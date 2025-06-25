import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-new';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  amount: number; // Amount in dollars
  rideId?: number; // Required for marketplace payments
  onPaymentSuccess?: (paymentIntentId: string) => void;
  onPaymentError?: (error: string) => void;
  disabled?: boolean;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({
  amount,
  rideId,
  onPaymentSuccess,
  onPaymentError,
  disabled = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<{
    platformFee: number;
    driverAmount: number;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    const createPaymentIntent = async () => {
      if (!currentUser) {
        onPaymentError?.("User authentication required");
        return;
      }

      try {
        const response = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser.uid,
            'x-user-email': currentUser.email || '',
            'x-user-name': currentUser.displayName || ''
          },
          body: JSON.stringify({ 
            amount,
            rideId 
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        if (data.platformFee !== undefined) {
          setPaymentDetails({
            platformFee: data.platformFee,
            driverAmount: data.driverAmount,
            totalAmount: data.totalAmount
          });
        }
      } catch (error: any) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Payment Setup Failed",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });
        onPaymentError?.(error.message || "Failed to initialize payment");
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, rideId, onPaymentError, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/my-rides`,
        },
        redirect: "if_required",
      });

      if (error) {
        console.error('Payment failed:', error);
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        onPaymentError?.(error.message || "Payment failed");
      } else if (paymentIntent?.status === 'succeeded') {
        toast({
          title: "Payment Authorized",
          description: `Authorization of $${amount.toFixed(2)} completed successfully!`,
        });
        onPaymentSuccess?.(paymentIntent.id);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      onPaymentError?.(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Amount: ${amount.toFixed(2)}
          {paymentDetails && (
            <span className="block text-xs mt-1">
              Platform fee: ${paymentDetails.platformFee.toFixed(2)} • Driver receives: ${paymentDetails.driverAmount.toFixed(2)}
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Payment Method</p>
            <p className="text-xs text-muted-foreground">
              Credit card, Apple Pay, and Google Pay are supported
            </p>
          </div>
          
          <PaymentElement 
            options={{
              layout: 'tabs',
              wallets: {
                applePay: 'auto',
                googlePay: 'auto'
              },
              fields: {
                billingDetails: {
                  name: 'auto',
                  email: 'auto',
                  address: 'never'
                }
              },
              terms: {
                applePay: 'never',
                googlePay: 'never',
                card: 'never'
              }
            }}
          />
          <Button
            type="submit"
            disabled={!stripe || isLoading || disabled}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing...
              </>
            ) : (
              `Authorize $${amount.toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  const options = {
    clientSecret: '', // Will be set after creation
    appearance: {
      theme: 'stripe' as const,
    },
  };
  
  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default PaymentForm;