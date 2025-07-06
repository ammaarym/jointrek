import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';

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
    // Detect mobile browser
    const isMobileBrowser = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Initialize authentication with proper persistence
    const initializeAuth = async () => {
      console.log('🔥 [AUTH_INIT] Starting authentication initialization');
      console.log('📱 [AUTH_INIT] Mobile browser detected:', isMobileBrowser);
      setLoading(true);
      
      try {
        // Set persistence to browserLocalPersistence for mobile compatibility
        console.log('🔐 [AUTH_INIT] Setting Firebase persistence to browserLocalPersistence');
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ [AUTH_INIT] Firebase persistence set successfully');
        
        // Check for redirect result (important for mobile)
        console.log('🔍 [AUTH_INIT] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          console.log('✅ [AUTH_INIT] User returned from redirect:', result.user.email);
          if (!isUFEmail(result.user.email || '')) {
            console.log('❌ [AUTH_INIT] Non-UF email, signing out');
            await firebaseSignOut(auth);
            alert('Please use your @ufl.edu email address to sign in.');
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
        await new Promise(resolve => setTimeout(resolve, isMobileBrowser ? 200 : 50));
        
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
          
          // Simplified redirect logic for mobile browsers
          const isRedirectInProgress = sessionStorage.getItem('auth_redirect_in_progress');
          const isMobileBrowser = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if ((currentPath === '/login' || currentPath === '/') && !isRedirectInProgress) {
            console.log('🔀 [AUTH_STATE] Redirecting authenticated user to profile');
            sessionStorage.setItem('auth_redirect_in_progress', 'true');
            
            if (isMobileBrowser) {
              // For mobile browsers, wait a bit for state to settle then redirect
              setTimeout(() => {
                sessionStorage.removeItem('auth_redirect_in_progress');
                window.location.href = '/profile';
              }, 500);
            } else {
              // Delayed redirect for desktop browsers
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
      // Set persistence before any sign-in attempt
      console.log('🔐 [AUTH] Setting Firebase persistence before sign in');
      await setPersistence(auth, browserLocalPersistence);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        'hd': 'ufl.edu',
        'prompt': 'select_account'
      });
      
      if (isMobileBrowser) {
        // Mobile: Always use redirect
        console.log('📱 [MOBILE_AUTH] Using redirect authentication');
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}