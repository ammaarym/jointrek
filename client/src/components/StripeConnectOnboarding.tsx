import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-new';
import { CheckCircle, AlertCircle, Shield, DollarSign, ExternalLink } from 'lucide-react';

interface StripeConnectOnboardingProps {
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function StripeConnectOnboarding({ onComplete, onError }: StripeConnectOnboardingProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const openOnboardingPopup = async () => {
    if (!currentUser) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/driver/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create onboarding link');
      }

      const result = await response.json();
      
      if (result.onboardingUrl) {
        // Open in popup since redirects don't work in Replit
        const popup = window.open(
          result.onboardingUrl,
          'stripe-onboarding',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        if (popup) {
          toast({
            title: "Onboarding Opened",
            description: "Complete your bank information setup in the popup window",
          });

          // Monitor popup for completion
          let checkInterval: NodeJS.Timeout;
          let statusCheckInterval: NodeJS.Timeout;
          
          const checkCompletion = async () => {
            try {
              // Check if driver status has been updated (indicates completion)
              const statusResponse = await fetch('/api/driver/status', {
                headers: {
                  'x-user-id': currentUser.uid,
                  'x-user-email': currentUser.email || '',
                  'x-user-name': currentUser.displayName || ''
                }
              });
              
              if (statusResponse.ok) {
                const status = await statusResponse.json();
                // If onboarding is complete and payouts are enabled, setup is done
                if (status.isOnboarded && status.payoutsEnabled) {
                  clearInterval(checkInterval);
                  clearInterval(statusCheckInterval);
                  
                  // Close the popup automatically
                  popup.close();
                  
                  toast({
                    title: "Setup Complete!",
                    description: "Your bank account is now ready to receive payments.",
                  });
                  
                  // Refresh the profile page
                  setTimeout(() => {
                    onComplete?.();
                  }, 500);
                  
                  return true;
                }
              }
            } catch (error) {
              console.log('Status check error:', error);
            }
            return false;
          };
          
          // Check for popup closure (manual close)
          checkInterval = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkInterval);
              clearInterval(statusCheckInterval);
              // Refresh status after popup closes
              setTimeout(() => {
                onComplete?.();
              }, 1000);
            }
          }, 1000);
          
          // Check for completion status every 3 seconds
          statusCheckInterval = setInterval(checkCompletion, 3000);
          
          // Also check immediately
          setTimeout(checkCompletion, 2000);
        } else {
          throw new Error('Popup was blocked. Please allow popups and try again.');
        }

      } else {
        toast({
          title: "Already Onboarded",
          description: "Your driver account is already set up",
        });
        onComplete?.();
      }
    } catch (error: any) {
      console.error('Error opening onboarding popup:', error);
      toast({
        title: "Onboarding Error",
        description: error.message,
        variant: "destructive",
      });
      onError?.(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to complete driver onboarding to set up your bank account for receiving payments from passengers.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <h3 className="font-medium">Bank Information Required:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Personal identification (SSN, ID document)
          </li>
          <li className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Bank account details for payments
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Address verification
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Business information (if applicable)
          </li>
        </ul>
      </div>

      <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Stripe Connect Onboarding
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Click the button below to open Stripe's secure onboarding process in a popup window. 
              You'll provide your bank information and identity verification details.
            </p>
          </div>
        </div>
      </div>

      <Button 
        onClick={openOnboardingPopup}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Opening Onboarding...
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Start Bank Information Setup
          </>
        )}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        <p>
          This will open Stripe's secure onboarding flow in a new window.
          <br />
          After completing the process, close the popup to return here.
        </p>
      </div>
    </div>
  );
}