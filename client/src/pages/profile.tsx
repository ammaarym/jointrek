import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-fixed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { FaPhone, FaInstagram, FaEdit, FaCreditCard, FaCar } from 'react-icons/fa';
import { RiSnapchatFill } from 'react-icons/ri';
import { Plus, Star, CheckCircle, DollarSign, Clock, FileText, CreditCard, User, Shield, Landmark, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { MultiSelect } from '@/components/ui/multi-select';
import { InsuranceVerificationUnified } from '@/components/insurance-verification-unified';
import VehicleRegistrationVerification from '@/components/vehicle-registration-verification';
import { INTEREST_TAGS, MAX_INTEREST_TAGS } from '@shared/constants';

// Helper function to format display name (convert "Last, First" to "First Last")
const formatDisplayName = (displayName: string | null | undefined): string => {
  if (!displayName) return '';
  
  // Check if name contains a comma (indicating "Last, First" format)
  if (displayName.includes(',')) {
    const parts = displayName.split(',').map(part => part.trim());
    if (parts.length === 2) {
      const [lastName, firstMiddle] = parts;
      return `${firstMiddle} ${lastName}`;
    }
  }
  
  // If no comma, return as-is with cleaned spacing
  return displayName.replace(/\s+/g, ' ').trim();
};

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

// Visual Setup Guide Component
const StripeSetupGuide = ({ 
  isVisible, 
  onClose 
}: { 
  isVisible: boolean;
  onClose: () => void;
}) => {
  if (!isVisible) return null;

  const setupSteps = [
    {
      id: 1,
      icon: <User className="w-5 h-5" />,
      title: "Business Information",
      description: "Fill out your business type (Individual) and personal details",
      tips: "Make sure your legal name matches your ID exactly"
    },
    {
      id: 2,
      icon: <Shield className="w-5 h-5" />,
      title: "Identity Verification", 
      description: "Upload a valid government-issued photo ID",
      tips: "Use a clear photo of your driver's license or passport"
    },
    {
      id: 3,
      icon: <Landmark className="w-5 h-5" />,
      title: "Bank Account Details",
      description: "Enter your bank account information for payouts",
      tips: "Double-check your routing and account numbers"
    },
    {
      id: 4,
      icon: <CreditCard className="w-5 h-5" />,
      title: "Tax Information",
      description: "Provide your Social Security Number or Tax ID",
      tips: "This is required for tax reporting purposes"
    },
    {
      id: 5,
      icon: <CheckCircle className="w-5 h-5" />,
      title: "Review & Submit",
      description: "Review all information and submit for approval",
      tips: "Processing typically takes 1-2 business days"
    }
  ];

  return (
    <div className="fixed right-4 top-20 bottom-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-40 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Driver Setup Guide</h2>
            <p className="text-xs text-gray-600 mt-1">Follow these steps in the Stripe popup window</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {setupSteps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  {step.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
                    Step {step.id}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-600 mb-1">
                  {step.description}
                </p>
                <div className="flex items-start space-x-1">
                  <span className="text-xs text-blue-600">💡</span>
                  <span className="text-xs text-blue-600 font-medium">
                    {step.tips}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Security Notice</h4>
              <p className="text-xs text-blue-700">
                Your banking and identity information is securely handled by Stripe. 
                Trek never sees your bank account details, SSN, or sensitive financial information.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-900">
              This guide will automatically close when you finish the setup
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { showErrorFromException, showError } = useErrorToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [snapchat, setSnapchat] = useState('');
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [isDriverLoading, setIsDriverLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [stripePopupWindow, setStripePopupWindow] = useState<Window | null>(null);

  // Fetch user profile data
  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ["/api/users/firebase", currentUser?.uid],
    enabled: !!currentUser?.uid,
    queryFn: async () => {
      const response = await fetch(`/api/users/firebase/${currentUser?.uid}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    }
  });

  // Handle automatic scrolling to payment section
  useEffect(() => {
    if (window.location.hash === '#payment' && dataLoaded) {
      const paymentSection = document.getElementById('payment-methods-section');
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [dataLoaded]);

  // Monitor Stripe popup window
  useEffect(() => {
    if (stripePopupWindow) {
      const checkClosed = setInterval(() => {
        if (stripePopupWindow.closed) {
          setShowSetupGuide(false);
          setStripePopupWindow(null);
          clearInterval(checkClosed);
          // Refresh driver status after popup closes with multiple attempts
          setTimeout(async () => {
            await loadDriverStatus();
            // Wait a bit more and try again to ensure Stripe has processed
            setTimeout(async () => {
              await loadDriverStatus();
              // Force a page refresh to ensure all data is synchronized
              window.location.reload();
            }, 3000);
          }, 1000);
        }
      }, 1000);

      return () => clearInterval(checkClosed);
    }
  }, [stripePopupWindow]);

  // Fetch user's payment methods
  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/payment-methods"],
    enabled: !!currentUser,
    queryFn: async () => {
      const response = await fetch('/api/payment-methods', {
        headers: {
          'x-user-id': currentUser?.uid || '',
          'x-user-email': currentUser?.email || '',
          'x-user-name': currentUser?.displayName || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      return response.json();
    }
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
        description: "Your payment method has been successfully removed.",
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

  // Delete driver account mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/driver/account", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bank Account Deleted",
        description: "Your bank account setup has been successfully removed.",
      });
      // Immediately update the UI to show the account is deleted
      setDriverStatus(null);
      // Refresh the data in the background
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/driver/status"] });
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete bank account setup.",
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

  const handleDeletePaymentMethod = (paymentMethodId: string) => {
    deletePaymentMutation.mutate(paymentMethodId);
  };

  const handleDeleteDriverAccount = () => {
    deleteDriverMutation.mutate();
  };

  const loadDriverStatus = async () => {
    if (!currentUser) return;
    
    setIsDriverLoading(true);
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
        console.error('Failed to load driver status');
      }
    } catch (error) {
      console.error('Error loading driver status:', error);
    } finally {
      setIsDriverLoading(false);
    }
  };

  const sendVerificationCode = async () => {
    if (!phone) {
      toast({
        title: "Phone Required",
        description: "Please enter a phone number first.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await fetch('/api/verify-phone/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsCodeSent(true);
        setShowPhoneVerification(true);
        toast({
          title: "Verification Code Sent",
          description: "Please check your phone for the verification code.",
        });
      } else {
        toast({
          title: "Failed to Send Code",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyPhoneNumber = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify-phone/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.uid || '',
          'x-user-email': currentUser?.email || '',
          'x-user-name': currentUser?.displayName || ''
        },
        body: JSON.stringify({ 
          phoneNumber: phone,
          verificationCode: verificationCode 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowPhoneVerification(false);
        setIsCodeSent(false);
        setVerificationCode('');
        setIsEditing(false);
        toast({
          title: "Welcome to Trek!",
          description: data.welcomeMessage || "Your phone has been verified successfully!",
        });
        // Refresh user data to get updated phone verification status
        refetchUser();
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Invalid verification code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify phone number. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
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
  }, [currentUser]);

  // Handle hash anchor scrolling
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && dataLoaded) {
      const element = document.getElementById(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100); // Small delay to ensure content is rendered
      }
    }
  }, [dataLoaded]);

  const loadUserProfile = async () => {
    try {
      console.log('[PROFILE] Loading user profile for:', currentUser?.uid);
      setLoading(true);
      const response = await fetch(`/api/users/firebase/${currentUser?.uid}`);
      console.log('[PROFILE] Profile API response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('[PROFILE] Loaded user data:', userData);
        setPhone(userData.phone || '');
        setInstagram(userData.instagram || '');
        setSnapchat(userData.snapchat || '');
        setInterestTags(userData.interestTags || []);
        // If no phone number exists, start in edit mode
        if (!userData.phone) {
          console.log('[PROFILE] No phone number found, enabling edit mode');
          setIsEditing(true);
        }
        setDataLoaded(true);
        console.log('[PROFILE] Profile loaded successfully');
      } else if (response.status === 404) {
        // User doesn't exist in database - create them
        console.log('[PROFILE] User not found, creating new user');
        await createNewUser();
      } else {
        throw new Error(`Failed to load profile: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[PROFILE] Error loading profile:', error);
      showErrorFromException(error, 'profile');
    } finally {
      setLoading(false);
    }
  };

  const createNewUser = async () => {
    try {
      console.log('[PROFILE] Creating new user in database');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUid: currentUser?.uid,
          email: currentUser?.email || '',
          displayName: currentUser?.displayName || 'Trek User',
          photoUrl: currentUser?.photoURL || null,
          emailVerified: currentUser?.emailVerified || false
        })
      });

      if (response.ok) {
        console.log('[PROFILE] User created successfully');
        // Set default empty values and enable edit mode for new users
        setPhone('');
        setInstagram('');
        setSnapchat('');
        setInterestTags([]);
        setIsEditing(true);
        setDataLoaded(true);
      } else {
        throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[PROFILE] Error creating user:', error);
      showErrorFromException(error, 'profile');
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
          interestTags,
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your contact information has been saved successfully.",
        });
        setIsEditing(false);
        
        // Signal other components that profile was updated
        localStorage.setItem('profile_updated', Date.now().toString());
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'profile_updated',
          newValue: Date.now().toString()
        }));
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showErrorFromException(error, 'profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    loadUserProfile(); // Reset to original values
    setIsEditing(false);
  };

  // Auto-save function with debouncing
  const handleAutoSave = async (phoneValue: string, instagramValue: string, snapchatValue: string, tagsValue: string[]) => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/users/firebase/${currentUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneValue,
          instagram: instagramValue,
          snapchat: snapchatValue,
          interestTags: tagsValue,
        }),
      });

      if (response.ok) {
        // Signal other components that profile was updated
        localStorage.setItem('profile_updated', Date.now().toString());
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'profile_updated',
          newValue: Date.now().toString()
        }));
      }
    } catch (error) {
      console.error('Error auto-saving profile:', error);
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
          // Open Stripe Express onboarding in popup
          const popup = window.open(
            result.onboardingUrl,
            'stripe-onboarding',
            'width=800,height=600,scrollbars=yes,resizable=yes'
          );
          
          if (popup) {
            setStripePopupWindow(popup);
            setShowSetupGuide(true);
            
            // Monitor popup for completion with automatic closing
            let checkInterval: NodeJS.Timeout;
            let statusCheckInterval: NodeJS.Timeout;
            
            const checkCompletion = async () => {
              try {
                // Check if driver status has been updated (indicates completion)
                const statusResponse = await fetch('/api/driver/status', {
                  headers: {
                    'x-user-id': currentUser.uid,
                    'x-user-email': currentUser.email || '',
                    'x-user-name': currentUser.displayName || ''
                  }
                });
                
                if (statusResponse.ok) {
                  const status = await statusResponse.json();
                  // If onboarding is complete and payouts are enabled, setup is done
                  if (status.isOnboarded && status.payoutsEnabled) {
                    clearInterval(checkInterval);
                    clearInterval(statusCheckInterval);
                    
                    // Close the popup automatically
                    popup.close();
                    setStripePopupWindow(null);
                    setShowSetupGuide(false);
                    
                    toast({
                      title: "Setup Complete!",
                      description: "Your bank account is now ready to receive payments.",
                    });
                    
                    // Refresh the profile page
                    setTimeout(() => {
                      loadDriverStatus();
                    }, 500);
                    
                    return true;
                  }
                }
              } catch (error) {
                console.log('Status check error:', error);
              }
              return false;
            };
            
            // Check for popup closure (manual close)
            checkInterval = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkInterval);
                clearInterval(statusCheckInterval);
                setStripePopupWindow(null);
                setShowSetupGuide(false);
                // Refresh status after popup closes
                setTimeout(() => {
                  loadDriverStatus();
                }, 1000);
              }
            }, 1000);
            
            // Check for completion status every 3 seconds
            statusCheckInterval = setInterval(checkCompletion, 3000);
            
            // Also check immediately after 2 seconds
            setTimeout(checkCompletion, 2000);
          } else {
            // Fallback to redirect if popup blocked
            window.location.href = result.onboardingUrl;
          }
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

  // Check if user has phone number (required) and any additional contact information
  const hasRequiredContactInfo = phone && phone.trim().length > 0;
  const hasAdditionalContactInfo = instagram || snapchat;

  // Show loading spinner while data is being loaded or no user
  if (!currentUser || (loading && !dataLoaded)) {
    console.log('[PROFILE] Showing loading spinner - currentUser:', !!currentUser, 'loading:', loading, 'dataLoaded:', dataLoaded);
    return (
      <div className="container px-4 py-6 mx-auto max-w-2xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  console.log('[PROFILE] Rendering profile page - loading:', loading, 'dataLoaded:', dataLoaded, 'currentUser:', currentUser?.email);

  return (
    <div className="container px-4 py-6 mx-auto max-w-2xl space-y-6">
      {/* Phone Number Required Banner */}
      {!hasRequiredContactInfo && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Phone Number Required
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>Please add your phone number to access ride features. This is required for safe communication between drivers and passengers.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Verification Required Banner */}
      {hasRequiredContactInfo && userData && !userData.phoneVerified && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Phone Verification Required
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Your phone number must be verified via SMS before you can access ride features. Please verify your phone number below.</p>
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
              <h3 className="font-semibold text-gray-900">{formatDisplayName(currentUser.displayName) || 'User'}</h3>
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

          {/* Always visible Phone Number section */}
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                <FaPhone className="text-primary" />
                Phone Number (Required)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Phone number (any format)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => handleAutoSave(phone, instagram, snapchat, interestTags)}
                  className="flex-1"
                  required
                  disabled={userData?.phoneVerified}
                />
                {phone && phone.length > 0 && !userData?.phoneVerified && (
                  <Button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={isSendingCode}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isSendingCode ? 'Sending...' : 'Verify'}
                  </Button>
                )}
                {userData?.phoneVerified && (
                  <div className="flex items-center gap-2 text-green-600 px-3 py-2 bg-green-50 rounded-md">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Required for SMS ride notifications and safety</p>
            </div>

            {/* Always visible Interest Tags section */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="interest-tags" className="flex items-center gap-2 mb-2">
                <Star className="text-primary w-4 h-4" />
                Interest Tags (Required)
              </Label>
              <MultiSelect
                options={INTEREST_TAGS.map(tag => ({ value: tag, label: tag }))}
                value={interestTags}
                onChange={(newTags) => {
                  setInterestTags(newTags);
                  handleAutoSave(phone, instagram, snapchat, newTags);
                }}
                placeholder="Select up to 5 interests..."
                maxSelections={MAX_INTEREST_TAGS}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Help other students know what you're like! Choose up to {MAX_INTEREST_TAGS} tags.
              </p>
            </div>

            {!phone && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Phone number required</p>
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-primary hover:bg-orange-600 text-white"
                >
                  Add Phone Number
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Driver Setup Section */}
      <Card id="driver-setup">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCar className="w-5 h-5" />
            Driver Setup
            {/* Show checkmark if all verifications are complete */}
            {userData?.vehicleRegistrationVerified && 
             userData?.insuranceVerified && 
             driverStatus?.isOnboarded && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </CardTitle>
          <CardDescription>
            Complete all three verification steps to become a verified driver
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {/* Vehicle Registration Verification */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                userData?.vehicleRegistrationVerified ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-gray-200'
              }`}
              onClick={() => window.location.href = '/vehicle-verification'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    userData?.vehicleRegistrationVerified 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {userData?.vehicleRegistrationVerified ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">1</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">Vehicle Registration Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your vehicle registration and provide vehicle details
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {userData?.vehicleRegistrationVerified ? (
                    <div className="text-green-600 text-sm font-medium">Verified</div>
                  ) : userData?.vehicleRegistrationStatus === 'pending' ? (
                    <div className="text-yellow-600 text-sm font-medium">Under Review</div>
                  ) : userData?.vehicleRegistrationStatus === 'rejected' ? (
                    <div className="text-red-600 text-sm font-medium">Rejected</div>
                  ) : (
                    <div className="text-gray-500 text-sm">Click to start →</div>
                  )}
                </div>
              </div>
            </div>

            {/* Insurance Verification */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                userData?.insuranceVerified ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-gray-200'
              }`}
              onClick={() => window.location.href = '/insurance-verification'}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    userData?.insuranceVerified 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {userData?.insuranceVerified ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">2</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">Insurance Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify your auto insurance policy and upload documents
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {userData?.insuranceVerified ? (
                    <div className="text-green-600 text-sm font-medium">Verified</div>
                  ) : userData?.insuranceStatus === 'pending' ? (
                    <div className="text-yellow-600 text-sm font-medium">Under Review</div>
                  ) : userData?.insuranceStatus === 'rejected' ? (
                    <div className="text-red-600 text-sm font-medium">Rejected</div>
                  ) : (
                    <div className="text-gray-500 text-sm">Click to start →</div>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Account Setup */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                driverStatus?.isOnboarded ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-gray-200'
              }`}
              onClick={() => {
                if (driverStatus?.isOnboarded) {
                  openDashboard();
                } else {
                  window.location.href = '/bank-setup';
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    driverStatus?.isOnboarded 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {driverStatus?.isOnboarded ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">3</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">Bank Account Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Set up your bank account to receive payments from passengers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {driverStatus?.isOnboarded ? (
                    <div className="text-green-600 text-sm font-medium">Verified</div>
                  ) : (
                    <div className="text-gray-500 text-sm">Click to start →</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Overall Status */}
          {userData?.vehicleRegistrationVerified && 
           userData?.insuranceVerified && 
           driverStatus?.isOnboarded && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Driver setup complete!</strong> You can now post rides and accept passengers.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">Secure Verification Process</h4>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  All your sensitive information is encrypted and securely processed. Trek never stores your banking details or SSN.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Payment Methods Section */}
      <Card id="payment-methods-section">
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
                      <div className="flex items-center gap-3 flex-1">
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
                      <div className="flex items-center gap-2">
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
                        <button
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          disabled={deletePaymentMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
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
              <div className="space-y-4">
                <Button
                  onClick={handleAddPaymentMethod}
                  disabled={setupPaymentMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {setupPaymentMutation.isPending ? "Setting up..." : "Add Payment Method"}
                </Button>

                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">Secure Payment Processing</h4>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Your payment information is encrypted and securely processed by Stripe. Trek never stores or sees your credit card details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Phone Verification Dialog */}
      <Dialog open={showPhoneVerification} onOpenChange={setShowPhoneVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaPhone className="text-orange-500" />
              Verify Phone Number
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                We've sent a 6-digit verification code to:
              </p>
              <p className="font-medium text-lg">{phone}</p>
            </div>
            
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={verifyPhoneNumber}
                disabled={isVerifying || verificationCode.length !== 6}
                className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
              >
                {isVerifying ? 'Verifying...' : 'Verify Phone'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPhoneVerification(false);
                  setVerificationCode('');
                  setIsCodeSent(false);
                }}
                disabled={isVerifying}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={sendVerificationCode}
                disabled={isSendingCode}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                {isSendingCode ? 'Sending...' : 'Resend Code'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visual Setup Guide - appears when Stripe popup is open */}
      <StripeSetupGuide 
        isVisible={showSetupGuide} 
        onClose={() => {
          setShowSetupGuide(false);
          setStripePopupWindow(null);
          // Refresh driver status when manually closed
          loadDriverStatus();
        }}
      />
    </div>
  );
}