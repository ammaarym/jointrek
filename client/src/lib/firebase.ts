import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "jointrek.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log if we are missing important environment variables
if (
  !import.meta.env.VITE_FIREBASE_API_KEY ||
  !import.meta.env.VITE_FIREBASE_PROJECT_ID
) {
  console.error("Missing essential Firebase environment variables!");
}

// Print current origin for debugging
console.log("Current origin:", window.location.origin);

// Initialize Firebase only once
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error", error);
  // If already initialized, use the existing app
  app = initializeApp(firebaseConfig, "Trek");
}

// Initialize Firebase services
export const auth = getAuth(app);

// Configure auth persistence for Replit production environment
import {
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";

// Configure multiple persistence layers for Replit compatibility
async function configureFirebaseAuth() {
  try {
    // First, try to set local persistence
    await setPersistence(auth, browserLocalPersistence);
    console.log(
      "✅ Firebase auth persistence set to local storage for Replit compatibility",
    );

    // Additional storage for auth state backup
    const user = auth.currentUser;
    if (user) {
      localStorage.setItem(
        "trek_firebase_auth_backup",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          timestamp: Date.now(),
        }),
      );
      console.log("✅ Auth state backup stored");
    }
  } catch (error) {
    console.error("❌ Error setting auth persistence:", error);
  }
}

// Initialize enhanced persistence
configureFirebaseAuth();

// Add additional auth configuration for production stability
auth.settings.appVerificationDisabledForTesting = false;

// Configure auth for production environment
auth.settings.appVerificationDisabledForTesting = false;

// Add production-specific auth configuration
const isProduction = window.location.hostname !== "localhost";
if (isProduction) {
  // Ensure proper domain configuration for production
  console.log("Configuring Firebase for production environment");

  // Add current domain to console log for easy copying
  const currentDomain = window.location.hostname;
  console.log(
    "🌐 Current domain that needs to be authorized in Firebase:",
    currentDomain,
  );
  console.log(
    "🔧 Add this domain to Firebase Console → Authentication → Settings → Authorized domains",
  );
}

// Get firestore database reference with improved caching
import {
  enableIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore";

// Initialize Firestore with performance optimizations
export const db = getFirestore(app);

// Enable offline persistence for better performance
try {
  enableIndexedDbPersistence(db)
    .then(() => console.log("Firebase offline persistence enabled"))
    .catch((err) => console.error("Error enabling offline persistence:", err));
} catch (err) {
  console.error("Error with offline persistence setup:", err);
}

// Only initialize analytics in browser environment
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// Export the app as default
export default app;
