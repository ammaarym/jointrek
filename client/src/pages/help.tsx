import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FaPhone, FaUniversity, FaCar, FaCreditCard, FaDollarSign, FaShieldAlt, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { CheckCircle, AlertCircle, Info, DollarSign, CreditCard, Phone } from 'lucide-react';

export default function Help() {
  return (
    <div className="container px-4 py-6 mx-auto max-w-4xl space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Guide</h1>
        <p className="text-lg text-gray-600">
          Everything you need to know about using Trek's ride-sharing platform
        </p>
      </div>

      {/* Phone Number Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FaPhone className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-base sm:text-lg">Phone Number Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Phone className="h-5 w-5 flex-shrink-0" />
            <AlertDescription className="text-sm sm:text-base">
              A verified phone number is required to use Trek's ride-sharing features.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Why Phone Verification is Required:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Ensures safety and accountability for all users</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Enables SMS notifications for ride updates and coordination</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Provides direct contact method between riders and drivers</span>
              </li>
            </ul>
            
            <h3 className="font-semibold text-gray-900 mt-4">Phone Number Format:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Enter your phone number in any format - we'll automatically format it correctly</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Examples: (813) 555-1234, 813-555-1234, 8135551234, +1 813 555 1234</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Must be a valid 10-digit US phone number</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Prevents spam and fake accounts</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">How to Add Your Phone Number:</h3>
            <ol className="space-y-1 text-sm text-blue-700">
              <li>1. Go to your Profile page</li>
              <li>2. Click "Edit Profile" button</li>
              <li>3. Enter your phone number in the required field</li>
              <li>4. Save your contact information</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* UFL Email Verification Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FaUniversity className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <span className="text-base sm:text-lg">University of Florida Email Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-5 w-5 flex-shrink-0" />
            <AlertDescription className="text-sm sm:text-base">
              Trek is exclusively for University of Florida students, staff, and faculty.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Accepted Email Domains:</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base">@ufl.edu (Students and Faculty)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base">@shands.ufl.edu (Medical Center Staff)</span>
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">Email Verification Process:</h3>
            <ol className="space-y-1 text-sm text-orange-700">
              <li>1. Sign up using your UFL email address</li>
              <li>2. Check your email for verification link</li>
              <li>3. Click the verification link to activate your account</li>
              <li>4. Complete your profile setup</li>
            </ol>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <AlertDescription className="text-yellow-800 text-sm sm:text-base">
              Only verified UFL email addresses can access the platform. Personal emails (Gmail, Yahoo, etc.) are not accepted.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Driver Setup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <FaCar className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-base sm:text-lg">Driver Setup & Bank Account Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <DollarSign className="h-5 w-5 flex-shrink-0" />
            <AlertDescription className="text-sm sm:text-base">
              Driver setup includes identity verification and bank account connection for secure payments.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">What You'll Need for Driver Setup:</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-3 text-sm sm:text-base">
                  <FaShieldAlt className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  Identity Verification
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Government-issued photo ID</li>
                  <li>• Social Security Number</li>
                  <li>• Personal information verification</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-3 text-sm sm:text-base">
                  <FaDollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
                  Banking Information
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Bank account number</li>
                  <li>• Routing number</li>
                  <li>• Account verification</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Driver Setup Process:</h3>
            <ol className="space-y-1 text-sm text-green-700">
              <li>1. Go to your Profile page</li>
              <li>2. Scroll to the "Driver Setup" section</li>
              <li>3. Click "Start Driver Setup"</li>
              <li>4. Complete Stripe Connect onboarding</li>
              <li>5. Provide identity and banking information</li>
              <li>6. Wait for verification (usually 24-48 hours)</li>
            </ol>
          </div>

          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <AlertDescription className="text-green-800 text-sm sm:text-base">
              All driver information is securely processed through Stripe Connect, a trusted payment platform used by millions of businesses worldwide.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Passenger Payment Methods Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCreditCard className="w-5 h-5 text-purple-600" />
            Passenger Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Passengers must add a payment method to request rides and make payments.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Accepted Payment Methods:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Credit Cards (Visa, Mastercard, American Express, Discover)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Debit Cards</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Apple Pay</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Google Pay</span>
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">How to Add Payment Method:</h3>
            <ol className="space-y-1 text-sm text-purple-700">
              <li>1. Go to your Profile page</li>
              <li>2. Scroll to "Payment Methods" section</li>
              <li>3. Click "Add Payment Method"</li>
              <li>4. Enter your card or payment information</li>
              <li>5. Save your payment method</li>
              <li>6. Set as default for future rides</li>
            </ol>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Your payment information is securely encrypted and stored with Stripe. Trek never stores your full card details.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Payment Process Explanation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaDollarSign className="w-5 h-5 text-green-600" />
            How Payment Process Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              Trek uses a secure two-step payment process to protect both drivers and passengers.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {/* Driver Payment Process */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaCar className="w-5 h-5 text-green-600" />
                For Drivers (Receiving Payments)
              </h3>
              
              <div className="space-y-3">
                <div className="flex gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-green-800">Ride Request Approval</h4>
                    <p className="text-sm text-green-700">When you approve a passenger's ride request, their payment method is authorized but not charged yet.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-green-800">Ride Completion</h4>
                    <p className="text-sm text-green-700">After the ride is completed and verified by both parties, the payment is processed and transferred to your bank account.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-green-800">Bank Transfer</h4>
                    <p className="text-sm text-green-700">Payments are automatically transferred to your verified bank account within 2-7 business days.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Payment Process */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaCreditCard className="w-5 h-5 text-purple-600" />
                For Passengers (Making Payments)
              </h3>
              
              <div className="space-y-3">
                <div className="flex gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium text-purple-800">Request Approval</h4>
                    <p className="text-sm text-purple-700">When a driver approves your ride request, we authorize your default payment method for the ride amount.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium text-purple-800">Authorization Hold</h4>
                    <p className="text-sm text-purple-700">Your card shows a temporary hold for the ride amount, but you're not charged until the ride is completed.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 bg-purple-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium text-purple-800">Final Charge</h4>
                    <p className="text-sm text-purple-700">After ride completion, the final charge is processed and you'll receive an email receipt.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Security */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FaShieldAlt className="w-4 h-4 text-blue-600" />
              Payment Security & Protection
            </h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• All transactions are processed through Stripe, a PCI-compliant payment processor</li>
              <li>• Your payment information is encrypted and never stored on Trek's servers</li>
              <li>• Dispute resolution available through Stripe for payment issues</li>
              <li>• Refunds processed automatically for cancelled rides</li>
              <li>• Real-time fraud monitoring and prevention</li>
            </ul>
          </div>

          {/* Payment Timeline */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Payment Timeline:</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <FaClock className="w-3 h-3" />
                <span><strong>Immediate:</strong> Payment authorization when ride is approved</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="w-3 h-3" />
                <span><strong>Upon completion:</strong> Final charge processed</span>
              </div>
              <div className="flex items-center gap-2">
                <FaClock className="w-3 h-3" />
                <span><strong>2-7 business days:</strong> Driver receives bank transfer</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Need More Help Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need More Help?</h3>
          <p className="text-gray-600 mb-4">
            If you have questions not covered in this guide, feel free to reach out to our support team.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Email: support@trek-rides.com</p>
            <p>Response time: Within 24 hours</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}