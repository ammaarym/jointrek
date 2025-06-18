import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect
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
    console.log("Setting up auth state listener");
    
    const handleAuthState = async (user: User | null) => {
      console.log("Auth state changed:", user?.email || "no user");
      
      // Always check for redirect result on app startup
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Processing redirect result for:", result.user.email);
          // The result.user will be processed below through the normal flow
        }
      } catch (error: any) {
        console.error("Error processing redirect result:", error);
        
        // Handle specific errors from redirect
        if (error.code === 'auth/account-selection-required') {
          console.log("User needs to select account");
        } else if (error.code === 'auth/popup-blocked') {
          console.log("Popup was blocked, but redirect should work");
        } else if (error.code === 'auth/unauthorized-domain') {
          console.error("Domain not authorized for authentication");
        }
      }
      
      if (user && user.email && isUFEmail(user.email)) {
        console.log("ALLOWING ACCESS - Contact info validated successfully");
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
            // Create new user
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
      } else if (user && user.email && !isUFEmail(user.email)) {
        // Non-UF email - sign out and show error
        console.log("BLOCKING ACCESS - Non-UF email detected:", user.email);
        await firebaseSignOut(auth);
        setCurrentUser(null);
        alert("Access restricted to University of Florida students only. Please use your @ufl.edu email address.");
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, handleAuthState);
    return unsubscribe;
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
      console.log("Starting Google sign-in with redirect - no popups");
      
      // Force clear all auth state
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // Ignore signout errors
      }
      
      // Clear all storage completely
      localStorage.clear();
      sessionStorage.clear();
      
      // Create a completely fresh provider instance
      const provider = new GoogleAuthProvider();
      
      // Force account selection and ensure redirect behavior
      provider.setCustomParameters({
        prompt: 'select_account consent',
        hd: 'ufl.edu',
        access_type: 'online',
        response_type: 'code',
        include_granted_scopes: 'false'
      });
      
      provider.addScope('email');
      provider.addScope('profile');
      
      // Force redirect - this will never open a popup
      console.log("Forcing browser redirect to Google");
      await signInWithRedirect(auth, provider);
      
    } catch (error: any) {
      console.error("Error starting redirect authentication:", error);
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