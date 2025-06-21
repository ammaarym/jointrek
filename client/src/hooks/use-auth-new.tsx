import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User } from 'firebase/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { replitAuthManager } from '../lib/replit-auth-manager';
import { replitFirebaseManager } from '../lib/replit-firebase-fix';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: (forceRedirect?: boolean) => Promise<void>;
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
    console.log("🔥 [AUTH DEBUG] Setting up Firebase authentication");
    console.log("🔥 [AUTH DEBUG] Current URL:", window.location.href);
    console.log("🔥 [AUTH DEBUG] Current pathname:", window.location.pathname);
    console.log("🔥 [AUTH DEBUG] Initial loading state:", loading);
    console.log("🔥 [AUTH DEBUG] Initial currentUser:", currentUser?.email || "null");
    
    let unsubscribe: (() => void) | null = null;
    let redirectProcessed = false;
    
    const initAuth = async () => {
      try {
        console.log("🔥 [AUTH DEBUG] Starting auth initialization...");
        
        // Set persistence before any auth operations
        console.log("🔥 [AUTH DEBUG] Setting session persistence...");
        await setPersistence(auth, browserSessionPersistence);
        console.log("✅ [AUTH DEBUG] Session persistence configured successfully");
        
        // Check for mobile redirect flag and auth state backup
        console.log("🔥 [AUTH DEBUG] Checking for stored auth state...");
        const mobileRedirectFlag = localStorage.getItem('trek_mobile_auth_redirect');
        const mobileRedirectTime = localStorage.getItem('trek_mobile_auth_timestamp');
        const isMobileRedirectRecent = mobileRedirectTime && (Date.now() - parseInt(mobileRedirectTime)) < 30000; // 30 seconds
        
        console.log("📱 [AUTH DEBUG] Mobile redirect flag:", mobileRedirectFlag);
        console.log("📱 [AUTH DEBUG] Mobile redirect recent:", isMobileRedirectRecent);
        
        const shouldBeAuthenticated = replitAuthManager.shouldUserBeAuthenticated();
        console.log("🔥 [AUTH DEBUG] Should user be authenticated?", shouldBeAuthenticated);
        
        if (shouldBeAuthenticated && !auth.currentUser) {
          console.log("🔥 [AUTH DEBUG] Auth state expected but missing, waiting for restoration...");
          const restoredUser = await replitAuthManager.waitForAuthRestoration(2000);
          if (restoredUser) {
            console.log("✅ [AUTH DEBUG] Auth state restored successfully for:", restoredUser.email);
          } else {
            console.log("⚠️ [AUTH DEBUG] Auth restoration timeout, clearing stale backup");
            replitAuthManager.clearAuthState();
          }
        }
        
        // Use enhanced Firebase manager for redirect handling
        console.log("🔥 [AUTH DEBUG] Using enhanced redirect handling...");
        const redirectUser = await replitFirebaseManager.handleRedirectResult();
        
        if (redirectUser) {
          console.log("🎉 [AUTH DEBUG] SUCCESS: Enhanced redirect authentication completed!");
          console.log("🔥 [AUTH DEBUG] Redirect user email:", redirectUser.email);
          console.log("🔥 [AUTH DEBUG] Redirect user UID:", redirectUser.uid);
          console.log("🔥 [AUTH DEBUG] Redirect user verified:", redirectUser.emailVerified);
          redirectProcessed = true;
          
          // Clear mobile redirect flags
          localStorage.removeItem('trek_mobile_auth_redirect');
          localStorage.removeItem('trek_mobile_auth_timestamp');
          console.log("📱 [AUTH DEBUG] Cleared mobile redirect flags");
          
          // Verify UF email domain immediately
          if (!redirectUser.email || !isUFEmail(redirectUser.email)) {
            console.log("❌ [AUTH DEBUG] BLOCKING - Non-UF email from redirect:", redirectUser.email || "no email");
            await firebaseSignOut(auth);
            alert("Access restricted to University of Florida students only. Please use your @ufl.edu email address.");
            setLoading(false);
            return;
          }
          
          console.log("✅ [AUTH DEBUG] UF email verified, setting user state");
          
          // Store auth state for persistence BEFORE setting user
          replitAuthManager.storeAuthState(redirectUser);
          console.log("📱 [AUTH DEBUG] Stored auth state for redirect user");
          
          // Sync user with PostgreSQL before setting state
          try {
            const userData = {
              firebaseUid: redirectUser.uid,
              email: redirectUser.email,
              displayName: redirectUser.displayName || "Anonymous User",
              photoUrl: redirectUser.photoURL,
              emailVerified: redirectUser.emailVerified
            };

            console.log("📱 [AUTH DEBUG] Syncing user with PostgreSQL...");
            const response = await fetch(`/api/users/firebase/${redirectUser.uid}`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
              console.log("✅ [AUTH DEBUG] User already exists in PostgreSQL");
            } else if (response.status === 404) {
              await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
              });
              console.log("✅ [AUTH DEBUG] Created new user in PostgreSQL");
            }
          } catch (error) {
            console.error("❌ [AUTH DEBUG] Error syncing user with PostgreSQL:", error);
          }
          
          // Set user state
          setCurrentUser(redirectUser);
          setLoading(false);
          console.log("🔥 [AUTH DEBUG] User state set, preparing redirect to profile");
          console.log("🔥 [AUTH DEBUG] Current pathname before redirect:", window.location.pathname);
          
          setTimeout(() => {
            console.log("🚀 [AUTH DEBUG] Executing redirect to /profile");
            window.location.replace('/profile');
          }, 500); // Longer delay to ensure state is set
          return;
        } else {
          console.log("🔥 [AUTH DEBUG] No redirect result found - checking existing auth state");
          console.log("🔥 [AUTH DEBUG] Auth current user after enhanced handling:", auth.currentUser?.email || "null");
        }
        
        // Set up auth state listener only after redirect check
        console.log("🔥 [AUTH DEBUG] Setting up onAuthStateChanged listener");
        unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
          console.log("🔥 [AUTH DEBUG] ===== AUTH STATE CHANGED =====");
          console.log("🔥 [AUTH DEBUG] User object:", user ? "exists" : "null");
          console.log("🔥 [AUTH DEBUG] User email:", user?.email || "no email");
          console.log("🔥 [AUTH DEBUG] User UID:", user?.uid || "no uid");
          console.log("🔥 [AUTH DEBUG] User verified:", user?.emailVerified || "not verified");
          console.log("🔥 [AUTH DEBUG] Current pathname:", window.location.pathname);
          console.log("🔥 [AUTH DEBUG] Redirect processed flag:", redirectProcessed);
          
          if (user && user.email) {
            console.log("🔥 [AUTH DEBUG] User has email, checking UF domain...");
            if (isUFEmail(user.email)) {
              console.log("✅ [AUTH DEBUG] ALLOWING ACCESS - Valid UF email:", user.email);
              console.log("🔥 [AUTH DEBUG] Setting currentUser state...");
              setCurrentUser(user);
              console.log("✅ [AUTH DEBUG] CurrentUser state set");
              
              // Store auth backup for Replit persistence
              replitAuthManager.storeAuthState(user);
              
              // Only redirect from login/home pages, not if already on profile
              const currentPath = window.location.pathname;
              console.log("🔥 [AUTH DEBUG] Current path for redirect check:", currentPath);
              console.log("🔥 [AUTH DEBUG] Should redirect?", !redirectProcessed && (currentPath === '/login' || currentPath === '/'));
              
              if (!redirectProcessed && (currentPath === '/login' || currentPath === '/')) {
                console.log("🚀 [AUTH DEBUG] Redirecting authenticated user from", currentPath, "to profile");
                setTimeout(() => {
                  console.log("🚀 [AUTH DEBUG] Executing delayed redirect to /profile");
                  window.location.replace('/profile');
                }, 100);
                return;
              } else {
                console.log("🔥 [AUTH DEBUG] No redirect needed - already on correct page or redirect already processed");
              }
              
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
            console.log("No authenticated user found");
            setCurrentUser(null);
          }
          
          setLoading(false);
        });
        
      } catch (error) {
        console.error("Error in auth initialization:", error);
        setLoading(false);
      }
    };

    initAuth();

    // Proper cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const isUFEmail = (email: string): boolean => {
    return email.endsWith('@ufl.edu');
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log("🚪 [SIGNOUT DEBUG] ===== STARTING COMPLETE SIGN OUT =====");
      console.log("🚪 [SIGNOUT DEBUG] Current user before signout:", auth.currentUser?.email || "null");
      console.log("🚪 [SIGNOUT DEBUG] Current URL:", window.location.href);
      
      // Clear Firebase auth state
      console.log("🚪 [SIGNOUT DEBUG] Calling Firebase signOut...");
      await firebaseSignOut(auth);
      console.log("✅ [SIGNOUT DEBUG] Firebase signOut completed");
      
      // Clear Replit-specific auth storage
      console.log("🚪 [SIGNOUT DEBUG] Clearing Replit auth storage...");
      replitAuthManager.clearAuthState();
      console.log("✅ [SIGNOUT DEBUG] Replit auth storage cleared");
      
      // Clear React Query cache
      console.log("🚪 [SIGNOUT DEBUG] Clearing React Query cache...");
      queryClient.clear();
      console.log("✅ [SIGNOUT DEBUG] React Query cache cleared");
      
      // Clear local state
      console.log("🚪 [SIGNOUT DEBUG] Clearing local user state...");
      setCurrentUser(null);
      console.log("✅ [SIGNOUT DEBUG] Local user state cleared");
      
      // Clear any Firebase-related localStorage items
      console.log("🚪 [SIGNOUT DEBUG] Clearing Firebase localStorage items...");
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase')) {
          console.log("🚪 [SIGNOUT DEBUG] Removing localStorage key:", key);
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage as well
      console.log("🚪 [SIGNOUT DEBUG] Clearing Firebase sessionStorage items...");
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('firebase:') || key.includes('firebase')) {
          console.log("🚪 [SIGNOUT DEBUG] Removing sessionStorage key:", key);
          sessionStorage.removeItem(key);
        }
      });
      
      console.log("🚪 [SIGNOUT DEBUG] All cleanup completed, preparing redirect to home");
      console.log("🚪 [SIGNOUT DEBUG] Auth current user after cleanup:", auth.currentUser?.email || "null");
      
      // Force redirect to home page after sign out
      setTimeout(() => {
        console.log("🚀 [SIGNOUT DEBUG] Executing redirect to home page");
        window.location.replace('/');
      }, 100);
    } catch (error: any) {
      console.error("❌ [SIGNOUT DEBUG] Error signing out:", error);
      console.log("❌ [SIGNOUT DEBUG] Error details:", error?.code, error?.message);
      throw error;
    }
  };

  const signInWithGoogle = async (forceRedirect: boolean = false): Promise<void> => {
    try {
      console.log("[DEBUG] Sign-in button clicked");
      console.log("[DEBUG] Force redirect:", forceRedirect);
      
      // Configure provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'ufl.edu'
      });
      provider.addScope('email');
      provider.addScope('profile');
      
      // Mobile device detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const useRedirect = forceRedirect || isMobile;
      
      if (useRedirect) {
        console.log("[DEBUG] Mobile device detected — using redirect");
        console.log("[DEBUG] Setting mobile redirect flag for persistence");
        
        // Store a flag to indicate mobile redirect is in progress
        localStorage.setItem('trek_mobile_auth_redirect', 'true');
        localStorage.setItem('trek_mobile_auth_timestamp', Date.now().toString());
        
        await signInWithRedirect(auth, provider);
        return; // Redirect will complete on page reload
      }
      
      console.log("[DEBUG] Desktop device detected — using popup");
      
      // Use Firebase popup for desktop
      const result = await signInWithPopup(auth, provider);
      
      if (result?.user) {
        console.log("[DEBUG] Popup sign-in successful:", result.user.email);
        
        // Verify UF email domain
        if (!result.user.email || !isUFEmail(result.user.email)) {
          console.log("❌ [SIGN IN] BLOCKING - Non-UF email:", result.user.email || "no email");
          await firebaseSignOut(auth);
          alert("Access restricted to University of Florida students only. Please use your @ufl.edu email address.");
          return;
        }
        
        console.log("✅ [SIGN IN] UF email verified, setting user state");
        
        // Store auth state immediately
        replitAuthManager.storeAuthState(result.user);
        setCurrentUser(result.user);
        
        // Redirect to profile page after successful authentication
        setTimeout(() => {
          console.log("🚀 [SIGN IN] Redirecting to profile page");
          window.location.replace('/profile');
        }, 100);
      } else {
        console.log("ℹ️ [SIGN IN] No user returned from authentication");
      }
      
    } catch (error: any) {
      console.error("[ERROR] Authentication error:", error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-blocked') {
        console.log("[DEBUG] Popup blocked - trying redirect as fallback");
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error("[ERROR] Redirect sign-in error:", redirectError);
          alert("Authentication failed. Please try refreshing the page and trying again.");
        }
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log("[DEBUG] User cancelled authentication - popup closed");
        // Don't throw error for user cancellation, just return silently
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Authentication failed: This domain is not authorized. Please contact support.");
      } else {
        alert("Authentication failed. Please try again.");
        throw error;
      }
      
      // Only throw error if it's not a user cancellation
      if (error.code !== 'auth/popup-closed-by-user') {
        throw error;
      }
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