import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth-fixed";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import MobileAuthFixed from "@/components/mobile-auth-fixed";
import { getRedirectResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { 
  isMobileDevice, 
  authenticateMobilePersistent, 
  processRedirectResultPersistent,
  navigateToProfile
} from "@/lib/mobile-auth-persistent";
import trekLogo from "@assets/TREK (1)_1751582306581.png";

export default function Login() {
  const { currentUser, loading, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [redirectResultChecked, setRedirectResultChecked] = useState(false);

  // Enhanced mobile redirect handling for Replit environment
  useEffect(() => {
    const handleAuthRedirect = async () => {
      console.log("🔍 Enhanced redirect handling starting...");
      
      // Detect mobile device and set state
      const isMobileAuth = isMobileDevice();
      setIsMobile(isMobileAuth);
      
      // Handle mobile redirect result if mobile browser
      if (isMobileAuth) {
        console.log("📱 Mobile browser detected, processing redirect...");
        try {
          const mobileUser = await processRedirectResultPersistent();
          if (mobileUser) {
            console.log("✅ Mobile redirect handled successfully");
            setRedirectResultChecked(true);
            navigateToProfile(mobileUser);
            return;
          }
        } catch (error) {
          console.error("❌ Mobile redirect error:", error);
        }
      }
      
      // Fallback to standard redirect handling
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("✅ User returned from redirect:", result.user);
        } else {
          console.log("ℹ️ No redirect result found");
        }
      } catch (error) {
        console.error("❌ Error handling redirect:", error);
      } finally {
        console.log("✅ Finished checking redirect result");
        setRedirectResultChecked(true);
      }
    };

    handleAuthRedirect();
  }, []);

  // Detect mobile device on component mount
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const mobileDetected = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    setIsMobile(mobileDetected);
    console.log('📱 [LOGIN] Device detection:', { isMobile: mobileDetected, userAgent });
  }, []);

  // Navigate to profile once auth is complete and user is loaded
  useEffect(() => {
    console.log('🔵 [LOGIN_REDIRECT] Auth state check:', {
      loading,
      hasCurrentUser: !!currentUser,
      userEmail: currentUser ? currentUser.email || 'no email' : 'null',
      hasRedirected,
      isMobile,
      mobileAuthSuccess: sessionStorage.getItem('mobile_auth_success')
    });

    // Skip redirect if mobile auth was recently processed
    const mobileAuthProcessed = localStorage.getItem('mobile_auth_processed');
    const recentlyProcessed = mobileAuthProcessed && (Date.now() - parseInt(mobileAuthProcessed)) < 5000; // 5 seconds
    
    if (isMobile && recentlyProcessed) {
      console.log("📱 [LOGIN_REDIRECT] Mobile auth recently processed, skipping login page redirect");
      return;
    }

    if (!loading && currentUser && !hasRedirected && !isMobile && redirectResultChecked) {
      console.log("🎯 [LOGIN_REDIRECT] Desktop user - executing redirect");
      setHasRedirected(true);
      
      setTimeout(() => {
        console.log("🚀 [LOGIN_REDIRECT] Executing window.location.replace to /profile");
        window.location.replace('/profile');
      }, 100);
    }
  }, [currentUser, loading, hasRedirected, isMobile, redirectResultChecked]);

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
    console.log('🔵 [LOGIN] Sign in button clicked');
    console.log('🔵 [LOGIN] Current loading state:', loading);
    console.log('🔵 [LOGIN] Current user:', currentUser ? currentUser.email || 'no email' : 'null');
    
    try {
      console.log('🔵 [LOGIN] Setting isSigningIn to true');
      setIsSigningIn(true);
      
      // Detect mobile device and use appropriate authentication
      const isMobileAuth = isMobileDevice();
      console.log('🔵 [LOGIN] Device detection:', { isMobile: isMobileAuth });
      
      if (isMobileAuth) {
        console.log('🔵 [LOGIN] Mobile device - using persistent mobile authentication');
        await authenticateMobilePersistent();
        console.log('🔵 [LOGIN] Mobile authentication initiated');
        // Keep loading state for mobile redirect
      } else {
        console.log('🔵 [LOGIN] Desktop device - using standard authentication');
        await signInWithGoogle();
        console.log('🔵 [LOGIN] Desktop authentication completed');
        setIsSigningIn(false);
      }
      
    } catch (error: any) {
      console.log('💥 [LOGIN] Error in handleGoogleSignIn:', { 
        code: error.code, 
        message: error.message,
        stack: error.stack 
      });
      
      console.log('🔵 [LOGIN] Resetting isSigningIn to false due to error');
      setIsSigningIn(false);
      
      // Handle specific error cases with user-friendly messages
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request') {
        console.log('👤 [LOGIN] User cancelled authentication');
        return;
      } else if (error.code === 'auth/network-request-failed') {
        console.log('🌐 [LOGIN] Network error detected');
        alert("Network error. Please check your connection and try again.");
      } else if (error.message?.includes('@ufl.edu')) {
        console.log('🏫 [LOGIN] UF email validation error');
        alert("Please use your @ufl.edu email address to sign in.");
      } else if (error.code === 'auth/popup-blocked') {
        console.log('🚫 [LOGIN] Popup blocked error');
        alert("Popup was blocked. Redirecting to Google sign-in...");
      } else {
        console.log('❓ [LOGIN] Unknown authentication error');
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
          <div className="flex justify-center mb-6">
            <img 
              src={trekLogo} 
              alt="Trek" 
              className="h-20 w-auto"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome to Trek</h2>
          <p className="mt-2 text-gray-600">
            Please sign in with your UF email to continue.
          </p>
        </div>

        <div className="space-y-3">
          {isMobile ? (
            <MobileAuthFixed 
              onSuccess={(user) => {
                console.log('✅ [LOGIN] Mobile auth success:', user.email);
                setHasRedirected(true);
              }}
            />
          ) : (
            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="flex w-full items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
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
          )}
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