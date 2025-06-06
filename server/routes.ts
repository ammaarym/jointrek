import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./postgres-storage"; // Use PostgreSQL storage
import { insertUserSchema, insertRideSchema, insertBookingSchema, insertMessageSchema, insertConversationSchema, insertReviewSchema, insertRideRequestSchema } from "@shared/schema";
import * as admin from 'firebase-admin';
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import apiRoutes from "./api";
import { sendRideRequestNotification, sendRideApprovalNotification } from "./twilioService";
import crypto from "crypto";
import Stripe from "stripe";

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

// Simplified authentication middleware since we're using client-side auth
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, we're using a simplified auth approach since we're handling 
    // authentication on the client side using Firebase Authentication
    
    // In a production app, we would verify the token here with Firebase Admin SDK
    // For the demo, we'll use a simplified approach
    
    // Create a dummy authenticated user for development
    const dummyUser = {
      uid: req.headers['x-user-id'] as string || 'demo-user',
      email: req.headers['x-user-email'] as string || 'student@ufl.edu',
      email_verified: true,
      name: req.headers['x-user-name'] as string || 'Demo Student',
    } as admin.auth.DecodedIdToken;
    
    // Add user info to request
    req.user = dummyUser;
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

      // SMS notification disabled for testing
      // TODO: Re-enable SMS notifications after in-app approval is confirmed working
      /*
      // Send SMS notification to driver
      try {
        // Get ride and driver details
        const ride = await storage.getRide(validatedData.rideId);
        const driver = await storage.getUserByFirebaseUid(ride.driverId);
        const passenger = await storage.getUserByFirebaseUid(req.user.uid);

        if (ride && driver && driver.phone && passenger) {
          await sendRideRequestNotification({
            driverPhone: driver.phone,
            passengerName: passenger.displayName || passenger.email.split('@')[0],
            origin: ride.origin,
            destination: ride.destination,
            departureTime: ride.departureTime.toISOString(),
            price: ride.price,
            requestId: rideRequest.id.toString()
          });
          console.log(`SMS notification sent to driver ${driver.email} for ride request ${rideRequest.id}`);
        } else {
          console.log(`Cannot send SMS - missing driver phone number or user data`);
        }
      } catch (smsError) {
        console.error("Error sending SMS notification:", smsError);
        // Don't fail the request if SMS fails
      }
      */

      res.status(201).json(rideRequest);
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
          
          // SMS approval notification disabled for testing
          // TODO: Re-enable SMS notifications after in-app approval is confirmed working
          
        } catch (error) {
          console.error("Error processing approved request:", error);
          // Don't fail the request if processing fails
        }
      }

      res.json(updatedRequest);
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

  // Mark ride as complete
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

      const updatedRide = await storage.markRideComplete(rideId);
      res.json(updatedRide);
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

      const { rideId } = req.body;
      
      if (!rideId) {
        return res.status(400).json({ message: "rideId is required" });
      }

      const user = await storage.getUserByFirebaseUid(req.user!.uid);
      if (!user || !user.stripeCustomerId || !user.defaultPaymentMethodId) {
        return res.status(400).json({ message: "Please add a payment method to your profile first" });
      }

      // Get ride details
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Create payment intent with saved payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(ride.price) * 100), // Convert to cents
        currency: "usd",
        customer: user.stripeCustomerId,
        payment_method: user.defaultPaymentMethodId,
        confirmation_method: "manual",
        confirm: true,
        capture_method: "manual", // Authorize now, capture later
        description: `Trek ride from ${ride.origin} to ${ride.destination}`,
        metadata: {
          rideId: rideId.toString(),
          passengerId: req.user!.uid,
          driverId: ride.driverId
        }
      });

      // Create ride request with payment info
      const rideRequest = await storage.createRideRequest({
        rideId,
        passengerId: req.user!.uid,
        status: "pending",
        stripePaymentIntentId: paymentIntent.id,
        paymentAmount: parseFloat(ride.price),
        paymentStatus: "authorized"
      });

      res.json({ 
        success: true,
        rideRequestId: rideRequest.id,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status
      });
    } catch (error: any) {
      console.error("Error confirming ride request:", error);
      res.status(500).json({ message: "Error confirming ride request: " + error.message });
    }
  });
  
  // Create payment intent for ride request (legacy method - keeping for compatibility)
  app.post("/api/create-payment-intent", authenticate, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment service not available" });
      }

      const { rideId, amount } = req.body;
      
      if (!rideId || !amount) {
        return res.status(400).json({ message: "rideId and amount are required" });
      }

      // Get ride details for payment description
      const ride = await storage.getRideById(rideId);
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }

      // Create payment intent with authorization only (don't capture yet)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        capture_method: "manual", // This allows us to authorize now and capture later
        description: `Trek ride from ${ride.origin} to ${ride.destination}`,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never"
        },
        metadata: {
          rideId: rideId.toString(),
          passengerId: req.user!.uid,
          driverId: ride.driverId
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
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

  return httpServer;
}
