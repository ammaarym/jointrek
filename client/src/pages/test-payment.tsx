import React, { useState } from 'react';
import PaymentForm from '@/components/PaymentForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestPayment() {
  const [amount, setAmount] = useState<string>('800'); // Default $8.00 in cents
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentResult, setPaymentResult] = useState<string>('');

  const handlePaymentSuccess = (paymentIntentId: string) => {
    setPaymentResult(`Payment successful! Payment ID: ${paymentIntentId}`);
    setShowPaymentForm(false);
  };

  const handlePaymentError = (error: string) => {
    setPaymentResult(`Payment failed: ${error}`);
    setShowPaymentForm(false);
  };

  const startPayment = () => {
    if (!amount || parseInt(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setPaymentResult('');
    setShowPaymentForm(true);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Direct Stripe Payment Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the direct payment integration with Stripe Elements
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPaymentForm ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (in cents)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="800"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  Amount in cents (e.g., 800 = $8.00)
                </p>
              </div>
              
              <Button onClick={startPayment} className="w-full">
                Start Payment (${(parseInt(amount || '0') / 100).toFixed(2)})
              </Button>

              {paymentResult && (
                <div className={`p-3 rounded-md ${
                  paymentResult.includes('successful') 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {paymentResult}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <PaymentForm
                  amount={parseInt(amount)}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentForm(false)}
                className="w-full"
              >
                Cancel Payment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Integration Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Backend:</strong> POST /api/payment-intent creates PaymentIntent with allow_redirects: 'never'</p>
          <p><strong>Frontend:</strong> Uses Stripe Elements with confirmCardPayment for direct payment</p>
          <p><strong>Flow:</strong> No redirects - payment happens directly on this page</p>
          <p><strong>Test Cards:</strong> Use 4242424242424242 (Visa) for successful payments</p>
        </CardContent>
      </Card>
    </div>
  );
}