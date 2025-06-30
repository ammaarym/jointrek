import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth-fixed";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const { currentUser, loading, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Navigate to profile once auth is complete and user is loaded
  useEffect(() => {
    if (!loading && currentUser && !hasRedirected) {
      console.log("[DEBUG] Login page: Authenticated user detected, redirecting to profile");
      console.log("[DEBUG] User email:", currentUser.email);
      console.log("[DEBUG] User UID:", currentUser.uid);
      setHasRedirected(true);
      
      // Use a small delay to ensure auth state is fully settled
      setTimeout(() => {
        console.log("[DEBUG] Executing redirect to /profile");
        window.location.replace('/profile');
      }, 100);
    }
  }, [currentUser, loading, hasRedirected]);

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is already authenticated, show loading and redirect
  if (currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      
      // Detect mobile device
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile, don't reset loading state since redirect will happen
        console.log('Starting mobile redirect authentication...');
      }
      
      await signInWithGoogle();
      
      // Only reset loading state if not mobile (since mobile redirects)
      if (!isMobile) {
        setIsSigningIn(false);
      }
      
    } catch (error: any) {
      setIsSigningIn(false);
      
      // Handle specific error cases with user-friendly messages
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request') {
        // User cancelled, just reset state
        return;
      } else if (error.code === 'auth/network-request-failed') {
        alert("Network error. Please check your connection and try again.");
      } else if (error.message?.includes('@ufl.edu')) {
        alert("Please use your @ufl.edu email address to sign in.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Popup was blocked. Redirecting to Google sign-in...");
      } else {
        alert("Authentication failed. Please refresh the page and try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        className="absolute left-4 top-4 flex items-center text-black"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <div className="w-full max-w-md space-y-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Trek</h2>
          <p className="mt-2 text-gray-600">
            Please sign in with your UF email to continue.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="flex w-full items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Redirecting to Google...</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="h-5 w-5"
                >
                  <path
                    fill="#fff"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032
                    s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2
                    C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </Button>
        </div>

        {isSigningIn && (
          <Alert className="mt-4">
            <AlertDescription className="text-center">
              Redirecting to Google for authentication...
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <span className="block font-medium text-primary">
              Note: You must use your @ufl.edu email
            </span>
            Only University of Florida students can use Trek.
          </p>
        </div>
      </div>
    </div>
  );
}