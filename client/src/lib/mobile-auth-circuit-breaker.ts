// Circuit breaker to prevent mobile authentication infinite loops
export class MobileAuthCircuitBreaker {
  private static REDIRECT_LIMIT = 3;
  private static TIMEOUT_MS = 300000; // 5 minutes
  private static STORAGE_KEY = 'mobile_auth_attempts';

  static shouldAllowRedirect(): boolean {
    const attempts = this.getAttempts();
    const now = Date.now();

    // Clear old attempts beyond timeout
    const validAttempts = attempts.filter(attempt => now - attempt < this.TIMEOUT_MS);
    
    if (validAttempts.length !== attempts.length) {
      this.setAttempts(validAttempts);
    }

    // Check if we've exceeded the limit
    if (validAttempts.length >= this.REDIRECT_LIMIT) {
      console.log('🚫 [CIRCUIT_BREAKER] Redirect limit exceeded, blocking redirect');
      return false;
    }

    return true;
  }

  static recordRedirectAttempt(): void {
    const attempts = this.getAttempts();
    attempts.push(Date.now());
    this.setAttempts(attempts);
    console.log('📊 [CIRCUIT_BREAKER] Recorded redirect attempt:', attempts.length);
  }

  static reset(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🔄 [CIRCUIT_BREAKER] Reset redirect attempts');
  }

  static forceReset(): void {
    // Force reset all mobile auth state
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem('mobile_auth_redirect');
    sessionStorage.removeItem('auth_redirect_in_progress');
    sessionStorage.removeItem('mobile_auth_timestamp');
    localStorage.removeItem('mobile_auth_completed');
    console.log('💥 [CIRCUIT_BREAKER] Force reset all mobile auth state');
  }

  private static getAttempts(): number[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static setAttempts(attempts: number[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(attempts));
  }
}