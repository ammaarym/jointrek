import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from 'firebase/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isUFEmail: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  signOut: async () => {},
  signInWithGoogle: async () => {},
  isUFEmail: () => false
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("Setting up Firebase authentication");
    
    // Handle redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          console.log("SUCCESS: Processing redirect result for:", result.user.email);
        }
      })
      .catch((error) => {
        console.error("Error processing redirect result:", error);
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      console.log("Auth state changed:", user?.email || "no user");
      
      if (user && user.email) {
        if (isUFEmail(user.email)) {
          console.log("ALLOWING ACCESS - Valid UF email:", user.email);
          setCurrentUser(user);
          
          // Sync user with PostgreSQL
          try {
            const userData = {
              firebaseUid: user.uid,
              email: user.email,
              displayName: user.displayName || "Anonymous User",
              photoUrl: user.photoURL,
              emailVerified: user.emailVerified
            };

            const response = await fetch(`/api/users/firebase/${user.uid}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
              console.log("User already exists in PostgreSQL");
            } else if (response.status === 404) {
              await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
              });
              console.log("Created new user in PostgreSQL");
            }
          } catch (error) {
            console.error("Error syncing user with PostgreSQL:", error);
          }
        } else {
          console.log("BLOCKING ACCESS - Invalid email domain:", user.email);
          await firebaseSignOut(auth);
          setCurrentUser(null);
          alert("Access restricted to University of Florida students only. Please use your @ufl.edu email address.");
        }
      } else {
        console.log("No authenticated user");
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isUFEmail = (email: string): boolean => {
    return email.endsWith('@ufl.edu');
  };

  const signOut = async (): Promise<void> => {
    try {
      // Clear Firebase auth state
      await firebaseSignOut(auth);
      
      // Clear React Query cache
      queryClient.clear();
      
      // Clear local state
      setCurrentUser(null);
      
      // Clear any Firebase-related localStorage items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage as well
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase')) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log("Complete sign out performed");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      console.log("Starting Google authentication with session persistence");
      
      // Set persistence to session before authentication
      await setPersistence(auth, browserSessionPersistence);
      console.log("Session persistence set successfully");
      
      // Create provider and redirect directly
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'ufl.edu'
      });
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log("Redirecting to Google authentication");
      await signInWithRedirect(auth, provider);
      
    } catch (error: any) {
      console.error("Authentication error:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signOut,
    signInWithGoogle,
    isUFEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};