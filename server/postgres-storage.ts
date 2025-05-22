import { db } from "./db";
import { 
  rides, 
  users, 
  bookings, 
  messages, 
  conversations,
  type Ride,
  type InsertRide,
  type User,
  type InsertUser,
  type Booking,
  type InsertBooking,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage
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

  async getAllRides(): Promise<Ride[]> {
    return await db.select().from(rides).orderBy(desc(rides.departureTime));
  }

  async getRidesByDriver(driverId: string): Promise<Ride[]> {
    return await db.select().from(rides).where(eq(rides.driverId, driverId));
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
        driverName: users.displayName,
        driverEmail: users.email,
        driverPhoto: users.photoUrl
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
    await db.delete(rides).where(eq(rides.id, id));
    return true;
  }

  // Implement getRidesByLocation method
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
}

// Export a singleton instance
export const storage = new PostgresStorage();