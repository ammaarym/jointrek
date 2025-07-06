// Mobile authentication fix utilities
export const isMobileBrowser = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const clearAllAuthFlags = (): void => {
  sessionStorage.removeItem('mobile_auth_redirect');
  sessionStorage.removeItem('auth_redirect_in_progress');
  localStorage.removeItem('firebase:authUser:YOUR_API_KEY:[DEFAULT]');
};

export const setMobileAuthRedirect = (): void => {
  if (isMobileBrowser()) {
    sessionStorage.setItem('mobile_auth_redirect', 'true');
    sessionStorage.setItem('mobile_auth_timestamp', Date.now().toString());
  }
};

export const checkMobileAuthTimeout = (): boolean => {
  const timestamp = sessionStorage.getItem('mobile_auth_timestamp');
  if (!timestamp) return false;
  
  const now = Date.now();
  const authTime = parseInt(timestamp);
  const timeout = 30000; // 30 seconds timeout
  
  if (now - authTime > timeout) {
    clearAllAuthFlags();
    return true; // timeout occurred
  }
  
  return false;
};

export const isReturningFromMobileAuth = (): boolean => {
  return isMobileBrowser() && !!sessionStorage.getItem('mobile_auth_redirect');
};