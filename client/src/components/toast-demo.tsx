import React from 'react';
import { Button } from '@/components/ui/button';
import { useErrorToast } from '@/hooks/use-error-toast';
import { useToast } from '@/hooks/use-toast';

export function ToastDemo() {
  const { showError, showErrorFromException, showValidationError, showNetworkError, showAuthError } = useErrorToast();
  const { toast } = useToast();

  const demoErrors = [
    {
      label: 'Authentication Error',
      action: () => showAuthError('access your profile'),
    },
    {
      label: 'Network Error',
      action: () => showNetworkError('load rides'),
    },
    {
      label: 'Payment Error',
      action: () => showError('payment', 'Your card was declined. Please try a different payment method.'),
    },
    {
      label: 'Validation Error',
      action: () => showValidationError('Phone number', 'must be a valid US phone number'),
    },
    {
      label: 'Exception Error',
      action: () => showErrorFromException(new Error('Failed to fetch ride data from server')),
    },
    {
      label: 'Success Toast',
      action: () => toast({
        variant: 'default',
        title: 'Success!',
        description: 'Your ride has been posted successfully.',
      }),
    },
  ];

  // Always return null - only show toasts when actual events occur
  return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg z-50">
      <h3 className="text-sm font-semibold mb-2">Toast Demo (Dev Only)</h3>
      <div className="space-y-2">
        {demoErrors.map((demo, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={demo.action}
            className="text-xs w-full"
          >
            {demo.label}
          </Button>
        ))}
      </div>
    </div>
  );
}