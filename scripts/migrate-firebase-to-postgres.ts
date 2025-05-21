/**
 * Migration script to transfer data from Firebase to PostgreSQL
 * 
 * This script:
 * 1. Connects to Firebase using admin credentials
 * 2. Extracts all rides and users data
 * 3. Transfers them to the PostgreSQL database
 * 
 * Run with: npm run migrate
 */

import { db as pgDb } from "../server/db";
import { rides, users } from "../shared/schema";
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { closeDb } from "../server/db";
import { eq } from "drizzle-orm";

// Initialize Firebase Admin
const app = initializeApp({
  // We would need a service account file for production
  // In development mode, we can use the client's Firebase connection
  projectId: process.env.VITE_FIREBASE_PROJECT_ID
});

const firestore = getFirestore(app);

interface FirebaseRide {
  id: string;
  driver: {
    id: string;
    name: string;
    photoUrl: string;
    rating: number;
    totalRides: number;
    contactInfo: {
      email: string;
      phone?: string;
      instagram?: string;
      snapchat?: string;
    };
  };
  origin: {
    city: string;
    area: string;
  };
  destination: {
    city: string;
    area: string;
  };
  departureTime: {
    seconds: number;
    nanoseconds: number;
  };
  arrivalTime: {
    seconds: number;
    nanoseconds: number;
  };
  seatsTotal: number;
  seatsLeft: number;
  price: number;
  genderPreference: string;
  carModel?: string;
  notes?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  rideType: "driver" | "passenger";
}

interface FirebaseUser {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  emailVerified: boolean;
}

async function migrateUsers() {
  console.log("Migrating users...");
  
  try {
    const usersSnapshot = await firestore.collection('users').get();
    const userCount = usersSnapshot.size;
    console.log(`Found ${userCount} users to migrate`);
    
    if (userCount === 0) {
      console.log("No users to migrate");
      return;
    }
    
    let insertedCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data() as FirebaseUser;
      
      try {
        // Check if user already exists
        const existingUsers = await pgDb
          .select()
          .from(users)
          .where(eq(users.firebaseUid, userData.id));
          
        if (existingUsers.length > 0) {
          console.log(`User ${userData.id} already exists, skipping`);
          continue;
        }
        
        // Insert the user
        await pgDb.insert(users).values({
          firebaseUid: userData.id,
          email: userData.email,
          displayName: userData.name,
          photoUrl: userData.photoUrl,
          emailVerified: userData.emailVerified
        });
        
        insertedCount++;
        console.log(`Migrated user ${userData.id}`);
      } catch (error) {
        console.error(`Failed to migrate user ${userData.id}:`, error);
      }
    }
    
    console.log(`Successfully migrated ${insertedCount} users`);
  } catch (error) {
    console.error("Error migrating users:", error);
  }
}

async function migrateRides() {
  console.log("Migrating rides...");
  
  try {
    const ridesSnapshot = await firestore.collection('rides').get();
    const rideCount = ridesSnapshot.size;
    console.log(`Found ${rideCount} rides to migrate`);
    
    if (rideCount === 0) {
      console.log("No rides to migrate");
      return;
    }
    
    let insertedCount = 0;
    
    for (const doc of ridesSnapshot.docs) {
      const rideData = doc.data() as FirebaseRide;
      
      try {
        // Convert timestamps
        const departureTime = new Date(rideData.departureTime.seconds * 1000);
        const arrivalTime = new Date(rideData.arrivalTime.seconds * 1000);
        const createdAt = new Date(rideData.createdAt.seconds * 1000);
        
        // Insert the ride
        await pgDb.insert(rides).values({
          driverId: rideData.driver.id,
          origin: rideData.origin.city,
          originArea: rideData.origin.area,
          destination: rideData.destination.city,
          destinationArea: rideData.destination.area,
          departureTime,
          arrivalTime,
          seatsTotal: rideData.seatsTotal,
          seatsLeft: rideData.seatsLeft,
          price: rideData.price,
          genderPreference: rideData.genderPreference,
          carModel: rideData.carModel || null,
          notes: rideData.notes || null,
          rideType: rideData.rideType
        });
        
        insertedCount++;
        console.log(`Migrated ride ${doc.id}`);
      } catch (error) {
        console.error(`Failed to migrate ride ${doc.id}:`, error);
      }
    }
    
    console.log(`Successfully migrated ${insertedCount} rides`);
  } catch (error) {
    console.error("Error migrating rides:", error);
  }
}

async function main() {
  try {
    console.log("Starting Firebase to PostgreSQL migration...");
    
    // Migrate users first, then rides (due to foreign key constraints)
    await migrateUsers();
    await migrateRides();
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close the database connection
    await closeDb();
    process.exit(0);
  }
}

// Run the migration
main();