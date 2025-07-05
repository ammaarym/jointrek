import { db } from "./db";
import { 
  rides, 
  users, 
  bookings, 
  messages, 
  conversations,
  completedRides,
  reviews,
  rideRequests,
  userStats,
  notifications,
  driverOffers,
  complaints,
  pollVotes,
  waitlist,
  insuranceDocuments,
  type Ride,
  type InsertRide,
  type User,
  type InsertUser,
  type Booking,
  type InsertBooking,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type CompletedRide,
  type InsertCompletedRide,
  type Review,
  type InsertReview,
  type RideRequest,
  type InsertRideRequest,
  type UserStats,
  type InsertUserStats,
  type DriverOffer,
  type InsertDriverOffer,
  type Complaint,
  type InsertComplaint,
  type PollVote,
  type InsertPollVote,
  type Waitlist,
  type InsertWaitlist,
  type InsuranceDocument,
  type InsertInsuranceDocument,
  insertNotificationSchema
} from "@shared/schema";
import { eq, and, or, desc, gte, sql, lt, isNull } from "drizzle-orm";
import { IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(firebaseUid: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.firebaseUid, firebaseUid))
      .returning();
    return updatedUser;
  }

  async updateUserStripeInfo(firebaseUid: string, stripeCustomerId: string, defaultPaymentMethodId?: string | null): Promise<User | undefined> {
    const updateData: any = { stripeCustomerId };
    if (defaultPaymentMethodId !== undefined) {
      updateData.defaultPaymentMethodId = defaultPaymentMethodId;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.firebaseUid, firebaseUid))
      .returning();
    return updatedUser;
  }

  // Ride methods
  async getRide(id: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride;
  }

  async getAllRidesOriginal(): Promise<Ride[]> {
    return await db.select().from(rides).orderBy(desc(rides.departureTime));
  }

  async getRidesByDriver(driverId: string): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.driverId, driverId))
      .orderBy(desc(rides.departureTime));
  }

  async getRidesByOrigin(origin: string): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.origin, origin))
      .orderBy(desc(rides.departureTime));
  }

  async getRidesByDestination(destination: string): Promise<Ride[]> {
    return await db
      .select()
      .from(rides)
      .where(eq(rides.destination, destination))
      .orderBy(desc(rides.departureTime));
  }

  async getRidesInFuture(): Promise<any[]> {
    // Helper function to format names from "Last, First" to "First Last"
    const formatDriverName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    const results = await db
      .select({
        id: rides.id,
        driverId: rides.driverId,
        origin: rides.origin,
        destination: rides.destination,
        originArea: rides.originArea,
        destinationArea: rides.destinationArea,
        departureTime: rides.departureTime,
        arrivalTime: rides.arrivalTime,
        seatsTotal: rides.seatsTotal,
        seatsLeft: rides.seatsLeft,
        price: rides.price,
        genderPreference: rides.genderPreference,
        carModel: rides.carModel,
        carMake: rides.carMake,
        carYear: rides.carYear,
        baggageCheckIn: rides.baggageCheckIn,
        baggagePersonal: rides.baggagePersonal,
        notes: rides.notes,
        createdAt: rides.createdAt,
        rideType: rides.rideType,
        isCompleted: rides.isCompleted,
        driverName: users.displayName,
        driverEmail: users.email,
        driverPhoto: users.photoUrl,
        driverPhone: users.phone,
        driverInstagram: users.instagram,
        driverSnapchat: users.snapchat,
        driverInterestTags: users.interestTags
      })
      .from(rides)
      .leftJoin(users, eq(rides.driverId, users.firebaseUid))
      .orderBy(desc(rides.departureTime));

    // Format driver names from "Last, First" to "First Last"
    return results.map(ride => ({
      ...ride,
      driverName: formatDriverName(ride.driverName)
    }));
  }

  async createRide(rideData: InsertRide): Promise<Ride> {
    const [ride] = await db.insert(rides).values(rideData).returning();
    return ride;
  }

  async updateRide(id: number, data: Partial<InsertRide>): Promise<Ride | undefined> {
    const [updatedRide] = await db
      .update(rides)
      .set(data)
      .where(eq(rides.id, id))
      .returning();
    return updatedRide;
  }

  async deleteRide(id: number): Promise<boolean> {
    try {
      // With CASCADE DELETE constraints, we can delete the ride directly
      // and all related records (driver_offers, ride_requests, reviews, etc.) will be deleted automatically
      const result = await db.delete(rides).where(eq(rides.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting ride:', error);
      throw error;
    }
  }

  async getRidesByLocation(origin: string, destination?: string): Promise<any[]> {
    // Helper function to format names from "Last, First" to "First Last"
    const formatDriverName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    const baseQuery = db
      .select({
        id: rides.id,
        driverId: rides.driverId,
        origin: rides.origin,
        destination: rides.destination,
        originArea: rides.originArea,
        destinationArea: rides.destinationArea,
        departureTime: rides.departureTime,
        arrivalTime: rides.arrivalTime,
        seatsTotal: rides.seatsTotal,
        seatsLeft: rides.seatsLeft,
        price: rides.price,
        genderPreference: rides.genderPreference,
        carModel: rides.carModel,
        carMake: rides.carMake,
        carYear: rides.carYear,
        baggageCheckIn: rides.baggageCheckIn,
        baggagePersonal: rides.baggagePersonal,
        notes: rides.notes,
        createdAt: rides.createdAt,
        rideType: rides.rideType,
        isCompleted: rides.isCompleted,
        driverName: users.displayName,
        driverEmail: users.email,
        driverPhoto: users.photoUrl,
        driverPhone: users.phone,
        driverInstagram: users.instagram,
        driverSnapchat: users.snapchat,
        driverInterestTags: users.interestTags
      })
      .from(rides)
      .leftJoin(users, eq(rides.driverId, users.firebaseUid))
      .where(destination ? 
        and(eq(rides.origin, origin), eq(rides.destination, destination)) : 
        eq(rides.origin, origin)
      )
      .orderBy(desc(rides.departureTime));

    const results = await baseQuery;
    
    // Format driver names from "Last, First" to "First Last"
    return results.map(ride => ({
      ...ride,
      driverName: formatDriverName(ride.driverName)
    }));
  }


  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByRide(rideId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.rideId, rideId));
  }

  async getBookingsByPassenger(passengerId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.passengerId, passengerId));
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(bookingData).returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationByParticipants(participantIds: string[]): Promise<Conversation | undefined> {
    // This is a simplified approach - we're checking if all participants are in the array
    // A more sophisticated approach would be needed for exact matches
    const allConversations = await db.select().from(conversations);
    const matchingConversation = allConversations.find(convo => {
      const participantsSet = new Set(convo.participants);
      return participantIds.every(id => participantsSet.has(id)) && 
             participantsSet.size === participantIds.length;
    });
    
    return matchingConversation;
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    // This is a simplified approach - we need to check if the userId is in the participants array
    const allConversations = await db.select().from(conversations);
    return allConversations.filter(convo => convo.participants.includes(userId));
  }

  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const [conversation] = await db.insert(conversations).values(conversationData).returning();
    return conversation;
  }

  async updateConversationLastMessage(id: number, message: string): Promise<Conversation | undefined> {
    const now = new Date();
    const [updatedConversation] = await db
      .update(conversations)
      .set({ 
        lastMessage: message,
        lastMessageTimestamp: now
      })
      .where(eq(conversations.id, id))
      .returning();
    
    return updatedConversation;
  }

  // Passenger-related methods
  async getRidesByPassenger(passengerId: string): Promise<Ride[]> {
    // Get bookings for this passenger
    const passengerBookings = await this.getBookingsByPassenger(passengerId);
    
    // Get the rides associated with these bookings
    const rideIds = passengerBookings.map(booking => booking.rideId);
    
    if (rideIds.length === 0) {
      return [];
    }
    
    // Get all rides where the ID is in the list of ride IDs
    if (rideIds.length === 1) {
      return await db
        .select()
        .from(rides)
        .where(eq(rides.id, rideIds[0]));
    } else {
      return await db
        .select()
        .from(rides)
        .where(sql`${rides.id} IN (${rideIds.join(',')})`);
    }
  }

  // Ride completion methods
  async markRideComplete(id: number): Promise<Ride | undefined> {
    const [updatedRide] = await db
      .update(rides)
      .set({ isCompleted: true })
      .where(eq(rides.id, id))
      .returning();
    return updatedRide;
  }

  // Get a ride by ID
  async getRideById(id: number): Promise<Ride | undefined> {
    const [ride] = await db.select().from(rides).where(eq(rides.id, id));
    return ride;
  }

  async getCompletedRidesByUser(userId: string): Promise<CompletedRide[]> {
    return await db.select().from(completedRides).where(eq(completedRides.participantId, userId));
  }

  async isRideCompletedByUser(rideId: number, userId: string): Promise<boolean> {
    const [completed] = await db
      .select()
      .from(completedRides)
      .where(and(eq(completedRides.rideId, rideId), eq(completedRides.participantId, userId)));
    return !!completed;
  }

  // Review methods
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    
    // Update user statistics after creating review
    await this.updateUserRatingStats(reviewData.revieweeId, reviewData.reviewType, reviewData.rating);
    
    return review;
  }

  async getReviewsByReviewee(revieweeId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.revieweeId, revieweeId));
  }

  async getReviewsByRide(rideId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.rideId, rideId));
  }

  async hasUserReviewedRide(reviewerId: string, rideId: number, revieweeId: string): Promise<boolean> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(
        eq(reviews.reviewerId, reviewerId),
        eq(reviews.rideId, rideId),
        eq(reviews.revieweeId, revieweeId)
      ));
    return !!review;
  }

  // User Statistics methods
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async createUserStats(userId: string): Promise<UserStats> {
    const [stats] = await db.insert(userStats).values({
      userId,
      driverRating: 0,
      passengerRating: 0,
      totalDriverRatings: 0,
      totalPassengerRatings: 0,
      ridesAsDriver: 0,
      ridesAsPassenger: 0
    }).returning();
    return stats;
  }

  async updateUserRatingStats(userId: string, reviewType: string, rating: number): Promise<void> {
    // Get existing stats or create new ones
    let stats = await this.getUserStats(userId);
    if (!stats) {
      stats = await this.createUserStats(userId);
    }

    if (reviewType === 'driver') {
      const newTotal = (stats.totalDriverRatings || 0) + 1;
      const currentSum = (stats.driverRating || 0) * (stats.totalDriverRatings || 0);
      const newAverage = (currentSum + rating) / newTotal;

      await db.update(userStats)
        .set({
          driverRating: newAverage,
          totalDriverRatings: newTotal,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));
    } else if (reviewType === 'passenger') {
      const newTotal = (stats.totalPassengerRatings || 0) + 1;
      const currentSum = (stats.passengerRating || 0) * (stats.totalPassengerRatings || 0);
      const newAverage = (currentSum + rating) / newTotal;

      await db.update(userStats)
        .set({
          passengerRating: newAverage,
          totalPassengerRatings: newTotal,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));
    }
  }

  async updateUserRideCount(userId: string, rideType: 'driver' | 'passenger'): Promise<void> {
    // Get existing stats or create new ones
    let stats = await this.getUserStats(userId);
    if (!stats) {
      stats = await this.createUserStats(userId);
    }

    if (rideType === 'driver') {
      await db.update(userStats)
        .set({
          ridesAsDriver: (stats.ridesAsDriver || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));
    } else {
      await db.update(userStats)
        .set({
          ridesAsPassenger: (stats.ridesAsPassenger || 0) + 1,
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));
    }
  }

  // Ride request methods
  async createRideRequest(requestData: InsertRideRequest): Promise<RideRequest> {
    const [request] = await db.insert(rideRequests).values(requestData).returning();
    return request;
  }

  async getRideRequestsForDriver(driverId: string): Promise<any[]> {
    // Helper function to format names from "Last, First" to "First Last"
    const formatPassengerName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    const requests = await db
      .select({
        id: rideRequests.id,
        rideId: rideRequests.rideId,
        passengerId: rideRequests.passengerId,
        status: rideRequests.status,
        message: rideRequests.message,
        createdAt: rideRequests.createdAt,
        passengerName: users.displayName,
        passengerEmail: users.email,
        passengerPhone: users.phone,
        rideOrigin: rides.origin,
        rideDestination: rides.destination,
        rideDepartureTime: rides.departureTime
      })
      .from(rideRequests)
      .innerJoin(rides, eq(rideRequests.rideId, rides.id))
      .innerJoin(users, eq(rideRequests.passengerId, users.firebaseUid))
      .where(eq(rides.driverId, driverId))
      .orderBy(desc(rideRequests.createdAt));
    
    // Format passenger names from "Last, First" to "First Last"
    return requests.map(request => ({
      ...request,
      passengerName: formatPassengerName(request.passengerName)
    }));
  }

  async getPendingRequestsForRide(rideId: number): Promise<RideRequest[]> {
    return await db
      .select()
      .from(rideRequests)
      .where(eq(rideRequests.rideId, rideId));
  }

  async getRideRequestsForUser(userId: string): Promise<any[]> {
    // Helper function to format names from "Last, First" to "First Last"
    const formatDriverName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    const requests = await db
      .select({
        id: rideRequests.id,
        rideId: rideRequests.rideId,
        passengerId: rideRequests.passengerId,
        status: rideRequests.status,
        message: rideRequests.message,
        createdAt: rideRequests.createdAt,
        driverName: users.displayName,
        driverEmail: users.email,
        driverPhone: users.phone,
        rideOrigin: rides.origin,
        rideDestination: rides.destination,
        rideDepartureTime: rides.departureTime
      })
      .from(rideRequests)
      .innerJoin(rides, eq(rideRequests.rideId, rides.id))
      .innerJoin(users, eq(rides.driverId, users.firebaseUid))
      .where(eq(rideRequests.passengerId, userId))
      .orderBy(desc(rideRequests.createdAt));
    
    // Format driver names from "Last, First" to "First Last"
    return requests.map(request => ({
      ...request,
      driverName: formatDriverName(request.driverName)
    }));
  }

  async updateRideRequestStatus(requestId: number, status: string, driverId: string): Promise<RideRequest> {
    // First verify the request belongs to this driver
    const [request] = await db
      .select({
        rideRequest: rideRequests,
        ride: rides
      })
      .from(rideRequests)
      .innerJoin(rides, eq(rideRequests.rideId, rides.id))
      .where(and(
        eq(rideRequests.id, requestId),
        eq(rides.driverId, driverId)
      ));

    if (!request) {
      throw new Error('Request not found or unauthorized');
    }

    const [updatedRequest] = await db
      .update(rideRequests)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(rideRequests.id, requestId))
      .returning();

    // Update baggage availability when status changes
    if (status === 'approved') {
      // Subtract passenger's baggage from ride availability
      await db
        .update(rides)
        .set({
          baggageCheckIn: sql`${rides.baggageCheckIn} - ${request.rideRequest.baggageCheckIn}`,
          baggagePersonal: sql`${rides.baggagePersonal} - ${request.rideRequest.baggagePersonal}`
        })
        .where(eq(rides.id, request.rideRequest.rideId));
    } else if (status === 'rejected' || status === 'cancelled') {
      // If previously approved, add baggage back to availability
      if (request.rideRequest.status === 'approved') {
        await db
          .update(rides)
          .set({
            baggageCheckIn: sql`${rides.baggageCheckIn} + ${request.rideRequest.baggageCheckIn}`,
            baggagePersonal: sql`${rides.baggagePersonal} + ${request.rideRequest.baggagePersonal}`
          })
          .where(eq(rides.id, request.rideRequest.rideId));
      }
    }

    return updatedRequest;
  }

  async cancelRideRequest(requestId: number, passengerId: string): Promise<RideRequest> {
    // First verify the request belongs to this passenger
    const [request] = await db
      .select()
      .from(rideRequests)
      .where(and(
        eq(rideRequests.id, requestId),
        eq(rideRequests.passengerId, passengerId)
      ));

    if (!request) {
      throw new Error('Request not found or unauthorized');
    }

    // Only allow canceling pending requests
    if (request.status !== 'pending') {
      throw new Error('Only pending requests can be cancelled');
    }

    const [updatedRequest] = await db
      .update(rideRequests)
      .set({ 
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(rideRequests.id, requestId))
      .returning();

    return updatedRequest;
  }

  async getApprovedRidesForUser(userId: string): Promise<any[]> {
    // Get rides where user is a passenger (approved requests)
    const passengerRides = await db
      .select({
        id: rideRequests.id,
        rideId: rideRequests.rideId,
        requestId: rideRequests.id,
        status: rideRequests.status,
        message: rideRequests.message,
        createdAt: rideRequests.createdAt,
        driverId: rides.driverId,
        driverName: users.displayName,
        driverEmail: users.email,
        driverPhone: users.phone,
        driverInstagram: users.instagram,
        driverSnapchat: users.snapchat,
        rideOrigin: rides.origin,
        rideDestination: rides.destination,
        rideDepartureTime: rides.departureTime,
        rideArrivalTime: rides.arrivalTime,
        ridePrice: sql<string>`COALESCE(${rideRequests.paymentAmount}::text, ${rides.price}::text)`,
        rideCarModel: rides.carModel,
        isCompleted: rides.isCompleted, // Include completion status
        isStarted: rides.isStarted, // Include start status
        startVerificationCode: rides.startVerificationCode,
        startedAt: rides.startedAt,
        userRole: sql<string>`'passenger'` // Mark user role
      })
      .from(rideRequests)
      .innerJoin(rides, eq(rideRequests.rideId, rides.id))
      .innerJoin(users, eq(rides.driverId, users.firebaseUid))
      .where(and(
        eq(rideRequests.passengerId, userId),
        eq(rideRequests.status, 'approved')
      ));

    // Get rides where user is a driver (with approved passengers)
    const driverRides = await db
      .select({
        id: rideRequests.id,
        rideId: rideRequests.rideId,
        requestId: rideRequests.id,
        status: rideRequests.status,
        message: rideRequests.message,
        createdAt: rideRequests.createdAt,
        driverId: rides.driverId,
        driverName: sql<string>`'You'`, // Driver sees "You" as driver name
        driverEmail: users.email, // Passenger email
        driverPhone: users.phone, // Passenger phone
        driverInstagram: users.instagram, // Passenger instagram
        driverSnapchat: users.snapchat, // Passenger snapchat
        // Add passenger-specific fields for driver view
        passengerName: users.displayName, // Passenger name
        passengerEmail: users.email, // Passenger email
        passengerPhone: users.phone, // Passenger phone
        rideOrigin: rides.origin,
        rideDestination: rides.destination,
        rideDepartureTime: rides.departureTime,
        rideArrivalTime: rides.arrivalTime,
        ridePrice: sql<string>`COALESCE(${rideRequests.paymentAmount}::text, ${rides.price}::text)`,
        rideCarModel: rides.carModel,
        isCompleted: rides.isCompleted, // Include completion status
        isStarted: rides.isStarted, // Include start status
        startVerificationCode: rides.startVerificationCode,
        startedAt: rides.startedAt,
        userRole: sql<string>`'driver'` // Mark user role
      })
      .from(rideRequests)
      .innerJoin(rides, eq(rideRequests.rideId, rides.id))
      .innerJoin(users, eq(rideRequests.passengerId, users.firebaseUid))
      .where(and(
        eq(rides.driverId, userId),
        eq(rideRequests.status, 'approved')
      ));

    // Helper function to format passenger names from "Last, First" to "First Last"
    const formatPassengerName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    // Format passenger names in driver rides
    const formattedDriverRides = driverRides.map(ride => ({
      ...ride,
      passengerName: formatPassengerName(ride.passengerName)
    }));

    // Combine both result sets and ensure price display
    const allApprovedRides = [...passengerRides, ...formattedDriverRides].map(ride => ({
      ...ride,
      ridePrice: ride.ridePrice || ride.originalPrice // Use counter offer price if available, fallback to original
    }));
    
    return allApprovedRides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Admin methods
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async getRideCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(rides);
    return result[0].count;
  }

  async getRequestStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    const result = await db.select({
      total: sql<number>`count(*)`,
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      approved: sql<number>`sum(case when status = 'approved' then 1 else 0 end)`,
      rejected: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)`
    }).from(rideRequests);
    
    return {
      total: result[0].total,
      pending: result[0].pending,
      approved: result[0].approved,
      rejected: result[0].rejected
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllRides(): Promise<any[]> {
    // Helper function to format names from "Last, First" to "First Last"
    const formatDriverName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    const results = await db.select({
      id: rides.id,
      origin: rides.origin,
      destination: rides.destination,
      departureTime: rides.departureTime,
      price: rides.price,
      seatsTotal: rides.seatsTotal,
      seatsLeft: rides.seatsLeft,
      isCompleted: rides.isCompleted,
      driverName: users.displayName,
      driverEmail: users.email
    })
    .from(rides)
    .leftJoin(users, eq(rides.driverId, users.firebaseUid))
    .orderBy(desc(rides.createdAt));

    // Format driver names from "Last, First" to "First Last"
    return results.map(ride => ({
      ...ride,
      driverName: formatDriverName(ride.driverName)
    }));
  }

  async getAllRequests(): Promise<any[]> {
    // Helper function to format names from "Last, First" to "First Last"
    const formatName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    const results = await db.select({
      id: rideRequests.id,
      rideId: rideRequests.rideId,
      status: rideRequests.status,
      message: rideRequests.message,
      createdAt: rideRequests.createdAt,
      passengerName: users.displayName,
      passengerEmail: users.email,
      rideOrigin: rides.origin,
      rideDestination: rides.destination,
      driverName: sql<string>`driver_users.display_name`,
      driverEmail: sql<string>`driver_users.email`,
      departureTime: rides.departureTime,
      price: rides.price
    })
    .from(rideRequests)
    .leftJoin(users, eq(rideRequests.passengerId, users.firebaseUid))
    .leftJoin(rides, eq(rideRequests.rideId, rides.id))
    .leftJoin(sql`users as driver_users`, sql`rides.driver_id = driver_users.firebase_uid`)
    .orderBy(desc(rideRequests.createdAt));

    // Format both passenger and driver names from "Last, First" to "First Last"
    return results.map(request => ({
      ...request,
      passengerName: formatName(request.passengerName),
      driverName: formatName(request.driverName)
    }));
  }

  async getApprovedRidesWithPassengers(): Promise<any[]> {
    // Helper function to format names from "Last, First" to "First Last"
    const formatName = (displayName: string | null): string => {
      if (!displayName) return '';
      
      // Check if name is in "Last, First" format
      if (displayName.includes(', ')) {
        const parts = displayName.split(', ');
        if (parts.length >= 2) {
          const lastName = parts[0];
          const firstName = parts[1];
          return `${firstName} ${lastName}`;
        }
      }
      
      // Return as-is if not in expected format
      return displayName;
    };

    // Get all rides that have approved passengers
    const ridesWithPassengers = await db.select({
      rideId: rides.id,
      origin: rides.origin,
      destination: rides.destination,
      departureTime: rides.departureTime,
      price: rides.price,
      seatsTotal: rides.seatsTotal,
      seatsLeft: rides.seatsLeft,
      driverName: sql<string>`driver_users.display_name`,
      driverEmail: sql<string>`driver_users.email`,
      passengerName: users.displayName,
      passengerEmail: users.email,
      approvedAt: rideRequests.updatedAt
    })
    .from(rides)
    .innerJoin(rideRequests, eq(rides.id, rideRequests.rideId))
    .innerJoin(users, eq(rideRequests.passengerId, users.firebaseUid))
    .innerJoin(sql`users as driver_users`, sql`rides.driver_id = driver_users.firebase_uid`)
    .where(eq(rideRequests.status, 'approved'))
    .orderBy(desc(rides.departureTime));

    // Group passengers by ride
    const groupedRides = ridesWithPassengers.reduce((acc, row) => {
      const rideId = row.rideId;
      if (!acc[rideId]) {
        acc[rideId] = {
          id: rideId,
          origin: row.origin,
          destination: row.destination,
          departureTime: row.departureTime,
          price: row.price,
          seatsTotal: row.seatsTotal,
          seatsLeft: row.seatsLeft,
          driverName: formatName(row.driverName),
          driverEmail: row.driverEmail,
          passengers: []
        };
      }
      acc[rideId].passengers.push({
        name: formatName(row.passengerName),
        email: row.passengerEmail,
        approvedAt: row.approvedAt
      });
      return acc;
    }, {} as Record<number, any>);

    return Object.values(groupedRides);
  }

  // Get a ride request by ID
  async getRideRequestById(id: number): Promise<RideRequest | undefined> {
    const [request] = await db.select().from(rideRequests).where(eq(rideRequests.id, id));
    return request;
  }

  // Update payment status for a ride request
  async updateRideRequestPaymentStatus(id: number, status: string): Promise<RideRequest | undefined> {
    const [request] = await db
      .update(rideRequests)
      .set({ paymentStatus: status, updatedAt: new Date() })
      .where(eq(rideRequests.id, id))
      .returning();
    return request;
  }



  // Delete expired rides (past their departure time)
  async deleteExpiredRides(): Promise<number> {
    const now = new Date();
    
    // Get rides that are past their departure time
    const expiredRides = await db
      .select({ id: rides.id })
      .from(rides)
      .where(lt(rides.departureTime, now));
    
    if (expiredRides.length === 0) {
      return 0;
    }

    const expiredRideIds = expiredRides.map(ride => ride.id);
    
    // Delete associated ride requests first
    for (const rideId of expiredRideIds) {
      await db.delete(rideRequests).where(eq(rideRequests.rideId, rideId));
    }
    
    // Delete associated reviews
    for (const rideId of expiredRideIds) {
      await db.delete(reviews).where(eq(reviews.rideId, rideId));
    }
    
    // Delete the expired rides
    for (const rideId of expiredRideIds) {
      await db.delete(rides).where(eq(rides.id, rideId));
    }
    
    console.log(`Cleaned up ${expiredRideIds.length} expired rides`);
    return expiredRideIds.length;
  }

  // Delete old ride requests based on their status and age
  async deleteOldRideRequests(): Promise<number> {
    const now = new Date();
    
    // Delete cancelled/rejected requests older than 12 hours
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const cancelledRejectedResult = await db
      .delete(rideRequests)
      .where(and(
        or(
          eq(rideRequests.status, 'canceled'),
          eq(rideRequests.status, 'rejected')
        ),
        lt(rideRequests.createdAt, twelveHoursAgo)
      ));
    
    // Delete approved requests older than 48 hours
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const approvedResult = await db
      .delete(rideRequests)
      .where(and(
        eq(rideRequests.status, 'approved'),
        lt(rideRequests.createdAt, fortyEightHoursAgo)
      ));
    
    const totalDeleted = (cancelledRejectedResult.rowCount || 0) + (approvedResult.rowCount || 0);
    console.log(`Cleaned up ${totalDeleted} old ride requests`);
    return totalDeleted;
  }

  async updateUserStripeConnectAccount(userId: number, accountId: string | null): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeConnectAccountId: accountId })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser;
  }

  // Database management methods
  async getTableData(tableName: string): Promise<any[]> {
    switch (tableName) {
      case 'users':
        return await db.select().from(users).orderBy(desc(users.createdAt));
      case 'rides':
        return await db.select().from(rides).orderBy(desc(rides.createdAt));
      case 'ride_requests':
        return await db.select().from(rideRequests).orderBy(desc(rideRequests.createdAt));
      case 'conversations':
        return await db.select().from(conversations).orderBy(desc(conversations.createdAt));
      case 'messages':
        return await db.select().from(messages).orderBy(desc(messages.createdAt));
      default:
        throw new Error(`Table ${tableName} not allowed`);
    }
  }

  async deleteRecord(tableName: string, id: number): Promise<void> {
    switch (tableName) {
      case 'users':
        await db.delete(users).where(eq(users.id, id));
        break;
      case 'rides':
        await db.delete(rides).where(eq(rides.id, id));
        break;
      case 'ride_requests':
        await db.delete(rideRequests).where(eq(rideRequests.id, id));
        break;
      case 'conversations':
        await db.delete(conversations).where(eq(conversations.id, id));
        break;
      case 'messages':
        await db.delete(messages).where(eq(messages.id, id));
        break;
      default:
        throw new Error(`Table ${tableName} not allowed`);
    }
  }

  async executeSQL(query: string): Promise<any[]> {
    // Execute raw SQL query with safety restrictions
    const result = await db.execute(sql.raw(query));
    return result.rows || [];
  }

  async updateUserCancellationStrikes(userId: string): Promise<void> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Check if we need to reset strikes for the new month
    const user = await this.getUserByFirebaseUid(userId);
    if (!user) return;
    
    if (!user.strikeResetDate || new Date(user.strikeResetDate) < currentMonth) {
      // Reset strikes for new month
      await db.update(users)
        .set({ 
          cancellationStrikeCount: 1,
          strikeResetDate: currentMonth
        })
        .where(eq(users.firebaseUid, userId));
    } else {
      // Increment existing strikes
      await db.update(users)
        .set({ 
          cancellationStrikeCount: sql`${users.cancellationStrikeCount} + 1`
        })
        .where(eq(users.firebaseUid, userId));
    }
  }

  async getUserCancellationStrikes(userId: string): Promise<number> {
    const user = await this.getUserByFirebaseUid(userId);
    if (!user) return 0;
    
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // If no reset date or it's from a previous month, return 0
    if (!user.strikeResetDate || new Date(user.strikeResetDate) < currentMonth) {
      return 0;
    }
    
    return user.cancellationStrikeCount || 0;
  }

  async cancelRide(rideId: number, cancelledBy: string, cancellationReason?: string): Promise<boolean> {
    const cancelledAt = new Date();
    
    const result = await db.update(rides)
      .set({
        isCancelled: true,
        cancelledBy,
        cancelledAt,
        cancellationReason
      })
      .where(eq(rides.id, rideId))
      .returning();
    
    return result.length > 0;
  }

  async getExpiredAuthorizedPayments(cutoffDate: Date): Promise<any[]> {
    // Get ride requests with authorized payments that need processing:
    // 1. Completed rides - capture payment
    // 2. Approved rides that didn't start within 24h of departure - cancel and refund
    // 3. Started rides that weren't completed within 24h - cancel and refund
    // 4. Pending requests older than 24h - cancel and refund
    const expiredPayments = await db
      .select({
        id: rideRequests.id,
        rideId: rideRequests.rideId,
        passengerId: rideRequests.passengerId,
        status: rideRequests.status,
        message: rideRequests.message,
        paymentStatus: rideRequests.paymentStatus,
        stripePaymentIntentId: rideRequests.stripePaymentIntentId,
        createdAt: rideRequests.createdAt,
        updatedAt: rideRequests.updatedAt,
        driverId: rides.driverId,
        departureTime: rides.departureTime,
        isStarted: rides.isStarted,
        isCompleted: rides.isCompleted,
        startedAt: rides.startedAt
      })
      .from(rideRequests)
      .innerJoin(rides, eq(rideRequests.rideId, rides.id))
      .where(and(
        eq(rideRequests.paymentStatus, 'authorized'),
        sql`${rideRequests.stripePaymentIntentId} IS NOT NULL`,
        or(
          // Completed rides - capture payment
          and(
            eq(rideRequests.status, 'approved'),
            eq(rides.isCompleted, true)
          ),
          // Approved rides that should have started but didn't (24h past departure)
          and(
            eq(rideRequests.status, 'approved'),
            eq(rides.isStarted, false),
            lt(rides.departureTime, cutoffDate)
          ),
          // Started rides that weren't completed within 24h - cancel and refund
          and(
            eq(rideRequests.status, 'approved'),
            eq(rides.isStarted, true),
            eq(rides.isCompleted, false),
            sql`${rides.startedAt} IS NOT NULL`,
            lt(rides.startedAt, cutoffDate)
          ),
          // Pending requests older than 24 hours (unaccepted)
          and(
            eq(rideRequests.status, 'pending'),
            lt(rideRequests.createdAt, cutoffDate)
          )
        )
      ));
    
    return expiredPayments;
  }

  // Notification methods
  async createNotification(notificationData: any): Promise<any> {
    try {
      const [notification] = await db.insert(notifications).values(notificationData).returning();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<any> {
    try {
      const [notification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning();
      
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Driver offers methods
  async createDriverOffer(offerData: InsertDriverOffer): Promise<DriverOffer> {
    const [offer] = await db.insert(driverOffers).values(offerData).returning();
    return offer;
  }

  async getDriverOffersForRide(rideId: number): Promise<any[]> {
    const result = await db
      .select({
        id: driverOffers.id,
        driverId: driverOffers.driverId,
        price: driverOffers.price,
        message: driverOffers.message,
        status: driverOffers.status,
        createdAt: driverOffers.createdAt,
        driverName: users.displayName,
        driverEmail: users.email,
        driverPhone: users.phone,
        driverPhotoUrl: users.photoUrl
      })
      .from(driverOffers)
      .leftJoin(users, eq(driverOffers.driverId, users.firebaseUid))
      .where(eq(driverOffers.passengerRideId, rideId))
      .orderBy(desc(driverOffers.createdAt));

    return result;
  }

  async updateDriverOfferStatus(offerId: number, status: string, userId: string): Promise<DriverOffer> {
    const [updatedOffer] = await db
      .update(driverOffers)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(driverOffers.id, offerId))
      .returning();

    return updatedOffer;
  }

  async getDriverOfferById(offerId: number): Promise<DriverOffer | undefined> {
    const [offer] = await db.select().from(driverOffers).where(eq(driverOffers.id, offerId));
    return offer;
  }

  async getDriverOffersByDriver(driverId: string): Promise<any[]> {
    const result = await db
      .select({
        id: driverOffers.id,
        passengerRideId: driverOffers.passengerRideId,
        price: driverOffers.price,
        message: driverOffers.message,
        status: driverOffers.status,
        createdAt: driverOffers.createdAt,
        rideOrigin: rides.origin,
        rideDestination: rides.destination,
        rideDepartureTime: rides.departureTime,
        passengerName: users.displayName,
        passengerEmail: users.email
      })
      .from(driverOffers)
      .leftJoin(rides, eq(driverOffers.passengerRideId, rides.id))
      .leftJoin(users, eq(rides.driverId, users.firebaseUid))
      .where(eq(driverOffers.driverId, driverId))
      .orderBy(desc(driverOffers.createdAt));

    return result;
  }

  // Complaint methods
  async createComplaint(complaintData: InsertComplaint): Promise<Complaint> {
    const [complaint] = await db.insert(complaints).values(complaintData).returning();
    return complaint;
  }

  async getAllComplaints(): Promise<any[]> {
    // Get all complaints with full ride and user details
    const results = await db
      .select({
        id: complaints.id,
        reporterId: complaints.reporterId,
        rideId: complaints.rideId,
        subject: complaints.subject,
        description: complaints.description,
        contactEmail: complaints.contactEmail,
        status: complaints.status,
        priority: complaints.priority,
        adminNotes: complaints.adminNotes,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
        // Reporter details
        reporterName: users.displayName,
        reporterEmail: users.email,
        reporterPhone: users.phone,
        reporterInstagram: users.instagram,
        reporterSnapchat: users.snapchat,
        // Ride details
        rideOrigin: rides.origin,
        rideOriginArea: rides.originArea,
        rideDestination: rides.destination,
        rideDestinationArea: rides.destinationArea,
        rideDepartureTime: rides.departureTime,
        rideArrivalTime: rides.arrivalTime,
        ridePrice: rides.price,
        rideSeatsTotal: rides.seatsTotal,
        rideSeatsLeft: rides.seatsLeft,
        rideGenderPreference: rides.genderPreference,
        rideCarMake: rides.carMake,
        rideCarModel: rides.carModel,
        rideCarYear: rides.carYear,
        rideNotes: rides.notes,
        rideBaggageCheckIn: rides.baggageCheckIn,
        rideBaggagePersonal: rides.baggagePersonal,
        rideIsStarted: rides.isStarted,
        rideStartedAt: rides.startedAt,
        rideIsCompleted: rides.isCompleted,
        rideIsCancelled: rides.isCancelled,
        rideCancelledBy: rides.cancelledBy,
        rideCancelledAt: rides.cancelledAt,
        rideCancellationReason: rides.cancellationReason,
        // Driver details
        driverId: rides.driverId,
        driverName: sql<string>`driver_users.display_name`,
        driverEmail: sql<string>`driver_users.email`,
        driverPhone: sql<string>`driver_users.phone`,
        driverInstagram: sql<string>`driver_users.instagram`,
        driverSnapchat: sql<string>`driver_users.snapchat`
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.reporterId, users.firebaseUid))
      .leftJoin(rides, eq(complaints.rideId, rides.id))
      .leftJoin(sql`users as driver_users`, sql`rides.driver_id = driver_users.firebase_uid`)
      .orderBy(desc(complaints.createdAt));

    return results;
  }

  async getComplaintById(id: number): Promise<any | undefined> {
    const [result] = await db
      .select({
        id: complaints.id,
        reporterId: complaints.reporterId,
        rideId: complaints.rideId,
        subject: complaints.subject,
        description: complaints.description,
        contactEmail: complaints.contactEmail,
        status: complaints.status,
        priority: complaints.priority,
        adminNotes: complaints.adminNotes,
        createdAt: complaints.createdAt,
        updatedAt: complaints.updatedAt,
        // Reporter details
        reporterName: users.displayName,
        reporterEmail: users.email,
        reporterPhone: users.phone,
        reporterInstagram: users.instagram,
        reporterSnapchat: users.snapchat,
        // Ride details
        rideOrigin: rides.origin,
        rideOriginArea: rides.originArea,
        rideDestination: rides.destination,
        rideDestinationArea: rides.destinationArea,
        rideDepartureTime: rides.departureTime,
        rideArrivalTime: rides.arrivalTime,
        ridePrice: rides.price,
        rideSeatsTotal: rides.seatsTotal,
        rideSeatsLeft: rides.seatsLeft,
        rideGenderPreference: rides.genderPreference,
        rideCarMake: rides.carMake,
        rideCarModel: rides.carModel,
        rideCarYear: rides.carYear,
        rideNotes: rides.notes,
        rideBaggageCheckIn: rides.baggageCheckIn,
        rideBaggagePersonal: rides.baggagePersonal,
        rideIsStarted: rides.isStarted,
        rideStartedAt: rides.startedAt,
        rideIsCompleted: rides.isCompleted,
        rideIsCancelled: rides.isCancelled,
        rideCancelledBy: rides.cancelledBy,
        rideCancelledAt: rides.cancelledAt,
        rideCancellationReason: rides.cancellationReason,
        // Driver details
        driverId: rides.driverId,
        driverName: sql<string>`driver_users.display_name`,
        driverEmail: sql<string>`driver_users.email`,
        driverPhone: sql<string>`driver_users.phone`,
        driverInstagram: sql<string>`driver_users.instagram`,
        driverSnapchat: sql<string>`driver_users.snapchat`
      })
      .from(complaints)
      .leftJoin(users, eq(complaints.reporterId, users.firebaseUid))
      .leftJoin(rides, eq(complaints.rideId, rides.id))
      .leftJoin(sql`users as driver_users`, sql`rides.driver_id = driver_users.firebase_uid`)
      .where(eq(complaints.id, id));

    return result;
  }

  async updateComplaintStatus(id: number, status: string, adminNotes?: string): Promise<Complaint | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const [complaint] = await db
      .update(complaints)
      .set(updateData)
      .where(eq(complaints.id, id))
      .returning();
    
    return complaint;
  }

  async updateComplaintPriority(id: number, priority: string): Promise<Complaint | undefined> {
    const [complaint] = await db
      .update(complaints)
      .set({ priority, updatedAt: new Date() })
      .where(eq(complaints.id, id))
      .returning();
    
    return complaint;
  }

  // Get complaints with passenger details for rides
  async getComplaintsWithPassengers(rideId: number): Promise<any[]> {
    const passengers = await db
      .select({
        passengerId: rideRequests.passengerId,
        passengerName: users.displayName,
        passengerEmail: users.email,
        passengerPhone: users.phone,
        passengerInstagram: users.instagram,
        passengerSnapchat: users.snapchat,
        requestStatus: rideRequests.status
      })
      .from(rideRequests)
      .leftJoin(users, eq(rideRequests.passengerId, users.firebaseUid))
      .where(eq(rideRequests.rideId, rideId));

    return passengers;
  }

  // === Poll Vote Methods ===
  
  async createPollVote(data: InsertPollVote): Promise<PollVote> {
    const [vote] = await db
      .insert(pollVotes)
      .values(data)
      .returning();
    
    return vote;
  }

  async getPollVoteByIp(question: string, userIp: string): Promise<PollVote | undefined> {
    const [vote] = await db
      .select()
      .from(pollVotes)
      .where(and(
        eq(pollVotes.question, question),
        eq(pollVotes.userIp, userIp)
      ));
    
    return vote;
  }

  async getPollStats(question: string): Promise<{ question: string; yesCount: number; noCount: number; totalVotes: number }> {
    const result = await db
      .select({
        answer: pollVotes.answer,
        count: sql<number>`count(*)`
      })
      .from(pollVotes)
      .where(eq(pollVotes.question, question))
      .groupBy(pollVotes.answer);

    let yesCount = 0;
    let noCount = 0;

    for (const row of result) {
      if (row.answer === 'yes') {
        yesCount = Number(row.count);
      } else if (row.answer === 'no') {
        noCount = Number(row.count);
      }
    }

    return {
      question,
      yesCount,
      noCount,
      totalVotes: yesCount + noCount
    };
  }

  async getAllPollData(): Promise<any[]> {
    const votes = await db
      .select()
      .from(pollVotes)
      .orderBy(desc(pollVotes.createdAt));
    
    return votes;
  }

  // === Waitlist Methods ===
  
  async createWaitlistEntry(data: InsertWaitlist): Promise<Waitlist> {
    const [entry] = await db
      .insert(waitlist)
      .values(data)
      .returning();
    return entry;
  }

  async getWaitlistByEmail(email: string): Promise<Waitlist | undefined> {
    const [entry] = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email));
    return entry;
  }

  async getAllWaitlistEntries(): Promise<Waitlist[]> {
    const entries = await db
      .select()
      .from(waitlist)
      .orderBy(desc(waitlist.createdAt));
    return entries;
  }

  // Insurance document methods
  async createInsuranceDocument(document: InsertInsuranceDocument): Promise<InsuranceDocument> {
    const [newDocument] = await db
      .insert(insuranceDocuments)
      .values(document)
      .returning();
    return newDocument;
  }

  async getInsuranceDocumentByUserId(userId: string): Promise<InsuranceDocument | undefined> {
    const [document] = await db
      .select()
      .from(insuranceDocuments)
      .where(eq(insuranceDocuments.userId, userId))
      .orderBy(desc(insuranceDocuments.createdAt))
      .limit(1);
    return document;
  }

  async getAllInsuranceDocuments(): Promise<InsuranceDocument[]> {
    return await db
      .select()
      .from(insuranceDocuments)
      .orderBy(desc(insuranceDocuments.createdAt));
  }

  async getPendingInsuranceDocuments(): Promise<InsuranceDocument[]> {
    return await db
      .select()
      .from(insuranceDocuments)
      .where(eq(insuranceDocuments.status, 'pending'))
      .orderBy(desc(insuranceDocuments.createdAt));
  }

  async updateInsuranceDocumentStatus(
    documentId: number, 
    status: 'approved' | 'rejected', 
    approvedBy: string,
    rejectionReason?: string
  ): Promise<InsuranceDocument> {
    const [updatedDocument] = await db
      .update(insuranceDocuments)
      .set({
        status,
        approvedBy,
        approvedAt: new Date(),
        rejectionReason
      })
      .where(eq(insuranceDocuments.id, documentId))
      .returning();
    
    // Update user's insurance verification status if approved
    if (status === 'approved') {
      await db
        .update(users)
        .set({
          insuranceVerified: true,
          insuranceVerificationDate: new Date(),
          insuranceStatus: 'approved'
        })
        .where(eq(users.firebaseUid, updatedDocument.userId));
    } else {
      await db
        .update(users)
        .set({
          insuranceStatus: 'rejected'
        })
        .where(eq(users.firebaseUid, updatedDocument.userId));
    }
    
    return updatedDocument;
  }

  async updateUserInsuranceInfo(
    userId: string,
    provider: string,
    policyNumber: string,
    expirationDate: Date,
    documentPath: string
  ): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        insuranceProvider: provider,
        insurancePolicyNumber: policyNumber,
        insuranceExpirationDate: expirationDate,
        insuranceDocumentPath: documentPath,
        insuranceStatus: 'pending'
      })
      .where(eq(users.firebaseUid, userId))
      .returning();
    
    return updatedUser;
  }
}

// Export a singleton instance
export const storage = new PostgresStorage();