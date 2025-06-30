import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

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
    // Enhanced authentication state management
    const initializeAuth = async () => {
      console.log('🔥 [AUTH_INIT] Starting authentication initialization');
      setLoading(true);
      
      try {
        // Check for redirect result first
        console.log('🔍 [AUTH_INIT] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('🔄 [AUTH_INIT] Processing redirect result for:', result.user.email);
          console.log('📊 [AUTH_INIT] Redirect result details:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            emailVerified: result.user.emailVerified
          });
          
          if (!isUFEmail(result.user.email || '')) {
            console.log('❌ [AUTH_INIT] Non-UF email from redirect, signing out');
            await firebaseSignOut(auth);
            alert('Please use your @ufl.edu email address to sign in.');
            throw new Error('Please use your @ufl.edu email address');
          } else {
            console.log('✅ [AUTH_INIT] Redirect authentication successful for:', result.user.email);
          }
        } else {
          console.log('ℹ️ [AUTH_INIT] No redirect result found');
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
    console.log('🚀 [AUTH] signInWithGoogle called');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Configure provider for UF domain restriction
    provider.setCustomParameters({
      'hd': 'ufl.edu',
      'prompt': 'select_account'
    });
    
    console.log('🔧 [AUTH] Provider configured with UF domain restriction');
    
    // Detect if this is a mobile device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('📱 [AUTH] Device detection:', { isMobile, userAgent: navigator.userAgent });
    
    try {
      if (isMobile) {
        // Use redirect for mobile devices
        console.log('📱 [AUTH] Mobile device detected, using redirect authentication');
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
              popupError.code === 'auth/cancelled-popup-request') {
            
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