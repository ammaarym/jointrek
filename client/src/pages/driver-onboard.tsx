import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-new';
import { CheckCircle, AlertCircle, DollarSign, Shield, Clock } from 'lucide-react';
import StripeConnectOnboarding from '@/components/StripeConnectOnboarding';

interface DriverStatus {
  isOnboarded: boolean;
  canAcceptRides: boolean;
  accountId?: string;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirementsEventuallyDue?: string[];
  requirementsCurrentlyDue?: string[];
}

export default function DriverOnboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    loadDriverStatus();
  }, [currentUser]);

  // Check URL parameters for onboarding completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // User returned from successful onboarding, refresh status after delay
      setTimeout(() => {
        loadDriverStatus();
      }, 2000); // Wait 2 seconds for Stripe to process
      
      toast({
        title: "Onboarding Complete!",
        description: "Your driver payment account has been set up successfully.",
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('refresh') === 'true') {
      // User needs to refresh/retry onboarding
      toast({
        title: "Please Complete Setup",
        description: "Please complete the driver payment setup to continue.",
        variant: "destructive",
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  const openDashboard = async () => {
    if (!currentUser) return;

    setIsLoadingDashboard(true);
    try {
      const response = await fetch('/api/driver/dashboard-link', {
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
        window.open(result.dashboardUrl, '_blank');
      } else {
        throw new Error('Failed to create dashboard link');
      }
    } catch (error: any) {
      console.error('Error opening dashboard:', error);
      toast({
        title: "Dashboard Error",
        description: "Failed to open Stripe dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const deleteDriverAccount = async () => {
    if (!currentUser) return;

    const confirmed = confirm(
      'Are you sure you want to delete your driver account? This will permanently remove your Stripe Connect account and you will need to complete the setup process again to become a driver.'
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/driver/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Driver Account Deleted",
          description: result.message,
        });
        
        // Refresh the status to show the user can start over
        loadDriverStatus();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete driver account');
      }
    } catch (error: any) {
      console.error('Error deleting driver account:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete driver account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
                    {driverStatus.detailsSubmitted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium">Account Details</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {driverStatus.detailsSubmitted 
                      ? "Identity and bank information verified" 
                      : "Verification in progress"}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {driverStatus.payoutsEnabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium">Bank Payouts</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {driverStatus.payoutsEnabled 
                      ? "Ready to receive payments" 
                      : "Bank verification in progress"}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {driverStatus.chargesEnabled ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium">Payment Processing</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {driverStatus.chargesEnabled 
                      ? "Can accept ride payments" 
                      : "Payment setup in progress"}
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Manage Account</span>
                  </div>
                  <div className="space-y-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={openDashboard}
                      disabled={isLoadingDashboard}
                      className="w-full"
                    >
                      {isLoadingDashboard ? (
                        <>
                          <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Opening...
                        </>
                      ) : (
                        "Open Stripe Dashboard"
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={deleteDriverAccount}
                      disabled={isLoading}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete Driver Account
                    </Button>
                  </div>
                </div>
              </div>

              {/* Show any pending requirements */}
              {(driverStatus.requirementsCurrentlyDue && driverStatus.requirementsCurrentlyDue.length > 0) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Action Required:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {driverStatus.requirementsCurrentlyDue.map((req, index) => (
                          <li key={index}>{req.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>
                        ))}
                      </ul>
                      <Button 
                        size="sm" 
                        onClick={openDashboard}
                        disabled={isLoadingDashboard}
                        className="mt-2"
                      >
                        Complete Requirements
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <StripeConnectOnboarding 
              onComplete={loadDriverStatus}
              onError={(error) => {
                toast({
                  title: "Onboarding Error",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
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