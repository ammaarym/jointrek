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
      setLoading(true);
      
      try {
        // Check for redirect result first
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('🔄 Processing redirect result for:', result.user.email);
          if (!isUFEmail(result.user.email || '')) {
            console.log('❌ Non-UF email from redirect, signing out');
            await firebaseSignOut(auth);
            alert('Please use your @ufl.edu email address to sign in.');
            throw new Error('Please use your @ufl.edu email address');
          } else {
            console.log('✅ Redirect authentication successful for:', result.user.email);
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
      
      // Set up auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user && user.email && isUFEmail(user.email)) {
          setCurrentUser(user);
          
          // Handle redirects for authenticated users
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/') {
            setTimeout(() => {
              window.location.replace('/profile');
            }, 100);
          }
        } else if (user && user.email && !isUFEmail(user.email)) {
          await firebaseSignOut(auth);
          setCurrentUser(null);
        } else {
          setCurrentUser(null);
        }
        
        setLoading(false);
      });

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
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Configure provider for UF domain restriction
    provider.setCustomParameters({
      'hd': 'ufl.edu',
      'prompt': 'select_account'
    });
    
    // Detect if this is a mobile device
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      if (isMobile) {
        // Use redirect for mobile devices
        console.log('Mobile device detected, using redirect authentication');
        await signInWithRedirect(auth, provider);
        return;
      } else {
        // Use popup for desktop browsers
        console.log('Desktop browser detected, using popup authentication');
        try {
          const result = await signInWithPopup(auth, provider);
          if (result.user && result.user.email && !isUFEmail(result.user.email)) {
            await firebaseSignOut(auth);
            throw new Error('Please use your @ufl.edu email address');
          }
          return;
        } catch (popupError: any) {
          // If popup fails on desktop, fall back to redirect
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request') {
            
            console.log('Popup failed, falling back to redirect');
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupError;
        }
      }
      
    } catch (error: any) {
      // Handle specific authentication errors
      if (error.message?.includes('@ufl.edu')) {
        throw error; // Re-throw UF email errors
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network connection failed. Please check your internet and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact support.');
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