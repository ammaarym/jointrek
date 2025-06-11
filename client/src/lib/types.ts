import { Timestamp } from "firebase/firestore";

// Custom mock timestamp that's compatible with Firestore Timestamp
export interface MockTimestamp {
  toDate: () => Date;
  seconds?: number;
  nanoseconds?: number;
  toMillis?: () => number;
  isEqual?: (other: Timestamp) => boolean;
  toJSON?: () => { seconds: number, nanoseconds: number };
}

export interface Location {
  city: string;
  area: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  instagram?: string;
  snapchat?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  totalRides: number;
  contactInfo?: ContactInfo;
  email?: string;
  phone?: string;
  instagram?: string;
  snapchat?: string;
}

export interface Ride {
  id: string;
  driver: UserProfile;
  origin: Location;
  destination: Location;
  departureTime: Timestamp | MockTimestamp;
  arrivalTime: Timestamp | MockTimestamp;
  seatsTotal: number;
  seatsLeft: number;
  price: number;
  genderPreference: string;
  carModel?: string;
  notes?: string;
  baggageCheckIn?: number;
  baggagePersonal?: number;
  createdAt: Timestamp | MockTimestamp;
  rideType: "driver" | "passenger";
  passengers?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

export interface ParticipantData {
  id: string;
  displayName: string;
  photoUrl: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantsData?: ParticipantData[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  rideId?: string;
}
