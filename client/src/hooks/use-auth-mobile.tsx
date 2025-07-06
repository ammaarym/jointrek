import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';

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
  const [redirectChecked, setRedirectChecked] = useState(false);

  const isUFEmail = (email: string): boolean => {
    return email.endsWith('@ufl.edu');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 [MOBILE_AUTH] Initializing mobile auth');
      
      // Set persistence for mobile browsers
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.log('✅ [MOBILE_AUTH] Session persistence set');
      } catch (error) {
        console.warn('⚠️ [MOBILE_AUTH] Persistence setting failed:', error);
      }

      // Check for redirect result only once
      if (!redirectChecked) {
        try {
          console.log('🔍 [MOBILE_AUTH] Checking redirect result...');
          const result = await getRedirectResult(auth);
          
          if (result?.user) {
            console.log('✅ [MOBILE_AUTH] Redirect result found:', result.user.email);
            if (!isUFEmail(result.user.email || '')) {
              console.log('❌ [MOBILE_AUTH] Non-UF email, signing out');
              await firebaseSignOut(auth);
              alert('Please use your @ufl.edu email address to sign in.');
            }
          } else {
            console.log('ℹ️ [MOBILE_AUTH] No redirect result');
          }
        } catch (error) {
          console.error('❌ [MOBILE_AUTH] Redirect check error:', error);
        }
        
        setRedirectChecked(true);
      }

      // Set up simple auth state listener
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔥 [MOBILE_AUTH] Auth state changed:', {
          hasUser: !!user,
          email: user?.email || 'null'
        });

        if (user && user.email && isUFEmail(user.email)) {
          setCurrentUser(user);
          
          // Simple redirect logic without loops
          const path = window.location.pathname;
          if (path === '/login' || path === '/') {
            console.log('🔀 [MOBILE_AUTH] Redirecting to profile');
            window.location.href = '/profile';
          }
        } else if (user && user.email && !isUFEmail(user.email)) {
          console.log('❌ [MOBILE_AUTH] Invalid email domain');
          firebaseSignOut(auth);
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
  }, [redirectChecked]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('❌ [MOBILE_AUTH] Sign out error:', error);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      console.log('🚀 [MOBILE_AUTH] Starting Google sign in');
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        'hd': 'ufl.edu',
        'prompt': 'select_account'
      });

      // Always use redirect for mobile
      await signInWithRedirect(auth, provider);
      console.log('🔄 [MOBILE_AUTH] Redirect initiated');
      
    } catch (error) {
      console.error('❌ [MOBILE_AUTH] Sign in error:', error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signOut, signInWithGoogle }}>
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