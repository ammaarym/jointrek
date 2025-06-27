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
  
    
    // Check for redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
  
          if (!isUFEmail(result.user.email || '')) {
            firebaseSignOut(auth);
            throw new Error('Please use your @ufl.edu email address');
          }
        }
      })
      .catch((error) => {

      });
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 User detected:', user);
      if (user && user.email && isUFEmail(user.email)) {
        setCurrentUser(user);
        setLoading(false);
        
        // Handle redirects for authenticated users
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/') {
          setTimeout(() => {
            window.location.replace('/profile');
          }, 100);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Configure provider to only allow UF domain
    provider.setCustomParameters({
      'hd': 'ufl.edu', // Hosted domain - restricts to UF emails only
      'prompt': 'select_account'
    });
    
    try {
      // Try popup first, fallback to redirect if blocked
      const result = await signInWithPopup(auth, provider);
      if (result.user && result.user.email && !isUFEmail(result.user.email)) {
        await firebaseSignOut(auth);
        throw new Error('Please use your @ufl.edu email address');
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        // Fallback to redirect for mobile/blocked popups
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
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