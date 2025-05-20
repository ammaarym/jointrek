import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, ArrowLeft } from "lucide-react";

export default function Login() {
  const { currentUser, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();

  // If user is already logged in, redirect to find-rides
  useEffect(() => {
    if (currentUser) {
      navigate("/find-rides");
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
                d="M12 10.826L5.182 15.66 1.455 14.87V9.13l3.727-.79L12 13.174 18.818 8.34l3.727.79v5.74l-3.727.79L12 10.826z"
              />
              <path
                fill="#fff"
                d="M12 10.826v-2.348l6.818-4.835 3.727.79v5.739l-3.727.79L12 10.826z"
              />
              <path
                fill="#fff"
                d="M12 10.826v2.348l-6.818 4.835-3.727-.79v-5.739l3.727-.79L12 10.826z"
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

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="mb-4 text-center text-sm font-medium text-gray-500">
            Why Sign In With Google?
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Secure authentication for UF students only</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>No need to remember another password</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-green-500">✓</span>
              <span>Helps ensure you're riding with verified students</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}