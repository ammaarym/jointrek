import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { useAuth } from "@/hooks/use-auth-new";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, Plus, Trash2, Building, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface PaymentData {
  paymentMethods: PaymentMethod[];
  defaultPaymentMethodId: string | null;
}

interface DriverStatus {
  isOnboarded: boolean;
  canAcceptRides: boolean;
  accountId?: string;
  payoutsEnabled?: boolean;
  chargesEnabled?: boolean;
}

const PaymentSetupForm = ({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) => {
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

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/profile/payment`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Method Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (setupIntent) {
      toast({
        title: "Payment Method Added",
        description: "Your payment method has been saved successfully.",
      });
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Payment Method</p>
        <p className="text-xs text-muted-foreground">
          Add a credit card, debit card, or digital wallet for secure payments
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
            billingDetails: 'auto'
          }
        }}
      />
      
      <div className="text-xs text-muted-foreground">
        <p>Supported cards: Visa, Mastercard, American Express, Discover, and more</p>
        <p>Your payment information is securely encrypted and stored with Stripe</p>
      </div>
      
      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
          className="flex-1"
        >
          {isLoading ? "Adding Payment Method..." : "Add Payment Method"}
        </Button>
      </div>
    </form>
  );
};

export default function ProfilePaymentPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  // Fetch user's payment methods
  const { data: paymentData, isLoading: paymentLoading } = useQuery<PaymentData>({
    queryKey: ["/api/payment-methods"],
    enabled: !!currentUser,
  });

  // Fetch driver status for bank account management
  const { data: driverStatus, isLoading: driverLoading } = useQuery<DriverStatus>({
    queryKey: ["/api/driver/status"],
    enabled: !!currentUser,
  });

  // Setup payment method mutation
  const setupPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/setup-payment-method", {});
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowAddPayment(true);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup payment method. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set default payment method mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest("POST", "/api/set-default-payment-method", {
        paymentMethodId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Default Payment Method Updated",
        description: "Your default payment method has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update default payment method.",
        variant: "destructive",
      });
    },
  });

  // Delete payment method mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest("DELETE", `/api/payment-methods/${paymentMethodId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Method Deleted",
        description: "Your payment method has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete payment method.",
        variant: "destructive",
      });
    },
  });

  // Delete bank account mutation
  const deleteBankAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/driver/account", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bank Account Deleted",
        description: "Your driver account and bank information have been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete bank account.",
        variant: "destructive",
      });
    },
  });

  const handleAddPaymentMethod = () => {
    setupPaymentMutation.mutate();
  };

  const handleSetDefault = (paymentMethodId: string) => {
    setDefaultMutation.mutate(paymentMethodId);
  };

  const handleDeletePaymentMethod = (paymentMethodId: string) => {
    deletePaymentMutation.mutate(paymentMethodId);
  };

  const handleDeleteBankAccount = () => {
    deleteBankAccountMutation.mutate();
  };

  const handlePaymentSetupSuccess = () => {
    setShowAddPayment(false);
    setClientSecret("");
    queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please log in to manage your payment methods.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Methods</h1>
        <p className="text-muted-foreground mt-2">
          Manage your saved payment methods for quick ride requests
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Saved Payment Methods
            </CardTitle>
            <CardDescription>
              Add and manage your payment methods for seamless ride booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-muted-foreground">Loading payment methods...</p>
              </div>
            ) : paymentData?.paymentMethods && paymentData.paymentMethods.length > 0 ? (
              <div className="space-y-3">
                {paymentData.paymentMethods.map((pm: PaymentMethod) => (
                  <div 
                    key={pm.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">
                              •••• •••• •••• {pm.card?.last4 || '****'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {pm.card?.brand?.toUpperCase() || 'CARD'} • Expires {pm.card?.exp_month || 'XX'}/{pm.card?.exp_year || 'XXXX'}
                            </p>
                          </div>
                          {paymentData?.defaultPaymentMethodId === pm.id && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                              <Check className="w-3 h-3" />
                              Default
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 min-w-fit">
                      {paymentData?.defaultPaymentMethodId !== pm.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(pm.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          Set as Default
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deletePaymentMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this payment method? This action cannot be undone.
                              {paymentData?.defaultPaymentMethodId === pm.id && (
                                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded text-orange-800 dark:text-orange-200 text-sm">
                                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                                  This is your default payment method.
                                </div>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePaymentMethod(pm.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Payment Method
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No payment methods added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a payment method to start requesting rides
                </p>
              </div>
            )}

            <Button 
              onClick={handleAddPaymentMethod}
              disabled={setupPaymentMutation.isPending}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              {setupPaymentMutation.isPending ? "Setting up..." : "Add Payment Method"}
            </Button>
          </CardContent>
        </Card>

        {/* Add Payment Method Form */}
        {showAddPayment && clientSecret && (
          <Card>
            <CardHeader>
              <CardTitle>Add Payment Method</CardTitle>
              <CardDescription>
                Add a new payment method to your profile for quick ride requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentSetupForm 
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSetupSuccess}
                />
              </Elements>
            </CardContent>
          </Card>
        )}

        {/* Bank Account Management for Drivers */}
        {driverStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Driver Bank Account
              </CardTitle>
              <CardDescription>
                Manage your bank account for receiving driver payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {driverStatus.isOnboarded ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                        <Building className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200">
                          Bank Account Connected
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-300">
                          {driverStatus.payoutsEnabled ? 'Payouts enabled' : 'Payouts pending approval'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await apiRequest('POST', '/api/driver/dashboard-link', {});
                            const data = await response.json();
                            window.open(data.dashboardUrl, '_blank');
                          } catch (error) {
                            console.error('Error opening Stripe dashboard:', error);
                            toast({
                              title: "Error",
                              description: "Failed to open Stripe dashboard. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Manage Account
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deleteBankAccountMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            Delete Bank Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Driver Bank Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete your driver bank account? This will:
                              <ul className="mt-2 space-y-1 text-sm">
                                <li>• Remove your ability to receive driver payments</li>
                                <li>• Delete all your bank account information</li>
                                <li>• Require you to set up a new account to drive again</li>
                              </ul>
                              <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-sm">
                                <AlertTriangle className="w-4 h-4 inline mr-1" />
                                This action cannot be undone.
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteBankAccount}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Bank Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No bank account connected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up your bank account to start driving and receiving payments
                  </p>
                  <Button 
                    onClick={() => window.open('/driver-onboard', '_blank')}
                    className="mt-4"
                    variant="outline"
                  >
                    Set Up Driver Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Info */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              How Payment Works
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Your payment method is securely stored with Stripe</li>
              <li>• When you request a ride, your card is authorized but not charged</li>
              <li>• Payment is only processed after the ride is completed</li>
              <li>• You can change your default payment method anytime</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}