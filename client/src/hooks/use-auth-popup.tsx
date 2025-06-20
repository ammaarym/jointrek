import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from 'firebase/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isUFEmail = (email: string): boolean => {
  return email.endsWith('@ufl.edu');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("🚀 [POPUP AUTH] Initializing popup-only authentication...");
    
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        // Set local persistence for popup authentication
        await setPersistence(auth, browserLocalPersistence);
        console.log("✅ [POPUP AUTH] Local persistence configured");

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
          console.log("🔄 [POPUP AUTH] Auth state changed:", user?.email || "no user");
          
          if (user && user.email) {
            if (isUFEmail(user.email)) {
              console.log("✅ [POPUP AUTH] Valid UF user:", user.email);
              setCurrentUser(user);
              
              // Auto-redirect authenticated users from login/home pages
              const currentPath = window.location.pathname;
              if (currentPath === '/login' || currentPath === '/') {
                console.log("🚀 [POPUP AUTH] Redirecting to profile");
                setTimeout(() => {
                  window.location.replace('/profile');
                }, 100);
              }
              
              // Sync user with backend
              try {
                const response = await fetch('/api/sync-user', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user.getIdToken()}`
                  },
                  body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: user.displayName || user.email.split('@')[0],
                    photoUrl: user.photoURL
                  })
                });

                if (response.ok) {
                  console.log("✅ [POPUP AUTH] User synced with backend");
                } else {
                  console.warn("⚠️ [POPUP AUTH] Failed to sync user with backend");
                }
              } catch (error) {
                console.warn("⚠️ [POPUP AUTH] Backend sync error:", error);
              }
            } else {
              console.log("❌ [POPUP AUTH] Non-UF email, signing out:", user.email);
              await firebaseSignOut(auth);
              alert("Access restricted to University of Florida students only. Please use your @ufl.edu email address.");
            }
          } else {
            console.log("🚪 [POPUP AUTH] No authenticated user");
            setCurrentUser(null);
          }
          
          setLoading(false);
        });

      } catch (error) {
        console.error("❌ [POPUP AUTH] Initialization error:", error);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      console.log("🚀 [POPUP AUTH] Starting Google popup authentication...");
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'ufl.edu'
      });
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log("🔄 [POPUP AUTH] Opening popup...");
      const result = await signInWithPopup(auth, provider);
      
      if (result?.user) {
        console.log("✅ [POPUP AUTH] Popup authentication successful:", result.user.email);
      } else {
        console.log("⚠️ [POPUP AUTH] No user returned from popup");
      }
      
    } catch (error: any) {
      console.error("❌ [POPUP AUTH] Authentication error:", error);
      
      if (error.code === 'auth/popup-blocked') {
        alert("Popup was blocked. Please allow popups for this site and try again.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("ℹ️ [POPUP AUTH] User closed popup");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Authentication failed: This domain is not authorized. Please contact support.");
      } else {
        alert("Authentication failed. Please try again.");
      }
      
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log("🚪 [POPUP AUTH] Signing out...");
      
      // Clear React Query cache
      queryClient.clear();
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Clear local state
      setCurrentUser(null);
      
      console.log("✅ [POPUP AUTH] Sign out complete");
      
      // Redirect to login
      window.location.replace('/login');
    } catch (error) {
      console.error("❌ [POPUP AUTH] Sign out error:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// User data query hook
export function useUser() {
  const { currentUser } = useAuth();
  
  return useQuery({
    queryKey: ['/api/user'],
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}