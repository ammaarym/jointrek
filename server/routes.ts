import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./postgres-storage"; // Use PostgreSQL storage
import { insertUserSchema, insertRideSchema, insertBookingSchema, insertMessageSchema, insertConversationSchema, insertReviewSchema, insertRideRequestSchema } from "@shared/schema";
import * as admin from 'firebase-admin';
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import apiRoutes from "./api";
import { twilioService } from "./twilio-service";
import crypto from "crypto";
import Stripe from "stripe";
import { db } from "./db";
import { rideRequests, rides } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";

// Initialize Stripe
let stripe: Stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
} else {
  console.warn("STRIPE_SECRET_KEY not found. Payment functionality will be disabled.");
}

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// We'll use a simple dummy implementation since we're primarily using client-side auth
let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;
  
  try {
    console.log('Using client-side Firebase authentication only');
    firebaseInitialized = true;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
};

// Authentication middleware that extracts Firebase user info from headers
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get Firebase user info from headers (set by client-side auth)
    const firebaseUid = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userName = req.headers['x-user-name'] as string;
    
    if (!firebaseUid) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Create user object with Firebase info
    const authenticatedUser = {
      uid: firebaseUid,
      email: userEmail || '',
      email_verified: true,
      name: userName || 'Trek User',
    } as admin.auth.DecodedIdToken;
    
    // Add user info to request
    req.user = authenticatedUser;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Firebase
  initFirebase();
  
  const httpServer = createServer(app);

  // Mount the API routes
  app.use("/api", apiRoutes);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // === User Routes ===
  
  // Get current user
  app.get("/api/users/me", authenticate, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create or update user
  app.post("/api/users", authenticate, async (req, res) => {
    try {
      const userData = insertUserSchema.parse({
        firebaseUid: req.user.uid,
        email: req.user.email,
        displayName: req.user.name || req.body.displayName,
        photoUrl: req.user.picture || req.body.photoUrl,
        emailVerified: req.user.email_verified || false
      });
      
      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(req.user.uid);
      
      if (existingUser) {
        // Update existing user
        const updatedUser = await storage.updateUser(req.user.uid, userData);
        return res.json(updatedUser);
      }
      
      // Create new user
      const newUser = await storage.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: fromZodError(error).message 
        });
      }
      
      console.error("Error creating/updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // === Ride Routes ===
  
  // Get all rides
  app.get("/api/rides", async (req, res) => {
    try {
      const origin = req.query.origin as string;
      const destination = req.query.destination as string;
      
      if (!origin) {
        return res.status(400).json({ message: "Origin query parameter is required" });
      }
      
      const rides = await storage.getRidesByLocation(origin, destination);
      res.json(rides);
    } catch (error) {
      console.error("Error fetching rides:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific ride
  app.get("/api/rides/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }
      
      const ride = await storage.getRide(id);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      res.json(ride);
    } catch (error) {
      console.error("Error fetching ride:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a ride
  app.post("/api/rides", authenticate, async (req, res) => {
    try {
      const rideData = insertRideSchema.parse({
        ...req.body,
        driverId: req.user.uid
      });
      
      const ride = await storage.createRide(rideData);
      res.status(201).json(ride);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid ride data", errors: error.errors });
      }
      
      console.error("Error creating ride:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update a ride
  app.patch("/api/rides/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }
      
      const ride = await storage.getRide(id);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      // Ensure the user owns the ride
      if (ride.driverId !== req.user.uid) {
        return res.status(403).json({ message: "You can only update your own rides" });
      }
      
      const updatedRide = await storage.updateRide(id, req.body);
      res.json(updatedRide);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid ride data", errors: error.errors });
      }
      
      console.error("Error updating ride:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Delete a ride
  app.delete("/api/rides/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }
      
      const ride = await storage.getRide(id);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      // Ensure the user owns the ride
      if (ride.driverId !== req.user.uid) {
        return res.status(403).json({ message: "You can only delete your own rides" });
      }
      
      await storage.deleteRide(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting ride:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark ride as complete
  app.patch("/api/rides/:id/complete", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }
      
      const ride = await storage.getRide(id);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      // Ensure the user owns the ride
      if (ride.driverId !== req.user.uid) {
        return res.status(403).json({ message: "You can only complete your own rides" });
      }
      
      const updatedRide = await storage.markRideComplete(id);
      res.json(updatedRide);
    } catch (error) {
      console.error("Error marking ride complete:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get rides by driver
  app.get("/api/users/me/rides", authenticate, async (req, res) => {
    try {
      const rides = await storage.getRidesByDriver(req.user.uid);
      res.json(rides);
    } catch (error) {
      console.error("Error fetching user rides:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get rides booked by a passenger
  app.get("/api/users/me/bookings", authenticate, async (req, res) => {
    try {
      const bookings = await storage.getBookingsByPassenger(req.user.uid);
      
      // Get the ride details for each booking
      const rides = await Promise.all(
        bookings.map(async (booking) => {
          const ride = await storage.getRide(booking.rideId);
          return { ...ride, bookingId: booking.id, bookingStatus: booking.status };
        })
      );
      
      res.json(rides.filter(ride => ride !== undefined));
    } catch (error) {
      console.error("Error fetching user bookings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === Ride Request Routes ===
  
  // Create ride request
  app.post("/api/ride-requests", authenticate, async (req, res) => {
    try {
      const validatedData = insertRideRequestSchema.parse(req.body);
      const rideRequest = await storage.createRideRequest({
        ...validatedData,
        passengerId: req.user!.uid
      });

      // Send SMS notification to driver
      let smsStatus = { sent: false, reason: 'Unknown error' };
      try {
        // Get ride and driver details
        const ride = await storage.getRide(validatedData.rideId);
        if (ride) {
          const driver = await storage.getUserByFirebaseUid(ride.driverId);
          const passenger = await storage.getUserByFirebaseUid(req.user!.uid);

          if (driver && driver.phone && passenger) {
            const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });

            const smsSent = await twilioService.notifyDriverOfRequest(
              driver.phone,
              passenger.displayName || passenger.email.split('@')[0],
              {
                origin: ride.origin,
                destination: ride.destination,
                departureTime: departureTime,
                seats: 1
              }
            );
            
            if (smsSent) {
              smsStatus = { sent: true, reason: `SMS sent to driver ${driver.displayName || driver.email.split('@')[0]} at ${driver.phone}` };
              console.log(`SMS notification sent to driver ${driver.email} for ride request ${rideRequest.id}`);
            } else {
              smsStatus = { sent: false, reason: 'Failed to send SMS - Twilio error' };
            }
          } else if (!driver) {
            smsStatus = { sent: false, reason: 'Driver not found' };
          } else if (!driver.phone) {
            smsStatus = { sent: false, reason: 'Driver has no phone number' };
          } else {
            smsStatus = { sent: false, reason: 'Passenger data not found' };
          }
        } else {
          smsStatus = { sent: false, reason: 'Ride not found' };
        }
      } catch (smsError: any) {
        console.error("Error sending SMS notification:", smsError);
        smsStatus = { sent: false, reason: `SMS error: ${smsError?.message || 'Unknown error'}` };
      }

      // Create notification for driver about new ride request
      try {
        const ride = await storage.getRide(rideRequest.rideId);
        const passenger = await storage.getUserByFirebaseUid(req.user!.uid);
        
        if (ride && passenger) {
          await storage.createNotification({
            userId: ride.driverId,
            type: 'ride_request',
            title: 'New Ride Request',
            message: `${passenger.displayName || passenger.email.split('@')[0]} requested to join your ride from ${ride.origin} to ${ride.destination}`,
            rideId: ride.id,
            requestId: rideRequest.id,
            isRead: false
          });
        }
      } catch (notificationError) {
        console.error('Error creating ride request notification:', notificationError);
      }

      res.status(201).json({
        ...rideRequest,
        smsStatus
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.toString() });
      }
      console.error("Error creating ride request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get ride requests for a driver
  app.get("/api/ride-requests/driver", authenticate, async (req, res) => {
    try {
      console.log(`Fetching ride requests for driver: ${req.user.uid}`);
      const requests = await storage.getRideRequestsForDriver(req.user.uid);
      console.log(`Found ${requests.length} ride requests for driver ${req.user.uid}`);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching ride requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get ride requests for a user (passenger)
  app.get("/api/ride-requests/user", authenticate, async (req, res) => {
    try {
      const requests = await storage.getRideRequestsForUser(req.user.uid);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user ride requests:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get approved rides for user
  app.get("/api/ride-requests/approved", authenticate, async (req, res) => {
    try {
      const approvedRides = await storage.getApprovedRidesForUser(req.user.uid);
      res.json(approvedRides);
    } catch (error) {
      console.error("Error fetching approved rides:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update ride request status (approve/reject)
  app.patch("/api/ride-requests/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid request ID" });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
      }

      const updatedRequest = await storage.updateRideRequestStatus(id, status, req.user.uid);

      // Initialize SMS status for approved requests
      let approvalSmsStatus = { sent: false, reason: 'Unknown error' };

      // If approved, decrement available seats and auto-reject other requests if full
      if (status === "approved") {
        try {
          // Get request details with ride and user info
          const requestDetails = await storage.getRideRequestsForDriver(req.user.uid);
          const thisRequest = requestDetails.find(r => r.id === id);
          
          if (thisRequest) {
            // Decrement available seats
            const ride = await storage.getRide(thisRequest.rideId);
            if (ride && ride.seatsLeft > 0) {
              const newSeatsLeft = ride.seatsLeft - 1;
              await storage.updateRide(ride.id, { 
                seatsLeft: newSeatsLeft 
              });
              console.log(`Seat decremented for ride ${ride.id}. Seats left: ${newSeatsLeft}`);
              
              // If no seats left, auto-reject all other pending requests for this ride
              if (newSeatsLeft === 0) {
                console.log(`Ride ${ride.id} is now full. Auto-rejecting remaining pending requests...`);
                
                // Get all pending requests for this specific ride
                const allRequestsForRide = await storage.getPendingRequestsForRide(thisRequest.rideId);
                const pendingRequests = allRequestsForRide.filter(req => 
                  req.status === 'pending' && req.id !== id
                );
                
                // Auto-reject all remaining pending requests
                for (const pendingRequest of pendingRequests) {
                  try {
                    await storage.updateRideRequestStatus(pendingRequest.id, 'rejected', req.user.uid);
                    console.log(`Auto-rejected request ${pendingRequest.id} - ride is full`);
                  } catch (error) {
                    console.error(`Failed to auto-reject request ${pendingRequest.id}:`, error);
                  }
                }
                
                if (pendingRequests.length > 0) {
                  console.log(`Auto-rejected ${pendingRequests.length} pending requests for full ride ${ride.id}`);
                }
              }
            }
          }
          
          // Send SMS notification to passenger when approved
          try {
            if (thisRequest) {
              const rideDetails = await storage.getRide(thisRequest.rideId);
              const passenger = await storage.getUserByFirebaseUid(thisRequest.passengerId);
              const driver = await storage.getUserByFirebaseUid(req.user!.uid);
              
              if (passenger && passenger.phone && driver && rideDetails) {
                const departureTime = new Date(rideDetails.departureTime).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });

                const smsSent = await twilioService.notifyPassengerOfApproval(
                  passenger.phone,
                  driver.displayName || driver.email.split('@')[0],
                  {
                    origin: rideDetails.origin,
                    destination: rideDetails.destination,
                    departureTime: departureTime,
                    driverPhone: driver.phone || 'Contact via app'
                  }
                );
                
                if (smsSent) {
                  approvalSmsStatus = { sent: true, reason: `SMS sent to passenger ${passenger.displayName || passenger.email.split('@')[0]} at ${passenger.phone}` };
                  console.log(`SMS approval notification sent to passenger ${passenger.email}`);
                } else {
                  approvalSmsStatus = { sent: false, reason: 'Failed to send SMS - Twilio error' };
                }
              } else if (!passenger) {
                approvalSmsStatus = { sent: false, reason: 'Passenger not found' };
              } else if (!passenger.phone) {
                approvalSmsStatus = { sent: false, reason: 'Passenger has no phone number' };
              } else {
                approvalSmsStatus = { sent: false, reason: 'Driver data not found' };
              }
            } else {
              approvalSmsStatus = { sent: false, reason: 'Request or ride data not found' };
            }
          } catch (smsError: any) {
            console.error("Error sending SMS approval notification:", smsError);
            approvalSmsStatus = { sent: false, reason: `SMS error: ${smsError?.message || 'Unknown error'}` };
          }
          
        } catch (error) {
          console.error("Error processing approved request:", error);
          // Don't fail the request if processing fails
        }

        // Create notification for passenger about approval
        try {
          const rideRequest = await storage.getRideRequestById(id);
          const ride = await storage.getRide(rideRequest.rideId);
          
          if (rideRequest && ride) {
            await storage.createNotification({
              userId: rideRequest.passengerId,
              type: 'ride_approved',
              title: 'Ride Request Approved',
              message: `Your ride request from ${ride.origin} to ${ride.destination} has been approved!`,
              rideId: ride.id,
              requestId: id,
              isRead: false
            });
          }
        } catch (notificationError) {
          console.error('Error creating approval notification:', notificationError);
        }
      }

      // Handle SMS notifications for rejections
      let rejectionSmsStatus = { sent: false, reason: 'Not applicable' };
      if (status === "rejected") {
        try {
          // Get request details for SMS notification
          const requestDetails = await storage.getRideRequestsForDriver(req.user!.uid);
          const thisRequest = requestDetails.find(r => r.id === id);
          
          if (thisRequest) {
            const rideDetails = await storage.getRide(thisRequest.rideId);
            const passenger = await storage.getUserByFirebaseUid(thisRequest.passengerId);
            const driver = await storage.getUserByFirebaseUid(req.user!.uid);
            
            if (passenger && passenger.phone && driver && rideDetails) {
              const departureTime = new Date(rideDetails.departureTime).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              const smsSent = await twilioService.notifyPassengerOfRejection(
                passenger.phone,
                driver.displayName || driver.email.split('@')[0],
                {
                  origin: rideDetails.origin,
                  destination: rideDetails.destination,
                  departureTime: departureTime
                }
              );
              
              if (smsSent) {
                rejectionSmsStatus = { sent: true, reason: `SMS sent to passenger ${passenger.displayName || passenger.email.split('@')[0]} at ${passenger.phone}` };
                console.log(`SMS rejection notification sent to passenger ${passenger.email}`);
              } else {
                rejectionSmsStatus = { sent: false, reason: 'Failed to send SMS - Twilio error' };
              }
            } else if (!passenger) {
              rejectionSmsStatus = { sent: false, reason: 'Passenger not found' };
            } else if (!passenger.phone) {
              rejectionSmsStatus = { sent: false, reason: 'Passenger has no phone number' };
            } else {
              rejectionSmsStatus = { sent: false, reason: 'Driver or ride data not found' };
            }
          } else {
            rejectionSmsStatus = { sent: false, reason: 'Request data not found' };
          }
        } catch (smsError: any) {
          console.error("Error sending SMS rejection notification:", smsError);
          rejectionSmsStatus = { sent: false, reason: `SMS error: ${smsError?.message || 'Unknown error'}` };
        }

        // Create notification for passenger about rejection
        try {
          const rideRequest = await storage.getRideRequestById(id);
          const ride = await storage.getRide(rideRequest.rideId);
          
          if (rideRequest && ride) {
            await storage.createNotification({
              userId: rideRequest.passengerId,
              type: 'ride_rejected',
              title: 'Ride Request Rejected',
              message: `Your ride request from ${ride.origin} to ${ride.destination} was not accepted this time.`,
              rideId: ride.id,
              requestId: id,
              isRead: false
            });
          }
        } catch (notificationError) {
          console.error('Error creating rejection notification:', notificationError);
        }
      }

      // Include SMS status in response
      if (status === "approved") {
        res.json({
          ...updatedRequest,
          smsStatus: approvalSmsStatus || { sent: false, reason: 'SMS status not available' }
        });
      } else if (status === "rejected") {
        res.json({
          ...updatedRequest,
          smsStatus: rejectionSmsStatus
        });
      } else {
        res.json(updatedRequest);
      }
    } catch (error) {
      console.error("Error updating ride request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // === Booking Routes ===
  
  // Create a booking
  app.post("/api/bookings", authenticate, async (req, res) => {
    try {
      const { rideId } = req.body;
      
      if (!rideId) {
        return res.status(400).json({ message: "rideId is required" });
      }
      
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      // Check if there are available seats
      if (ride.seatsLeft <= 0) {
        return res.status(400).json({ message: "No seats available for this ride" });
      }
      
      // Check if user has already booked this ride
      const userBookings = await storage.getBookingsByPassenger(req.user.uid);
      const existingBooking = userBookings.find(booking => 
        booking.rideId === rideId && 
        ['pending', 'confirmed'].includes(booking.status)
      );
      
      if (existingBooking) {
        return res.status(400).json({ message: "You have already booked this ride" });
      }
      
      const bookingData = insertBookingSchema.parse({
        rideId,
        passengerId: req.user.uid,
        status: "pending"
      });
      
      const booking = await storage.createBooking(bookingData);
      
      // Create a conversation between driver and passenger if it doesn't exist
      const existingConversation = await storage.getConversationByParticipants([
        req.user.uid,
        ride.driverId
      ]);
      
      if (!existingConversation) {
        await storage.createConversation({
          participants: [req.user.uid, ride.driverId],
          rideId
        });
      }
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update booking status
  app.patch("/api/bookings/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }
      
      if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const ride = await storage.getRide(booking.rideId);
      
      if (!ride) {
        return res.status(404).json({ message: "Associated ride not found" });
      }
      
      // Only the ride driver can confirm/cancel a booking, or the passenger can cancel their own booking
      if (
        (status === 'confirmed' && ride.driverId !== req.user.uid) ||
        (status === 'cancelled' && ride.driverId !== req.user.uid && booking.passengerId !== req.user.uid)
      ) {
        return res.status(403).json({ message: "Unauthorized to update this booking" });
      }
      
      // If confirming and no seats left
      if (status === 'confirmed' && ride.seatsLeft <= 0 && booking.status !== 'confirmed') {
        return res.status(400).json({ message: "No seats available for this ride" });
      }
      
      const updatedBooking = await storage.updateBookingStatus(id, status);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // === Message & Conversation Routes ===
  
  // Get user's conversations
  app.get("/api/conversations", authenticate, async (req, res) => {
    try {
      const conversations = await storage.getConversationsByUser(req.user.uid);
      
      // Enrich conversation data with participants info
      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const participants = await Promise.all(
            conversation.participants
              .filter(id => id !== req.user.uid)
              .map(async (id) => {
                const user = await storage.getUserByFirebaseUid(id);
                return user ? {
                  id: user.firebaseUid,
                  displayName: user.displayName,
                  photoUrl: user.photoUrl
                } : null;
              })
          );
          
          return {
            ...conversation,
            participantsData: participants.filter(p => p !== null)
          };
        })
      );
      
      res.json(enrichedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific conversation
  app.get("/api/conversations/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Ensure the user is a participant
      if (!conversation.participants.includes(req.user.uid)) {
        return res.status(403).json({ message: "You are not a participant in this conversation" });
      }
      
      // Get messages for this conversation
      const messages = await storage.getMessagesByConversation(id);
      
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Create a conversation
  app.post("/api/conversations", authenticate, async (req, res) => {
    try {
      const { participantId, rideId } = req.body;
      
      if (!participantId) {
        return res.status(400).json({ message: "participantId is required" });
      }
      
      // Check if the conversation already exists
      const existingConversation = await storage.getConversationByParticipants([
        req.user.uid,
        participantId
      ]);
      
      if (existingConversation) {
        return res.json(existingConversation);
      }
      
      // Create new conversation
      const conversationData = insertConversationSchema.parse({
        participants: [req.user.uid, participantId],
        rideId
      });
      
      const conversation = await storage.createConversation(conversationData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      }
      
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Send a message
  app.post("/api/messages", authenticate, async (req, res) => {
    try {
      const { conversationId, text } = req.body;
      
      if (!conversationId || !text) {
        return res.status(400).json({ message: "conversationId and text are required" });
      }
      
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Ensure the user is a participant
      if (!conversation.participants.includes(req.user.uid)) {
        return res.status(403).json({ message: "You are not a participant in this conversation" });
      }
      
      const messageData = insertMessageSchema.parse({
        conversationId,
        senderId: req.user.uid,
        text
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Cancel ride with penalty system
  app.post('/api/rides/:id/cancel', authenticate, async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      const { cancellationReason } = req.body;
      
      if (isNaN(rideId)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }

      // Get the ride
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if ride is already completed or cancelled
      if (ride.isCompleted || ride.cancelledBy) {
        return res.status(400).json({ message: "Cannot cancel a completed or already cancelled ride" });
      }

      // Check if user is authorized to cancel (driver or approved passenger)
      let userRole = '';
      if (ride.driverId === req.user!.uid) {
        userRole = 'driver';
      } else {
        // Check if user is an approved passenger
        const approvedRequest = await db
          .select()
          .from(rideRequests)
          .where(and(
            eq(rideRequests.rideId, rideId),
            eq(rideRequests.passengerId, req.user!.uid),
            eq(rideRequests.status, 'approved')
          ))
          .limit(1);

        if (approvedRequest.length === 0) {
          return res.status(403).json({ message: "You are not authorized to cancel this ride" });
        }
        userRole = 'passenger';
      }

      // Cancel the ride using the storage method with penalty handling
      const cancellationResult = await storage.cancelRide(rideId, req.user!.uid, cancellationReason);
      
      if (!cancellationResult) {
        return res.status(500).json({ message: "Failed to cancel ride" });
      }

      // Update all ride requests to cancelled status
      await db.update(rideRequests)
        .set({ status: 'cancelled' })
        .where(eq(rideRequests.rideId, rideId));

      // Send SMS notifications to affected parties
      let smsResults: any[] = [];
      try {
        // Get all approved passengers for this ride
        const approvedRequests = await db
          .select()
          .from(rideRequests)
          .where(and(
            eq(rideRequests.rideId, rideId),
            eq(rideRequests.status, 'cancelled')
          ));

        const driver = await storage.getUserByFirebaseUid(ride.driverId);
        const canceller = await storage.getUserByFirebaseUid(req.user!.uid);

        if (userRole === 'passenger') {
          // Passenger cancelled - notify driver
          if (driver && driver.phone) {
            const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit', hour12: true
            });

            const smsSent = await twilioService.notifyDriverOfCancellation(
              driver.phone,
              canceller?.displayName || canceller?.email.split('@')[0] || 'A passenger',
              {
                origin: ride.origin,
                destination: ride.destination,
                departureTime: departureTime,
                reason: cancellationReason
              }
            );

            smsResults.push({
              recipient: 'driver',
              phone: driver.phone,
              sent: smsSent,
              name: driver.displayName || driver.email.split('@')[0]
            });
          }
        } else if (userRole === 'driver') {
          // Driver cancelled - notify all passengers
          for (const request of approvedRequests) {
            const passenger = await storage.getUserByFirebaseUid(request.passengerId);
            if (passenger && passenger.phone) {
              const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              });

              const smsSent = await twilioService.notifyPassengerOfCancellation(
                passenger.phone,
                driver?.displayName || driver?.email.split('@')[0] || 'The driver',
                {
                  origin: ride.origin,
                  destination: ride.destination,
                  departureTime: departureTime,
                  reason: cancellationReason
                }
              );

              smsResults.push({
                recipient: 'passenger',
                phone: passenger.phone,
                sent: smsSent,
                name: passenger.displayName || passenger.email.split('@')[0]
              });
            }
          }
        }
      } catch (smsError) {
        console.error('Error sending cancellation SMS notifications:', smsError);
      }

      // Get updated user strikes count
      const userStrikes = await storage.getUserCancellationStrikes(req.user!.uid);

      res.json({
        message: "Ride cancelled successfully",
        penaltyApplied: cancellationResult.penaltyApplied || false,
        penaltyAmount: cancellationResult.penaltyAmount || 0,
        strikeCount: userStrikes,
        cancelled: true,
        smsNotifications: smsResults
      });

    } catch (error: any) {
      console.error("Error cancelling ride:", error);
      res.status(500).json({ message: error.message || "Failed to cancel ride" });
    }
  });

  // Cancel individual passenger from ride (driver only)
  app.post('/api/ride-requests/:id/cancel-by-driver', authenticate, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      // Get the ride request
      const rideRequest = await storage.getRideRequestById(requestId);
      if (!rideRequest) {
        return res.status(404).json({ message: "Ride request not found" });
      }

      // Get the ride to verify the user is the driver
      const ride = await storage.getRideById(rideRequest.rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if user is the driver
      if (ride.driverId !== req.user!.uid) {
        return res.status(403).json({ message: "Only the driver can cancel passengers" });
      }

      // Check if request is approved
      if (rideRequest.status !== 'approved') {
        return res.status(400).json({ message: "Can only cancel approved passengers" });
      }

      // Update the request status to 'canceled'
      await storage.updateRideRequestStatus(requestId, 'canceled', req.user!.uid);

      // Process refund if payment was authorized
      let refundProcessed = false;
      try {
        if (rideRequest.stripePaymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(rideRequest.stripePaymentIntentId);
          
          if (paymentIntent.status === 'requires_capture') {
            // Cancel the payment intent
            await stripe.paymentIntents.cancel(rideRequest.stripePaymentIntentId);
            refundProcessed = true;
          } else if (paymentIntent.status === 'succeeded') {
            // Create a refund
            await stripe.refunds.create({
              payment_intent: rideRequest.stripePaymentIntentId,
              reason: 'requested_by_customer'
            });
            refundProcessed = true;
          }
        }
      } catch (paymentError: any) {
        console.error('Error processing refund for cancelled passenger:', paymentError);
        // Continue with cancellation even if refund fails
      }

      // Increase available seats and restore baggage on the ride
      await db
        .update(rides)
        .set({ 
          seatsLeft: sql`${rides.seatsLeft} + 1`,
          baggageCheckIn: sql`${rides.baggageCheckIn} + ${rideRequest.baggageCheckIn || 0}`,
          baggagePersonal: sql`${rides.baggagePersonal} + ${rideRequest.baggagePersonal || 0}`
        })
        .where(eq(rides.id, rideRequest.rideId));

      // Send SMS notification to the cancelled passenger
      try {
        const passenger = await storage.getUserByFirebaseUid(rideRequest.passengerId);
        const driver = await storage.getUserByFirebaseUid(req.user!.uid);
        
        if (passenger && passenger.phone && driver) {
          const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
          });

          const smsSent = await twilioService.notifyPassengerOfCancellation(
            passenger.phone,
            driver.displayName || driver.email.split('@')[0] || 'The driver',
            {
              origin: ride.origin,
              destination: ride.destination,
              departureTime: departureTime,
              reason: reason || 'No reason provided'
            }
          );

          console.log(`SMS cancellation notification sent to passenger ${passenger.email}: ${smsSent ? 'Success' : 'Failed'}`);
        }
      } catch (smsError) {
        console.error('Error sending SMS notification to cancelled passenger:', smsError);
      }

      // Create notification for cancelled passenger
      try {
        await storage.createNotification({
          userId: rideRequest.passengerId,
          type: 'ride_cancelled',
          title: 'Ride Cancelled',
          message: `You have been removed from the ride from ${ride.origin} to ${ride.destination}. ${reason ? `Reason: ${reason}` : ''}`,
          rideId: ride.id,
          requestId: requestId,
          isRead: false
        });
      } catch (notificationError) {
        console.error('Error creating cancellation notification:', notificationError);
      }

      res.json({
        message: "Passenger cancelled successfully",
        refundProcessed,
        requestId
      });

    } catch (error: any) {
      console.error("Error cancelling passenger:", error);
      res.status(500).json({ message: error.message || "Failed to cancel passenger" });
    }
  });

  // Get user cancellation strikes
  app.get('/api/users/:userId/strikes', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      
      // Ensure user can only access their own strikes data
      if (userId !== req.user!.uid) {
        return res.status(403).json({ message: "You can only access your own strikes data" });
      }

      const strikes = await storage.getUserCancellationStrikes(userId);
      
      res.json({ strikes });
    } catch (error) {
      console.error("Error getting user strikes:", error);
      res.status(500).json({ message: "Failed to get user strikes" });
    }
  });

  // Generate start verification code for drivers to show passengers
  app.post('/api/rides/:id/generate-start-verification', authenticate, async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      
      if (isNaN(rideId)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }

      // Get the ride to verify the driver owns it
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if user is the driver
      if (ride.driverId !== req.user!.uid) {
        return res.status(403).json({ message: "You can only generate start codes for your own rides" });
      }

      // Check if ride has approved passengers
      const approvedRequests = await db
        .select()
        .from(rideRequests)
        .where(and(
          eq(rideRequests.rideId, rideId),
          eq(rideRequests.status, 'approved')
        ));

      if (approvedRequests.length === 0) {
        return res.status(400).json({ message: "No approved passengers for this ride" });
      }

      // Generate a 4-digit start verification code
      const startVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Update ride with start verification code
      await db.update(rides).set({ startVerificationCode }).where(eq(rides.id, rideId));
      
      res.json({ startVerificationCode });
    } catch (error) {
      console.error("Error generating start verification code:", error);
      res.status(500).json({ message: "Failed to generate start verification code" });
    }
  });

  // Verify start code and mark ride as started
  app.patch('/api/rides/:id/verify-start', authenticate, async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      const { startVerificationCode } = req.body;
      
      if (isNaN(rideId)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }

      if (!startVerificationCode) {
        return res.status(400).json({ message: "Start verification code is required" });
      }

      // Get the ride to verify the code
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if user has an approved request for this ride (passenger verification)
      const approvedRequest = await db
        .select()
        .from(rideRequests)
        .where(and(
          eq(rideRequests.rideId, rideId),
          eq(rideRequests.passengerId, req.user!.uid),
          eq(rideRequests.status, 'approved')
        ))
        .limit(1);

      if (approvedRequest.length === 0) {
        return res.status(403).json({ message: "You don't have an approved request for this ride" });
      }

      // Verify the start code matches
      if (ride.startVerificationCode !== startVerificationCode) {
        return res.status(400).json({ message: "Invalid start verification code" });
      }

      // Mark ride as started and record start time
      const startedAt = new Date();
      await db.update(rides).set({ 
        isStarted: true, 
        startedAt,
        startVerificationCode: null // Clear the code after use
      }).where(eq(rides.id, rideId));
      
      res.json({
        message: "Ride started successfully",
        startedAt: startedAt.toISOString()
      });
    } catch (error) {
      console.error("Error verifying start code:", error);
      res.status(500).json({ message: "Failed to verify start code" });
    }
  });

  // Generate verification code for ride completion
  app.post('/api/rides/:id/generate-verification', authenticate, async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      
      if (isNaN(rideId)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }

      // Get the ride to verify ownership
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if user is the driver
      if (ride.driverId !== req.user!.uid) {
        return res.status(403).json({ message: "You can only generate verification codes for your own rides" });
      }

      // Check if ride has been started
      if (!ride.isStarted) {
        return res.status(400).json({ message: "Ride must be started before generating completion code" });
      }

      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Update ride with verification code
      await db.update(rides).set({ verificationCode }).where(eq(rides.id, rideId));
      
      res.json({ verificationCode });
    } catch (error) {
      console.error("Error generating verification code:", error);
      res.status(500).json({ message: "Failed to generate verification code" });
    }
  });

  // Verify completion code and mark ride as complete
  app.patch('/api/rides/:id/verify-complete', authenticate, async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      const { verificationCode } = req.body;
      
      if (isNaN(rideId)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }

      if (!verificationCode) {
        return res.status(400).json({ message: "Verification code is required" });
      }

      // Get the ride to verify the code
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Verify the code matches
      if (ride.verificationCode !== verificationCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Get all approved ride requests for this ride to capture payments
      const approvedRequests = await db
        .select()
        .from(rideRequests)
        .where(and(
          eq(rideRequests.rideId, rideId),
          eq(rideRequests.status, 'approved')
        ));

      const paymentResults = [];
      
      // Capture payment for each approved passenger
      for (const request of approvedRequests) {
        if (request.stripePaymentIntentId && stripe) {
          try {
            console.log(`Capturing payment for request ${request.id}, payment intent: ${request.stripePaymentIntentId}`);
            
            // Capture the payment
            const paymentIntent = await stripe.paymentIntents.capture(request.stripePaymentIntentId);
            
            // Update payment status in database
            await storage.updateRideRequestPaymentStatus(request.id, 'captured');
            
            paymentResults.push({
              requestId: request.id,
              paymentIntentId: request.stripePaymentIntentId,
              status: 'captured',
              amount: paymentIntent.amount / 100
            });
            
            console.log(`Payment captured successfully for request ${request.id}: $${paymentIntent.amount / 100}`);
          } catch (stripeError: any) {
            console.error(`Failed to capture payment for request ${request.id}:`, stripeError);
            paymentResults.push({
              requestId: request.id,
              paymentIntentId: request.stripePaymentIntentId,
              status: 'failed',
              error: stripeError.message
            });
          }
        }
      }

      // Mark ride as complete and clear verification code
      const updatedRide = await storage.markRideComplete(rideId);
      await db.update(rides).set({ verificationCode: null }).where(eq(rides.id, rideId));

      // Update user statistics for driver
      await storage.updateUserRideCount(ride.driverId, 'driver');

      // Update user statistics for each approved passenger
      for (const request of approvedRequests) {
        await storage.updateUserRideCount(request.passengerId, 'passenger');
      }
      
      res.json({
        ride: updatedRide,
        paymentsProcessed: paymentResults.length,
        paymentResults
      });
    } catch (error) {
      console.error("Error verifying ride completion:", error);
      res.status(500).json({ message: "Failed to verify ride completion" });
    }
  });

  // Legacy endpoint - Mark ride as complete and capture payments
  app.patch('/api/rides/:id/complete', authenticate, async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.id);
      
      if (isNaN(rideId)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }

      // Get the ride to verify ownership
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if user is the driver
      if (ride.driverId !== req.user!.uid) {
        return res.status(403).json({ message: "You can only complete your own rides" });
      }

      // Get all approved ride requests for this ride to capture payments
      const approvedRequests = await db
        .select()
        .from(rideRequests)
        .where(and(
          eq(rideRequests.rideId, rideId),
          eq(rideRequests.status, 'approved')
        ));

      const paymentResults = [];
      
      // Capture payment for each approved passenger
      for (const request of approvedRequests) {
        if (request.stripePaymentIntentId && stripe) {
          try {
            console.log(`Capturing payment for request ${request.id}, payment intent: ${request.stripePaymentIntentId}`);
            
            // Capture the payment
            const paymentIntent = await stripe.paymentIntents.capture(request.stripePaymentIntentId);
            
            // Update payment status in database
            await storage.updateRideRequestPaymentStatus(request.id, 'captured');
            
            paymentResults.push({
              requestId: request.id,
              paymentIntentId: request.stripePaymentIntentId,
              status: 'captured',
              amount: paymentIntent.amount / 100
            });
            
            console.log(`Payment captured successfully for request ${request.id}: $${paymentIntent.amount / 100}`);
          } catch (stripeError: any) {
            console.error(`Failed to capture payment for request ${request.id}:`, stripeError);
            paymentResults.push({
              requestId: request.id,
              paymentIntentId: request.stripePaymentIntentId,
              status: 'failed',
              error: stripeError.message
            });
          }
        }
      }

      // Mark ride as complete
      const updatedRide = await storage.markRideComplete(rideId);
      
      res.json({
        ride: updatedRide,
        paymentsProcessed: paymentResults.length,
        paymentResults
      });
    } catch (error) {
      console.error("Error marking ride complete:", error);
      res.status(500).json({ message: "Failed to mark ride complete" });
    }
  });

  // Create a review
  app.post('/api/reviews', authenticate, async (req: Request, res: Response) => {
    try {
      const { revieweeId, rideId, rating, reviewType } = req.body;
      
      const reviewData = insertReviewSchema.parse({
        reviewerId: req.user!.uid,
        revieweeId,
        rideId,
        rating,
        reviewType
      });
      
      const review = await storage.createReview(reviewData);
      
      // Update user rating statistics
      await storage.updateUserRatingStats(revieweeId, reviewType, rating);
      
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get reviews for a user
  app.get('/api/users/:userId/reviews', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const reviews = await storage.getReviewsByReviewee(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Get user statistics including ratings and ride counts
  app.get('/api/users/:userId/stats', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      let stats = await storage.getUserStats(userId);
      
      // Create stats if they don't exist
      if (!stats) {
        stats = await storage.createUserStats(userId);
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user statistics" });
    }
  });

  // Payment intent with destination charges for marketplace
  app.post('/api/payment-intent', authenticate, async (req: Request, res: Response) => {
    try {
      const { amount, rideId } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Valid amount in cents is required" });
      }

      if (!rideId) {
        return res.status(400).json({ message: "Ride ID is required" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      // Get ride details to find the driver
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Get driver details to check for Connect account
      const driver = await storage.getUserByFirebaseUid(ride.driverId);
      if (!driver || !driver.stripeConnectAccountId) {
        return res.status(400).json({ 
          message: "Driver hasn't completed Connect onboarding yet" 
        });
      }

      // Verify Connect account is ready for transfers
      const account = await stripe.accounts.retrieve(driver.stripeConnectAccountId);
      if (!account.details_submitted || !account.charges_enabled) {
        return res.status(400).json({ 
          message: "Driver's payment account is not ready to receive transfers" 
        });
      }

      // Calculate platform fee (10% of ride cost)
      const platformFeePercent = 0.10;
      const totalAmountCents = Math.round(amount * 100);
      const platformFeeCents = Math.round(totalAmountCents * platformFeePercent);

      // Create payment intent with destination charges
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: 'usd',
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: driver.stripeConnectAccountId,
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          rideId: rideId.toString(),
          passengerId: req.user!.uid,
          driverId: ride.driverId,
          platformFee: (platformFeeCents / 100).toString(),
          driverAmount: ((totalAmountCents - platformFeeCents) / 100).toString(),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        platformFee: platformFeeCents / 100,
        driverAmount: (totalAmountCents - platformFeeCents) / 100,
        totalAmount: totalAmountCents / 100
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Driver Stripe Connect Express onboarding
  app.post('/api/driver/onboard', authenticate, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has a Connect account
      if (user.stripeConnectAccountId) {
        try {
          const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
          
          if (!account.details_submitted) {
            // Create new account link for existing incomplete account
            const accountLink = await stripe.accountLinks.create({
              account: user.stripeConnectAccountId,
              refresh_url: `${req.headers.origin || 'http://localhost:5000'}/driver-onboard?refresh=true`,
              return_url: `${req.headers.origin || 'http://localhost:5000'}/driver-onboard?success=true`,
              type: 'account_onboarding',
            });
            
            return res.json({ 
              accountId: user.stripeConnectAccountId,
              onboardingUrl: accountLink.url,
              status: 'pending'
            });
          } else {
            return res.json({ 
              accountId: user.stripeConnectAccountId,
              status: 'complete',
              message: 'Driver account already onboarded'
            });
          }
        } catch (accountError) {
          console.error('Error retrieving existing account:', accountError);
          // Account might be invalid, create a new one
        }
      }

      // Create new Stripe Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        individual: {
          email: user.email,
          first_name: user.displayName?.split(' ')[0] || '',
          last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
        },
        settings: {
          payouts: {
            schedule: {
              interval: 'daily'
            }
          }
        }
      });

      // Save the account ID to user record
      await storage.updateUserStripeConnectAccount(user.id, account.id);

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.headers.origin || 'http://localhost:5000'}/driver-onboard?refresh=true`,
        return_url: `${req.headers.origin || 'http://localhost:5000'}/driver-onboard?success=true`,
        type: 'account_onboarding',
      });

      res.json({ 
        accountId: account.id,
        onboardingUrl: accountLink.url,
        status: 'pending'
      });
    } catch (error: any) {
      console.error('Error creating driver account:', error);
      
      // Check if it's the Connect not enabled error
      if (error.message?.includes('signed up for Connect')) {
        return res.status(400).json({ 
          message: "Stripe Connect needs to be enabled in your Stripe dashboard first. Please go to Dashboard → Connect to enable it.",
          connectSetupRequired: true
        });
      }
      
      res.status(500).json({ message: "Error setting up driver account: " + error.message });
    }
  });

  // Check driver onboarding status
  app.get('/api/driver/status', authenticate, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user || !user.stripeConnectAccountId) {
        return res.json({ 
          isOnboarded: false,
          canAcceptRides: false 
        });
      }

      const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);
      
      // Allow ride posting if details are submitted, even if charges not yet enabled
      // Charges may be pending review but driver can still post rides
      const isOnboarded = account.details_submitted;
      const canAcceptRides = account.details_submitted && (account.requirements?.currently_due || []).length === 0;
      
      res.json({
        isOnboarded,
        canAcceptRides,
        accountId: user.stripeConnectAccountId,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
        requirementsEventuallyDue: account.requirements?.eventually_due || [],
        requirementsCurrentlyDue: account.requirements?.currently_due || []
      });
    } catch (error: any) {
      console.error('Error checking driver status:', error);
      res.status(500).json({ message: "Error checking driver status: " + error.message });
    }
  });

  // Create dashboard link for drivers to manage their Connect account
  app.post('/api/driver/dashboard-link', authenticate, async (req: Request, res: Response) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user || !user.stripeConnectAccountId) {
        return res.status(404).json({ message: "Driver account not found" });
      }

      const link = await stripe.accounts.createLoginLink(user.stripeConnectAccountId);
      
      res.json({ dashboardUrl: link.url });
    } catch (error: any) {
      console.error('Error creating dashboard link:', error);
      res.status(500).json({ message: "Error creating dashboard link: " + error.message });
    }
  });



  // === Payment Routes ===
  
  // Setup payment method for user profile
  app.post("/api/setup-payment-method", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      console.log("Setup payment method - Looking for user with Firebase UID:", req.user!.uid);
      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      console.log("Setup payment method - Found user:", user ? { id: user.id, email: user.email, firebaseUid: user.firebaseUid } : "null");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let stripeCustomerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.displayName,
          metadata: {
            firebaseUid: user.firebaseUid
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUserStripeInfo(user.firebaseUid, stripeCustomerId);
      }

      // Create setup intent for saving payment method
      const setupIntent = await stripe.setupIntents.create({
        customer: stripeCustomerId,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never"
        },
        payment_method_options: {
          card: {
            request_three_d_secure: "automatic"
          }
        },
        usage: "off_session", // For future payments
        metadata: {
          firebaseUid: user.firebaseUid
        }
      });

      res.json({ 
        clientSecret: setupIntent.client_secret,
        customerId: stripeCustomerId 
      });
    } catch (error: any) {
      console.error("Error setting up payment method:", error);
      res.status(500).json({ message: "Error setting up payment method: " + error.message });
    }
  });

  // Get user's saved payment methods
  app.get("/api/payment-methods", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user || !user.stripeCustomerId) {
        return res.json({ paymentMethods: [], hasDefaultPaymentMethod: false });
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      res.json({ 
        paymentMethods: paymentMethods.data,
        hasDefaultPaymentMethod: !!user.defaultPaymentMethodId,
        defaultPaymentMethodId: user.defaultPaymentMethodId
      });
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ message: "Error fetching payment methods: " + error.message });
    }
  });

  // Set default payment method
  app.post("/api/set-default-payment-method", authenticate, async (req, res) => {
    try {
      const { paymentMethodId } = req.body;
      
      if (!paymentMethodId) {
        return res.status(400).json({ message: "paymentMethodId is required" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUserStripeInfo(user.firebaseUid, user.stripeCustomerId!, paymentMethodId);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error setting default payment method:", error);
      res.status(500).json({ message: "Error setting default payment method: " + error.message });
    }
  });

  // Confirm ride request with saved payment method (new simplified flow)
  app.post("/api/confirm-ride-request", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const { rideId, paymentMethodId } = req.body;
      
      if (!rideId) {
        return res.status(400).json({ message: "rideId is required" });
      }

      if (!paymentMethodId) {
        return res.status(400).json({ message: "paymentMethodId is required" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "Please add a payment method to your profile first" });
      }

      // Get user's payment methods to verify the selected one exists
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card',
      });

      if (paymentMethods.data.length === 0) {
        return res.status(400).json({ message: "Please add a payment method to your profile first" });
      }

      // Use the specifically selected payment method
      const paymentMethod = paymentMethods.data.find(pm => pm.id === paymentMethodId);
      if (!paymentMethod) {
        return res.status(400).json({ message: "Selected payment method not found" });
      }

      // Get ride details
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Get driver details for Connect account
      const driver = await storage.getUserByFirebaseUid(ride.driverId);
      if (!driver || !driver.stripeConnectAccountId) {
        return res.status(400).json({ message: "Driver has not completed payment setup" });
      }

      // Calculate platform fee (7% of ride price)
      const totalAmount = Math.round(parseFloat(ride.price) * 100); // Convert to cents
      const applicationFee = Math.round(totalAmount * 0.07); // 7% platform fee
      const driverAmount = totalAmount - applicationFee; // 93% to driver

      // Create payment intent with manual capture (authorize only, capture on ride completion)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "usd",
        customer: user.stripeCustomerId,
        payment_method: paymentMethod.id,
        confirm: true,
        capture_method: 'manual', // Manual capture - only authorize payment now
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never"
        },
        application_fee_amount: applicationFee, // Platform keeps 7%
        transfer_data: {
          destination: driver.stripeConnectAccountId, // Driver gets 93%
        },
        description: `Trek ride from ${ride.origin} to ${ride.destination}`,
        metadata: {
          rideId: rideId.toString(),
          passengerId: req.user!.uid,
          driverId: ride.driverId,
          driverConnectAccountId: driver.stripeConnectAccountId,
          applicationFee: applicationFee.toString(),
          driverAmount: driverAmount.toString()
        }
      });

      // Create ride request with payment info (authorized but not captured)
      const rideRequest = await storage.createRideRequest({
        rideId,
        passengerId: req.user!.uid,
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
        paymentAmount: parseFloat(ride.price),
        paymentStatus: "authorized", // Payment is authorized but not yet captured
        baggageCheckIn: req.body.baggageCheckIn || 0,
        baggagePersonal: req.body.baggagePersonal || 0
      });

      // Send SMS notification to driver
      console.log('BEFORE SMS SECTION - About to start SMS notification');
      let smsStatus = { sent: false, reason: 'SMS not attempted' };
      
      try {
        console.log('=== SMS NOTIFICATION SECTION REACHED ===');
        console.log('Driver object:', { id: driver.id, email: driver.email, phone: driver.phone, displayName: driver.displayName });
        console.log('User object:', { id: user.id, email: user.email, displayName: user.displayName });
        console.log('Ride object:', { id: ride.id, origin: ride.origin, destination: ride.destination });
        console.log('=== ATTEMPTING SMS NOTIFICATION ===');
        console.log('Driver phone:', driver.phone);
        console.log('Passenger name:', user.displayName);
        
        if (driver.phone && user.displayName) {
          const departureTime = new Date(ride.departureTime).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });

          const smsSent = await twilioService.notifyDriverOfRequest(
            driver.phone,
            user.displayName || user.email.split('@')[0],
            {
              origin: ride.origin,
              destination: ride.destination,
              departureTime: departureTime,
              seats: 1
            }
          );
          
          if (smsSent) {
            smsStatus = { sent: true, reason: `SMS sent to driver ${driver.displayName || driver.email.split('@')[0]} at ${driver.phone}` };
            console.log(`SMS notification sent to driver ${driver.email} for ride request ${rideRequest.id}`);
          } else {
            smsStatus = { sent: false, reason: 'Failed to send SMS - Twilio error' };
          }
        } else if (!driver.phone) {
          smsStatus = { sent: false, reason: 'Driver has no phone number' };
        } else {
          smsStatus = { sent: false, reason: 'Passenger data not found' };
        }
      } catch (smsError: any) {
        console.error("Error sending SMS notification:", smsError);
        smsStatus = { sent: false, reason: `SMS error: ${smsError?.message || 'Unknown error'}` };
      }

      res.json({ 
        success: true,
        rideRequestId: rideRequest.id,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        smsStatus
      });
    } catch (error: any) {
      console.error("Error confirming ride request:", error);
      res.status(500).json({ message: "Error confirming ride request: " + error.message });
    }
  });
  
  // DEPRECATED: Legacy payment intent creation - use /api/confirm-ride-request instead
  app.post("/api/create-payment-intent", authenticate, async (req, res) => {
    res.status(410).json({ 
      message: "This endpoint is deprecated. Please use /api/confirm-ride-request for payments.",
      deprecated: true,
      useInstead: "/api/confirm-ride-request"
    });
  });

  // Capture payment when ride is completed
  app.post("/api/capture-payment", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const { paymentIntentId, rideRequestId } = req.body;
      
      if (!paymentIntentId || !rideRequestId) {
        return res.status(400).json({ message: "paymentIntentId and rideRequestId are required" });
      }

      // Get the ride request to verify ownership
      const rideRequest = await storage.getRideRequestById(rideRequestId);
      if (!rideRequest) {
        return res.status(404).json({ message: "Ride request not found" });
      }

      // Get the ride to verify the driver
      const ride = await storage.getRideById(rideRequest.rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Only the driver can capture payment
      if (ride.driverId !== req.user!.uid) {
        return res.status(403).json({ message: "Only the driver can capture payment" });
      }

      // Capture the payment
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

      // Update payment status in database
      await storage.updateRideRequestPaymentStatus(rideRequestId, "captured");

      res.json({ 
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount
        }
      });
    } catch (error: any) {
      console.error("Error capturing payment:", error);
      res.status(500).json({ message: "Error capturing payment: " + error.message });
    }
  });

  // Cancel payment intent if ride request is rejected or cancelled
  app.post("/api/cancel-payment", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const { paymentIntentId, rideRequestId } = req.body;
      
      if (!paymentIntentId || !rideRequestId) {
        return res.status(400).json({ message: "paymentIntentId and rideRequestId are required" });
      }

      // Get the ride request to verify
      const rideRequest = await storage.getRideRequestById(rideRequestId);
      if (!rideRequest) {
        return res.status(404).json({ message: "Ride request not found" });
      }

      // Cancel the payment intent
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

      // Update payment status in database
      await storage.updateRideRequestPaymentStatus(rideRequestId, "cancelled");

      res.json({ 
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        }
      });
    } catch (error: any) {
      console.error("Error cancelling payment:", error);
      res.status(500).json({ message: "Error cancelling payment: " + error.message });
    }
  });

  // Cancel ride request by passenger
  app.delete("/api/ride-requests/:id/cancel", authenticate, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      if (isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid request ID" });
      }

      // Get the ride request to verify ownership
      const rideRequest = await storage.getRideRequestById(requestId);
      if (!rideRequest) {
        return res.status(404).json({ message: "Ride request not found" });
      }

      // Only the passenger can cancel their own request
      if (rideRequest.passengerId !== req.user!.uid) {
        return res.status(403).json({ message: "You can only cancel your own requests" });
      }

      // Only allow canceling pending requests
      if (rideRequest.status !== "pending") {
        return res.status(400).json({ message: "Only pending requests can be cancelled" });
      }

      // Cancel the payment intent if it exists
      if (rideRequest.stripePaymentIntentId && stripe) {
        try {
          await stripe.paymentIntents.cancel(rideRequest.stripePaymentIntentId);
          await storage.updateRideRequestPaymentStatus(requestId, "cancelled");
        } catch (stripeError) {
          console.error("Error cancelling Stripe payment:", stripeError);
          // Continue with request cancellation even if Stripe fails
        }
      }

      // Update request status to cancelled
      await storage.cancelRideRequest(requestId, req.user!.uid);

      res.json({ 
        success: true,
        message: "Ride request cancelled successfully"
      });
    } catch (error: any) {
      console.error("Error cancelling ride request:", error);
      res.status(500).json({ message: "Error cancelling ride request: " + error.message });
    }
  });

  // Delete payment method
  app.delete("/api/payment-methods/:id", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const paymentMethodId = req.params.id;
      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify the payment method belongs to this user
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (paymentMethod.customer !== user.stripeCustomerId) {
        return res.status(403).json({ message: "Payment method does not belong to this user" });
      }

      // Detach the payment method from the customer
      await stripe.paymentMethods.detach(paymentMethodId);

      // If this was the default payment method, clear it from user record
      if (user.defaultPaymentMethodId === paymentMethodId) {
        await storage.updateUserStripeInfo(user.firebaseUid, user.stripeCustomerId, null);
      }

      res.json({ success: true, message: "Payment method deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ message: "Error deleting payment method: " + error.message });
    }
  });

  // Delete driver account and reset Stripe Connect account
  app.delete("/api/driver/account", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user has a Stripe Connect account, delete it
      if (user.stripeConnectAccountId) {
        try {
          await stripe.accounts.del(user.stripeConnectAccountId);
        } catch (stripeError: any) {
          console.error("Error deleting Stripe Connect account:", stripeError);
          // Continue with local cleanup even if Stripe deletion fails
        }
      }

      // Reset the user's Stripe Connect account ID in the database
      await storage.updateUserStripeConnectAccount(user.id, null);

      res.json({ 
        success: true, 
        message: "Driver account deleted successfully. You can now restart the driver setup process." 
      });
    } catch (error: any) {
      console.error("Error deleting driver account:", error);
      res.status(500).json({ message: "Error deleting driver account: " + error.message });
    }
  });

  // === Admin Routes ===
  
  // Admin authentication
  app.post("/api/admin/auth", async (req, res) => {
    try {
      const { passkey } = req.body;
      
      // Simple passkey check - in production, use more secure method
      if (passkey === "admin") {
        const token = crypto.randomBytes(32).toString('hex');
        res.json({ token });
      } else {
        res.status(401).json({ error: "Invalid passkey" });
      }
    } catch (error) {
      console.error("Admin auth error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notification routes
  app.get('/api/notifications', authenticate, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.uid);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  });

  app.get('/api/notifications/unread-count', authenticate, async (req: Request, res: Response) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.uid);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ count: 0 });
    }
  });

  app.patch('/api/notifications/:id/read', authenticate, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Error marking notification as read' });
    }
  });

  // Driver offers endpoints
  app.post('/api/driver-offers', authenticate, async (req: Request, res: Response) => {
    try {
      const { passengerRideId, price, message } = req.body;
      const driverId = req.user?.uid;

      if (!driverId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!passengerRideId || !price) {
        return res.status(400).json({ message: 'Passenger ride ID and price are required' });
      }

      // Check if driver is onboarded (has Stripe Connect account)
      const driver = await storage.getUserByFirebaseUid(driverId);
      if (!driver || !driver.stripeConnectAccountId) {
        return res.status(400).json({ message: 'Driver must complete onboarding first' });
      }

      // Create driver offer
      const offer = await storage.createDriverOffer({
        driverId,
        passengerRideId,
        price,
        message: message?.trim() || null,
        status: 'pending'
      });

      // Create notification for the passenger
      await storage.createNotification({
        userId: ride.driverId, // This is the passenger who posted the ride request
        type: 'driver_offer',
        title: 'New Driver Offer',
        message: `${driverUser.displayName} offered to drive you for $${price}`,
        relatedId: offer.id,
        isRead: false
      });

      // Get passenger info and send SMS notification
      const ride = await storage.getRideById(passengerRideId);
      if (ride) {
        const passenger = await storage.getUserByFirebaseUid(ride.driverId); // This is the passenger who posted the ride request
        const driverUser = await storage.getUserByFirebaseUid(driverId);
        
        if (passenger?.phone && driverUser) {
          try {
            // Format driver name from "Last, First" to "First Last"
            const formatName = (displayName: string): string => {
              if (!displayName) return displayName;
              if (displayName.includes(',')) {
                const parts = displayName.split(',').map(part => part.trim());
                if (parts.length === 2) {
                  const [lastName, firstMiddle] = parts;
                  return `${firstMiddle} ${lastName}`;
                }
              }
              return displayName;
            };
            
            const formattedDriverName = formatName(driverUser.displayName);
            const smsMessage = `🚗 New driver offer from ${formattedDriverName}!\n\nRoute: ${ride.origin} → ${ride.destination}\nPrice: $${price}\nDeparture: ${new Date(ride.departureTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${new Date(ride.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}\n${message ? `\nMessage: "${message}"\n` : ''}\nView and respond: https://jointrek.replit.app/`;
            
            await twilioService.sendSMS({
              to: passenger.phone,
              message: smsMessage
            });
            
            console.log(`SMS notification sent to passenger ${passenger.email} at ${passenger.phone}`);
          } catch (smsError) {
            console.error('Error sending SMS notification:', smsError);
            // Don't fail the offer creation if SMS fails
          }
        }
      }

      res.json(offer);
    } catch (error) {
      console.error('Error creating driver offer:', error);
      res.status(500).json({ message: 'Failed to create driver offer' });
    }
  });

  app.get('/api/driver-offers/received/:rideId', authenticate, async (req: Request, res: Response) => {
    try {
      const rideId = parseInt(req.params.rideId);
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const offers = await storage.getDriverOffersForRide(rideId);
      res.json(offers);
    } catch (error) {
      console.error('Error fetching driver offers:', error);
      res.status(500).json({ message: 'Failed to fetch driver offers' });
    }
  });

  app.get('/api/driver-offers/for-user', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get all driver offers for rides posted by this user
      const userRides = await storage.getRidesByDriver(userId);
      const allOffers = [];
      
      for (const ride of userRides) {
        const offers = await storage.getDriverOffersForRide(ride.id);
        allOffers.push(...offers);
      }

      res.json(allOffers);
    } catch (error) {
      console.error('Error fetching user driver offers:', error);
      res.status(500).json({ message: 'Failed to fetch driver offers' });
    }
  });

  app.patch('/api/driver-offers/:id/status', authenticate, async (req: Request, res: Response) => {
    try {
      const offerId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const updatedOffer = await storage.updateDriverOfferStatus(offerId, status, userId);
      res.json(updatedOffer);
    } catch (error) {
      console.error('Error updating driver offer status:', error);
      res.status(500).json({ message: 'Failed to update driver offer status' });
    }
  });

  // Admin middleware
  const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Admin dashboard stats
  app.get("/api/admin/stats", adminAuth, async (req, res) => {
    try {
      const totalUsers = await storage.getUserCount();
      const totalRides = await storage.getRideCount();
      const requestStats = await storage.getRequestStats();
      
      res.json({
        totalUsers,
        totalRides,
        totalRequests: requestStats.total,
        pendingRequests: requestStats.pending,
        approvedRequests: requestStats.approved,
        rejectedRequests: requestStats.rejected
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin users list
  app.get("/api/admin/users", adminAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin update user
  app.patch("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { displayName, phone, instagram, snapchat } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (phone !== undefined) updateData.phone = phone;
      if (instagram !== undefined) updateData.instagram = instagram;
      if (snapchat !== undefined) updateData.snapchat = snapchat;

      const updatedUser = await storage.updateUser(user.firebaseUid, updateData);
      
      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    } catch (error) {
      console.error("Admin update user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin delete user
  app.delete("/api/admin/users/:id", adminAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Delete user's data in cascade order
      await storage.executeSQL(`DELETE FROM ride_requests WHERE passenger_id = '${user.firebaseUid}' OR driver_id = '${user.firebaseUid}'`);
      await storage.executeSQL(`DELETE FROM bookings WHERE passenger_id = '${user.firebaseUid}'`);
      await storage.executeSQL(`DELETE FROM rides WHERE driver_id = '${user.firebaseUid}'`);
      await storage.executeSQL(`DELETE FROM messages WHERE sender_id = '${user.firebaseUid}'`);
      await storage.executeSQL(`DELETE FROM reviews WHERE reviewer_id = '${user.firebaseUid}' OR reviewee_id = '${user.firebaseUid}'`);
      await storage.executeSQL(`DELETE FROM user_stats WHERE user_id = '${user.firebaseUid}'`);
      await storage.executeSQL(`DELETE FROM notifications WHERE user_id = '${user.firebaseUid}'`);
      await storage.executeSQL(`DELETE FROM users WHERE id = ${userId}`);
      
      res.json({ success: true, message: "User and all associated data deleted successfully" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin rides list
  app.get("/api/admin/rides", adminAuth, async (req, res) => {
    try {
      const rides = await storage.getAllRides();
      res.json(rides);
    } catch (error) {
      console.error("Admin rides error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin requests list
  app.get("/api/admin/requests", adminAuth, async (req, res) => {
    try {
      const requests = await storage.getAllRequests();
      res.json(requests);
    } catch (error) {
      console.error("Admin requests error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin approved rides with passengers
  app.get("/api/admin/approved-rides", adminAuth, async (req, res) => {
    try {
      const approvedRides = await storage.getApprovedRidesWithPassengers();
      res.json(approvedRides);
    } catch (error) {
      console.error("Admin approved rides error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Database management - Get table data
  app.get("/api/admin/table/:tableName", adminAuth, async (req, res) => {
    try {
      const { tableName } = req.params;
      const allowedTables = ['users', 'rides', 'ride_requests', 'conversations', 'messages'];
      
      if (!allowedTables.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      const data = await storage.getTableData(tableName);
      res.json(data);
    } catch (error) {
      console.error(`Admin table ${req.params.tableName} error:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Database management - Delete record
  app.delete("/api/admin/table/:tableName/:id", adminAuth, async (req, res) => {
    try {
      const { tableName, id } = req.params;
      const allowedTables = ['users', 'rides', 'ride_requests', 'conversations', 'messages'];
      
      if (!allowedTables.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name" });
      }

      await storage.deleteRecord(tableName, parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error(`Admin delete ${req.params.tableName}/${req.params.id} error:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Database management - Execute SQL
  app.post("/api/admin/sql", adminAuth, async (req, res) => {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "SQL query is required" });
      }

      // Basic security check - prevent dangerous operations
      const lowerQuery = query.toLowerCase().trim();
      const dangerousCommands = ['drop', 'truncate', 'alter', 'create', 'grant', 'revoke'];
      
      if (dangerousCommands.some(cmd => lowerQuery.startsWith(cmd))) {
        return res.status(403).json({ error: "Dangerous SQL operations are not allowed" });
      }

      const result = await storage.executeSQL(query);
      res.json(result);
    } catch (error) {
      console.error("Admin SQL execution error:", error);
      res.status(500).json({ error: "SQL execution failed: " + (error as Error).message });
    }
  });

  // Database management - Execute SQL query
  app.post("/api/admin/sql", adminAuth, async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Invalid query" });
      }

      // Basic safety check - only allow SELECT, INSERT, UPDATE, DELETE
      const trimmedQuery = query.trim().toLowerCase();
      const allowedOperations = ['select', 'insert', 'update', 'delete'];
      const operation = trimmedQuery.split(' ')[0];
      
      if (!allowedOperations.includes(operation)) {
        return res.status(400).json({ error: "Only SELECT, INSERT, UPDATE, DELETE operations allowed" });
      }

      const result = await storage.executeSQL(query);
      res.json(result);
    } catch (error) {
      console.error("Admin SQL error:", error);
      res.status(500).json({ error: "SQL execution failed: " + (error as Error).message });
    }
  });

  // Cancel ride with penalty logic
  app.post("/api/rides/:id/cancel", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const rideId = parseInt(req.params.id);
      const { cancellationReason } = req.body;
      
      if (isNaN(rideId)) {
        return res.status(400).json({ message: "Invalid ride ID" });
      }

      // Get the ride details
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Check if ride is already cancelled, started, or completed
      if (ride.isCancelled) {
        return res.status(400).json({ message: "Ride is already cancelled" });
      }
      if (ride.isStarted) {
        return res.status(400).json({ message: "Cannot cancel a ride that has already started" });
      }
      if (ride.isCompleted) {
        return res.status(400).json({ message: "Cannot cancel a completed ride" });
      }

      const userId = req.user!.uid;
      const user = await storage.getUserByFirebaseUid(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Determine if user is driver or has approved ride request
      const isDriver = ride.driverId === userId;
      const approvedRequests = await db
        .select()
        .from(rideRequests)
        .where(and(
          eq(rideRequests.rideId, rideId),
          eq(rideRequests.passengerId, userId),
          eq(rideRequests.status, 'approved')
        ));
      
      const isApprovedPassenger = approvedRequests.length > 0;

      if (!isDriver && !isApprovedPassenger) {
        return res.status(403).json({ message: "You can only cancel rides you're involved in" });
      }

      // Calculate hours until departure
      const now = new Date();
      const departureTime = new Date(ride.departureTime);
      const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Get current strike count
      const currentStrikes = await storage.getUserCancellationStrikes(userId);
      let penaltyApplied = false;
      let penaltyAmount = 0;

      // Apply penalty logic if cancelling within 48 hours
      if (hoursUntilDeparture < 48) {
        if (currentStrikes === 0) {
          // First strike - just log warning
          await storage.updateUserCancellationStrikes(userId);
          console.log(`First cancellation strike for user ${userId} on ride ${rideId}`);
        } else {
          // Second strike or more - apply penalty
          await storage.updateUserCancellationStrikes(userId);
          
          if (isDriver) {
            // Driver penalty: 20% of ride payout they would have received
            const ridePrice = parseFloat(ride.price);
            const driverPayout = ridePrice * 0.93; // Driver gets 93% normally
            penaltyAmount = Math.round(driverPayout * 0.20 * 100); // 20% penalty in cents

            // Charge driver via Stripe
            if (user.stripeConnectAccountId) {
              try {
                await stripe.transfers.create({
                  amount: penaltyAmount,
                  currency: 'usd',
                  destination: 'acct_1234567890', // Platform account - would need to be configured
                  source_transaction: user.stripeConnectAccountId,
                  description: `Cancellation penalty for ride ${rideId}`
                });
                penaltyApplied = true;
              } catch (stripeError) {
                console.error('Failed to charge driver penalty:', stripeError);
                // Continue with cancellation even if penalty fails
              }
            }
          } else {
            // Passenger penalty: 20% of ride cost
            const ridePrice = parseFloat(ride.price);
            penaltyAmount = Math.round(ridePrice * 0.20 * 100); // 20% penalty in cents

            // Charge passenger via Stripe
            if (user.stripeCustomerId) {
              try {
                await stripe.paymentIntents.create({
                  amount: penaltyAmount,
                  currency: 'usd',
                  customer: user.stripeCustomerId,
                  confirm: true,
                  automatic_payment_methods: {
                    enabled: true,
                    allow_redirects: "never"
                  },
                  description: `Cancellation penalty for ride ${rideId}`
                });
                penaltyApplied = true;
              } catch (stripeError) {
                console.error('Failed to charge passenger penalty:', stripeError);
                // Continue with cancellation even if penalty fails
              }
            }
          }
        }
      }

      // Cancel the ride
      const cancelledBy = isDriver ? 'driver' : 'passenger';
      await storage.cancelRide(rideId, cancelledBy, cancellationReason);

      // Cancel all approved ride requests and refund payments
      const allApprovedRequests = await db
        .select()
        .from(rideRequests)
        .where(and(
          eq(rideRequests.rideId, rideId),
          eq(rideRequests.status, 'approved')
        ));

      const refundResults = [];
      for (const request of allApprovedRequests) {
        if (request.stripePaymentIntentId) {
          try {
            await stripe.paymentIntents.cancel(request.stripePaymentIntentId);
            await storage.updateRideRequestPaymentStatus(request.id, 'canceled');
            refundResults.push({
              requestId: request.id,
              passengerId: request.passengerId,
              status: 'refunded'
            });
          } catch (error) {
            console.error(`Failed to refund request ${request.id}:`, error);
            refundResults.push({
              requestId: request.id,
              passengerId: request.passengerId,
              status: 'refund_failed'
            });
          }
        }
      }

      // Update all ride requests to cancelled
      await db.update(rideRequests)
        .set({ status: 'canceled' })
        .where(eq(rideRequests.rideId, rideId));

      const updatedStrikeCount = await storage.getUserCancellationStrikes(userId);

      res.json({
        success: true,
        message: "Ride cancelled successfully",
        penaltyApplied,
        penaltyAmount: penaltyAmount / 100, // Convert back to dollars
        strikeCount: updatedStrikeCount,
        hoursUntilDeparture: Math.round(hoursUntilDeparture * 10) / 10,
        refundsProcessed: refundResults.length,
        refundResults
      });

    } catch (error: any) {
      console.error("Error cancelling ride:", error);
      res.status(500).json({ message: "Error cancelling ride: " + error.message });
    }
  });

  // Get user's cancellation strike count
  app.get("/api/users/strikes", authenticate, async (req, res) => {
    try {
      const strikeCount = await storage.getUserCancellationStrikes(req.user!.uid);
      res.json({ strikeCount });
    } catch (error: any) {
      console.error("Error getting strike count:", error);
      res.status(500).json({ message: "Error getting strike count: " + error.message });
    }
  });

  // Manual payment processing trigger
  app.post("/api/admin/process-payments", adminAuth, async (req, res) => {
    try {
      const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-05-28.basil',
      });

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredAuthorizations = await storage.getExpiredAuthorizedPayments(twentyFourHoursAgo);
      
      console.log(`Processing ${expiredAuthorizations.length} expired payment authorizations`);
      
      const results = [];
      
      for (const request of expiredAuthorizations) {
        try {
          if (request.stripePaymentIntentId) {
            if (request.status === 'approved') {
              if (request.isCompleted) {
                // Capture payment for completed rides
                console.log(`Capturing payment for completed ride request ${request.id}: ${request.stripePaymentIntentId}`);
                
                await stripeInstance.paymentIntents.capture(request.stripePaymentIntentId);
                await storage.updateRideRequestPaymentStatus(request.id, 'captured');
                
                results.push({
                  requestId: request.id,
                  action: 'captured',
                  paymentIntentId: request.stripePaymentIntentId,
                  status: 'success',
                  reason: 'ride_completed'
                });
                
                console.log(`Successfully captured payment for completed request ${request.id}`);
              } else {
                // Check if ride should have started but didn't - cancel and refund
                const currentTime = new Date();
                const departureTime = new Date(request.departureTime);
                const timeSinceDeparture = currentTime.getTime() - departureTime.getTime();
                const twentyFourHours = 24 * 60 * 60 * 1000;
                
                if (timeSinceDeparture > twentyFourHours && !request.isStarted) {
                  console.log(`Canceling approved request ${request.id} - ride didn't start within 24 hours of departure: ${request.stripePaymentIntentId}`);
                  
                  await stripeInstance.paymentIntents.cancel(request.stripePaymentIntentId);
                  await storage.updateRideRequestStatus(request.id, 'canceled', request.driverId || '');
                  await storage.updateRideRequestPaymentStatus(request.id, 'canceled');
                  
                  results.push({
                    requestId: request.id,
                    action: 'canceled_and_refunded',
                    paymentIntentId: request.stripePaymentIntentId,
                    status: 'success',
                    reason: 'ride_not_started_on_time'
                  });
                  
                  console.log(`Successfully canceled and refunded payment for non-started ride request ${request.id}`);
                }
                // Check if ride started but wasn't completed within 24 hours
                else if (request.isStarted && !request.isCompleted && request.startedAt) {
                  const startedAt = new Date(request.startedAt);
                  const timeSinceStart = currentTime.getTime() - startedAt.getTime();
                  
                  if (timeSinceStart > twentyFourHours) {
                    console.log(`Canceling approved request ${request.id} - ride started but not completed within 24 hours: ${request.stripePaymentIntentId}`);
                    
                    await stripeInstance.paymentIntents.cancel(request.stripePaymentIntentId);
                    await storage.updateRideRequestStatus(request.id, 'canceled', request.driverId || '');
                    await storage.updateRideRequestPaymentStatus(request.id, 'canceled');
                    
                    results.push({
                      requestId: request.id,
                      action: 'canceled_and_refunded',
                      paymentIntentId: request.stripePaymentIntentId,
                      status: 'success',
                      reason: 'ride_not_completed_on_time'
                    });
                    
                    console.log(`Successfully canceled and refunded payment for incomplete ride request ${request.id}`);
                  }
                }
              }
            } else if (request.status === 'pending') {
              // Cancel and refund payment for unaccepted requests
              console.log(`Canceling unaccepted request ${request.id}: ${request.stripePaymentIntentId}`);
              
              await stripeInstance.paymentIntents.cancel(request.stripePaymentIntentId);
              await storage.updateRideRequestStatus(request.id, 'canceled', request.driverId || '');
              await storage.updateRideRequestPaymentStatus(request.id, 'canceled');
              
              results.push({
                requestId: request.id,
                action: 'canceled_and_refunded',
                paymentIntentId: request.stripePaymentIntentId,
                status: 'success',
                reason: 'request_not_accepted'
              });
              
              console.log(`Successfully canceled and refunded payment for unaccepted request ${request.id}`);
            }
          }
        } catch (error: any) {
          console.error(`Failed to process payment for request ${request.id}:`, error.message);
          results.push({
            requestId: request.id,
            action: request.status === 'approved' ? 'capture_failed' : 'cancel_failed',
            paymentIntentId: request.stripePaymentIntentId,
            status: 'error',
            error: error.message
          });
        }
      }

      res.json({
        message: `Processed ${expiredAuthorizations.length} payment authorizations`,
        results
      });
    } catch (error) {
      console.error("Admin payment processing error:", error);
      res.status(500).json({ error: "Payment processing failed: " + (error as Error).message });
    }
  });

  return httpServer;
}
