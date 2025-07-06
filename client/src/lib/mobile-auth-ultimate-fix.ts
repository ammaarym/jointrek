// Ultimate mobile authentication fix for Replit environment
import { auth } from '@/lib/firebase';
import { browserSessionPersistence, setPersistence } from 'firebase/auth';

export const isMobileBrowser = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isReplitEnvironment = (): boolean => {
  return window.location.hostname.includes('replit.app') || 
         window.location.hostname.includes('repl.co') ||
         window.location.hostname.includes('replit.dev');
};

export const setupMobileAuthForReplit = async (): Promise<void> => {
  if (!isMobileBrowser() || !isReplitEnvironment()) {
    return;
  }

  try {
    // Force session persistence for mobile in Replit
    await setPersistence(auth, browserSessionPersistence);
    console.log('📱 [MOBILE_FIX] Set session persistence for mobile Replit');
    
    // Clear any existing auth loops
    clearAllMobileAuthState();
    
    // Set flag to prevent auto-redirects
    sessionStorage.setItem('mobile_replit_mode', 'true');
    
  } catch (error) {
    console.error('📱 [MOBILE_FIX] Error setting up mobile auth:', error);
  }
};

export const clearAllMobileAuthState = (): void => {
  // Clear all possible auth state that could cause loops
  const authKeys = [
    'mobile_auth_redirect',
    'mobile_auth_timestamp', 
    'auth_redirect_in_progress',
    'mobile_auth_completed',
    'mobile_auth_attempts',
    'mobile_replit_mode'
  ];
  
  authKeys.forEach(key => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
  
  console.log('📱 [MOBILE_FIX] Cleared all mobile auth state');
};

export const shouldPreventAutoRedirect = (): boolean => {
  return isMobileBrowser() && 
         isReplitEnvironment() && 
         !!sessionStorage.getItem('mobile_replit_mode');
};

export const handleMobileAuthSuccess = (): void => {
  if (isMobileBrowser() && isReplitEnvironment()) {
    console.log('📱 [MOBILE_FIX] Mobile auth success - manual navigation required');
    clearAllMobileAuthState();
    
    // Show success message instead of auto-redirect
    const successDiv = document.createElement('div');
    successDiv.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  z-index: 10000; text-align: center; max-width: 300px;">
        <h3 style="margin: 0 0 10px 0; color: #059669;">Login Successful!</h3>
        <p style="margin: 0 0 15px 0; color: #374151; font-size: 14px;">
          Click below to continue to your profile.
        </p>
        <button onclick="window.location.href='/profile'" 
                style="background: #059669; color: white; border: none; padding: 10px 20px; 
                       border-radius: 6px; cursor: pointer; font-size: 16px;">
          Go to Profile
        </button>
      </div>
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 10000);
  }
};