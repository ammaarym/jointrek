import { 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  User,
  browserSessionPersistence,
  setPersistence,
  Auth
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Enhanced mobile detection that specifically handles Safari and WebView issues
export function isMobileBrowserEnhanced(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);
  const isWebView = /(wv|version.*chrome)/i.test(userAgent);
  
  console.log('📱 [MOBILE_ENHANCED] Device detection:', {
    userAgent,
    isMobile,
    isSafari,
    isWebView,
    platform: navigator.platform
  });
  
  return isMobile || isSafari || isWebView;
}

// Check if we're in Replit's iframe environment
export function isReplitIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // If we can't check, assume we're in iframe
  }
}

// Initialize mobile-specific Firebase auth for Replit
export async function initializeMobileAuthForReplit(): Promise<void> {
  console.log('🔧 [MOBILE_INIT] Initializing mobile auth for Replit environment');
  
  try {
    // For mobile in Replit iframe, use session persistence
    if (isMobileBrowserEnhanced() && isReplitIframe()) {
      console.log('📱 [MOBILE_INIT] Setting up mobile iframe authentication');
      await setPersistence(auth, browserSessionPersistence);
      
      // Clear any existing auth state to prevent conflicts
      sessionStorage.removeItem('firebase:authUser');
      localStorage.removeItem('firebase:authUser');
      
      console.log('✅ [MOBILE_INIT] Mobile iframe auth configured');
    }
  } catch (error) {
    console.error('❌ [MOBILE_INIT] Failed to initialize mobile auth:', error);
  }
}

// Enhanced Google sign-in for mobile Replit environment
export async function signInWithGoogleMobileReplit(): Promise<User | null> {
  console.log('🚀 [MOBILE_SIGNIN] Starting Google sign-in for mobile Replit');
  
  try {
    // Initialize mobile auth first
    await initializeMobileAuthForReplit();
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Force account selection and consent
    provider.setCustomParameters({
      prompt: 'select_account consent',
      hd: 'ufl.edu' // Restrict to UF domain
    });
    
    console.log('🔄 [MOBILE_SIGNIN] Initiating redirect to Google');
    await signInWithRedirect(auth, provider);
    
    // The redirect will happen, so we won't reach here
    return null;
  } catch (error) {
    console.error('❌ [MOBILE_SIGNIN] Sign-in failed:', error);
    throw new Error('Mobile authentication failed. Please try again.');
  }
}

// Process redirect result for mobile Replit
export async function processMobileRedirectResult(): Promise<User | null> {
  console.log('🔍 [MOBILE_REDIRECT] Processing redirect result');
  
  try {
    const result = await getRedirectResult(auth);
    
    if (result?.user) {
      console.log('✅ [MOBILE_REDIRECT] Redirect result successful:', result.user.email);
      
      // Validate UF email
      if (!result.user.email?.endsWith('@ufl.edu')) {
        console.log('❌ [MOBILE_REDIRECT] Invalid email domain');
        await auth.signOut();
        throw new Error('Please use your UF email address (@ufl.edu)');
      }
      
      // Clear redirect flags
      sessionStorage.removeItem('mobile_auth_redirect');
      sessionStorage.removeItem('auth_redirect_in_progress');
      
      return result.user;
    } else {
      console.log('ℹ️ [MOBILE_REDIRECT] No redirect result found');
      return null;
    }
  } catch (error) {
    console.error('❌ [MOBILE_REDIRECT] Redirect processing failed:', error);
    
    // Clear any problematic state
    sessionStorage.removeItem('mobile_auth_redirect');
    sessionStorage.removeItem('auth_redirect_in_progress');
    
    throw error;
  }
}

// Mobile-specific auth state listener
export function setupMobileAuthStateListener(onAuthStateChange: (user: User | null) => void): () => void {
  console.log('👂 [MOBILE_LISTENER] Setting up mobile auth state listener');
  
  return auth.onAuthStateChanged((user) => {
    console.log('🔥 [MOBILE_LISTENER] Auth state changed:', {
      hasUser: !!user,
      email: user?.email,
      isMobile: isMobileBrowserEnhanced(),
      isIframe: isReplitIframe()
    });
    
    onAuthStateChange(user);
  });
}

// Clear all mobile auth state
export function clearMobileAuthState(): void {
  console.log('🧹 [MOBILE_CLEAR] Clearing mobile auth state');
  
  const keysToRemove = [
    'mobile_auth_redirect',
    'mobile_auth_timestamp',
    'auth_redirect_in_progress',
    'mobile_auth_completed',
    'mobile_replit_mode',
    'firebase:authUser'
  ];
  
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
  
  console.log('✅ [MOBILE_CLEAR] Mobile auth state cleared');
}