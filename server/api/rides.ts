import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../postgres-storage";
import { insertRideSchema } from "@shared/schema";
import { z } from "zod";
import * as admin from "firebase-admin";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// Authentication middleware that handles Firebase tokens
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First try Authorization header (Firebase token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        // Decode the JWT to extract user info
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        const authenticatedUser = {
          uid: payload.user_id || payload.sub || payload.uid,
          email: payload.email || '',
          email_verified: payload.email_verified || false,
          name: payload.name || payload.display_name || 'Trek User',
        } as admin.auth.DecodedIdToken;
        
        req.user = authenticatedUser;
        return next();
      } catch (tokenError) {
        console.error("Token verification error:", tokenError);
        return res.status(401).json({ message: "Invalid authentication token" });
      }
    }
    
    // Fallback to header-based auth (for backward compatibility)
    const firebaseUid = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userName = req.headers['x-user-name'] as string;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Authentication required - missing user ID" });
    }
    
    const authenticatedUser = {
      uid: firebaseUid,
      email: userEmail || '',
      email_verified: true,
      name: userName || 'Trek User',
    } as admin.auth.DecodedIdToken;
    
    req.user = authenticatedUser;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

const router = Router();

// GET /api/rides - Get all rides
router.get("/", async (req: Request, res: Response) => {
  try {
    const rides = await storage.getRidesInFuture();
    res.json(rides);
  } catch (error) {
    console.error("Error fetching rides:", error);
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// GET /api/rides/:id - Get a specific ride
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ride ID" });
    }
    
    const ride = await storage.getRide(id);
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }
    
    res.json(ride);
  } catch (error) {
    console.error("Error fetching ride:", error);
    res.status(500).json({ error: "Failed to fetch ride" });
  }
});

// POST /api/rides - Create a new ride
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid;
    const userEmail = req.user!.email;
    
    console.log("Creating ride for user:", firebaseUid);
    
    // Ensure user exists in PostgreSQL database before creating ride
    try {
      const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!existingUser) {
        const userData = {
          firebaseUid: firebaseUid,
          email: userEmail || '',
          displayName: req.user!.name || 'Trek User',
          photoUrl: null,
          emailVerified: req.user!.email_verified || false
        };
        
        const newUser = await storage.createUser(userData);
        console.log("Created new user in PostgreSQL:", newUser.id);
      }
    } catch (userError) {
      console.error("Error ensuring user exists:", userError);
      return res.status(500).json({ error: "Failed to verify user account" });
    }
    
    // Convert string dates to Date objects and add driverId
    const rideData = {
      ...req.body,
      driverId: firebaseUid, // Add the authenticated user's ID
      departureTime: req.body.departureTime ? new Date(req.body.departureTime) : undefined,
      arrivalTime: req.body.arrivalTime ? new Date(req.body.arrivalTime) : undefined
    };
    
    // Validate the request body against our schema
    const validationResult = insertRideSchema.safeParse(rideData);
    
    if (!validationResult.success) {
      console.log("Validation errors:", validationResult.error.format());
      return res.status(400).json({ 
        error: "Invalid ride data", 
        details: validationResult.error.format() 
      });
    }
    
    // Create the ride in the database
    const ride = await storage.createRide(validationResult.data);
    
    res.status(201).json(ride);
  } catch (error) {
    console.error("Error creating ride:", error);
    res.status(500).json({ error: "Failed to create ride" });
  }
});

// PUT /api/rides/:id - Update a ride
router.put("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ride ID" });
    }
    
    const userId = req.user!.uid;
    
    // Ensure the ride exists
    const existingRide = await storage.getRide(id);
    if (!existingRide) {
      return res.status(404).json({ error: "Ride not found" });
    }
    
    // Ensure the user owns the ride
    if (existingRide.driverId !== userId) {
      return res.status(403).json({ error: "You can only update your own rides" });
    }
    
    // Convert string dates to Date objects if present
    const rideData = {
      ...req.body,
      departureTime: req.body.departureTime ? new Date(req.body.departureTime) : undefined,
      arrivalTime: req.body.arrivalTime ? new Date(req.body.arrivalTime) : undefined
    };
    
    // Validate the request body against our schema
    const validationResult = insertRideSchema.partial().safeParse(rideData);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid ride data", 
        details: validationResult.error.format() 
      });
    }
    
    // If seatsTotal is being updated, update seatsLeft to match (since we don't have bookings yet)
    let updateData = validationResult.data;
    if (updateData.seatsTotal !== undefined) {
      // For simplicity, set seatsLeft equal to seatsTotal (no booking system yet)
      updateData.seatsLeft = updateData.seatsTotal;
    }
    
    // Update the ride in the database
    const updatedRide = await storage.updateRide(id, updateData);
    
    res.json(updatedRide);
  } catch (error) {
    console.error("Error updating ride:", error);
    res.status(500).json({ error: "Failed to update ride" });
  }
});

// DELETE /api/rides/:id - Delete a ride
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ride ID" });
    }
    
    // Ensure the ride exists
    const existingRide = await storage.getRide(id);
    if (!existingRide) {
      return res.status(404).json({ error: "Ride not found" });
    }
    
    // Delete the ride from the database
    const success = await storage.deleteRide(id);
    
    if (success) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: "Failed to delete ride" });
    }
  } catch (error) {
    console.error("Error deleting ride:", error);
    res.status(500).json({ error: "Failed to delete ride" });
  }
});

export default router;