import { useToast } from '@/hooks/use-toast';
import { AlertCircle, WifiOff, CreditCard, User, Car, MessageSquare, Shield } from 'lucide-react';

// Define error contexts and their configurations
export type ErrorContext = 
  | 'authentication'
  | 'network'
  | 'payment'
  | 'ride_booking'
  | 'profile'
  | 'messaging'
  | 'validation'
  | 'permission'
  | 'stripe_connect'
  | 'driver_onboarding'
  | 'file_upload'
  | 'general';

interface ErrorConfig {
  icon: React.ComponentType<any>;
  title: string;
  defaultMessage: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

const errorConfigs: Record<ErrorContext, ErrorConfig> = {
  authentication: {
    icon: User,
    title: 'Authentication Error',
    defaultMessage: 'Please sign in with your UF email to continue.',
    variant: 'destructive',
    duration: 5000
  },
  network: {
    icon: WifiOff,
    title: 'Connection Error',
    defaultMessage: 'Unable to connect to Trek servers. Please check your internet connection.',
    variant: 'destructive',
    duration: 6000
  },
  payment: {
    icon: CreditCard,
    title: 'Payment Error',
    defaultMessage: 'There was an issue processing your payment. Please try again.',
    variant: 'destructive',
    duration: 7000
  },
  ride_booking: {
    icon: Car,
    title: 'Booking Error',
    defaultMessage: 'Unable to process your ride request. Please try again.',
    variant: 'destructive',
    duration: 5000
  },
  profile: {
    icon: User,
    title: 'Profile Error',
    defaultMessage: 'Unable to update your profile. Please try again.',
    variant: 'destructive',
    duration: 4000
  },
  messaging: {
    icon: MessageSquare,
    title: 'Message Error',
    defaultMessage: 'Unable to send your message. Please try again.',
    variant: 'destructive',
    duration: 4000
  },
  validation: {
    icon: AlertCircle,
    title: 'Validation Error',
    defaultMessage: 'Please check your input and try again.',
    variant: 'destructive',
    duration: 4000
  },
  permission: {
    icon: Shield,
    title: 'Permission Error',
    defaultMessage: 'You do not have permission to perform this action.',
    variant: 'destructive',
    duration: 5000
  },
  stripe_connect: {
    icon: CreditCard,
    title: 'Driver Setup Error',
    defaultMessage: 'Unable to set up your driver account. Please try again.',
    variant: 'destructive',
    duration: 6000
  },
  driver_onboarding: {
    icon: Car,
    title: 'Driver Onboarding Error',
    defaultMessage: 'Unable to complete driver setup. Please try again.',
    variant: 'destructive',
    duration: 5000
  },
  file_upload: {
    icon: AlertCircle,
    title: 'Upload Error',
    defaultMessage: 'Unable to upload file. Please try again.',
    variant: 'destructive',
    duration: 4000
  },
  general: {
    icon: AlertCircle,
    title: 'Error',
    defaultMessage: 'Something went wrong. Please try again.',
    variant: 'destructive',
    duration: 4000
  }
};

// Common error patterns and their contexts
const errorPatterns: Array<{ pattern: RegExp | string; context: ErrorContext }> = [
  { pattern: /network|connection|timeout|fetch/i, context: 'network' },
  { pattern: /auth|login|sign|token|unauthorized/i, context: 'authentication' },
  { pattern: /payment|stripe|card|billing|charge/i, context: 'payment' },
  { pattern: /ride|booking|request|driver|passenger/i, context: 'ride_booking' },
  { pattern: /profile|contact|phone|instagram|snapchat/i, context: 'profile' },
  { pattern: /message|chat|conversation/i, context: 'messaging' },
  { pattern: /validation|invalid|required|format/i, context: 'validation' },
  { pattern: /permission|forbidden|access|denied/i, context: 'permission' },
  { pattern: /connect.*account|onboard|payout/i, context: 'stripe_connect' },
  { pattern: /upload|file|image/i, context: 'file_upload' },
];

export function useErrorToast() {
  const { toast } = useToast();

  const showError = (
    context: ErrorContext,
    customMessage?: string,
    details?: string
  ) => {
    const config = errorConfigs[context];
    const Icon = config.icon;

    toast({
      variant: config.variant,
      duration: config.duration,
      title: (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {config.title}
        </div>
      ),
      description: customMessage || config.defaultMessage + (details ? ` ${details}` : ''),
    });
  };

  const showErrorFromResponse = async (response: Response, fallbackContext: ErrorContext = 'general') => {
    let context = fallbackContext;
    let message = '';

    try {
      const text = await response.text();
      
      // Try to parse as JSON for detailed error messages
      try {
        const errorData = JSON.parse(text);
        message = errorData.message || errorData.error || '';
      } catch {
        message = text;
      }

      // Auto-detect context based on error message
      for (const { pattern, context: detectedContext } of errorPatterns) {
        if (typeof pattern === 'string') {
          if (message.toLowerCase().includes(pattern.toLowerCase())) {
            context = detectedContext;
            break;
          }
        } else if (pattern.test(message)) {
          context = detectedContext;
          break;
        }
      }

      // Auto-detect context based on status code
      if (response.status === 401 || response.status === 403) {
        context = 'authentication';
      } else if (response.status === 404) {
        context = 'general';
        message = 'The requested resource was not found.';
      } else if (response.status === 429) {
        context = 'general';
        message = 'Too many requests. Please wait a moment and try again.';
      } else if (response.status >= 500) {
        context = 'network';
        message = 'Server error. Please try again later.';
      }

    } catch (error) {
      console.error('Error parsing response:', error);
    }

    showError(context, message);
  };

  const showErrorFromException = (error: Error | unknown, context: ErrorContext = 'general') => {
    let message = '';
    let detectedContext = context;

    if (error instanceof Error) {
      message = error.message;
      
      // Auto-detect context from error message
      for (const { pattern, context: patternContext } of errorPatterns) {
        if (typeof pattern === 'string') {
          if (message.toLowerCase().includes(pattern.toLowerCase())) {
            detectedContext = patternContext;
            break;
          }
        } else if (pattern.test(message)) {
          detectedContext = patternContext;
          break;
        }
      }

      // Special handling for common JavaScript errors
      if (message.includes('Failed to fetch')) {
        detectedContext = 'network';
        message = 'Unable to connect to Trek servers. Please check your internet connection.';
      } else if (message.includes('NetworkError')) {
        detectedContext = 'network';
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    showError(detectedContext, message);
  };

  const showValidationError = (field: string, issue: string) => {
    showError('validation', `${field}: ${issue}`);
  };

  const showNetworkError = (operation?: string) => {
    const message = operation 
      ? `Unable to ${operation}. Please check your connection and try again.`
      : undefined;
    showError('network', message);
  };

  const showAuthError = (action?: string) => {
    const message = action
      ? `Please sign in to ${action}.`
      : undefined;
    showError('authentication', message);
  };

  return {
    showError,
    showErrorFromResponse,
    showErrorFromException,
    showValidationError,
    showNetworkError,
    showAuthError,
  };
}