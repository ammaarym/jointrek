import { 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  User,
  browserSessionPersistence,
  setPersistence,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Persistent state keys
const MOBILE_AUTH_KEYS = {
  REDIRECT_STARTED: 'trek_mobile_redirect_started',
  REDIRECT_CHECKED: 'trek_mobile_redirect_checked',
  AUTH_STATE: 'trek_mobile_auth_state',
  PAGE_LOADED: 'trek_mobile_page_loaded'
} as const;

// Enhanced mobile detection
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Tablet|tablet/i.test(userAgent);
  const safari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const webview = /wv|WebView/i.test(userAgent);
  
  console.log('📱 [MOBILE_PERSISTENT] Device detection:', {
    userAgent: userAgent.substring(0, 100) + '...',
    isMobile: mobile,
    isSafari: safari,
    isWebView: webview,
    result: mobile || safari || webview
  });
  
  return mobile || safari || webview;
}

// Persistent state management
class PersistentMobileState {
  private setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('📱 [MOBILE_PERSISTENT] Storage failed:', error);
    }
  }
  
  private getItem(key: string): string | null {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    } catch (error) {
      console.warn('📱 [MOBILE_PERSISTENT] Storage read failed:', error);
      return null;
    }
  }
  
  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('📱 [MOBILE_PERSISTENT] Storage removal failed:', error);
    }
  }
  
  setRedirectStarted(): void {
    const timestamp = Date.now().toString();
    this.setItem(MOBILE_AUTH_KEYS.REDIRECT_STARTED, timestamp);
    console.log('📱 [MOBILE_PERSISTENT] Redirect started flag set:', timestamp);
  }
  
  isRedirectStarted(): boolean {
    const value = this.getItem(MOBILE_AUTH_KEYS.REDIRECT_STARTED);
    const started = !!value;
    console.log('📱 [MOBILE_PERSISTENT] Redirect started check:', started, value);
    return started;
  }
  
  setRedirectChecked(): void {
    const timestamp = Date.now().toString();
    this.setItem(MOBILE_AUTH_KEYS.REDIRECT_CHECKED, timestamp);
    console.log('📱 [MOBILE_PERSISTENT] Redirect checked flag set:', timestamp);
  }
  
  hasRedirectBeenChecked(): boolean {
    const value = this.getItem(MOBILE_AUTH_KEYS.REDIRECT_CHECKED);
    const checked = !!value;
    console.log('📱 [MOBILE_PERSISTENT] Redirect checked status:', checked, value);
    return checked;
  }
  
  setPageLoaded(): void {
    const timestamp = Date.now().toString();
    this.setItem(MOBILE_AUTH_KEYS.PAGE_LOADED, timestamp);
    console.log('📱 [MOBILE_PERSISTENT] Page loaded flag set:', timestamp);
  }
  
  isPageLoaded(): boolean {
    const value = this.getItem(MOBILE_AUTH_KEYS.PAGE_LOADED);
    const loaded = !!value;
    console.log('📱 [MOBILE_PERSISTENT] Page loaded check:', loaded, value);
    return loaded;
  }
  
  clearAll(): void {
    Object.values(MOBILE_AUTH_KEYS).forEach(key => {
      this.removeItem(key);
    });
    console.log('📱 [MOBILE_PERSISTENT] All persistent state cleared');
  }
  
  getDebugInfo(): Record<string, string | null> {
    return Object.entries(MOBILE_AUTH_KEYS).reduce((acc, [name, key]) => {
      acc[name] = this.getItem(key);
      return acc;
    }, {} as Record<string, string | null>);
  }
}

export const persistentState = new PersistentMobileState();

// Page load detection
export function waitForPageLoad(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      console.log('📱 [MOBILE_PERSISTENT] Page already loaded');
      persistentState.setPageLoaded();
      resolve();
      return;
    }
    
    console.log('📱 [MOBILE_PERSISTENT] Waiting for page load...');
    
    const handleLoad = () => {
      console.log('📱 [MOBILE_PERSISTENT] Page load detected');
      persistentState.setPageLoaded();
      window.removeEventListener('load', handleLoad);
      resolve();
    };
    
    window.addEventListener('load', handleLoad);
    
    // Fallback timeout
    setTimeout(() => {
      console.log('📱 [MOBILE_PERSISTENT] Page load timeout - proceeding anyway');
      persistentState.setPageLoaded();
      window.removeEventListener('load', handleLoad);
      resolve();
    }, 3000);
  });
}

// Safe mobile authentication with persistence
export async function authenticateMobilePersistent(): Promise<User | null> {
  console.log('🚀 [MOBILE_PERSISTENT] Starting persistent mobile authentication');
  
  try {
    // Wait for page to fully load
    await waitForPageLoad();
    
    // Check if redirect already in progress
    if (persistentState.isRedirectStarted() && !persistentState.hasRedirectBeenChecked()) {
      console.log('⚠️ [MOBILE_PERSISTENT] Redirect already in progress, aborting');
      return null;
    }
    
    // Set persistence for mobile
    await setPersistence(auth, browserSessionPersistence);
    console.log('✅ [MOBILE_PERSISTENT] Session persistence set');
    
    // Create provider with UF domain restriction
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'ufl.edu',
      prompt: 'select_account'
    });
    
    console.log('🔄 [MOBILE_PERSISTENT] Initiating Google redirect...');
    
    // Mark redirect as started
    persistentState.setRedirectStarted();
    
    // Start redirect
    await signInWithRedirect(auth, provider);
    
    return null;
    
  } catch (error) {
    console.error('❌ [MOBILE_PERSISTENT] Authentication failed:', error);
    persistentState.clearAll();
    throw new Error('Mobile sign-in failed. Please try again.');
  }
}

// Process redirect result with persistence
export async function processRedirectResultPersistent(): Promise<User | null> {
  console.log('🔍 [MOBILE_PERSISTENT] Processing persistent redirect result');
  
  try {
    // Check if we should process redirect
    if (persistentState.hasRedirectBeenChecked()) {
      console.log('ℹ️ [MOBILE_PERSISTENT] Redirect already processed, skipping');
      return null;
    }
    
    // Wait for page to fully load before processing
    await waitForPageLoad();
    
    console.log('🔍 [MOBILE_PERSISTENT] Getting redirect result...');
    const result = await getRedirectResult(auth);
    
    // Mark as checked regardless of result
    persistentState.setRedirectChecked();
    
    if (result?.user) {
      console.log('✅ [MOBILE_PERSISTENT] Redirect successful:', result.user.email);
      
      // Validate UF email
      if (!result.user.email?.endsWith('@ufl.edu')) {
        console.log('❌ [MOBILE_PERSISTENT] Invalid email domain');
        await auth.signOut();
        persistentState.clearAll();
        throw new Error('Please use your UF email address (@ufl.edu)');
      }
      
      console.log('✅ [MOBILE_PERSISTENT] Authentication completed successfully');
      return result.user;
    } else {
      console.log('ℹ️ [MOBILE_PERSISTENT] No redirect result found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ [MOBILE_PERSISTENT] Redirect processing failed:', error);
    persistentState.setRedirectChecked(); // Mark as checked to prevent loops
    throw error;
  }
}

// Safe navigation with delay
export function navigateToProfile(user: User): void {
  console.log('🧭 [MOBILE_PERSISTENT] Preparing navigation to profile...');
  
  // Ensure page is fully loaded and auth state is stable
  setTimeout(() => {
    console.log('🧭 [MOBILE_PERSISTENT] Navigating to profile for:', user.email);
    
    // Clear mobile auth state before navigation
    persistentState.clearAll();
    
    // Use replace to avoid back button issues
    window.location.replace('/profile');
  }, 1000); // 1 second delay to ensure everything is ready
}

// Auth state monitor with persistence awareness
export function monitorAuthStatePersistent(callback: (user: User | null) => void): () => void {
  console.log('👂 [MOBILE_PERSISTENT] Setting up persistent auth state monitor');
  
  return onAuthStateChanged(auth, (user) => {
    console.log('🔥 [MOBILE_PERSISTENT] Auth state changed:', {
      hasUser: !!user,
      email: user?.email || 'none',
      verified: user?.emailVerified || false,
      persistentState: persistentState.getDebugInfo()
    });
    
    callback(user);
  });
}

// Debug information
export function getMobileAuthDebugInfo(): Record<string, any> {
  return {
    isMobile: isMobileDevice(),
    persistentState: persistentState.getDebugInfo(),
    currentUrl: window.location.href,
    readyState: document.readyState,
    userAgent: navigator.userAgent.substring(0, 100) + '...'
  };
}