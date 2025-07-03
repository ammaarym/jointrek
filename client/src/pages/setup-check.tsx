import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth-fixed';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Car, CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface SetupCheckProps {
  mode: 'request' | 'post';
}

export default function SetupCheck({ mode }: SetupCheckProps) {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [hasDriverSetup, setHasDriverSetup] = useState(false);
  const [hasInsuranceVerified, setHasInsuranceVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSetup = async () => {
      if (!currentUser) return;

      try {
        // Check payment method status (only needed for requesting rides)
        if (mode === 'request') {
          const paymentResponse = await fetch('/api/users/payment-status', {
            headers: {
              'x-user-id': currentUser.uid,
              'x-user-email': currentUser.email || '',
              'x-user-name': currentUser.displayName || ''
            }
          });
          
          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            setHasPaymentMethod(!!paymentData.hasPaymentMethod);
            
            // Auto-redirect if setup is complete
            if (paymentData.hasPaymentMethod) {
              setLocation('/request-ride');
              return;
            }
          }
        }

        // Check driver setup status (only needed for posting rides)
        if (mode === 'post') {
          const [driverResponse, insuranceResponse] = await Promise.all([
            fetch('/api/driver/status', {
              headers: {
                'x-user-id': currentUser.uid,
                'x-user-email': currentUser.email || '',
                'x-user-name': currentUser.displayName || ''
              }
            }),
            fetch('/api/users/insurance/status', {
              headers: {
                'x-user-id': currentUser.uid,
                'x-user-email': currentUser.email || '',
                'x-user-name': currentUser.displayName || ''
              }
            })
          ]);
          
          if (driverResponse.ok) {
            const driverData = await driverResponse.json();
            setHasDriverSetup(driverData.isOnboarded);
          }

          if (insuranceResponse.ok) {
            const insuranceData = await insuranceResponse.json();
            setHasInsuranceVerified(insuranceData.hasInsurance);
          }

          // Auto-redirect if both setups are complete
          if (driverResponse.ok && insuranceResponse.ok) {
            const driverData = await driverResponse.json();
            const insuranceData = await insuranceResponse.json();
            
            if (driverData.isOnboarded && insuranceData.hasInsurance) {
              setLocation('/post-ride');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking setup status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSetup();
  }, [currentUser, mode, setLocation]);

  const canProceed = mode === 'request' ? hasPaymentMethod : (hasDriverSetup && hasInsuranceVerified);

  const handleProceed = () => {
    if (mode === 'request') {
      setLocation('/request-ride');
    } else {
      setLocation('/post-ride');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Checking setup...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'request' ? 'Request a Ride' : 'Post a Ride'}
        </h1>
        <p className="text-gray-600">
          Before you can {mode === 'request' ? 'request rides' : 'post rides'}, please complete the required setup.
        </p>
      </div>

      <div className="space-y-6">
        {/* Payment Method Card (only for requesting rides) */}
        {mode === 'request' && (
          <Card 
            className={`${hasPaymentMethod ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors'}`}
            onClick={!hasPaymentMethod ? () => setLocation('/profile#payment') : undefined}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {hasPaymentMethod ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                <CreditCard className="w-6 h-6" />
                Payment Method
                {!hasPaymentMethod && (
                  <span className="ml-auto text-sm text-orange-600 font-normal">Click to setup →</span>
                )}
              </CardTitle>
              <CardDescription>
                {hasPaymentMethod 
                  ? 'You have a payment method set up and ready to use.'
                  : 'Add a payment method to pay for rides securely. Click anywhere on this card to get started.'
                }
              </CardDescription>
            </CardHeader>
            {!hasPaymentMethod && (
              <CardContent>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/profile#payment');
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Add Payment Method
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Driver Setup Card (only for posting rides) */}
        {mode === 'post' && (
          <Card 
            className={`${hasDriverSetup ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors'}`}
            onClick={!hasDriverSetup ? () => setLocation('/profile#bank-account') : undefined}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {hasDriverSetup ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                <Car className="w-6 h-6" />
                Bank Account Setup
                {!hasDriverSetup && (
                  <span className="ml-auto text-sm text-orange-600 font-normal">Click to setup →</span>
                )}
              </CardTitle>
              <CardDescription>
                {hasDriverSetup 
                  ? 'Your bank account is set up and ready to receive payments.'
                  : 'Add your bank account information to receive payments from passengers. Click anywhere on this card to get started.'
                }
              </CardDescription>
            </CardHeader>
            {!hasDriverSetup && (
              <CardContent>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/profile#bank-account');
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Set Up Bank Account
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Insurance Verification Card (only for posting rides) */}
        {mode === 'post' && (
          <Card 
            className={`${hasInsuranceVerified ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors'}`}
            onClick={!hasInsuranceVerified ? () => setLocation('/profile#insurance') : undefined}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {hasInsuranceVerified ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                )}
                <Shield className="w-6 h-6" />
                Insurance Verification
                {!hasInsuranceVerified && (
                  <span className="ml-auto text-sm text-orange-600 font-normal">Click to setup →</span>
                )}
              </CardTitle>
              <CardDescription>
                {hasInsuranceVerified 
                  ? 'Your auto insurance is verified and ready for rides.'
                  : 'Verify your auto insurance before posting rides. This ensures passenger safety and meets Trek\'s driver requirements. Click anywhere on this card to get started.'
                }
              </CardDescription>
            </CardHeader>
            {!hasInsuranceVerified && (
              <CardContent>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation('/profile#insurance');
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Verify Insurance Now
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">🔒 Your Information is Secure</h3>
          <p className="text-green-700 text-sm">
            Trek never sees your banking or credit card details. All financial information is securely 
            processed by Stripe, our PCI DSS compliant payment processor. Your data is encrypted and protected.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/find-rides')}
            className="flex-1"
          >
            Back to Find Rides
          </Button>
          
          {canProceed && (
            <Button 
              onClick={handleProceed}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              Continue to {mode === 'request' ? 'Request Ride' : 'Post Ride'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}