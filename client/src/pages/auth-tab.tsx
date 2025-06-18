import React, { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function AuthTab() {
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthentication = async () => {
      try {
        console.log("Auth tab: Checking for redirect result");
        
        // First check if there's a redirect result
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log("Auth tab: User authenticated successfully");
          // Send success message to parent window
          window.opener?.postMessage({
            type: 'AUTH_SUCCESS',
            user: result.user
          }, window.location.origin);
          
          // Close this tab
          setTimeout(() => {
            window.close();
          }, 1000);
          return;
        }
        
        // If no redirect result, start the authentication process
        console.log("Auth tab: Starting Google authentication");
        
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account',
          hd: 'ufl.edu'
        });
        provider.addScope('email');
        provider.addScope('profile');
        
        await signInWithRedirect(auth, provider);
        
      } catch (error: any) {
        console.error("Auth tab: Authentication error:", error);
        setError(error.message || "Authentication failed");
        setIsAuthenticating(false);
        
        // Send error message to parent window
        window.opener?.postMessage({
          type: 'AUTH_ERROR',
          error: error.message
        }, window.location.origin);
      }
    };

    handleAuthentication();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Auth tab: User signed in:", user.email);
        // Send success message to parent window
        window.opener?.postMessage({
          type: 'AUTH_SUCCESS',
          user: user
        }, window.location.origin);
        
        // Close this tab after a brief delay
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Trek Authentication
            </h1>
            <p className="text-gray-600 mt-2">
              Signing you in with Google...
            </p>
          </div>

          {isAuthenticating && !error && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-gray-600">Redirecting to Google...</span>
            </div>
          )}

          {error && (
            <Alert className="mt-4">
              <AlertDescription className="text-center text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 text-sm text-gray-500">
            <p>
              <span className="font-medium text-primary">Note:</span> You must use your @ufl.edu email
            </p>
            <p className="mt-1">
              Only University of Florida students can use Trek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}