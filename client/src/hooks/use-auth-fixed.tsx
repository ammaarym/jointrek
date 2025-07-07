import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { isMobileBrowser, setMobileAuthRedirect, checkMobileAuthTimeout, isReturningFromMobileAuth, clearAllAuthFlags } from '@/lib/mobile-auth-fix';
import { MobileAuthCircuitBreaker } from '@/lib/mobile-auth-circuit-breaker';
import { shouldPreventAutoRedirect, handleMobileAuthSuccess, setupMobileAuthForReplit } from '@/lib/mobile-auth-ultimate-fix';

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
  const [authInitialized, setAuthInitialized] = useState(false);

  const isUFEmail = (email: string): boolean => {
    return email.endsWith('@ufl.edu');
  };

  useEffect(() => {
    // Check for mobile auth timeout on component mount
    if (checkMobileAuthTimeout()) {
      console.log('📱 [MOBILE_AUTH] Mobile auth timeout detected, clearing state');
    }
    
    // Initialize mobile auth for Replit environment
    setupMobileAuthForReplit();
    
    // Initialize authentication with proper persistence
    const initializeAuth = async () => {
      console.log('🔥 [AUTH_INIT] Starting authentication initialization');
      console.log('📱 [AUTH_INIT] Mobile browser detected:', isMobileBrowser());
      setLoading(true);
      
      try {
        // Use different persistence for mobile vs desktop
        const persistenceType = isMobileBrowser() ? browserSessionPersistence : browserLocalPersistence;
        console.log('🔐 [AUTH_INIT] Setting Firebase persistence to:', isMobileBrowser() ? 'browserSessionPersistence' : 'browserLocalPersistence');
        await setPersistence(auth, persistenceType);
        console.log('✅ [AUTH_INIT] Firebase persistence set successfully');
        
        // Enhanced mobile redirect handling
        if (isMobileBrowser()) {
          console.log('📱 [MOBILE_AUTH] Mobile browser - checking redirect state...');
          
          // Check if we're returning from OAuth redirect by looking for auth parameters
          const urlParams = new URLSearchParams(window.location.search);
          const hasAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('authuser') || urlParams.has('scope');
          
          if (hasAuthParams) {
            console.log('📱 [MOBILE_AUTH] OAuth parameters detected in URL - processing redirect');
            // Clear URL parameters immediately to prevent redirect loops
            const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
          
          const mobileRedirectFlag = sessionStorage.getItem('mobile_auth_redirect');
          console.log('📱 [MOBILE_AUTH] Mobile redirect flag:', mobileRedirectFlag);
          
          // Clear stale redirect state if timeout occurred
          if (checkMobileAuthTimeout()) {
            console.log('📱 [MOBILE_AUTH] Mobile auth timeout detected, state cleared');
          }
          
          if (mobileRedirectFlag && hasAuthParams) {
            console.log('📱 [MOBILE_AUTH] Valid mobile redirect detected, processing...');
            // Wait for redirect to complete on mobile
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        // Check for redirect result
        console.log('🔍 [AUTH_INIT] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          console.log('✅ [AUTH_INIT] User returned from redirect:', result.user.email);
          if (!isUFEmail(result.user.email || '')) {
            console.log('❌ [AUTH_INIT] Non-UF email, signing out');
            await firebaseSignOut(auth);
            alert('Please use your @ufl.edu email address to sign in.');
          } else {
            console.log('✅ [AUTH_INIT] Valid UF email from redirect, user should be authenticated');
          }
        } else {
          console.log('ℹ️ [AUTH_INIT] No redirect result found');
        }
      } catch (error) {
        console.error('💥 [AUTH_INIT] Initialization error:', error);
      }
      
      // Set up auth state listener with mobile compatibility delay
      console.log('👂 [AUTH_INIT] Setting up auth state listener');
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        // Small delay to ensure state is properly settled (especially on mobile)
        await new Promise(resolve => setTimeout(resolve, isMobileBrowser() ? 200 : 50));
        
        console.log('🔥 [AUTH_STATE] Auth state changed:', {
          hasUser: !!user,
          email: user?.email || 'null',
          uid: user?.uid || 'null',
          emailVerified: user?.emailVerified || false,
          authInitialized: authInitialized
        });
        
        if (user && user.email && isUFEmail(user.email)) {
          console.log('✅ [AUTH_STATE] Valid UF user detected, setting current user');
          setCurrentUser(user);
          
          // Clear any redirect flags that might cause loops
          sessionStorage.removeItem('auth_redirect_in_progress');
          
          // Handle redirects for authenticated users - prevent redirect loops
          const currentPath = window.location.pathname;
          console.log('🧭 [AUTH_STATE] Current path:', currentPath);
          
          // Enhanced redirect logic with mobile loop prevention
          const isRedirectInProgress = sessionStorage.getItem('auth_redirect_in_progress');
          const mobileRedirectFlag = sessionStorage.getItem('mobile_auth_redirect');
          
          // Check if we already completed mobile auth successfully
          const mobileAuthCompleted = localStorage.getItem('mobile_auth_completed');
          
          if ((currentPath === '/login' || currentPath === '/') && !isRedirectInProgress) {
            // For mobile browsers in Replit, prevent auto-redirect to stop loops
            if (shouldPreventAutoRedirect()) {
              console.log('📱 [MOBILE_FIX] Preventing auto-redirect for mobile Replit - showing manual navigation');
              handleMobileAuthSuccess();
              return;
            }
            
            // Check circuit breaker first to prevent infinite loops
            if (!MobileAuthCircuitBreaker.shouldAllowRedirect()) {
              console.log('🚫 [AUTH_STATE] Circuit breaker blocked redirect - too many attempts');
              MobileAuthCircuitBreaker.forceReset();
              return;
            }
            
            console.log('🔀 [AUTH_STATE] Redirecting authenticated user to profile');
            MobileAuthCircuitBreaker.recordRedirectAttempt();
            
            // Prevent multiple redirects by setting a flag
            sessionStorage.setItem('auth_redirect_in_progress', 'true');
            
            if (isMobileBrowser() && (mobileRedirectFlag || mobileAuthCompleted)) {
              // Mobile user - immediate redirect and clear all flags
              console.log('📱 [MOBILE_AUTH] Mobile user authenticated, clearing all flags and redirecting');
              sessionStorage.removeItem('mobile_auth_redirect');
              sessionStorage.removeItem('auth_redirect_in_progress');
              localStorage.removeItem('mobile_auth_completed');
              MobileAuthCircuitBreaker.reset();
              
              // Force navigation to profile page
              window.location.replace('/profile');
            } else if (isMobileBrowser()) {
              // Mobile browser without redirect flags - standard redirect
              console.log('📱 [MOBILE_AUTH] Mobile user standard redirect');
              setTimeout(() => {
                sessionStorage.removeItem('auth_redirect_in_progress');
                window.location.replace('/profile');
              }, 300);
            } else {
              // Desktop browser - standard redirect
              setTimeout(() => {
                sessionStorage.removeItem('auth_redirect_in_progress');
                window.location.replace('/profile');
              }, 100);
            }
          }
        } else if (user && user.email && !isUFEmail(user.email)) {
          console.log('❌ [AUTH_STATE] Non-UF email detected, signing out:', user.email);
          await firebaseSignOut(auth);
          setCurrentUser(null);
        } else {
          console.log('👤 [AUTH_STATE] No user or invalid user, setting to null');
          setCurrentUser(null);
          
          // Clear mobile redirect flag if user is not authenticated
          sessionStorage.removeItem('mobile_auth_redirect');
        }
        
        console.log('⏳ [AUTH_STATE] Setting loading to false');
        setLoading(false);
        
        // Mark auth as initialized after first state change
        if (!authInitialized) {
          setAuthInitialized(true);
        }
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
    const isMobileBrowser = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('🚀 [AUTH] Starting Google sign in');
    console.log('📱 [AUTH] Mobile browser detected:', isMobileBrowser);
    
    try {
      // Set persistence before any sign-in attempt (different for mobile vs desktop)
      const persistenceType = isMobileBrowser ? browserSessionPersistence : browserLocalPersistence;
      console.log('🔐 [AUTH] Setting Firebase persistence before sign in:', isMobileBrowser ? 'browserSessionPersistence' : 'browserLocalPersistence');
      await setPersistence(auth, persistenceType);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        'hd': 'ufl.edu',
        'prompt': 'select_account'
      });
      
      if (isMobileBrowser()) {
        // Mobile: Set redirect flag and use redirect authentication
        console.log('📱 [MOBILE_AUTH] Setting mobile redirect flag and using redirect authentication');
        setMobileAuthRedirect();
        await signInWithRedirect(auth, provider);
      } else {
        // Desktop: Try popup, fallback to redirect
        console.log('🖥️ [DESKTOP_AUTH] Trying popup authentication');
        try {
          const result = await signInWithPopup(auth, provider);
          
          if (result.user && !isUFEmail(result.user.email || '')) {
            await firebaseSignOut(auth);
            throw new Error('Please use your @ufl.edu email address');
          }
        } catch (popupError: any) {
          console.log('⚠️ [DESKTOP_AUTH] Popup failed, using redirect');
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request' ||
              popupError.code === 'auth/unauthorized-domain') {
            await signInWithRedirect(auth, provider);
          } else {
            throw popupError;
          }
        }
      }
    } catch (error: any) {
      console.error('💥 [AUTH_ERROR] Sign in failed:', error);
      
      if (error.message?.includes('@ufl.edu')) {
        throw error;
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network connection failed. Please check your internet and try again.');
      } else {
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
    console.error('🚨 [AUTH] useAuth called outside AuthProvider context');
    // Return a safe default instead of throwing
    return {
      currentUser: null,
      loading: true,
      signOut: async () => {},
      signInWithGoogle: async () => {}
    };
  }
  return context;
}