// Safari-specific authentication workaround for Firebase Auth
// This handles Safari's unique behavior with redirects and session storage

export const isSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent) && !/CriOS|FxiOS|OPiOS/i.test(userAgent);
};

export const isMobileSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(userAgent) && /Safari/i.test(userAgent) && !/CriOS|FxiOS|OPiOS/i.test(userAgent);
};

export const setSafariAuthState = (state: 'pending' | 'completed' | 'failed', data?: any) => {
  const timestamp = Date.now().toString();
  const authData = {
    state,
    timestamp,
    data: data || null,
    url: window.location.href
  };
  
  console.log('🍎 [SAFARI_AUTH] Setting auth state:', authData);
  
  // Use both sessionStorage and localStorage for Safari
  try {
    sessionStorage.setItem('safari_auth_state', JSON.stringify(authData));
    localStorage.setItem('safari_auth_backup', JSON.stringify(authData));
  } catch (error) {
    console.error('🍎 [SAFARI_AUTH] Error setting auth state:', error);
  }
};

export const getSafariAuthState = (): any | null => {
  try {
    // Try sessionStorage first, then localStorage backup
    let authState = sessionStorage.getItem('safari_auth_state');
    if (!authState) {
      authState = localStorage.getItem('safari_auth_backup');
    }
    
    if (authState) {
      const parsed = JSON.parse(authState);
      console.log('🍎 [SAFARI_AUTH] Retrieved auth state:', parsed);
      return parsed;
    }
  } catch (error) {
    console.error('🍎 [SAFARI_AUTH] Error getting auth state:', error);
  }
  
  return null;
};

export const clearSafariAuthState = () => {
  console.log('🍎 [SAFARI_AUTH] Clearing auth state');
  try {
    sessionStorage.removeItem('safari_auth_state');
    localStorage.removeItem('safari_auth_backup');
  } catch (error) {
    console.error('🍎 [SAFARI_AUTH] Error clearing auth state:', error);
  }
};

// Safari-specific redirect handling
export const handleSafariRedirect = (currentUrl: string): boolean => {
  console.log('🍎 [SAFARI_AUTH] Checking Safari redirect for URL:', currentUrl);
  
  // Check if we're returning from Google OAuth
  const urlParams = new URLSearchParams(window.location.search);
  const fragment = window.location.hash;
  
  console.log('🍎 [SAFARI_AUTH] URL params:', urlParams.toString());
  console.log('🍎 [SAFARI_AUTH] Fragment:', fragment);
  
  // Check for OAuth parameters
  const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || 
                        fragment.includes('access_token') || fragment.includes('id_token');
  
  if (hasOAuthParams) {
    console.log('🍎 [SAFARI_AUTH] OAuth parameters detected, likely returning from Google');
    setSafariAuthState('completed', { url: currentUrl, params: urlParams.toString(), fragment });
    return true;
  }
  
  return false;
};

// Enhanced persistence settings for Safari
export const getSafariPersistenceConfig = () => {
  return {
    enablePersistence: true,
    forceOwnership: true,
    synchronizeTabs: false // Disable tab sync for Safari
  };
};