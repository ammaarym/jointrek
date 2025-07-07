import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult, 
  GoogleAuthProvider, 
  User,
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
         window.location.hostname.includes('replit.dev');
}

// Firebase popup authentication solution for Replit
class FirebasePopupAuth {
  private provider: GoogleAuthProvider;
  
  constructor() {
    this.provider = new GoogleAuthProvider();
    this.provider.setCustomParameters({
      hd: 'ufl.edu', // Restrict to UF domain
      prompt: 'select_account'
    });
  }
  
  async initialize(): Promise<void> {
    console.log('🔧 [POPUP_AUTH] Initializing Firebase popup authentication');
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log('✅ [POPUP_AUTH] Persistence set to local storage');
    } catch (error) {
      console.error('❌ [POPUP_AUTH] Failed to set persistence:', error);
    }
  }
  
  async signInWithGoogle(): Promise<User> {
    console.log('🚀 [POPUP_AUTH] Starting Google sign-in with popup');
    
    await this.initialize();
    
    try {
      // Try popup first (works on desktop and some mobile browsers)
      const result = await signInWithPopup(auth, this.provider);
      
      if (!result.user.email?.endsWith('@ufl.edu')) {
        console.log('❌ [POPUP_AUTH] Invalid email domain');
        await signOut(auth);
        throw new Error('Please use your UF email address (@ufl.edu)');
      }
      
      console.log('✅ [POPUP_AUTH] Popup sign-in successful:', result.user.email);
      return result.user;
      
    } catch (error: any) {
      console.log('⚠️ [POPUP_AUTH] Popup failed, trying redirect fallback:', error.code);
      
      // Fallback to redirect if popup is blocked
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request') {
        
        console.log('🔄 [POPUP_AUTH] Using redirect fallback...');
        return this.fallbackToRedirect();
      }
      
      throw error;
    }
  }
  
  private async fallbackToRedirect(): Promise<never> {
    console.log('🔄 [POPUP_AUTH] Falling back to redirect method');
    
    // Mark that we're using redirect fallback
    sessionStorage.setItem('firebase_popup_fallback', 'true');
    
    // Start redirect
    await signInWithRedirect(auth, this.provider);
    
    // This will redirect, so we never reach here
    throw new Error('Redirect initiated');
  }
  
  async handleRedirectFallback(): Promise<User | null> {
    console.log('🔍 [POPUP_AUTH] Checking for redirect fallback result');
    
    // Only process if we used redirect fallback
    if (!sessionStorage.getItem('firebase_popup_fallback')) {
      return null;
    }
    
    try {
      const result = await getRedirectResult(auth);
      
      if (result?.user) {
        console.log('✅ [POPUP_AUTH] Redirect fallback successful:', result.user.email);
        
        // Validate UF email
        if (!result.user.email?.endsWith('@ufl.edu')) {
          console.log('❌ [POPUP_AUTH] Invalid email domain');
          await signOut(auth);
          throw new Error('Please use your UF email address (@ufl.edu)');
        }
        
        // Clear fallback flag
        sessionStorage.removeItem('firebase_popup_fallback');
        return result.user;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ [POPUP_AUTH] Redirect fallback failed:', error);
      sessionStorage.removeItem('firebase_popup_fallback');
      throw error;
    }
  }
  
  setupAuthStateListener(callback: (user: User | null) => void): () => void {
    console.log('👂 [POPUP_AUTH] Setting up auth state listener');
    
    return onAuthStateChanged(auth, (user) => {
      console.log('🔥 [POPUP_AUTH] Auth state changed:', {
        hasUser: !!user,
        email: user?.email || 'none',
        verified: user?.emailVerified || false
      });
      
      callback(user);
    });
  }
  
  async signOut(): Promise<void> {
    console.log('🚪 [POPUP_AUTH] Signing out');
    sessionStorage.removeItem('firebase_popup_fallback');
    await signOut(auth);
  }
  
  getDebugInfo(): any {
    return {
      isMobile: isMobileDevice(),
      isReplit: isReplitEnvironment(),
      hasFallbackFlag: !!sessionStorage.getItem('firebase_popup_fallback'),
      currentUrl: window.location.href,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    };
  }
}

// Export singleton instance
export const firebasePopupAuth = new FirebasePopupAuth();

// Convenience functions
export async function signInWithGooglePopup(): Promise<User> {
  return firebasePopupAuth.signInWithGoogle();
}

export async function handlePopupRedirectFallback(): Promise<User | null> {
  return firebasePopupAuth.handleRedirectFallback();
}

export function setupPopupAuthListener(callback: (user: User | null) => void): () => void {
  return firebasePopupAuth.setupAuthStateListener(callback);
}

export async function signOutPopup(): Promise<void> {
  return firebasePopupAuth.signOut();
}

export function getPopupAuthDebugInfo(): any {
  return firebasePopupAuth.getDebugInfo();
}