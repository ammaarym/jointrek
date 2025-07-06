import { 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  User,
  browserSessionPersistence,
  browserLocalPersistence,
  setPersistence,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Detection utilities
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export function isReplitEnvironment(): boolean {
  return window.location.hostname.includes('replit.app') || 
         window.location.hostname.includes('replit.dev') ||
         window.parent !== window; // iframe detection
}

export function isWebView(): boolean {
  const ua = navigator.userAgent;
  return /wv|WebView|Instagram|FBAV|Twitter/i.test(ua);
}

// State management keys
const AUTH_STATE_KEY = 'replit_mobile_auth_state';
const REDIRECT_FLAG_KEY = 'replit_redirect_in_progress';
const REDIRECT_CHECKED_KEY = 'replit_redirect_checked';

interface AuthState {
  redirectInProgress: boolean;
  redirectChecked: boolean;
  lastRedirectTime: number;
  attemptCount: number;
}

class ReplitMobileAuthManager {
  private maxAttempts = 3;
  private redirectTimeout = 30000; // 30 seconds
  
  private getAuthState(): AuthState {
    const stored = localStorage.getItem(AUTH_STATE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to parse auth state:', e);
      }
    }
    
    return {
      redirectInProgress: false,
      redirectChecked: false,
      lastRedirectTime: 0,
      attemptCount: 0
    };
  }
  
  private setAuthState(state: Partial<AuthState>): void {
    const currentState = this.getAuthState();
    const newState = { ...currentState, ...state };
    
    try {
      localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(newState));
      sessionStorage.setItem(AUTH_STATE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('Failed to save auth state:', e);
    }
  }
  
  private clearAuthState(): void {
    localStorage.removeItem(AUTH_STATE_KEY);
    sessionStorage.removeItem(AUTH_STATE_KEY);
    localStorage.removeItem(REDIRECT_FLAG_KEY);
    sessionStorage.removeItem(REDIRECT_FLAG_KEY);
    localStorage.removeItem(REDIRECT_CHECKED_KEY);
    sessionStorage.removeItem(REDIRECT_CHECKED_KEY);
  }
  
  private isRedirectExpired(): boolean {
    const state = this.getAuthState();
    return Date.now() - state.lastRedirectTime > this.redirectTimeout;
  }
  
  async initializeAuth(): Promise<void> {
    console.log('🔧 [REPLIT_MOBILE] Initializing mobile auth for Replit environment');
    
    // Set appropriate persistence based on environment
    const persistence = isWebView() ? browserSessionPersistence : browserLocalPersistence;
    
    try {
      await setPersistence(auth, persistence);
      console.log('✅ [REPLIT_MOBILE] Auth persistence set:', persistence);
    } catch (error) {
      console.error('❌ [REPLIT_MOBILE] Failed to set persistence:', error);
    }
  }
  
  async handleRedirectResult(): Promise<User | null> {
    console.log('🔍 [REPLIT_MOBILE] Checking for redirect result');
    
    const state = this.getAuthState();
    
    // Skip if already checked or not in progress
    if (state.redirectChecked || !state.redirectInProgress) {
      console.log('ℹ️ [REPLIT_MOBILE] Redirect already processed or not in progress');
      return null;
    }
    
    // Check if redirect expired
    if (this.isRedirectExpired()) {
      console.log('⏰ [REPLIT_MOBILE] Redirect expired, clearing state');
      this.clearAuthState();
      return null;
    }
    
    try {
      // Mark as checked first to prevent loops
      this.setAuthState({ redirectChecked: true });
      
      const result = await getRedirectResult(auth);
      
      if (result?.user) {
        console.log('✅ [REPLIT_MOBILE] Redirect result found:', result.user.email);
        
        // Validate UF email
        if (!result.user.email?.endsWith('@ufl.edu')) {
          console.log('❌ [REPLIT_MOBILE] Invalid email domain');
          await signOut(auth);
          this.clearAuthState();
          throw new Error('Please use your UF email address (@ufl.edu)');
        }
        
        // Clear state on success
        this.clearAuthState();
        return result.user;
      } else {
        console.log('ℹ️ [REPLIT_MOBILE] No redirect result found');
        
        // If no result and redirect was in progress, something went wrong
        if (state.redirectInProgress) {
          console.log('⚠️ [REPLIT_MOBILE] Redirect was in progress but no result found');
          
          // Wait a bit more for slow mobile networks
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try one more time
          const secondResult = await getRedirectResult(auth);
          if (secondResult?.user) {
            console.log('✅ [REPLIT_MOBILE] Second attempt successful');
            this.clearAuthState();
            return secondResult.user;
          }
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ [REPLIT_MOBILE] Error processing redirect result:', error);
      this.setAuthState({ redirectChecked: true });
      throw error;
    }
  }
  
  async signInWithGoogle(): Promise<void> {
    console.log('🚀 [REPLIT_MOBILE] Starting Google sign-in for mobile');
    
    const state = this.getAuthState();
    
    // Check attempt limit
    if (state.attemptCount >= this.maxAttempts) {
      console.log('❌ [REPLIT_MOBILE] Max attempts reached');
      throw new Error('Too many sign-in attempts. Please refresh the page and try again.');
    }
    
    // Check if redirect already in progress
    if (state.redirectInProgress && !this.isRedirectExpired()) {
      console.log('⚠️ [REPLIT_MOBILE] Redirect already in progress');
      throw new Error('Sign-in already in progress. Please wait...');
    }
    
    try {
      // Initialize auth first
      await this.initializeAuth();
      
      // Create provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        hd: 'ufl.edu',
        prompt: 'select_account'
      });
      
      // Set state before redirect
      this.setAuthState({
        redirectInProgress: true,
        redirectChecked: false,
        lastRedirectTime: Date.now(),
        attemptCount: state.attemptCount + 1
      });
      
      console.log('🔄 [REPLIT_MOBILE] Starting redirect...');
      
      // Start redirect
      await signInWithRedirect(auth, provider);
      
    } catch (error) {
      console.error('❌ [REPLIT_MOBILE] Sign-in failed:', error);
      this.clearAuthState();
      throw error;
    }
  }
  
  setupAuthStateListener(callback: (user: User | null) => void): () => void {
    console.log('👂 [REPLIT_MOBILE] Setting up auth state listener');
    
    return onAuthStateChanged(auth, (user) => {
      console.log('🔥 [REPLIT_MOBILE] Auth state changed:', {
        hasUser: !!user,
        email: user?.email || 'none',
        verified: user?.emailVerified || false
      });
      
      callback(user);
    });
  }
  
  async signOut(): Promise<void> {
    console.log('🚪 [REPLIT_MOBILE] Signing out');
    this.clearAuthState();
    await signOut(auth);
  }
  
  getDebugInfo(): any {
    return {
      isMobile: isMobileDevice(),
      isReplit: isReplitEnvironment(),
      isWebView: isWebView(),
      authState: this.getAuthState(),
      currentUrl: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    };
  }
}

// Export singleton instance
export const replitMobileAuth = new ReplitMobileAuthManager();

// Convenience functions
export async function signInWithGoogleMobile(): Promise<void> {
  return replitMobileAuth.signInWithGoogle();
}

export async function handleMobileRedirectResult(): Promise<User | null> {
  return replitMobileAuth.handleRedirectResult();
}

export function setupMobileAuthListener(callback: (user: User | null) => void): () => void {
  return replitMobileAuth.setupAuthStateListener(callback);
}

export async function signOutMobile(): Promise<void> {
  return replitMobileAuth.signOut();
}

export function getMobileAuthDebugInfo(): any {
  return replitMobileAuth.getDebugInfo();
}