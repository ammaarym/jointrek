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
      console.log('🚀 Starting Google sign-in process...');
      
      // Check if we're in mobile environment
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log('📱 Mobile device detected:', isMobile);
      
      if (isMobile) {
        // Use redirect for mobile devices to avoid popup issues
        console.log('📱 Using redirect authentication for mobile');
        await signInWithRedirect(auth, provider);
      } else {
        // Try popup for desktop
        console.log('🖥️ Using popup authentication for desktop');
        const result = await signInWithPopup(auth, provider);
        
        if (result.user && result.user.email) {
          console.log('✅ Popup authentication successful:', result.user.email);
          if (!isUFEmail(result.user.email)) {
            console.log('❌ Non-UF email detected, signing out');
            await firebaseSignOut(auth);
            throw new Error('Please use your @ufl.edu email address');
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request') {
        console.log('🔄 Popup blocked/cancelled, falling back to redirect');
        await signInWithRedirect(auth, provider);
      } else if (error.code === 'auth/network-request-failed') {
        console.log('🌐 Network error, retrying with redirect');
        await signInWithRedirect(auth, provider);
      } else {
        console.error('🚨 Unhandled authentication error:', error);
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