import React, { useEffect, useState } from 'react';
import { 
  signInWithRedirect, 
  getRedirectResult, 
  setPersistence, 
  browserLocalPersistence,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

interface MobileAuthProps {
  onSuccess?: (user: User) => void;
}

const MobileAuthFixed: React.FC<MobileAuthProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasProcessedRedirect, setHasProcessedRedirect] = useState(false);

  useEffect(() => {
    const processAuthentication = async () => {
      if (hasProcessedRedirect) return;

      try {
        // Configure local persistence for mobile
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ [MOBILE_AUTH_FIXED] Local persistence configured');

        // Check for redirect result immediately
        console.log('🔍 [MOBILE_AUTH_FIXED] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        setHasProcessedRedirect(true);
        
        if (result && result.user) {
          console.log('✅ [MOBILE_AUTH_FIXED] Redirect successful:', result.user.email);
          
          // Validate UF email
          if (!result.user.email?.endsWith('@ufl.edu')) {
            console.log('❌ [MOBILE_AUTH_FIXED] Non-UF email, signing out');
            await auth.signOut();
            alert('Please use your @ufl.edu email address to sign in.');
            setIsLoading(false);
            return;
          }

          // Call success callback and redirect immediately
          if (onSuccess) {
            onSuccess(result.user);
          }
          
          // Mark as processed to prevent loops and redirect
          localStorage.setItem('mobile_auth_processed', Date.now().toString());
          console.log('🚀 [MOBILE_AUTH_FIXED] Redirecting to profile...');
          
          // Small delay to ensure state is saved, then redirect
          setTimeout(() => {
            window.location.replace('/profile');
          }, 100);
          
        } else {
          console.log('ℹ️ [MOBILE_AUTH_FIXED] No redirect result found');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('💥 [MOBILE_AUTH_FIXED] Error processing authentication:', error);
        setIsLoading(false);
      }
    };

    processAuthentication();
  }, [hasProcessedRedirect, onSuccess]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 [MOBILE_AUTH_FIXED] Initiating Google sign-in...');
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: 'ufl.edu'
      });

      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('❌ [MOBILE_AUTH_FIXED] Sign-in error:', error);
      setIsLoading(false);
      alert('Sign-in failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button 
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full bg-[#4285f4] hover:bg-[#357ae8] text-white"
      >
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </Button>
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Redirecting to Google...</span>
        </div>
      )}
    </div>
  );
};

export default MobileAuthFixed;