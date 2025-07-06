import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { isMobileBrowser, clearAllAuthFlags, isReturningFromMobileAuth } from '@/lib/mobile-auth-fix';

interface MobileAuthHandlerProps {
  onAuthStateChange: (user: any) => void;
}

export const MobileAuthHandler = ({ onAuthStateChange }: MobileAuthHandlerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isMobileBrowser()) return;

    const handleMobileAuth = async () => {
      try {
        setIsProcessing(true);
        console.log('📱 [MOBILE_AUTH_HANDLER] Starting mobile auth processing');

        // Check for OAuth redirect parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('authuser');
        
        if (hasOAuthParams) {
          console.log('📱 [MOBILE_AUTH_HANDLER] OAuth parameters found, processing redirect');
          
          // Clean URL immediately to prevent loops
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          // Get redirect result with timeout
          const redirectPromise = getRedirectResult(auth);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redirect timeout')), 10000)
          );
          
          try {
            const result = await Promise.race([redirectPromise, timeoutPromise]) as any;
            
            if (result && result.user) {
              console.log('📱 [MOBILE_AUTH_HANDLER] Redirect successful:', result.user.email);
              
              // Validate UF email
              if (result.user.email?.endsWith('@ufl.edu')) {
                console.log('✅ [MOBILE_AUTH_HANDLER] Valid UF email, clearing mobile flags');
                clearAllAuthFlags();
                
                // Force redirect to profile after successful auth
                setTimeout(() => {
                  window.location.href = '/profile';
                }, 1000);
              } else {
                console.log('❌ [MOBILE_AUTH_HANDLER] Invalid email domain');
                await auth.signOut();
                clearAllAuthFlags();
                alert('Please use your @ufl.edu email address.');
                window.location.href = '/login';
              }
            }
          } catch (error) {
            console.error('📱 [MOBILE_AUTH_HANDLER] Redirect processing failed:', error);
            clearAllAuthFlags();
          }
        }
        
        // Check for returning from mobile auth
        if (isReturningFromMobileAuth()) {
          console.log('📱 [MOBILE_AUTH_HANDLER] Returning from mobile auth, checking state');
          
          // Wait for auth state to settle
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const user = auth.currentUser;
          if (user?.email?.endsWith('@ufl.edu')) {
            console.log('📱 [MOBILE_AUTH_HANDLER] User authenticated, clearing flags');
            clearAllAuthFlags();
            
            // Redirect to profile if on login page
            if (window.location.pathname === '/login' || window.location.pathname === '/') {
              window.location.href = '/profile';
            }
          }
        }
        
      } catch (error) {
        console.error('📱 [MOBILE_AUTH_HANDLER] Error processing mobile auth:', error);
        clearAllAuthFlags();
      } finally {
        setIsProcessing(false);
      }
    };

    // Run mobile auth handler
    handleMobileAuth();

    // Set up auth state listener for mobile
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isMobileBrowser() && user?.email?.endsWith('@ufl.edu')) {
        console.log('📱 [MOBILE_AUTH_HANDLER] Auth state changed to valid user');
        clearAllAuthFlags();
      }
      onAuthStateChange(user);
    });

    return unsubscribe;
  }, [onAuthStateChange]);

  // Show processing indicator for mobile users
  if (isMobileBrowser() && isProcessing) {
    return (
      <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};