/**
 * Replit Authentication State Manager
 * 
 * Handles Firebase authentication persistence issues in Replit's production environment
 * by implementing a robust backup and restoration system for auth state.
 */

import { User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthBackup {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  timestamp: number;
}

const AUTH_BACKUP_KEY = 'trek_replit_auth_backup';
const AUTH_TOKEN_KEY = 'trek_replit_auth_token';

export class ReplitAuthManager {
  private static instance: ReplitAuthManager;
  private authBackup: AuthBackup | null = null;

  static getInstance(): ReplitAuthManager {
    if (!ReplitAuthManager.instance) {
      ReplitAuthManager.instance = new ReplitAuthManager();
    }
    return ReplitAuthManager.instance;
  }

  /**
   * Store authentication state backup for Replit persistence
   */
  storeAuthState(user: User): void {
    console.log("🔐 [REPLIT AUTH] Storing auth state backup for:", user.email);
    
    const backup: AuthBackup = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(AUTH_BACKUP_KEY, JSON.stringify(backup));
      // Also store in sessionStorage as fallback
      sessionStorage.setItem(AUTH_BACKUP_KEY, JSON.stringify(backup));
      
      // Store auth token if available
      user.getIdToken().then(token => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        console.log("✅ [REPLIT AUTH] Auth token stored");
      }).catch(error => {
        console.log("⚠️ [REPLIT AUTH] Could not store auth token:", error);
      });
      
      this.authBackup = backup;
      console.log("✅ [REPLIT AUTH] Auth state backup stored successfully");
    } catch (error) {
      console.error("❌ [REPLIT AUTH] Error storing auth state:", error);
    }
  }

  /**
   * Retrieve stored authentication state
   */
  getStoredAuthState(): AuthBackup | null {
    try {
      // Try localStorage first
      let backupData = localStorage.getItem(AUTH_BACKUP_KEY);
      
      // Fallback to sessionStorage
      if (!backupData) {
        backupData = sessionStorage.getItem(AUTH_BACKUP_KEY);
      }

      if (backupData) {
        const backup: AuthBackup = JSON.parse(backupData);
        const age = Date.now() - backup.timestamp;
        
        console.log("🔐 [REPLIT AUTH] Found stored auth state for:", backup.email);
        console.log("🔐 [REPLIT AUTH] Auth backup age:", Math.round(age / 1000) + " seconds");
        
        // Only return if backup is less than 1 hour old
        if (age < 3600000) {
          this.authBackup = backup;
          return backup;
        } else {
          console.log("⚠️ [REPLIT AUTH] Auth backup expired, clearing");
          this.clearAuthState();
        }
      }
    } catch (error) {
      console.error("❌ [REPLIT AUTH] Error retrieving auth state:", error);
      this.clearAuthState();
    }
    
    return null;
  }

  /**
   * Check if we should expect user to be authenticated based on stored state
   */
  shouldUserBeAuthenticated(): boolean {
    const storedState = this.getStoredAuthState();
    return storedState !== null;
  }

  /**
   * Clear all stored authentication state
   */
  clearAuthState(): void {
    console.log("🔐 [REPLIT AUTH] Clearing all stored auth state");
    
    try {
      localStorage.removeItem(AUTH_BACKUP_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_BACKUP_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      
      // Clear any Firebase-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase')) {
          localStorage.removeItem(key);
        }
      });
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase')) {
          sessionStorage.removeItem(key);
        }
      });
      
      this.authBackup = null;
      console.log("✅ [REPLIT AUTH] Auth state cleared successfully");
    } catch (error) {
      console.error("❌ [REPLIT AUTH] Error clearing auth state:", error);
    }
  }

  /**
   * Wait for Firebase auth to restore from backup
   */
  async waitForAuthRestoration(maxWaitTime: number = 3000): Promise<User | null> {
    console.log("🔐 [REPLIT AUTH] Waiting for Firebase auth restoration...");
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkAuth = () => {
        const currentUser = auth.currentUser;
        const elapsed = Date.now() - startTime;
        
        if (currentUser) {
          console.log("✅ [REPLIT AUTH] Firebase auth restored:", currentUser.email);
          resolve(currentUser);
        } else if (elapsed >= maxWaitTime) {
          console.log("⚠️ [REPLIT AUTH] Auth restoration timeout");
          resolve(null);
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      
      checkAuth();
    });
  }

  /**
   * Get stored auth token
   */
  getStoredToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error("❌ [REPLIT AUTH] Error getting stored token:", error);
      return null;
    }
  }
}

export const replitAuthManager = ReplitAuthManager.getInstance();