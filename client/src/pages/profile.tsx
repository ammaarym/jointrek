import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-new';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { FaPhone, FaInstagram, FaEdit, FaCreditCard, FaCar } from 'react-icons/fa';
import { RiSnapchatFill } from 'react-icons/ri';
import { Plus, Star, CheckCircle, DollarSign, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

// Driver Status Interface
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

// Payment Setup Form Component
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
        return_url: `${window.location.origin}/profile`,
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

export default function Profile() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [isDriverLoading, setIsDriverLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  // Fetch user's payment methods
  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/payment-methods"],
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

  const handleAddPaymentMethod = () => {
    setupPaymentMutation.mutate();
  };

  const handlePaymentSetupSuccess = () => {
    setShowAddPayment(false);
    setClientSecret("");
    queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
  };

  const handleSetDefault = (paymentMethodId: string) => {
    setDefaultMutation.mutate(paymentMethodId);
  };

  const loadDriverStatus = async () => {
    if (!currentUser) return;

    try {
      setIsDriverLoading(true);
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
      // Don't show error toast for driver status - it's optional
    } finally {
      setIsDriverLoading(false);
    }
  };

  // Load user profile data on mount
  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
      loadDriverStatus();
    }
  }, [currentUser]);

  // Check URL parameters for driver onboarding completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // User returned from successful onboarding, refresh status after delay
      setTimeout(() => {
        loadDriverStatus();
      }, 2000); // Wait 2 seconds for Stripe to process
      
      toast({
        title: "Driver Setup Complete!",
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

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/firebase/${currentUser?.uid}`);
      if (response.ok) {
        const userData = await response.json();
        setPhone(userData.phone || '');
        setInstagram(userData.instagram || '');
        setSnapchat(userData.snapchat || '');
        // If no contact info exists, start in edit mode
        if (!userData.phone && !userData.instagram && !userData.snapchat) {
          setIsEditing(true);
        }
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    
    if (!phone || phone.trim() === '') {
      toast({
        title: "Phone Number Required",
        description: "Phone number is required for SMS notifications.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/firebase/${currentUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          instagram,
          snapchat,
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your contact information has been saved successfully.",
        });
        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    loadUserProfile(); // Reset to original values
    setIsEditing(false);
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
            title: "Already Setup",
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
        title: "Driver Setup Error",
        description: error.message || "Failed to start driver setup",
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
        if (result.dashboardUrl) {
          window.open(result.dashboardUrl, '_blank');
        }
      } else {
        throw new Error('Failed to get dashboard link');
      }
    } catch (error: any) {
      console.error('Error opening dashboard:', error);
      toast({
        title: "Dashboard Error",
        description: "Failed to open driver dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="text-center">
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Check if user has any contact information
  const hasContactInfo = phone || instagram || snapchat;

  // Show loading spinner while data is being loaded
  if (loading && !dataLoaded) {
    return (
      <div className="container px-4 py-6 mx-auto max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto max-w-2xl space-y-6">
      {/* Contact Info Required Banner */}
      {!hasContactInfo && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Contact Information Required
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  You must add at least one contact method (phone, Instagram, or Snapchat) before you can access ride features. This helps other students connect with you for rides.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Profile</CardTitle>
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            This information will be shown to other users when they view your rides
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Email Section */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-lg font-semibold">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{currentUser.displayName || 'User'}</h3>
              <p className="text-sm text-gray-600">{currentUser.email}</p>
              <p className="text-xs text-gray-500">University of Florida Email</p>
            </div>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Add photo upload functionality
                  toast({
                    title: "Coming Soon",
                    description: "Profile picture upload will be available soon!",
                  });
                }}
              >
                Change Photo
              </Button>
            )}
          </div>

          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <FaPhone className="text-primary" />
                  Phone Number (Required)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Required for SMS ride notifications</p>
              </div>

              <div>
                <Label htmlFor="instagram" className="flex items-center gap-2 mb-2">
                  <FaInstagram className="text-primary" />
                  Instagram Username (Optional)
                </Label>
                <Input
                  id="instagram"
                  placeholder="Enter your Instagram username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="snapchat" className="flex items-center gap-2 mb-2">
                  <RiSnapchatFill className="text-primary" />
                  Snapchat Username (Optional)
                </Label>
                <Input
                  id="snapchat"
                  placeholder="Enter your Snapchat username"
                  value={snapchat}
                  onChange={(e) => setSnapchat(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="bg-primary hover:bg-orange-600 text-white flex-1"
                >
                  {loading ? 'Saving...' : 'Save Contact Information'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className="space-y-6">
              {phone && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FaPhone className="text-primary w-5 h-5" />
                  <div>
                    <p className="font-medium text-gray-900">Phone Number</p>
                    <p className="text-gray-600">{phone}</p>
                  </div>
                </div>
              )}

              {instagram && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FaInstagram className="text-primary w-5 h-5" />
                  <div>
                    <p className="font-medium text-gray-900">Instagram</p>
                    <p className="text-gray-600">@{instagram}</p>
                  </div>
                </div>
              )}

              {snapchat && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <RiSnapchatFill className="text-primary w-5 h-5" />
                  <div>
                    <p className="font-medium text-gray-900">Snapchat</p>
                    <p className="text-gray-600">{snapchat}</p>
                  </div>
                </div>
              )}

              {!phone && !instagram && !snapchat && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No contact information added yet</p>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-primary hover:bg-orange-600 text-white"
                  >
                    Add Contact Information
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Setup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCar className="w-5 h-5" />
            Driver Setup
          </CardTitle>
          <CardDescription>
            Set up your driver account to post rides and receive payments from passengers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isDriverLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              <span className="ml-2 text-sm text-muted-foreground">Loading driver status...</span>
            </div>
          ) : driverStatus?.isOnboarded ? (
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
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={openDashboard}
                  disabled={isLoadingDashboard}
                  variant="outline"
                  className="flex-1"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {isLoadingDashboard ? "Loading..." : "Manage Account"}
                </Button>
                
                <Button
                  onClick={startOnboarding}
                  disabled={isOnboarding}
                  variant="outline"
                  className="flex-1"
                >
                  <FaEdit className="w-4 h-4 mr-2" />
                  {isOnboarding ? "Updating..." : "Modify Setup"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-8">
                <FaCar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Become a Driver</h3>
                <p className="text-muted-foreground mb-6">
                  Set up your driver account to post rides and earn money from passengers. You'll need to provide identity verification and banking information.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.location.href = '/stripe-setup-guide'}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Setup Guide
                  </Button>
                  <Button
                    onClick={startOnboarding}
                    disabled={isOnboarding}
                    className="bg-primary hover:bg-orange-600 text-white flex-1"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {isOnboarding ? "Setting up..." : "Start Driver Setup"}
                  </Button>
                </div>
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
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Your Data is Secure
                </h3>
                <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                  <li>• All banking information is securely handled by Stripe</li>
                  <li>• Trek never sees your bank account or SSN details</li>
                  <li>• Your data is encrypted and PCI DSS compliant</li>
                  <li>• Only you and Stripe have access to your financial data</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCreditCard className="w-5 h-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>
            Manage your payment methods for quick and secure ride payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              <span className="ml-2 text-sm text-muted-foreground">Loading payment methods...</span>
            </div>
          ) : (
            <>
              {/* Existing Payment Methods */}
              {(paymentData as any)?.paymentMethods?.length > 0 ? (
                <div className="space-y-3">
                  {(paymentData as any).paymentMethods.map((method: any) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <FaCreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            •••• •••• •••• {method.card.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {method.card.brand.toUpperCase()} expires {method.card.exp_month}/{method.card.exp_year}
                          </p>
                        </div>
                        {(paymentData as any).defaultPaymentMethodId === method.id && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                            <Star className="w-3 h-3 fill-current" />
                            Default
                          </div>
                        )}
                      </div>
                      {(paymentData as any).defaultPaymentMethodId !== method.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          Set as Default
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaCreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No payment methods added yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add a payment method to make ride payments quick and secure
                  </p>
                </div>
              )}

              {/* Add Payment Method Button */}
              <Button
                onClick={handleAddPaymentMethod}
                disabled={setupPaymentMutation.isPending}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                {setupPaymentMutation.isPending ? "Setting up..." : "Add Payment Method"}
              </Button>
            </>
          )}

          {/* Add Payment Method Form */}
          {showAddPayment && clientSecret && (
            <Card className="mt-4">
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

          {/* Payment Info */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">
                How Payment Works
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Your payment method is securely stored with Stripe</li>
                <li>• When you request a ride, your card is authorized but not charged</li>
                <li>• Payment is only processed after the ride is completed</li>
                <li>• You can change your default payment method anytime</li>
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}