import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth-popup";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function Login() {
  const { currentUser, loading, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Navigate to profile once auth is complete and user is loaded
  useEffect(() => {
    if (!loading && currentUser) {
      console.log("Login page: Authenticated user detected, redirecting to profile");
      setTimeout(() => {
        window.location.replace('/profile');
      }, 100);
    }
  }, [currentUser, loading]);

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
      console.log("Starting Google popup sign-in...");
      
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trek</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {/* UF Restriction Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>UF Students Only:</strong> Access is restricted to University of Florida students with valid @ufl.edu email addresses.
            </p>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg flex items-center justify-center gap-3"
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Having trouble signing in?{' '}
              <button
                onClick={() => navigate('/help')}
                className="text-blue-600 hover:underline"
              >
                Get help
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}