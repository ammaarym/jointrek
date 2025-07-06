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

// Simple and reliable mobile detection
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Tablet|tablet/i.test(userAgent);
  const safari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  console.log('📱 [MOBILE_DIRECT] Device detection:', {
    userAgent: userAgent.substring(0, 100) + '...',
    isMobile: mobile,
    isSafari: safari,
    result: mobile || safari
  });
  
  return mobile || safari;
}

// Direct mobile authentication without complex logic
export async function authenticateDirectMobile(): Promise<User | null> {
  console.log('🚀 [MOBILE_DIRECT] Starting direct mobile authentication');
  
  try {
    // Set session persistence for mobile
    await setPersistence(auth, browserSessionPersistence);
    console.log('✅ [MOBILE_DIRECT] Session persistence set');
    
    // Create provider with UF domain restriction
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      hd: 'ufl.edu', // Restrict to UF domain
      prompt: 'select_account'
    });
    
    console.log('🔄 [MOBILE_DIRECT] Initiating Google redirect...');
    
    // Clear any existing state
    sessionStorage.setItem('mobile_auth_started', Date.now().toString());
    
    // Start redirect
    await signInWithRedirect(auth, provider);
    
    // This should redirect, so we won't reach here
    return null;
    
  } catch (error) {
    console.error('❌ [MOBILE_DIRECT] Authentication failed:', error);
    throw new Error('Mobile sign-in failed. Please try again.');
  }
}

// Process redirect result directly
export async function processDirectRedirectResult(): Promise<User | null> {
  console.log('🔍 [MOBILE_DIRECT] Processing redirect result');
  
  try {
    // Check if we recently started auth
    const authStarted = sessionStorage.getItem('mobile_auth_started');
    if (authStarted) {
      const timeSinceStart = Date.now() - parseInt(authStarted);
      console.log('⏱️ [MOBILE_DIRECT] Time since auth started:', timeSinceStart, 'ms');
    }
    
    const result = await getRedirectResult(auth);
    
    if (result?.user) {
      console.log('✅ [MOBILE_DIRECT] Redirect successful:', result.user.email);
      
      // Validate UF email
      if (!result.user.email?.endsWith('@ufl.edu')) {
        console.log('❌ [MOBILE_DIRECT] Invalid email domain');
        await auth.signOut();
        throw new Error('Please use your UF email address (@ufl.edu)');
      }
      
      // Clear auth started flag
      sessionStorage.removeItem('mobile_auth_started');
      
      return result.user;
    } else {
      console.log('ℹ️ [MOBILE_DIRECT] No redirect result found');
      return null;
    }
    
  } catch (error) {
    console.error('❌ [MOBILE_DIRECT] Redirect processing failed:', error);
    sessionStorage.removeItem('mobile_auth_started');
    throw error;
  }
}

// Simple auth state monitor
export function monitorMobileAuthState(callback: (user: User | null) => void): () => void {
  console.log('👂 [MOBILE_DIRECT] Setting up auth state monitor');
  
  return onAuthStateChanged(auth, (user) => {
    console.log('🔥 [MOBILE_DIRECT] Auth state changed:', {
      hasUser: !!user,
      email: user?.email || 'none',
      verified: user?.emailVerified || false
    });
    
    callback(user);
  });
}

// Clear mobile auth data
export function clearMobileAuthData(): void {
  console.log('🧹 [MOBILE_DIRECT] Clearing mobile auth data');
  
  sessionStorage.removeItem('mobile_auth_started');
  localStorage.removeItem('mobile_auth_started');
  
  // Clear Firebase auth cache
  const firebaseKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('firebase:') || key.includes('auth')
  );
  
  firebaseKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('✅ [MOBILE_DIRECT] Mobile auth data cleared');
}