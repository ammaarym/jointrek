import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isUFEmail = (email: string): boolean => {
    return email.endsWith('@ufl.edu');
  };

  useEffect(() => {
    console.log('[AUTH] Setting up listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[AUTH] State change - user:', user?.email || 'none');
      
      if (user && user.email && isUFEmail(user.email)) {
        console.log('[AUTH] Valid UF user');
        setCurrentUser(user);
        
        // Handle redirects for authenticated users
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/') {
          console.log('[AUTH] Redirecting to profile');
          setTimeout(() => {
            window.location.replace('/profile');
          }, 100);
        }
      } else {
        console.log('[AUTH] No valid user');
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

  const value = {
    currentUser,
    loading,
    signOut
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