import { Router, Request, Response } from "express";
import { storage } from "../postgres-storage";
import { insertRideSchema } from "@shared/schema";
import { z } from "zod";

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
router.post("/", async (req: Request, res: Response) => {
  try {
    console.log("Received ride data:", req.body);
    
    // Convert string dates to Date objects
    const rideData = {
      ...req.body,
      departureTime: req.body.departureTime ? new Date(req.body.departureTime) : undefined,
      arrivalTime: req.body.arrivalTime ? new Date(req.body.arrivalTime) : undefined
    };
    
    console.log("Processed ride data:", rideData);
    
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
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ride ID" });
    }
    
    // Get user info from headers (since we're using client-side auth)
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    
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