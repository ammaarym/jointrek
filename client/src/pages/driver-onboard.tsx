import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-new';
import { CheckCircle, AlertCircle, DollarSign, Shield, Clock } from 'lucide-react';

interface DriverStatus {
  isOnboarded: boolean;
  canAcceptRides: boolean;
  accountId?: string;
  payoutsEnabled?: boolean;
}

export default function DriverOnboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    loadDriverStatus();
  }, [currentUser]);

  const loadDriverStatus = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/driver/status', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        const status = await response.json();
        setDriverStatus(status);
      } else {
        throw new Error('Failed to load driver status');
      }
    } catch (error: any) {
      console.error('Error loading driver status:', error);
      toast({
        title: "Error",
        description: "Failed to load driver status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startOnboarding = async () => {
    if (!currentUser) return;

    setIsOnboarding(true);
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

      if (response.ok) {
        const result = await response.json();
        
        if (result.onboardingUrl) {
          // Redirect to Stripe Express onboarding
          window.location.href = result.onboardingUrl;
        } else {
          toast({
            title: "Already Onboarded",
            description: "Your driver account is already set up",
          });
          loadDriverStatus();
        }
      } else {
        const error = await response.json();
        
        if (error.connectSetupRequired) {
          toast({
            title: "Platform Setup Required",
            description: "Stripe Connect needs to be enabled in the platform dashboard first. Please contact support.",
            variant: "destructive",
          });
        } else {
          throw new Error(error.message || 'Failed to start onboarding');
        }
      }
    } catch (error: any) {
      console.error('Error starting onboarding:', error);
      toast({
        title: "Onboarding Error",
        description: error.message || "Failed to start driver onboarding",
        variant: "destructive",
      });
    } finally {
      setIsOnboarding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!driverStatus) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load driver status. Please try again later.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Driver Payment Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set up your payment account to receive money from ride passengers
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {driverStatus.isOnboarded ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your driver account is fully set up and ready to accept rides!
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Account Verified</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your identity and bank account are verified
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {driverStatus.payoutsEnabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium">Payouts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {driverStatus.payoutsEnabled 
                      ? "Ready to receive payments" 
                      : "Being processed by Stripe"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to complete driver onboarding before you can offer rides or accept ride requests.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h3 className="font-medium">What you'll need to provide:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Personal identification (SSN, ID document)
                  </li>
                  <li className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Bank account for receiving payments
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Business information (if applicable)
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={startOnboarding}
                disabled={isOnboarding}
                className="w-full"
                size="lg"
              >
                {isOnboarding ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Setting up...
                  </>
                ) : (
                  "Start Driver Onboarding"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Driver Payments Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium">Payment Process:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-4">
              <li>Passengers pay when booking rides</li>
              <li>Money is held securely until ride completion</li>
              <li>After ride verification, payment is automatically split</li>
              <li>Your share is transferred to your bank account</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Payment Timeline:</h4>
            <p className="text-muted-foreground">
              Payments are typically transferred to your bank account within 2-7 business days after ride completion.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Security & Compliance:</h4>
            <p className="text-muted-foreground">
              All payments are processed securely by Stripe, which handles tax reporting and compliance requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}