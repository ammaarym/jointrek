import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email);
      
      if (user && user.email && isUFEmail(user.email)) {
        // Check for redirect result
        console.log("Checking for redirect result...");
        try {
          const result = await getRedirectResult(auth);
          console.log("Redirect result received:", result ? "result found" : "no result");
          if (result) {
            console.log("Processing redirect result");
          } else {
            console.log("No redirect result found");
          }
        } catch (error) {
          console.error("Error getting redirect result:", error);
        }

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
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

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
      console.log("DEBUG: Starting comprehensive authentication cleanup");
      
      // First, check current auth state
      console.log("DEBUG: Current user before cleanup:", auth.currentUser?.email || "null");
      
      // Always sign out first to clear any cached credentials
      console.log("DEBUG: Signing out from Firebase");
      await firebaseSignOut(auth);
      
      // Verify sign out completed
      console.log("DEBUG: Current user after signOut:", auth.currentUser?.email || "null");
      
      // Clear all Firebase-related storage with debugging
      console.log("DEBUG: Clearing localStorage items");
      const localStorageItems = Object.keys(localStorage);
      console.log("DEBUG: localStorage keys before cleanup:", localStorageItems);
      localStorageItems.forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase') || key.includes('auth') || key.includes('google')) {
          console.log("DEBUG: Removing localStorage key:", key);
          localStorage.removeItem(key);
        }
      });
      
      console.log("DEBUG: Clearing sessionStorage items");
      const sessionStorageItems = Object.keys(sessionStorage);
      console.log("DEBUG: sessionStorage keys before cleanup:", sessionStorageItems);
      sessionStorageItems.forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase') || key.includes('auth') || key.includes('google')) {
          console.log("DEBUG: Removing sessionStorage key:", key);
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear any Google OAuth related cookies by setting them to expire
      console.log("DEBUG: Attempting to clear Google OAuth cookies");
      document.cookie = "oauth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.google.com";
      document.cookie = "oauth_code_verifier=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.google.com";
      document.cookie = "session_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.accounts.google.com";
      
      // Wait longer for cleanup to complete
      console.log("DEBUG: Waiting for cleanup to complete...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a completely fresh provider instance with maximum forcing
      console.log("DEBUG: Creating fresh GoogleAuthProvider");
      const freshProvider = new GoogleAuthProvider();
      freshProvider.setCustomParameters({
        prompt: 'select_account consent',
        hd: 'ufl.edu',
        access_type: 'online',
        include_granted_scopes: 'false',
        login_hint: '', // Clear any login hints
        authuser: '-1' // Force fresh authentication
      });
      freshProvider.addScope('email');
      freshProvider.addScope('profile');
      
      console.log("DEBUG: Provider configuration created");
      
      // Try popup-based authentication with enhanced error handling
      console.log("DEBUG: Attempting signInWithPopup with enhanced configuration");
      try {
        const result = await signInWithPopup(auth, freshProvider);
        console.log("DEBUG: Popup sign-in successful:", result.user.email);
        console.log("DEBUG: User UID:", result.user.uid);
      } catch (popupError: any) {
        console.log("DEBUG: Popup failed, trying alternative approach:", popupError.code);
        
        // If popup fails due to blocked popup or other issues, throw a helpful error
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          throw new Error("ACCOUNT_SWITCHING_ISSUE: To switch UFL accounts, the authentication system is automatically using cached credentials. Please follow these steps:\n\n1. Sign out from Trek completely\n2. Open a new private/incognito browser window\n3. Go to accounts.google.com and sign out of all accounts\n4. Go to login.ufl.edu and sign out\n5. Return to Trek in the private window and sign in with your desired UFL account\n\nThis ensures both Google and UF authentication systems don't use cached credentials.");
        }
        
        // For other errors, re-throw the original error
        throw popupError;
      }
      
    } catch (error: any) {
      console.error("DEBUG: Error signing in with Google:", error);
      console.error("DEBUG: Error code:", error.code);
      console.error("DEBUG: Error message:", error.message);
      console.error("DEBUG: Full error object:", error);
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