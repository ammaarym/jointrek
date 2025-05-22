import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User insert schema
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

// Ride table schema
export const rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  driverId: text("driver_id").notNull().references(() => users.firebaseUid),
  origin: text("origin").notNull(),
  originArea: text("origin_area").notNull(),
  destination: text("destination").notNull(),
  destinationArea: text("destination_area").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  seatsTotal: integer("seats_total").notNull(),
  seatsLeft: integer("seats_left").notNull(),
  price: text("price").notNull(),
  genderPreference: text("gender_preference").notNull(),
  carModel: text("car_model"),
  notes: text("notes"),
  rideType: text("ride_type").notNull(),
  phone: text("phone"),
  instagram: text("instagram"),
  snapchat: text("snapchat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ride insert schema
export const insertRideSchema = createInsertSchema(rides).omit({
  id: true,
  createdAt: true
});

// Booking table schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  passengerId: text("passenger_id").notNull().references(() => users.firebaseUid),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Booking insert schema
export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true
});

// Message table schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: text("sender_id").notNull().references(() => users.firebaseUid),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Message insert schema
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

// Conversation table schema
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participants: text("participants").array().notNull(),
  lastMessage: text("last_message"),
  lastMessageTimestamp: timestamp("last_message_timestamp"),
  rideId: integer("ride_id").references(() => rides.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Conversation insert schema
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Ride = typeof rides.$inferSelect;
export type InsertRide = z.infer<typeof insertRideSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
