import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  isUFEmail: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email);
      
      // If user is logged in, sync with PostgreSQL database
      if (user) {
        try {
          // Import dynamically to avoid circular dependencies
          const { syncUserToPostgres } = await import('../lib/sync-user');
          await syncUserToPostgres(user);
        } catch (error) {
          console.error("Error syncing user to PostgreSQL:", error);
        }
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    // Check for redirect result on page load
    console.log("Checking for redirect result...");
    getRedirectResult(auth)
      .then((result) => {
        console.log("Redirect result received:", result ? result.user?.email : "no result");
        if (!result) {
          console.log("No redirect result found");
          return;
        }
        
        if (result.user?.email && !isUFEmail(result.user.email)) {
          console.log("Non-UF email detected from redirect:", result.user.email);
          firebaseSignOut(auth);
        }
      })
      .catch((error) => {
        console.error("Error getting redirect result:", error);
      });

    return () => unsubscribe();
  }, []);

  // Check if email is from UF domain
  const isUFEmail = (email: string) => {
    return email.endsWith("@ufl.edu");
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    // Validate UF email
    if (!isUFEmail(email)) {
      toast({
        title: "Registration Failed",
        description: "Please use your UF email address (@ufl.edu) to create an account.",
        variant: "destructive"
      });
      throw new Error("Please use a valid UF email address");
    }
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`
      });
      
      // Create a user profile in Firestore
      const userRef = doc(db, 'users', result.user.uid);
      const userData = {
        uid: result.user.uid,
        email: email,
        displayName: `${firstName} ${lastName}`,
        firstName: firstName,
        lastName: lastName,
        photoURL: "",
        createdAt: serverTimestamp(),
        rides: 0,
        rating: 5.0
      };
      
      await setDoc(userRef, userData);
      
      toast({
        title: "Account created",
        description: "You're now logged in to GatorLift!",
      });
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || "Failed to create account");
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    // Validate UF email
    if (!isUFEmail(email)) {
      toast({
        title: "Access Denied",
        description: "Please use your UF email address (@ufl.edu) to sign in.",
        variant: "destructive"
      });
      throw new Error("Please use a valid UF email address");
    }
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || "Failed to sign in");
    }
  };

  // Sign in with Google - uses popup method for better compatibility
  const signInWithGoogle = async () => {
    try {
      // Log auth state before signing in
      console.log("Starting Google sign-in process");
      console.log("Auth provider configuration:", googleProvider);
      console.log("Current auth state:", auth.currentUser);
      
      // Try using popup method for sign-in
      console.log("Attempting Google sign-in with popup");
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log("Google sign-in successful:", result.user);
      
      // Check if the email is from UF
      if (result.user.email && !isUFEmail(result.user.email)) {
        console.log("Non-UF email detected:", result.user.email);
        
        // Sign out the user immediately
        console.log("Signing out non-UF user");
        await firebaseSignOut(auth);
        
        // Make sure the state is updated to reflect signed out status
        setCurrentUser(null);
        
        throw new Error("Non-UF email used for sign-in");
      }
      
      console.log("UF email verification successful!");
      
      // Create user profile if needed
      console.log("Creating/updating user profile");
      const userRef = doc(db, 'users', result.user.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || "UF Student",
          photoURL: result.user.photoURL || "",
          createdAt: serverTimestamp(),
          rides: 0,
          rating: 5.0
        };
        
        await setDoc(userRef, userData);
      }
      
      toast({
        title: "Welcome to GatorLift!",
        description: "You have successfully signed in with your UF email.",
        duration: 5000
      });
      
      // Force state update
      setCurrentUser(result.user);
      
      return result;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      console.log("Error code:", error.code);
      console.log("Error message:", error.message);
      
      // Check for specific Firebase errors
      if (error.code === 'auth/configuration-not-found') {
        toast({
          title: "Authentication Error",
          description: "Google sign-in is not properly configured. Firebase configuration may be missing.",
          variant: "destructive"
        });
      } else if (error.code === 'auth/unauthorized-domain') {
        toast({
          title: "Domain Not Authorized",
          description: "This domain is not authorized in Firebase. Please add it to your Firebase console's authorized domains.",
          variant: "destructive"
        });
      } else if (error.code === 'auth/popup-blocked') {
        toast({
          title: "Popup Blocked",
          description: "The authentication popup was blocked by your browser. Please enable popups for this site.",
          variant: "destructive"
        });
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: "Authentication Cancelled",
          description: "You closed the Google sign-in window. Please try again.",
          variant: "destructive"
        });
      } else if (error.message !== "Non-UF email used for sign-in") {
        toast({
          title: "Sign in failed",
          description: error.message || "There was a problem with Google sign-in.",
          variant: "destructive"
        });
      }
      
      throw error;
    }
  };
  
  // Handle the redirect result when user returns from Google auth
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log("Checking for redirect result...");
        
        // Get the redirect result when user returns from Google auth
        const result = await getRedirectResult(auth);
        console.log("Redirect result received:", result ? "success" : "no result");
        
        // If there's a result, user has completed Google sign-in
        if (result && result.user) {
          console.log("User successfully signed in with Google");
          
          // Validate if the email is a UF email
          const email = result.user.email;
          console.log("Email domain check:", email);
          
          if (email && !isUFEmail(email)) {
            console.log("Non-UF email detected, signing out user");
            // Sign the user out immediately
            await firebaseSignOut(auth);
            
            toast({
              title: "Access Denied",
              description: "Please use your UF email address (@ufl.edu) to sign in.",
              variant: "destructive",
              duration: 5000
            });
            
            throw new Error("Non-UF email used for sign-in");
          }
          
          console.log("UF email confirmed, proceeding with account setup");
          
          // If we reach here, authentication was successful with a UF email
          // Create a user profile in Firestore if needed
          try {
            const userRef = doc(db, 'users', result.user.uid);
            const userSnapshot = await getDoc(userRef);
            
            if (!userSnapshot.exists()) {
              console.log("Creating new user profile in Firestore");
              
              const userData = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName || email?.split('@')[0] || "UF Student",
                photoURL: result.user.photoURL || "",
                createdAt: serverTimestamp(),
                rides: 0,
                rating: 5.0
              };
              
              await setDoc(userRef, userData);
            } else {
              console.log("Existing user profile found");
            }
            
            // Force a state update to ensure the UI reflects the authenticated state
            setCurrentUser(result.user);
            
            toast({
              title: "Welcome to GatorLift!",
              description: "You have successfully signed in with your UF email.",
              duration: 5000
            });
            
            // Navigate user back to home page
            window.location.href = '/';
          } catch (dbError) {
            console.error("Database error:", dbError);
            // Don't fail the auth if the database operation fails
            
            // Still show success message
            toast({
              title: "Welcome to GatorLift!",
              description: "You have successfully signed in with your UF email.",
              duration: 5000
            });
          }
        } else {
          console.log("No redirect result found");
        }
      } catch (error: any) {
        console.error("Google redirect result error:", error);
        
        if (error.message !== "Non-UF email used for sign-in") {
          toast({
            title: "Authentication Error",
            description: error.message || "Failed to complete Google sign-in",
            variant: "destructive",
            duration: 5000
          });
        }
      }
    };
    
    // Process the redirect result when component mounts
    handleRedirectResult();
  }, []);

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message || "Failed to sign out");
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isUFEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
