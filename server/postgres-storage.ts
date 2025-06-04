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
  type InsertRideRequest
} from "@shared/schema";
import { eq, and, or, desc, gte, sql } from "drizzle-orm";
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

  async getRidesInFuture(): Promise<Ride[]> {
    // For now, return all rides without filtering by date
    return await db
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
        notes: rides.notes,
        createdAt: rides.createdAt,
        rideType: rides.rideType,
        isCompleted: rides.isCompleted,
        driverName: users.displayName,
        driverEmail: users.email,
        driverPhoto: users.photoUrl,
        driverPhone: users.phone,
        driverInstagram: users.instagram,
        driverSnapchat: users.snapchat
      })
      .from(rides)
      .leftJoin(users, eq(rides.driverId, users.firebaseUid))
      .orderBy(desc(rides.departureTime));
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
    // First delete any associated reviews
    await db.delete(reviews).where(eq(reviews.rideId, id));
    
    // Then delete the ride
    await db.delete(rides).where(eq(rides.id, id));
    return true;
  }

  async getRidesByLocation(origin: string, destination?: string): Promise<Ride[]> {
    if (destination) {
      return await db
        .select()
        .from(rides)
        .where(and(eq(rides.origin, origin), eq(rides.destination, destination)))
        .orderBy(desc(rides.departureTime));
    } else {
      return await db
        .select()
        .from(rides)
        .where(eq(rides.origin, origin))
        .orderBy(desc(rides.departureTime));
    }
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

  // Ride request methods
  async createRideRequest(requestData: InsertRideRequest): Promise<RideRequest> {
    const [request] = await db.insert(rideRequests).values(requestData).returning();
    return request;
  }

  async getRideRequestsForDriver(driverId: string): Promise<any[]> {
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
    
    return requests;
  }

  async updateRideRequestStatus(requestId: number, status: string, driverId: string): Promise<RideRequest> {
    // First verify the request belongs to this driver
    const [request] = await db
      .select()
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

    return updatedRequest;
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
    return await db.select({
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
  }

  async getAllRequests(): Promise<any[]> {
    return await db.select({
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
  }

  async getApprovedRidesWithPassengers(): Promise<any[]> {
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
          driverName: row.driverName,
          driverEmail: row.driverEmail,
          passengers: []
        };
      }
      acc[rideId].passengers.push({
        name: row.passengerName,
        email: row.passengerEmail,
        approvedAt: row.approvedAt
      });
      return acc;
    }, {} as Record<number, any>);

    return Object.values(groupedRides);
  }
}

// Export a singleton instance
export const storage = new PostgresStorage();