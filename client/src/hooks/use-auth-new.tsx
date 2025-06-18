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
      console.log("Opening authentication in new tab");
      
      // Clear existing auth state
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // Ignore errors
      }
      
      // Store current location to return to after auth
      sessionStorage.setItem('pre_auth_location', window.location.pathname);
      
      // Open auth page in new tab
      const authTab = window.open('/auth-tab', '_blank', 'width=500,height=600,toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes');
      
      if (!authTab) {
        console.log("New tab blocked, using redirect");
        // Fallback to redirect if popup blocked
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account',
          hd: 'ufl.edu'
        });
        provider.addScope('email');
        provider.addScope('profile');
        await signInWithRedirect(auth, provider);
      } else {
        console.log("Auth tab opened successfully");
        
        // Listen for auth completion
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'AUTH_SUCCESS') {
            console.log("Authentication successful");
            authTab.close();
            window.removeEventListener('message', handleMessage);
            // Reload to update auth state
            window.location.reload();
          } else if (event.data.type === 'AUTH_ERROR') {
            console.error("Authentication failed:", event.data.error);
            authTab.close();
            window.removeEventListener('message', handleMessage);
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        // Clean up if tab is closed manually
        const checkClosed = setInterval(() => {
          if (authTab.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            console.log("Auth tab closed manually");
          }
        }, 1000);
      }
      
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