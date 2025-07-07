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

export function isProductionDomain(): boolean {
  return window.location.hostname === 'jointrek.com' || 
         window.location.hostname === 'www.jointrek.com';
}

export function shouldUsePopupAuth(): boolean {
  const hostname = window.location.hostname;
  const isMobile = isMobileDevice();
  
  // Check if we're on production domain (jointrek.com)
  if (hostname === 'jointrek.com' || hostname === 'www.jointrek.com') {
    console.log('🎯 [DOMAIN_CHECK] Production domain (jointrek.com) detected');
    console.log('🎯 [DOMAIN_CHECK] Device type:', isMobile ? 'Mobile' : 'Desktop');
    
    if (isMobile) {
      console.log('🎯 [DOMAIN_CHECK] Using redirect authentication for mobile on production');
      return false; // Use redirect for mobile on production
    } else {
      console.log('🎯 [DOMAIN_CHECK] Using popup authentication for desktop on production');
      return true; // Use popup for desktop on production
    }
  }
  
  // For all other domains (including Replit), always use popup to avoid redirect loops
  console.log('🎯 [DOMAIN_CHECK] Non-production domain detected:', hostname);
  console.log('🎯 [DOMAIN_CHECK] Using popup authentication to avoid redirect loops');
  return true;
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
    console.log('🚀 [POPUP_AUTH] Starting domain-aware Google sign-in');
    console.log('🎯 [POPUP_AUTH] Current domain:', window.location.hostname);
    
    await this.initialize();
    
    const usePopup = shouldUsePopupAuth();
    console.log('🎯 [POPUP_AUTH] Authentication method:', usePopup ? 'popup' : 'redirect');
    
    if (usePopup) {
      return this.signInWithPopupMethod();
    } else {
      return this.signInWithRedirectMethod();
    }
  }
  
  private async signInWithPopupMethod(): Promise<User> {
    console.log('🪟 [POPUP_AUTH] Using popup authentication');
    
    try {
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
  
  private async signInWithRedirectMethod(): Promise<never> {
    console.log('🔄 [POPUP_AUTH] Using redirect authentication for mobile on production');
    
    // Mark that we're using redirect
    sessionStorage.setItem('firebase_redirect_auth', 'true');
    
    // Start redirect
    await signInWithRedirect(auth, this.provider);
    
    // This will redirect, so we never reach here
    throw new Error('Redirect initiated');
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
    console.log('🔍 [POPUP_AUTH] Checking for redirect result');
    
    // Check for both fallback and direct redirect flags
    const hasFallbackFlag = sessionStorage.getItem('firebase_popup_fallback');
    const hasRedirectFlag = sessionStorage.getItem('firebase_redirect_auth');
    
    if (!hasFallbackFlag && !hasRedirectFlag) {
      console.log('ℹ️ [POPUP_AUTH] No redirect flags found');
      return null;
    }
    
    try {
      const result = await getRedirectResult(auth);
      
      if (result?.user) {
        console.log('✅ [POPUP_AUTH] Redirect successful:', result.user.email);
        
        // Validate UF email
        if (!result.user.email?.endsWith('@ufl.edu')) {
          console.log('❌ [POPUP_AUTH] Invalid email domain');
          await signOut(auth);
          throw new Error('Please use your UF email address (@ufl.edu)');
        }
        
        // Clear all redirect flags
        sessionStorage.removeItem('firebase_popup_fallback');
        sessionStorage.removeItem('firebase_redirect_auth');
        return result.user;
      }
      
      console.log('ℹ️ [POPUP_AUTH] No redirect result found');
      return null;
      
    } catch (error) {
      console.error('❌ [POPUP_AUTH] Redirect processing failed:', error);
      sessionStorage.removeItem('firebase_popup_fallback');
      sessionStorage.removeItem('firebase_redirect_auth');
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
    sessionStorage.removeItem('firebase_redirect_auth');
    await signOut(auth);
  }
  
  getDebugInfo(): any {
    const hostname = window.location.hostname;
    const isMobile = isMobileDevice();
    const isProduction = hostname === 'jointrek.com' || hostname === 'www.jointrek.com';
    const shouldPopup = shouldUsePopupAuth();
    
    return {
      currentDomain: hostname,
      targetProductionDomain: 'jointrek.com',
      isProductionDomain: isProduction,
      isReplitDomain: isReplitEnvironment(),
      deviceType: isMobile ? 'Mobile' : 'Desktop',
      authMethod: shouldPopup ? 'Popup' : 'Redirect',
      authStrategy: isProduction 
        ? (isMobile ? 'Mobile Redirect on Production' : 'Desktop Popup on Production')
        : 'Popup Only (Non-Production)',
      hasFallbackFlag: !!sessionStorage.getItem('firebase_popup_fallback'),
      hasRedirectFlag: !!sessionStorage.getItem('firebase_redirect_auth'),
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