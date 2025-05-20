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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
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

  // Sign in with Google - uses redirect method for better mobile experience
  const signInWithGoogle = async () => {
    try {
      // Inform the user about requirements
      toast({
        title: "Google Sign-In",
        description: "Please use your UF email address (@ufl.edu) to sign in.",
        duration: 5000,
      });
      
      // Use redirect method as recommended for mobile devices
      await signInWithRedirect(auth, googleProvider);
      
      // We won't reach here until after the redirect cycle completes
      return null;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      // Check for specific Firebase errors
      if (error.code === 'auth/configuration-not-found') {
        toast({
          title: "Authentication Error",
          description: "Google sign-in is not properly configured. Please use email/password instead.",
          variant: "destructive"
        });
      } else if (error.code !== 'auth/popup-closed-by-user' && error.message !== "Non-UF email used for sign-in") {
        toast({
          title: "Sign in failed",
          description: "There was a problem with Google sign-in. Please use email/password instead.",
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
        // Get the redirect result when user returns from Google auth
        const result = await getRedirectResult(auth);
        
        // If there's a result, user has completed Google sign-in
        if (result && result.user) {
          // Validate if the email is a UF email
          const email = result.user.email;
          if (email && !isUFEmail(email)) {
            // Sign the user out immediately
            await firebaseSignOut(auth);
            
            toast({
              title: "Access Denied",
              description: "Please use your UF email address (@ufl.edu) to sign in.",
              variant: "destructive"
            });
            
            throw new Error("Non-UF email used for sign-in");
          }
          
          // If we reach here, authentication was successful with a UF email
          
          // Create a user profile in Firestore if needed
          try {
            const userRef = doc(db, 'users', result.user.uid);
            const userSnapshot = await getDoc(userRef);
            
            if (!userSnapshot.exists()) {
              const userData = {
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
                photoURL: result.user.photoURL,
                createdAt: serverTimestamp(),
                rides: 0,
                rating: 5.0
              };
              
              await setDoc(userRef, userData);
            }
            
            toast({
              title: "Welcome to GatorLift!",
              description: "You have successfully signed in with your UF email.",
            });
          } catch (dbError) {
            console.log("Database error:", dbError);
            // Don't fail the auth if the database operation fails
          }
        }
      } catch (error: any) {
        console.error("Google redirect result error:", error);
        
        if (error.message !== "Non-UF email used for sign-in") {
          toast({
            title: "Authentication Error",
            description: error.message || "Failed to complete Google sign-in",
            variant: "destructive"
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
