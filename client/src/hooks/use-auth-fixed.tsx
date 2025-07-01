import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { isSafari, isMobileSafari, setSafariAuthState, getSafariAuthState, clearSafariAuthState, handleSafariRedirect } from '@/lib/safari-auth-fix';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isUFEmail = (email: string): boolean => {
    return email.endsWith('@ufl.edu');
  };

  useEffect(() => {
    // Enhanced authentication state management with Safari-specific fixes
    const initializeAuth = async () => {
      console.log('🔥 [AUTH_INIT] Starting authentication initialization');
      setLoading(true);
      
      try {
        const currentUrl = window.location.href;
        const safariDetected = isSafari();
        const mobileSafariDetected = isMobileSafari();
        
        console.log('🍎 [SAFARI_DEBUG] Browser detection:', {
          safari: safariDetected,
          mobileSafari: mobileSafariDetected,
          userAgent: navigator.userAgent
        });

        // Safari-specific: Check session storage for auth state
        const safariAuthState = getSafariAuthState();
        if (safariAuthState) {
          console.log('🍎 [SAFARI_DEBUG] Found Safari auth state:', safariAuthState);
          
          // If auth was completed, clear the state
          if (safariAuthState.state === 'completed') {
            clearSafariAuthState();
          }
        }
        
        // Safari-specific: Check if we're returning from OAuth
        if (safariDetected && handleSafariRedirect(currentUrl)) {
          console.log('🍎 [SAFARI_DEBUG] OAuth redirect detected, waiting for auth state...');
        }
        
        // Check for redirect result first
        console.log('🔍 [MOBILE_DEBUG] Checking for redirect result...');
        console.log('📊 [MOBILE_DEBUG] Current URL:', currentUrl);
        console.log('🔍 [MOBILE_DEBUG] Current session:', document.cookie);
        
        // Add timeout for Safari redirect result check - longer for Safari
        const timeoutDuration = safariDetected ? 10000 : 5000;
        const redirectResultPromise = getRedirectResult(auth);
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), timeoutDuration));
        
        const result = await Promise.race([redirectResultPromise, timeoutPromise]) as any;
        
        // Enhanced redirect result logging
        if (result?.user) {
          console.log('✅ [MOBILE_DEBUG] User returned from redirect:', result.user.displayName);
          console.log('🔄 [MOBILE_DEBUG] Processing redirect result for:', result.user.email);
          console.log('📊 [MOBILE_DEBUG] Redirect result details:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified,
            currentPath: window.location.pathname,
            providerId: result.providerId || 'unknown',
            operationType: result.operationType || 'unknown',
            credential: result.credential ? 'present' : 'null'
          });
        } else {
          console.log('❌ [MOBILE_DEBUG] No redirect result found');
          console.log('📊 [MOBILE_DEBUG] Redirect result was:', result);
          console.log('🔍 [MOBILE_DEBUG] Result type:', typeof result);
          console.log('🔍 [MOBILE_DEBUG] Result null?:', result === null);
          console.log('🔍 [MOBILE_DEBUG] Result undefined?:', result === undefined);
          
          // Log current auth state even when no redirect result
          console.log('🔍 [MOBILE_DEBUG] Current auth.currentUser:', auth.currentUser?.email || 'null');
        }
        
        if (result && result.user) {
          
          if (!isUFEmail(result.user.email || '')) {
            console.log('❌ [MOBILE_DEBUG] Non-UF email from redirect, signing out');
            await firebaseSignOut(auth);
            console.log('❌ [MOBILE_DEBUG] User not authenticated, showing login again');
            alert('Please use your @ufl.edu email address to sign in.');
            throw new Error('Please use your @ufl.edu email address');
          } else {
            console.log('✅ [MOBILE_DEBUG] Auth successful:', result.user.email);
            console.log('✅ [MOBILE_DEBUG] UF email validation passed, user should be logged in');
          }
        } else {
          console.log('ℹ️ [MOBILE_DEBUG] No redirect result found');
          console.log('🔍 [MOBILE_DEBUG] Current auth.currentUser:', auth.currentUser?.email || 'none');
        }
      } catch (error) {
        console.error('💥 [AUTH_INIT] Redirect result error:', error);
      }
      
      // Set up auth state listener
      console.log('👂 [AUTH_INIT] Setting up auth state listener');
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('🔥 [AUTH_STATE] Auth state changed:', {
          hasUser: !!user,
          email: user?.email || 'null',
          uid: user?.uid || 'null',
          emailVerified: user?.emailVerified || false
        });
        
        if (user && user.email && isUFEmail(user.email)) {
          console.log('✅ [AUTH_STATE] Valid UF user detected, setting current user');
          setCurrentUser(user);
          
          // Handle redirects for authenticated users
          const currentPath = window.location.pathname;
          console.log('🧭 [AUTH_STATE] Current path:', currentPath);
          
          if (currentPath === '/login' || currentPath === '/') {
            console.log('🔀 [AUTH_STATE] Redirecting authenticated user to profile');
            setTimeout(() => {
              window.location.replace('/profile');
            }, 100);
          }
        } else if (user && user.email && !isUFEmail(user.email)) {
          console.log('❌ [AUTH_STATE] Non-UF email detected, signing out:', user.email);
          await firebaseSignOut(auth);
          setCurrentUser(null);
        } else {
          console.log('👤 [AUTH_STATE] No user or invalid user, setting to null');
          setCurrentUser(null);
        }
        
        console.log('⏳ [AUTH_STATE] Setting loading to false');
        setLoading(false);
      });

      console.log('✅ [AUTH_INIT] Auth initialization completed');
      return unsubscribe;
    };

    const unsubscribePromise = initializeAuth();
    
    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const signInWithGoogle = async (): Promise<void> => {
    console.log('🚀 [MOBILE_DEBUG] Login button clicked');
    console.log('📱 [MOBILE_DEBUG] Starting Google login redirect');
    console.log('🔍 [MOBILE_DEBUG] Current session:', document.cookie);
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Configure provider for UF domain restriction
    provider.setCustomParameters({
      'hd': 'ufl.edu',
      'prompt': 'select_account'
    });
    
    console.log('🔧 [MOBILE_DEBUG] Provider configured with UF domain restriction');
    console.log('📊 [MOBILE_DEBUG] Current auth state:', {
      user: auth.currentUser?.email || 'none',
      domain: window.location.hostname,
      pathname: window.location.pathname
    });
    
    // Detect Safari specifically
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('🍎 [SAFARI_DEBUG] Browser detection:', { isSafari, isMobile, userAgent: navigator.userAgent });
    
    try {
      if (isMobile || isSafari) {
        // Safari/Mobile specific handling - set session storage flag
        setSafariAuthState('pending', {
          timestamp: Date.now(),
          provider: 'google',
          returnUrl: window.location.pathname
        });
        console.log('🍎 [SAFARI_DEBUG] Set auth pending state');
        
        // Use redirect for mobile devices and Safari
        console.log('📱 [AUTH] Mobile/Safari device detected, using redirect authentication');
        console.log('🔄 [AUTH] Calling signInWithRedirect...');
        await signInWithRedirect(auth, provider);
        console.log('✅ [AUTH] signInWithRedirect completed (redirect initiated)');
        return;
      } else {
        // Use popup for desktop browsers
        console.log('💻 [AUTH] Desktop browser detected, using popup authentication');
        try {
          console.log('🪟 [AUTH] Calling signInWithPopup...');
          const result = await signInWithPopup(auth, provider);
          console.log('✅ [AUTH] signInWithPopup successful:', { email: result.user?.email, uid: result.user?.uid });
          
          if (result.user && result.user.email && !isUFEmail(result.user.email)) {
            console.log('❌ [AUTH] Non-UF email detected, signing out:', result.user.email);
            await firebaseSignOut(auth);
            throw new Error('Please use your @ufl.edu email address');
          }
          
          console.log('✅ [AUTH] UF email validation passed');
          return;
        } catch (popupError: any) {
          console.log('❌ [AUTH] Popup failed:', { code: popupError.code, message: popupError.message });
          
          // If popup fails on desktop, fall back to redirect
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request' ||
              popupError.code === 'auth/unauthorized-domain') {
            
            console.log('🔄 [AUTH] Popup failed, falling back to redirect');
            await signInWithRedirect(auth, provider);
            console.log('✅ [AUTH] Fallback redirect initiated');
            return;
          }
          throw popupError;
        }
      }
      
    } catch (error: any) {
      console.log('💥 [AUTH] Authentication error:', { code: error.code, message: error.message });
      
      // Handle specific authentication errors
      if (error.message?.includes('@ufl.edu')) {
        console.log('🏫 [AUTH] Re-throwing UF email error');
        throw error; // Re-throw UF email errors
      } else if (error.code === 'auth/network-request-failed') {
        console.log('🌐 [AUTH] Network error detected');
        throw new Error('Network connection failed. Please check your internet and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        console.log('🚫 [AUTH] Operation not allowed error');
        throw new Error('Google sign-in is not enabled. Please contact support.');
      } else {
        console.log('❓ [AUTH] Unknown authentication error');
        throw new Error('Authentication failed. Please refresh the page and try again.');
      }
    }
  };

  const value = {
    currentUser,
    loading,
    signOut,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}