import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  rideDetails: {
    origin: string;
    destination: string;
    departureTime: string;
    price: string;
  };
  onPaymentSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const CheckoutForm = ({ amount, rideDetails, onPaymentSuccess, onCancel }: Omit<PaymentFormProps, 'clientSecret'>) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`, // Redirect after payment
      },
      redirect: "if_required", // Don't redirect if not necessary
    });

    if (error) {
      toast({
        title: "Payment Authorization Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (paymentIntent) {
      toast({
        title: "Payment Authorized",
        description: "Your card has been authorized. Payment will be charged after the ride is completed.",
      });
      onPaymentSuccess(paymentIntent.id);
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Authorize Payment</CardTitle>
        <CardDescription>
          Your card will be authorized for ${amount}. Payment will only be charged after the ride is completed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-semibold">Ride Details:</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>From:</strong> {rideDetails.origin}</p>
            <p><strong>To:</strong> {rideDetails.destination}</p>
            <p><strong>Departure:</strong> {new Date(rideDetails.departureTime).toLocaleString()}</p>
            <p><strong>Price:</strong> ${rideDetails.price}</p>
          </div>
        </div>

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
                  email: 'auto'
                }
              }
            }}
          />
          
          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={!stripe || isLoading}
              className="flex-1"
            >
              {isLoading ? "Authorizing..." : `Authorize $${amount}`}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground">
          By proceeding, you authorize Trek to charge your payment method after the ride is completed.
          You will not be charged until the driver confirms ride completion.
        </p>
      </CardContent>
    </Card>
  );
};

export default function PaymentForm({ clientSecret, amount, rideDetails, onPaymentSuccess, onCancel }: PaymentFormProps) {
  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <CheckoutForm 
        amount={amount}
        rideDetails={rideDetails}
        onPaymentSuccess={onPaymentSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}