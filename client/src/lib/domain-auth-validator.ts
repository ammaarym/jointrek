// Domain authentication validator for mobile signInWithRedirect compatibility
export class DomainAuthValidator {
  private static readonly PRODUCTION_DOMAIN = 'jointrek.com';
  private static readonly ALLOWED_DOMAINS = [
    'jointrek.com',
    'www.jointrek.com'
  ];

  static getCurrentDomain(): string {
    return window.location.hostname;
  }

  static getCurrentOrigin(): string {
    return window.location.origin;
  }

  static isProductionDomain(): boolean {
    const currentDomain = this.getCurrentDomain();
    return this.ALLOWED_DOMAINS.includes(currentDomain);
  }

  static isReplitDomain(): boolean {
    const currentDomain = this.getCurrentDomain();
    return currentDomain.includes('replit.dev') || 
           currentDomain.includes('replit.app') ||
           currentDomain.includes('replit.com');
  }

  static isLocalhost(): boolean {
    const currentDomain = this.getCurrentDomain();
    return currentDomain === 'localhost' || currentDomain === '127.0.0.1';
  }

  static isFirebaseDomain(): boolean {
    const currentDomain = this.getCurrentDomain();
    return currentDomain.includes('firebaseapp.com') || 
           currentDomain.includes('web.app');
  }

  static isUnsupportedForMobileRedirect(): boolean {
    return this.isReplitDomain() || 
           this.isLocalhost() || 
           this.isFirebaseDomain();
  }

  static shouldAllowMobileRedirect(): boolean {
    const isSupported = this.isProductionDomain();
    
    // Log the current domain check
    console.log('🌐 [DOMAIN_VALIDATOR] Domain check for mobile redirect:', {
      currentDomain: this.getCurrentDomain(),
      currentOrigin: this.getCurrentOrigin(),
      isProductionDomain: this.isProductionDomain(),
      isReplitDomain: this.isReplitDomain(),
      isLocalhost: this.isLocalhost(),
      isFirebaseDomain: this.isFirebaseDomain(),
      shouldAllowMobileRedirect: isSupported
    });

    return isSupported;
  }

  static getBlockedDomainMessage(): string {
    const currentDomain = this.getCurrentDomain();
    
    if (this.isReplitDomain()) {
      return `Mobile login is blocked on Replit domains (${currentDomain}). Please access the app from https://jointrek.com for mobile authentication.`;
    } else if (this.isLocalhost()) {
      return `Mobile login is blocked on localhost (${currentDomain}). Please access the app from https://jointrek.com for mobile authentication.`;
    } else if (this.isFirebaseDomain()) {
      return `Mobile login is blocked on Firebase hosting domains (${currentDomain}). Please access the app from https://jointrek.com for mobile authentication.`;
    } else {
      return `Mobile login is only supported on https://jointrek.com. Current domain: ${currentDomain}`;
    }
  }

  static logCurrentDomainInfo(): void {
    console.log('🏠 [DOMAIN_INFO] Current domain information:', {
      hostname: window.location.hostname,
      origin: window.location.origin,
      href: window.location.href,
      isProductionDomain: this.isProductionDomain(),
      isReplitDomain: this.isReplitDomain(),
      isLocalhost: this.isLocalhost(),
      isFirebaseDomain: this.isFirebaseDomain(),
      mobileRedirectAllowed: this.shouldAllowMobileRedirect()
    });
  }
}