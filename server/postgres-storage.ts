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
  type InsertUser
} from "@shared/schema";
import { eq, and, or, desc, gte, sql } from "drizzle-orm";

export class PostgresStorage {
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
    const now = new Date();
    return await db
      .select()
      .from(rides)
      .where(gte(rides.departureTime, now))
      .orderBy(rides.departureTime);
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
}

// Export a singleton instance
export const storage = new PostgresStorage();