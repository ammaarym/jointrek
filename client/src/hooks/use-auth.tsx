import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isUFEmail: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    // Create a mock user for testing
    const mockUser = {
      uid: "test-user-123",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: "https://randomuser.me/api/portraits/men/1.jpg",
      emailVerified: true
    } as User;
    
    // Return a mock context with a current user for testing
    return {
      currentUser: mockUser,
      loading: false,
      signUp: async () => {},
      signIn: async () => {},
      signOut: async () => {},
      isUFEmail: () => true
    };
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
    // For testing purposes - allow any email
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`
      });
      
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
    signOut,
    isUFEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
