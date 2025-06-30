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
          if (!isUFEmail(result.user.email || '')) {
            await firebaseSignOut(auth);
            throw new Error('Please use your @ufl.edu email address');
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

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Configure provider for production environment
    provider.setCustomParameters({
      'hd': 'ufl.edu',
      'prompt': 'select_account',
      'access_type': 'online'
    });
    
    try {
      console.log('Starting Google authentication...');
      
      // Always use redirect for production reliability
      console.log('Using redirect authentication for production stability');
      await signInWithRedirect(auth, provider);
      
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Handle authentication errors
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network connection failed. Please check your internet and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact support.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid credentials. Please try again.');
      } else {
        console.error('Unexpected authentication error:', error);
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