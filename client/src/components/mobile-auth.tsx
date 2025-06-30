import React, { useEffect, useState } from 'react';
import { 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  setPersistence, 
  browserSessionPersistence,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface MobileAuthProps {
  onSuccess?: (user: User) => void;
  redirectPath?: string;
}

const MobileAuth: React.FC<MobileAuthProps> = ({ 
  onSuccess, 
  redirectPath = '/dashboard' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Configure Firebase Auth persistence for mobile
    const configurePersistence = async () => {
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.log('✅ [MOBILE_AUTH] Session persistence configured');
      } catch (error) {
        console.error('❌ [MOBILE_AUTH] Error setting persistence:', error);
      }
    };

    configurePersistence();

    // Check for redirect result on component mount
    const handleRedirectResult = async () => {
      try {
        console.log('🔍 [MOBILE_AUTH] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('✅ [MOBILE_AUTH] Redirect authentication successful:', result.user.email);
          
          // Validate UF email domain
          if (result.user.email && !result.user.email.endsWith('@ufl.edu')) {
            console.log('❌ [MOBILE_AUTH] Non-UF email, signing out');
            await auth.signOut();
            alert('Please use your @ufl.edu email address to sign in.');
            setIsLoading(false);
            return;
          }

          setUser(result.user);
          if (onSuccess) {
            onSuccess(result.user);
          }
          
          // Let the parent component handle navigation
          console.log('✅ [MOBILE_AUTH] Authentication successful, parent will handle redirect');
        } else {
          console.log('ℹ️ [MOBILE_AUTH] No redirect result found');
        }
      } catch (error) {
        console.error('💥 [MOBILE_AUTH] Redirect result error:', error);
        setIsLoading(false);
      }
    };

    handleRedirectResult();

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔥 [MOBILE_AUTH] Auth state changed:', {
        hasUser: !!user,
        email: user?.email || 'null'
      });
      
      if (user && user.email && user.email.endsWith('@ufl.edu')) {
        setUser(user);
        setIsLoading(false);
        
        if (onSuccess) {
          onSuccess(user);
        }
        
        // Let parent component handle navigation
        console.log('✅ [MOBILE_AUTH] User authenticated via state change, parent will handle redirect');
      } else if (user && user.email && !user.email.endsWith('@ufl.edu')) {
        // Sign out non-UF users
        auth.signOut();
        setUser(null);
        setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [onSuccess, redirectPath, setLocation]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 [MOBILE_AUTH] Starting Google redirect authentication');

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configure provider for UF domain restriction
      provider.setCustomParameters({
        'hd': 'ufl.edu',
        'prompt': 'select_account'
      });

      console.log('📱 [MOBILE_AUTH] Calling signInWithRedirect...');
      await signInWithRedirect(auth, provider);
      
      // Note: The page will redirect, so code after this won't execute
      console.log('🔄 [MOBILE_AUTH] Redirect initiated');
      
    } catch (error: any) {
      console.error('💥 [MOBILE_AUTH] Sign-in error:', error);
      setIsLoading(false);
      
      // Handle specific errors
      if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized for authentication. Please contact support.');
      } else if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your connection and try again.');
      } else {
        alert('Authentication failed. Please try again.');
      }
    }
  };

  // If user is already authenticated, show success state
  if (user) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6">
        <div className="text-green-600 text-center">
          <h3 className="text-lg font-semibold">Welcome back!</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full max-w-md bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center space-x-3 py-3 px-4 rounded-lg shadow-sm"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </Button>
      
      <p className="text-xs text-gray-500 text-center max-w-md">
        Please use your @ufl.edu email address to sign in
      </p>
    </div>
  );
};

export default MobileAuth;