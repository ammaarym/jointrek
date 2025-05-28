import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, ArrowLeft } from "lucide-react";

export default function Login() {
  const { currentUser, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();

  // If user is already logged in, redirect to profile
  useEffect(() => {
    if (currentUser) {
      navigate("/profile");
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      console.log("Attempting Google sign-in from login page");
      await signInWithGoogle();
      // Successful login with UF email will redirect to find-rides due to the useEffect above
    } catch (error) {
      console.error("Google sign-in error:", error);
      // Error handling done in useAuth hook
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
          <h2 className="text-3xl font-bold text-gray-900">Welcome to GatorLift</h2>
          <p className="mt-2 text-gray-600">
            Please sign in with your UF email to continue.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white py-6"
          >
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
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <span className="block font-medium text-orange-600">
              Note: You must use your @ufl.edu email
            </span>
            Only University of Florida students can use GatorLift.
          </p>
        </div>


      </div>
    </div>
  );
}