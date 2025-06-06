import { users, rides, bookings, messages, conversations, completedRides, reviews } from "@shared/schema";
import type { 
  User, InsertUser, 
  Ride, InsertRide, 
  Booking, InsertBooking, 
  Message, InsertMessage, 
  Conversation, InsertConversation,
  CompletedRide, InsertCompletedRide,
  Review, InsertReview
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(firebaseUid: string, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserStripeInfo(firebaseUid: string, stripeCustomerId: string, defaultPaymentMethodId?: string): Promise<User | undefined>;

  // Ride methods
  getRide(id: number): Promise<Ride | undefined>;
  getRidesByDriver(driverId: string): Promise<Ride[]>;
  getRidesByPassenger(passengerId: string): Promise<Ride[]>;
  getRidesByLocation(origin: string, destination?: string): Promise<Ride[]>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRide(id: number, data: Partial<InsertRide>): Promise<Ride | undefined>;
  deleteRide(id: number): Promise<boolean>;

  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByRide(rideId: number): Promise<Booking[]>;
  getBookingsByPassenger(passengerId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationByParticipants(participantIds: string[]): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversationLastMessage(id: number, message: string): Promise<Conversation | undefined>;

  // Ride completion methods
  markRideComplete(id: number): Promise<Ride | undefined>;
  getCompletedRidesByUser(userId: string): Promise<CompletedRide[]>;
  isRideCompletedByUser(rideId: number, userId: string): Promise<boolean>;

  // Reviews methods
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByReviewee(revieweeId: string): Promise<Review[]>;
  getReviewsByRide(rideId: number): Promise<Review[]>;
  hasUserReviewedRide(reviewerId: string, rideId: number, revieweeId: string): Promise<boolean>;

  // Ride request methods
  createRideRequest(request: any): Promise<any>;
  getRideRequestsForDriver(driverId: string): Promise<any[]>;
  getRideRequestsForUser(userId: string): Promise<any[]>;
  getPendingRequestsForRide(rideId: number): Promise<any[]>;
  updateRideRequestStatus(id: number, status: string, driverId: string): Promise<any>;
  getRideRequestById(id: number): Promise<any>;
  updateRideRequestPaymentStatus(id: number, status: string): Promise<any>;
  getRideById(id: number): Promise<any>;

  // Admin methods
  getUserCount(): Promise<number>;
  getRideCount(): Promise<number>;
  getRequestStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }>;
  getAllUsers(): Promise<User[]>;
  getAllRides(): Promise<any[]>;
  getAllRequests(): Promise<any[]>;
  getApprovedRidesWithPassengers(): Promise<any[]>;
  
  // Cleanup methods
  deleteExpiredRides(): Promise<number>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private usersByFirebaseUid: Map<string, User>;
  private usersByEmail: Map<string, User>;
  
  private rides: Map<number, Ride>;
  private bookings: Map<number, Booking>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  
  private userIdCounter: number;
  private rideIdCounter: number;
  private bookingIdCounter: number;
  private messageIdCounter: number;
  private conversationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.usersByFirebaseUid = new Map();
    this.usersByEmail = new Map();
    
    this.rides = new Map();
    this.bookings = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    
    this.userIdCounter = 1;
    this.rideIdCounter = 1;
    this.bookingIdCounter = 1;
    this.messageIdCounter = 1;
    this.conversationIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return this.usersByFirebaseUid.get(firebaseUid);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.usersByEmail.get(email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    const user: User = {
      id,
      ...userData,
      createdAt: now
    };
    
    this.users.set(id, user);
    this.usersByFirebaseUid.set(user.firebaseUid, user);
    this.usersByEmail.set(user.email, user);
    
    return user;
  }

  async updateUser(firebaseUid: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersByFirebaseUid.get(firebaseUid);
    
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...user,
      ...data
    };
    
    this.users.set(user.id, updatedUser);
    this.usersByFirebaseUid.set(updatedUser.firebaseUid, updatedUser);
    this.usersByEmail.set(updatedUser.email, updatedUser);
    
    return updatedUser;
  }

  // Ride methods
  async getRide(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getRidesByDriver(driverId: string): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter(ride => ride.driverId === driverId);
  }

  async getRidesByPassenger(passengerId: string): Promise<Ride[]> {
    const passengerBookings = Array.from(this.bookings.values()).filter(
      booking => booking.passengerId === passengerId && booking.status === "confirmed"
    );
    
    return Promise.all(
      passengerBookings.map(booking => this.getRide(booking.rideId))
    ).then(rides => rides.filter((ride): ride is Ride => ride !== undefined));
  }

  async getRidesByLocation(origin: string, destination?: string): Promise<Ride[]> {
    let filteredRides = Array.from(this.rides.values()).filter(
      ride => ride.origin.toLowerCase() === origin.toLowerCase()
    );
    
    if (destination) {
      filteredRides = filteredRides.filter(
        ride => ride.destination.toLowerCase() === destination.toLowerCase()
      );
    }
    
    return filteredRides;
  }

  async createRide(rideData: InsertRide): Promise<Ride> {
    const id = this.rideIdCounter++;
    const now = new Date();
    
    const ride: Ride = {
      id,
      ...rideData,
      createdAt: now
    };
    
    this.rides.set(id, ride);
    
    return ride;
  }

  async updateRide(id: number, data: Partial<InsertRide>): Promise<Ride | undefined> {
    const ride = this.rides.get(id);
    
    if (!ride) {
      return undefined;
    }
    
    const updatedRide: Ride = {
      ...ride,
      ...data
    };
    
    this.rides.set(id, updatedRide);
    
    return updatedRide;
  }

  async deleteRide(id: number): Promise<boolean> {
    return this.rides.delete(id);
  }

  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByRide(rideId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.rideId === rideId);
  }

  async getBookingsByPassenger(passengerId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.passengerId === passengerId);
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const id = this.bookingIdCounter++;
    const now = new Date();
    
    const booking: Booking = {
      id,
      ...bookingData,
      createdAt: now
    };
    
    this.bookings.set(id, booking);
    
    // Update seatsLeft in the ride
    const ride = this.rides.get(booking.rideId);
    if (ride && booking.status === "confirmed") {
      const updatedRide = {
        ...ride,
        seatsLeft: Math.max(0, ride.seatsLeft - 1)
      };
      this.rides.set(ride.id, updatedRide);
    }
    
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    
    if (!booking) {
      return undefined;
    }
    
    const previousStatus = booking.status;
    const updatedBooking: Booking = {
      ...booking,
      status
    };
    
    this.bookings.set(id, updatedBooking);
    
    // Update seatsLeft in the ride if status changed to/from "confirmed"
    const ride = this.rides.get(booking.rideId);
    if (ride) {
      let seatsLeft = ride.seatsLeft;
      
      if (previousStatus !== "confirmed" && status === "confirmed") {
        // Seat was taken
        seatsLeft = Math.max(0, seatsLeft - 1);
      } else if (previousStatus === "confirmed" && status !== "confirmed") {
        // Seat was released
        seatsLeft = Math.min(ride.seatsTotal, seatsLeft + 1);
      }
      
      if (seatsLeft !== ride.seatsLeft) {
        const updatedRide = {
          ...ride,
          seatsLeft
        };
        this.rides.set(ride.id, updatedRide);
      }
    }
    
    return updatedBooking;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    
    const message: Message = {
      id,
      ...messageData,
      createdAt: now
    };
    
    this.messages.set(id, message);
    
    // Update last message in conversation
    await this.updateConversationLastMessage(message.conversationId, message.text);
    
    return message;
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationByParticipants(participantIds: string[]): Promise<Conversation | undefined> {
    // Sort the participants to ensure consistent ordering
    const sortedParticipantIds = [...participantIds].sort();
    
    return Array.from(this.conversations.values()).find(conversation => {
      const sortedConversationParticipants = [...conversation.participants].sort();
      
      if (sortedParticipantIds.length !== sortedConversationParticipants.length) {
        return false;
      }
      
      return sortedParticipantIds.every((id, index) => id === sortedConversationParticipants[index]);
    });
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conversation => conversation.participants.includes(userId))
      .sort((a, b) => {
        // Sort by last message timestamp (descending)
        const timeA = a.lastMessageTimestamp?.getTime() || 0;
        const timeB = b.lastMessageTimestamp?.getTime() || 0;
        return timeB - timeA;
      });
  }

  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const now = new Date();
    
    const conversation: Conversation = {
      id,
      ...conversationData,
      createdAt: now
    };
    
    this.conversations.set(id, conversation);
    
    return conversation;
  }

  async updateConversationLastMessage(id: number, message: string): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    
    if (!conversation) {
      return undefined;
    }
    
    const updatedConversation: Conversation = {
      ...conversation,
      lastMessage: message,
      lastMessageTimestamp: new Date()
    };
    
    this.conversations.set(id, updatedConversation);
    
    return updatedConversation;
  }

  // Ride request methods (stubs for interface compliance - using PostgreSQL in production)
  async createRideRequest(request: any): Promise<any> {
    throw new Error("MemStorage ride request methods not implemented - use PostgreSQL");
  }

  async getRideRequestsForDriver(driverId: string): Promise<any[]> {
    throw new Error("MemStorage ride request methods not implemented - use PostgreSQL");
  }

  async getRideRequestsForUser(userId: string): Promise<any[]> {
    throw new Error("MemStorage ride request methods not implemented - use PostgreSQL");
  }

  async getPendingRequestsForRide(rideId: number): Promise<any[]> {
    throw new Error("MemStorage ride request methods not implemented - use PostgreSQL");
  }

  async updateRideRequestStatus(id: number, status: string, driverId: string): Promise<any> {
    throw new Error("MemStorage ride request methods not implemented - use PostgreSQL");
  }

  // Admin methods (stubs)
  async getUserCount(): Promise<number> {
    return this.users.size;
  }

  async getRideCount(): Promise<number> {
    return this.rides.size;
  }

  async getRequestStats(): Promise<{ total: number; pending: number; approved: number; rejected: number }> {
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllRides(): Promise<any[]> {
    return Array.from(this.rides.values());
  }

  async getAllRequests(): Promise<any[]> {
    return [];
  }

  async getApprovedRidesWithPassengers(): Promise<any[]> {
    return [];
  }

  // Completion and review methods (stubs)
  async markRideComplete(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async getCompletedRidesByUser(userId: string): Promise<any[]> {
    return [];
  }

  async isRideCompletedByUser(rideId: number, userId: string): Promise<boolean> {
    return false;
  }

  async createReview(review: any): Promise<any> {
    return review;
  }

  async getReviewsByReviewee(revieweeId: string): Promise<any[]> {
    return [];
  }

  async getReviewsByRide(rideId: number): Promise<any[]> {
    return [];
  }

  async hasUserReviewedRide(reviewerId: string, rideId: number, revieweeId: string): Promise<boolean> {
    return false;
  }

  async deleteExpiredRides(): Promise<number> {
    return 0; // MemStorage stub - use PostgreSQL in production
  }
}

// Export the storage instance
export const storage = new MemStorage();
