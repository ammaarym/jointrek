import React from "react";
import { CarTaxiFront, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { FcGoogle } from "react-icons/fc";

// Type definitions
interface AuthModalProps {
  isOpen: boolean;
  initialView: "login" | "signup";
  onClose: () => void;
}

export default function AuthModal({ isOpen, initialView, onClose }: AuthModalProps) {
  const { signInWithGoogle } = useAuth();

  // Handle Google sign in - this is the only supported authentication method
  const handleGoogleSignIn = async () => {
    try {
      // Show informative toast before redirecting
      toast({
        title: "UF Email Authentication",
        description: "You'll be redirected to sign in with your UF email (@ufl.edu)",
        duration: 3000,
      });
      
      // Start the Google sign-in process with redirect
      await signInWithGoogle();
      
      // This part won't execute until after redirect cycle completes
      onClose();
    } catch (error) {
      console.log("Google sign-in process ended");
      
      // Error handling is done in the auth hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <div className="mb-6 text-center">
            <CarTaxiFront className="text-primary-orange text-4xl mx-auto" />
            <h2 className="text-2xl font-bold mt-4 dark:text-white">
              Welcome to Trek
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              UF Student Ride Sharing Platform
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-4">
              <p className="text-center text-sm text-orange-800 dark:text-orange-300">
                <strong>UF Students Only</strong><br/>
                Authentication restricted to @ufl.edu email addresses
              </p>
            </div>
            
            <Button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white dark:border-neutral-600 font-medium py-3 rounded-md transition h-12"
              onClick={handleGoogleSignIn}
            >
              <FcGoogle className="h-6 w-6" />
              <span>Sign in with Google</span>
            </Button>
            
            <div className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-4">
              By signing in, you agree to our <a href="#" className="text-primary-blue dark:text-primary-orange hover:underline">Terms of Service</a> and <a href="#" className="text-primary-blue dark:text-primary-orange hover:underline">Privacy Policy</a>
            </div>
            
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <p className="text-center text-sm text-blue-800 dark:text-blue-300">
                <strong>How it works:</strong> You'll be redirected to Google to sign in with your UF email account for secure authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}