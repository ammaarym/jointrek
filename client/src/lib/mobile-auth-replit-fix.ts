// Comprehensive mobile authentication fix for Replit environment
import { auth } from '@/lib/firebase';
import { getRedirectResult, signOut } from 'firebase/auth';

export const isMobileBrowser = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isReplitEnvironment = (): boolean => {
  return window.location.hostname.includes('replit.app') || window.location.hostname.includes('repl.co');
};

export const clearMobileAuthState = (): void => {
  sessionStorage.removeItem('mobile_auth_redirect');
  sessionStorage.removeItem('mobile_auth_timestamp');
  sessionStorage.removeItem('auth_redirect_in_progress');
  localStorage.removeItem('mobile_auth_completed');
};

export const setMobileAuthRedirect = (): void => {
  if (isMobileBrowser()) {
    sessionStorage.setItem('mobile_auth_redirect', 'true');
    sessionStorage.setItem('mobile_auth_timestamp', Date.now().toString());
    console.log('📱 [MOBILE_AUTH] Mobile auth redirect flag set');
  }
};

export const handleMobileRedirectResult = async (): Promise<boolean> => {
  if (!isMobileBrowser() || !isReplitEnvironment()) {
    return false;
  }

  try {
    console.log('📱 [MOBILE_REDIRECT] Checking for mobile redirect result...');
    
    // Check for OAuth parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('authuser');
    
    if (hasOAuthParams) {
      console.log('📱 [MOBILE_REDIRECT] OAuth parameters detected, cleaning URL');
      // Clean URL immediately
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    
    // Process redirect result
    const result = await getRedirectResult(auth);
    
    if (result?.user) {
      console.log('📱 [MOBILE_REDIRECT] Redirect result found:', result.user.email);
      
      // Validate UF email
      if (result.user.email?.endsWith('@ufl.edu')) {
        console.log('✅ [MOBILE_REDIRECT] Valid UF email, clearing mobile state');
        clearMobileAuthState();
        localStorage.setItem('mobile_auth_completed', 'true');
        
        // Force navigation to profile
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1000);
        
        return true;
      } else {
        console.log('❌ [MOBILE_REDIRECT] Invalid email domain, signing out');
        await signOut(auth);
        clearMobileAuthState();
        alert('Please use your @ufl.edu email address.');
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('📱 [MOBILE_REDIRECT] Error handling redirect:', error);
    clearMobileAuthState();
    return false;
  }
};

export const checkMobileAuthTimeout = (): boolean => {
  const timestamp = sessionStorage.getItem('mobile_auth_timestamp');
  if (!timestamp) return false;
  
  const now = Date.now();
  const authTime = parseInt(timestamp);
  const timeout = 60000; // 60 seconds timeout
  
  if (now - authTime > timeout) {
    console.log('📱 [MOBILE_AUTH] Mobile auth timeout exceeded, clearing state');
    clearMobileAuthState();
    return true;
  }
  
  return false;
};