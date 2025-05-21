import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Log if we are missing important environment variables
if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
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
  app = initializeApp(firebaseConfig, "GatorLift");
}

// Initialize Firebase services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for UF email authentication
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Set minimum auth parameters to improve reliability
// No domain restriction to avoid UF login issues
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Get firestore database reference
export const db = getFirestore(app);

// Only initialize analytics in browser environment
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Export the app as default
export default app;
