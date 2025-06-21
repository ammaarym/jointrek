import {
  createContext, useContext, useState, useEffect, ReactNode
} from 'react';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);

// Helper function to check UF email domain
const isUFEmail = (email: string): boolean => {
  return email.endsWith('@ufl.edu');
};

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('[AUTH] Setting session persistence...');
        await setPersistence(auth, browserSessionPersistence);
        console.log('[AUTH] ✅ Session persistence configured');

        console.log('[AUTH] Checking redirect result...');
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('[AUTH] 🎉 Redirect result user found:', result.user.email);
          console.log('[AUTH] User UID:', result.user.uid);
          console.log('[AUTH] Email verified:', result.user.emailVerified);
          
          // Verify UF email domain
          if (!result.user.email || !isUFEmail(result.user.email)) {
            console.log('[AUTH] ❌ BLOCKING - Non-UF email:', result.user.email || 'no email');
            await firebaseSignOut(auth);
            alert('Access restricted to University of Florida students only. Please use your @ufl.edu email address.');
            setLoading(false);
            return;
          }
          
          console.log('[AUTH] ✅ UF email verified, setting user state');
          setCurrentUser(result.user);
          
          // Sync with PostgreSQL
          try {
            const userData = {
              firebaseUid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName || "Anonymous User",
              photoUrl: result.user.photoURL,
              emailVerified: result.user.emailVerified
            };

            console.log('[AUTH] 🔄 Syncing user with PostgreSQL...');
            const response = await fetch(`/api/users/firebase/${result.user.uid}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
              console.log('[AUTH] ✅ User already exists in PostgreSQL');
            } else if (response.status === 404) {
              await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
              });
              console.log('[AUTH] ✅ Created new user in PostgreSQL');
            }
          } catch (error) {
            console.error('[AUTH] ❌ Error syncing user with PostgreSQL:', error);
          }
          
          setLoading(false);
          return;
        }

        console.log('[AUTH] No redirect result found, setting up auth state listener...');
        onAuthStateChanged(auth, async (user) => {
          console.log('[AUTH] Auth state changed - user:', user?.email || 'none');
          console.log('[AUTH] User UID:', user?.uid || 'none');
          console.log('[AUTH] Email verified:', user?.emailVerified || 'none');
          
          if (user) {
            // Verify UF email domain
            if (!user.email || !isUFEmail(user.email)) {
              console.log('[AUTH] ❌ BLOCKING - Non-UF email:', user.email || 'no email');
              await firebaseSignOut(auth);
              alert('Access restricted to University of Florida students only. Please use your @ufl.edu email address.');
              setCurrentUser(null);
              setLoading(false);
              return;
            }
            
            console.log('[AUTH] ✅ UF email verified');
            setCurrentUser(user);
            
            // Check if we need to redirect authenticated users
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/') {
              console.log('[AUTH] 🚀 Redirecting authenticated user to profile');
              setTimeout(() => {
                window.location.replace('/profile');
              }, 100);
            }
          } else {
            console.log('[AUTH] No authenticated user found');
            setCurrentUser(null);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error('[AUTH] ❌ Init error:', err);
        setLoading(false);
      }
    };

    init();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    console.log('[AUTH] Device detection - Mobile:', isMobile);
    console.log('[AUTH] User agent:', navigator.userAgent);

    try {
      if (isMobile) {
        console.log('[AUTH] 📱 Mobile device detected → using redirect');
        // Store flag for mobile redirect tracking
        localStorage.setItem('trek_mobile_auth_redirect', 'true');
        localStorage.setItem('trek_mobile_auth_timestamp', Date.now().toString());
        await signInWithRedirect(auth, provider);
      } else {
        console.log('[AUTH] 💻 Desktop device detected → using popup');
        const result = await signInWithPopup(auth, provider);
        console.log('[AUTH] 🎉 Popup sign-in successful - user:', result.user.email);
        
        // Verify UF email domain
        if (!result.user.email || !isUFEmail(result.user.email)) {
          console.log('[AUTH] ❌ BLOCKING - Non-UF email:', result.user.email || 'no email');
          await firebaseSignOut(auth);
          alert('Access restricted to University of Florida students only. Please use your @ufl.edu email address.');
          return;
        }
        
        setCurrentUser(result.user);
      }
    } catch (err: any) {
      console.error('[AUTH] ❌ Sign-in error:', err);
      console.error('[AUTH] Error code:', err.code);
      console.error('[AUTH] Error message:', err.message);
      
      // Handle popup blocked - fallback to redirect
      if (err.code === 'auth/popup-blocked') {
        console.log('[AUTH] 🔄 Popup blocked, using redirect fallback');
        await signInWithRedirect(auth, provider);
      } else if (err.code === 'auth/popup-closed-by-user') {
        console.log('[AUTH] ℹ️ User cancelled authentication');
        // Don't throw error for user cancellation
      } else {
        throw err;
      }
    }
  };

  const signOut = async () => {
    console.log('[AUTH] 🚪 Signing out user');
    await firebaseSignOut(auth);
    setCurrentUser(null);
    // Clear any stored auth flags
    localStorage.removeItem('trek_mobile_auth_redirect');
    localStorage.removeItem('trek_mobile_auth_timestamp');
    console.log('[AUTH] ✅ Sign out complete');
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};