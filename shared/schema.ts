import { pgTable, text, serial, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
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
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").default(false),
  instagram: text("instagram"),
  snapchat: text("snapchat"),
  stripeCustomerId: text("stripe_customer_id"),
  defaultPaymentMethodId: text("default_payment_method_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  insuranceExpirationDate: timestamp("insurance_expiration_date"),
  insuranceVerified: boolean("insurance_verified").default(false),
  insuranceVerificationDate: timestamp("insurance_verification_date"),
  interestTags: text("interest_tags").array(),
  cancellationStrikeCount: integer("cancellation_strike_count").default(0).notNull(),
  strikeResetDate: timestamp("strike_reset_date"),
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
  carMake: text("car_make"),
  carModel: text("car_model"),
  carYear: integer("car_year"),
  notes: text("notes"),
  rideType: text("ride_type").notNull(),
  baggageCheckIn: integer("baggage_check_in").default(0).notNull(),
  baggagePersonal: integer("baggage_personal").default(0).notNull(),
  isStarted: boolean("is_started").default(false),
  startVerificationCode: text("start_verification_code"),
  startedAt: timestamp("started_at"),
  isCompleted: boolean("is_completed").default(false),
  verificationCode: text("verification_code"),
  isCancelled: boolean("is_cancelled").default(false),
  cancelledBy: text("cancelled_by"), // "driver" or "passenger"
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ride insert schema
export const insertRideSchema = createInsertSchema(rides).omit({
  id: true,
  createdAt: true
});

// Ride requests table schema
export const rideRequests = pgTable("ride_requests", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  passengerId: text("passenger_id").notNull().references(() => users.firebaseUid),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  message: text("message"),
  stripePaymentIntentId: text("stripe_payment_intent_id"), // For holding payment
  paymentAmount: integer("payment_amount"), // Amount in cents
  paymentStatus: text("payment_status").default("pending"), // pending, authorized, captured, failed
  baggageCheckIn: integer("baggage_check_in").default(0).notNull(),
  baggagePersonal: integer("baggage_personal").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ride request insert schema
export const insertRideRequestSchema = createInsertSchema(rideRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Completed rides table schema
export const completedRides = pgTable("completed_rides", {
  id: serial("id").primaryKey(),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  participantId: text("participant_id").notNull().references(() => users.firebaseUid),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Reviews table schema
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewerId: text("reviewer_id").notNull().references(() => users.firebaseUid),
  revieweeId: text("reviewee_id").notNull().references(() => users.firebaseUid),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  rating: integer("rating").notNull(), // 1-5 stars
  description: text("description"), // max 200 chars (enforced in frontend)
  reviewType: text("review_type").notNull(), // "driver" or "passenger"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Completed rides insert schema
export const insertCompletedRideSchema = createInsertSchema(completedRides).omit({
  id: true,
  completedAt: true
});

// Reviews insert schema
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});

// Notifications table schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.firebaseUid),
  type: text("type").notNull(), // "ride_request", "ride_approved", "ride_rejected", "ride_cancelled", "ride_completed"
  title: text("title").notNull(),
  message: text("message").notNull(),
  rideId: integer("ride_id"),
  requestId: integer("request_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification insert schema
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

// User statistics table schema
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => users.firebaseUid),
  driverRating: real("driver_rating").default(0),
  passengerRating: real("passenger_rating").default(0),
  totalDriverRatings: integer("total_driver_ratings").default(0),
  totalPassengerRatings: integer("total_passenger_ratings").default(0),
  ridesAsDriver: integer("rides_as_driver").default(0),
  ridesAsPassenger: integer("rides_as_passenger").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User statistics insert schema
export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true
});

// Driver offers table (for drivers offering rides to passengers)
export const driverOffers = pgTable("driver_offers", {
  id: serial("id").primaryKey(),
  driverId: text("driver_id").notNull().references(() => users.firebaseUid),
  passengerRideId: integer("passenger_ride_id").notNull().references(() => rides.id),
  price: real("price").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Driver offers insert schema
export const insertDriverOfferSchema = createInsertSchema(driverOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Complaints table schema
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => users.firebaseUid),
  rideId: integer("ride_id").notNull().references(() => rides.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  contactEmail: text("contact_email"), // Optional email for follow-up
  status: text("status").notNull().default("open"), // open, investigating, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  adminNotes: text("admin_notes"), // Admin internal notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Complaints insert schema
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true
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

export type CompletedRide = typeof completedRides.$inferSelect;
export type InsertCompletedRide = z.infer<typeof insertCompletedRideSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type RideRequest = typeof rideRequests.$inferSelect;
export type InsertRideRequest = z.infer<typeof insertRideRequestSchema>;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

export type DriverOffer = typeof driverOffers.$inferSelect;
export type InsertDriverOffer = z.infer<typeof insertDriverOfferSchema>;

export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;

// Poll votes table schema
export const pollVotes = pgTable("poll_votes", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(), // e.g., "would-use-trek"
  answer: text("answer").notNull(), // e.g., "yes" or "no"
  userIp: text("user_ip"), // Track by IP to prevent duplicate votes
  userAgent: text("user_agent"), // Additional tracking info
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Poll votes insert schema
export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({
  id: true,
  createdAt: true
});

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;

// Waitlist table schema
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Waitlist insert schema
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true
});

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
