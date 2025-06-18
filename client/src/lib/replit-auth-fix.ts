/**
 * Replit-specific Firebase authentication fixes
 * 
 * This module addresses specific issues with Firebase authentication
 * in Replit's production deployment environment where standard
 * session persistence doesn't work as expected.
 */

import { auth } from './firebase';
import { 
  setPersistence, 
  browserLocalPersistence, 
  onAuthStateChanged,
  getRedirectResult,
  User 
} from 'firebase/auth';

// Replit-specific storage keys
const REPLIT_AUTH_STATE_KEY = 'trek_replit_auth_state';
const REPLIT_USER_DATA_KEY = 'trek_replit_user_data';

/**
 * Enhanced persistence for Replit environment
 * Uses multiple storage mechanisms to ensure auth state survives redirects
 */
export const configureReplitPersistence = async (): Promise<void> => {
  try {
    // Set Firebase persistence to local storage
    await setPersistence(auth, browserLocalPersistence);
    console.log("Replit: Firebase persistence configured");
    
    // Additional persistence check
    const currentUser = auth.currentUser;
    if (currentUser) {
      localStorage.setItem(REPLIT_AUTH_STATE_KEY, 'authenticated');
      localStorage.setItem(REPLIT_USER_DATA_KEY, JSON.stringify({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        emailVerified: currentUser.emailVerified
      }));
    }
  } catch (error) {
    console.error("Replit: Error configuring persistence:", error);
  }
};

/**
 * Check if user should be authenticated based on stored state
 * This helps detect authentication state even when Firebase doesn't persist properly
 */
export const checkReplitAuthState = (): boolean => {
  const authState = localStorage.getItem(REPLIT_AUTH_STATE_KEY);
  const userData = localStorage.getItem(REPLIT_USER_DATA_KEY);
  
  if (authState === 'authenticated' && userData) {
    try {
      const user = JSON.parse(userData);
      console.log("Replit: Found stored auth state for:", user.email);
      return true;
    } catch (error) {
      console.error("Replit: Error parsing stored user data:", error);
      localStorage.removeItem(REPLIT_AUTH_STATE_KEY);
      localStorage.removeItem(REPLIT_USER_DATA_KEY);
    }
  }
  
  return false;
};

/**
 * Clear Replit-specific auth storage
 */
export const clearReplitAuthState = (): void => {
  localStorage.removeItem(REPLIT_AUTH_STATE_KEY);
  localStorage.removeItem(REPLIT_USER_DATA_KEY);
  console.log("Replit: Auth state cleared");
};

/**
 * Enhanced redirect result handler for Replit
 * Provides additional logging and state management
 */
export const handleReplitRedirectResult = async (): Promise<User | null> => {
  try {
    console.log("Replit: Checking for redirect result...");
    const result = await getRedirectResult(auth);
    
    if (result && result.user) {
      console.log("Replit: Redirect authentication successful for:", result.user.email);
      
      // Store auth state immediately
      localStorage.setItem(REPLIT_AUTH_STATE_KEY, 'authenticated');
      localStorage.setItem(REPLIT_USER_DATA_KEY, JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        emailVerified: result.user.emailVerified
      }));
      
      return result.user;
    } else {
      console.log("Replit: No redirect result found");
      return null;
    }
  } catch (error) {
    console.error("Replit: Error handling redirect result:", error);
    return null;
  }
};

/**
 * Setup enhanced auth state monitoring for Replit
 */
export const setupReplitAuthMonitoring = (callback: (user: User | null) => void): (() => void) => {
  console.log("Replit: Setting up enhanced auth monitoring");
  
  // Standard Firebase auth state listener
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("Replit: Auth state change detected:", user?.email || "no user");
    
    if (user) {
      // Update stored state
      localStorage.setItem(REPLIT_AUTH_STATE_KEY, 'authenticated');
      localStorage.setItem(REPLIT_USER_DATA_KEY, JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified
      }));
    } else {
      // Clear stored state
      clearReplitAuthState();
    }
    
    callback(user);
  });
  
  return unsubscribe;
};