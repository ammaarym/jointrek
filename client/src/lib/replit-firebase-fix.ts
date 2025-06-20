/**
 * Comprehensive Firebase Authentication Fix for Replit Production Environment
 * 
 * Addresses specific issues with Firebase persistence and redirect handling
 * in Replit's hosting environment by implementing multiple fallback strategies.
 */

import {
  Auth,
  User,
  getRedirectResult,
  signInWithRedirect,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from './firebase';

interface ReplitAuthState {
  user: User | null;
  pending: boolean;
  error: string | null;
}

class ReplitFirebaseManager {
  private static instance: ReplitFirebaseManager;
  private authState: ReplitAuthState = { user: null, pending: false, error: null };
  private authStateCallbacks: Array<(state: ReplitAuthState) => void> = [];
  private persistenceConfigured = false;

  static getInstance(): ReplitFirebaseManager {
    if (!ReplitFirebaseManager.instance) {
      ReplitFirebaseManager.instance = new ReplitFirebaseManager();
    }
    return ReplitFirebaseManager.instance;
  }

  /**
   * Configure Firebase persistence with multiple fallback strategies
   */
  async configurePersistence(): Promise<void> {
    if (this.persistenceConfigured) return;

    console.log("🔧 [REPLIT FIREBASE] Configuring enhanced persistence...");
    
    try {
      // Try local persistence first
      await setPersistence(auth, browserLocalPersistence);
      console.log("✅ [REPLIT FIREBASE] Local persistence configured");
    } catch (error) {
      console.log("⚠️ [REPLIT FIREBASE] Local persistence failed, trying session persistence");
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.log("✅ [REPLIT FIREBASE] Session persistence configured");
      } catch (sessionError) {
        console.error("❌ [REPLIT FIREBASE] All persistence methods failed:", sessionError);
      }
    }

    this.persistenceConfigured = true;
  }

  /**
   * Enhanced redirect result handling with multiple retry strategies
   */
  async handleRedirectResult(): Promise<User | null> {
    console.log("🔄 [REPLIT FIREBASE] Enhanced redirect result handling...");
    
    await this.configurePersistence();
    
    // Check for OAuth parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const fragment = window.location.hash;
    const hasOAuthIndicators = 
      urlParams.has('code') || 
      urlParams.has('state') || 
      fragment.includes('access_token') ||
      fragment.includes('id_token') ||
      urlParams.has('authuser') ||
      document.referrer.includes('accounts.google.com');

    console.log("🔍 [REPLIT FIREBASE] OAuth indicators present:", hasOAuthIndicators);
    console.log("🔍 [REPLIT FIREBASE] URL params:", window.location.search);
    console.log("🔍 [REPLIT FIREBASE] Fragment:", fragment);
    console.log("🔍 [REPLIT FIREBASE] Referrer:", document.referrer);

    // Multiple attempts to get redirect result
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔄 [REPLIT FIREBASE] Redirect attempt ${attempt}/3`);
      
      try {
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          console.log("🎉 [REPLIT FIREBASE] Redirect result found on attempt", attempt);
          console.log("✅ [REPLIT FIREBASE] User:", result.user.email);
          
          // Store in multiple locations for persistence
          this.storeUserData(result.user);
          return result.user;
        }
        
        console.log(`⚠️ [REPLIT FIREBASE] No redirect result on attempt ${attempt}`);
        
        // If we have OAuth indicators but no result, wait and retry
        if (hasOAuthIndicators && attempt < 3) {
          console.log(`⏰ [REPLIT FIREBASE] Waiting ${attempt * 500}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
        }
        
      } catch (error) {
        console.error(`❌ [REPLIT FIREBASE] Error on attempt ${attempt}:`, error);
        
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // If redirect failed but we have OAuth indicators, try auth state monitoring
    if (hasOAuthIndicators) {
      console.log("🔄 [REPLIT FIREBASE] Redirect failed, monitoring auth state changes...");
      return this.waitForAuthStateChange(3000);
    }

    console.log("❌ [REPLIT FIREBASE] All redirect attempts failed");
    return null;
  }

  /**
   * Wait for auth state to change (useful when redirect result is lost)
   */
  async waitForAuthStateChange(timeoutMs: number = 3000): Promise<User | null> {
    console.log("⏰ [REPLIT FIREBASE] Waiting for auth state change...");
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log("⏰ [REPLIT FIREBASE] Auth state change timeout");
        resolve(null);
      }, timeoutMs);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log("✅ [REPLIT FIREBASE] Auth state changed - user found:", user.email);
          clearTimeout(timeout);
          unsubscribe();
          this.storeUserData(user);
          resolve(user);
        }
      });
    });
  }

  /**
   * Store user data in multiple locations for persistence
   */
  private storeUserData(user: User): void {
    console.log("💾 [REPLIT FIREBASE] Storing user data for persistence...");
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      timestamp: Date.now()
    };

    try {
      // Store in localStorage
      localStorage.setItem('replit_firebase_user', JSON.stringify(userData));
      
      // Store in sessionStorage as backup
      sessionStorage.setItem('replit_firebase_user', JSON.stringify(userData));
      
      // Store auth token if available
      user.getIdToken().then(token => {
        localStorage.setItem('replit_firebase_token', token);
        sessionStorage.setItem('replit_firebase_token', token);
        console.log("✅ [REPLIT FIREBASE] Auth token stored");
      }).catch(() => {
        console.log("⚠️ [REPLIT FIREBASE] Could not store auth token");
      });
      
      console.log("✅ [REPLIT FIREBASE] User data stored successfully");
    } catch (error) {
      console.error("❌ [REPLIT FIREBASE] Error storing user data:", error);
    }
  }

  /**
   * Retrieve stored user data
   */
  getStoredUserData(): any | null {
    try {
      const stored = localStorage.getItem('replit_firebase_user') || 
                   sessionStorage.getItem('replit_firebase_user');
      
      if (stored) {
        const userData = JSON.parse(stored);
        const age = Date.now() - userData.timestamp;
        
        // Return if less than 1 hour old
        if (age < 3600000) {
          console.log("📱 [REPLIT FIREBASE] Found stored user data:", userData.email);
          return userData;
        } else {
          console.log("⏰ [REPLIT FIREBASE] Stored user data expired");
          this.clearStoredData();
        }
      }
    } catch (error) {
      console.error("❌ [REPLIT FIREBASE] Error retrieving stored data:", error);
    }
    
    return null;
  }

  /**
   * Clear all stored data
   */
  clearStoredData(): void {
    console.log("🧹 [REPLIT FIREBASE] Clearing stored data...");
    
    try {
      localStorage.removeItem('replit_firebase_user');
      localStorage.removeItem('replit_firebase_token');
      sessionStorage.removeItem('replit_firebase_user');
      sessionStorage.removeItem('replit_firebase_token');
      
      // Clear Firebase-related items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log("✅ [REPLIT FIREBASE] Stored data cleared");
    } catch (error) {
      console.error("❌ [REPLIT FIREBASE] Error clearing data:", error);
    }
  }

  /**
   * Enhanced Google sign-in with popup method (bypasses redirect session issues)
   */
  async signInWithGoogle(): Promise<User | null> {
    console.log("🚀 [REPLIT FIREBASE] Starting popup-based Google sign-in...");
    
    try {
      await this.configurePersistence();
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'ufl.edu' // Hint for UF domain
      });
      
      // Add required scopes
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log("🔄 [REPLIT FIREBASE] Opening authentication popup...");
      const result = await signInWithPopup(auth, provider);
      
      if (result?.user) {
        console.log("✅ [REPLIT FIREBASE] Popup authentication successful!");
        console.log("👤 [REPLIT FIREBASE] User:", result.user.email);
        
        // Store user data immediately
        this.storeUserData(result.user);
        return result.user;
      } else {
        console.log("❌ [REPLIT FIREBASE] No user returned from popup");
        return null;
      }
      
    } catch (error: any) {
      // Handle popup blocked error gracefully
      if (error.code === 'auth/popup-blocked') {
        console.log("⚠️ [REPLIT FIREBASE] Popup blocked - falling back to redirect method");
        return this.fallbackToRedirect();
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("ℹ️ [REPLIT FIREBASE] User closed popup");
        return null;
      } else {
        console.error("❌ [REPLIT FIREBASE] Popup sign-in error:", error);
        throw error;
      }
    }
  }

  /**
   * Fallback to redirect method if popup is blocked
   */
  private async fallbackToRedirect(): Promise<User | null> {
    console.log("🔄 [REPLIT FIREBASE] Using redirect fallback...");
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'ufl.edu'
      });
      provider.addScope('email');
      provider.addScope('profile');
      
      await signInWithRedirect(auth, provider);
      return null; // Redirect will handle the rest
      
    } catch (error) {
      console.error("❌ [REPLIT FIREBASE] Redirect fallback error:", error);
      throw error;
    }
  }
}

export const replitFirebaseManager = ReplitFirebaseManager.getInstance();