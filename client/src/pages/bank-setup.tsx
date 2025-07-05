import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-fixed';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export default function BankSetupPage() {
  const { currentUser } = useAuth();

  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ['/api/users/firebase', currentUser?.uid],
    enabled: !!currentUser?.uid,
  });

  const startOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/stripe/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser?.getIdToken()}`
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to start onboarding');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: "Unable to start bank account setup. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleStartSetup = () => {
    startOnboardingMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/profile#driver-setup'}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  3
                </div>
                Bank Account Setup
              </CardTitle>
              <CardDescription>
                Set up your bank account to receive payments from passengers and complete Step 3 of driver verification.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Bank Setup Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Stripe Connect Account Setup
            </CardTitle>
            <CardDescription>
              Create your secure payment account to receive ride earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Set Up Your Payment Account</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You'll need to provide identity verification and banking information through our secure payment processor, Stripe.
              </p>
              
              <Button
                onClick={handleStartSetup}
                disabled={startOnboardingMutation.isPending}
                className="bg-primary hover:bg-orange-600 text-white px-8 py-3"
                size="lg"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {startOnboardingMutation.isPending ? "Setting up..." : "Start Bank Account Setup"}
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">
                What you'll need:
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Government-issued ID (driver's license)</li>
                <li>• Social Security Number for tax reporting</li>
                <li>• Bank account information for payments</li>
                <li>• Business information (if applicable)</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm">
                Your Data is Secure
              </h3>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li>• All banking information is securely handled by Stripe</li>
                <li>• Trek never sees your bank account or SSN details</li>
                <li>• Your data is encrypted and PCI DSS compliant</li>
                <li>• Only you and Stripe have access to your financial data</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-sm">
                After Setup
              </h3>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Once your account is verified, you'll be redirected back to your profile page. The verification process may take 1-2 business days.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}