import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration with the provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyDxYAWHsdSZ9Gg4jxT9RzlJUYNp53Y86Wk",
  authDomain: "gatorlift-a1a82.firebaseapp.com",
  projectId: "gatorlift-a1a82",
  storageBucket: "gatorlift-a1a82.firebasestorage.app",
  messagingSenderId: "209031169433",
  appId: "1:209031169433:web:2baa364be6ae249df23f08",
  measurementId: "G-1V352MHT6K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
