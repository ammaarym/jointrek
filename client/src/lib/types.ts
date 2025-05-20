import { Timestamp } from "firebase/firestore";

export interface Location {
  city: string;
  area: string;
}

export interface UserProfile {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  totalRides: number;
}

export interface Ride {
  id: string;
  driver: UserProfile;
  origin: Location;
  destination: Location;
  departureTime: Timestamp;
  arrivalTime: Timestamp;
  seatsTotal: number;
  seatsLeft: number;
  price: number;
  genderPreference: string;
  carModel?: string;
  notes?: string;
  createdAt: Timestamp;
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
