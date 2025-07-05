import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { InsuranceVerificationUnified } from '@/components/insurance-verification-unified';
import { useAuth } from '@/hooks/use-auth-fixed';
import { useQuery } from '@tanstack/react-query';

export default function InsuranceVerificationPage() {
  const { currentUser } = useAuth();

  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ['/api/users/firebase', currentUser?.uid],
    enabled: !!currentUser?.uid,
  });

  const handleUpdate = () => {
    refetchUser();
    // Redirect back to profile page after successful update
    setTimeout(() => {
      window.location.href = '/profile#driver-setup';
    }, 1000);
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
                  2
                </div>
                Insurance Verification
              </CardTitle>
              <CardDescription>
                Verify your auto insurance policy and upload required documents to complete Step 2 of driver verification.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Insurance Verification Component */}
        <InsuranceVerificationUnified 
          currentInsurance={userData && typeof userData === 'object' ? {
            insuranceProvider: (userData as any).insuranceProvider,
            insurancePolicyNumber: (userData as any).insurancePolicyNumber,
            insuranceExpirationDate: (userData as any).insuranceExpirationDate,
            insuranceVerified: (userData as any).insuranceVerified,
            insuranceStatus: (userData as any).insuranceStatus || 'none',
            insuranceRejectionReason: (userData as any).insuranceRejectionReason
          } : undefined}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}