import React from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  User,
  Building,
  FileText,
  Camera
} from 'lucide-react';

export default function StripeSetupGuide() {
  const [, setLocation] = useLocation();

  const steps = [
    {
      title: "Personal Information",
      icon: <User className="w-5 h-5" />,
      description: "You'll need to provide basic personal details",
      items: [
        "Full legal name (as it appears on your ID)",
        "Date of birth",
        "Social Security Number (last 4 digits)",
        "Phone number",
        "Home address"
      ],
      tip: "Make sure all information matches your government-issued ID exactly"
    },
    {
      title: "Business Information",
      icon: <Building className="w-5 h-5" />,
      description: "Since you're driving for Trek, you'll select individual/sole proprietor",
      items: [
        "Business type: Individual/Sole Proprietor",
        "Business category: Transportation",
        "Business description: Rideshare driving services",
        "Website: Not required for individual drivers"
      ],
      tip: "Most student drivers select 'Individual' as their business type"
    },
    {
      title: "Bank Account Details",
      icon: <CreditCard className="w-5 h-5" />,
      description: "This is where you'll receive your ride payments",
      items: [
        "Bank account number",
        "Routing number",
        "Account type (Checking or Savings)",
        "Bank account holder name (must match your name)"
      ],
      tip: "Double-check your bank details - incorrect info will delay payments"
    },
    {
      title: "Identity Verification",
      icon: <FileText className="w-5 h-5" />,
      description: "Stripe needs to verify your identity for security",
      items: [
        "Government-issued photo ID (Driver's License, Passport, or State ID)",
        "Clear photo of the front and back of your ID",
        "Sometimes additional documents may be requested"
      ],
      tip: "Take photos in good lighting with all text clearly visible"
    }
  ];

  const requirements = [
    {
      title: "Age Requirement",
      description: "Must be 18 years or older",
      icon: <CheckCircle className="w-4 h-4 text-green-600" />
    },
    {
      title: "Valid ID",
      description: "Government-issued photo identification",
      icon: <CheckCircle className="w-4 h-4 text-green-600" />
    },
    {
      title: "US Bank Account",
      description: "Active checking or savings account",
      icon: <CheckCircle className="w-4 h-4 text-green-600" />
    },
    {
      title: "SSN",
      description: "Social Security Number for tax purposes",
      icon: <CheckCircle className="w-4 h-4 text-green-600" />
    }
  ];

  const timeline = [
    {
      step: "Instant",
      title: "Account Creation",
      description: "Create your Stripe Connect account through Trek"
    },
    {
      step: "5-10 min",
      title: "Information Entry",
      description: "Fill out personal and bank account information"
    },
    {
      step: "1-2 business days",
      title: "Verification",
      description: "Stripe verifies your identity and bank account"
    },
    {
      step: "Immediately",
      title: "Start Earning",
      description: "Begin accepting ride payments once verified"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/profile")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Stripe Driver Setup Guide</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Follow this step-by-step guide to set up your Stripe Connect account and start receiving payments for your Trek rides.
          </p>
        </div>
      </div>

      {/* Benefits Section */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <DollarSign className="w-6 h-6 mr-2" />
            Why Set Up Stripe?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Secure Payments</h4>
                <p className="text-sm text-gray-600">Bank-level security for all transactions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">Fast Transfers</h4>
                <p className="text-sm text-gray-600">Payments arrive in 1-2 business days</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium">No Hidden Fees</h4>
                <p className="text-sm text-gray-600">Trek covers all processing fees</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Before You Start</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">Make sure you have these items ready:</p>
          <div className="grid md:grid-cols-2 gap-4">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {req.icon}
                <div>
                  <h4 className="font-medium">{req.title}</h4>
                  <p className="text-sm text-gray-600">{req.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Setup Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {item.step}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <div className="space-y-6 mb-8">
        <h2 className="text-2xl font-bold text-center">Step-by-Step Setup Process</h2>
        
        {steps.map((step, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mr-3">
                  {index + 1}
                </div>
                {step.icon}
                <span className="ml-2">{step.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{step.description}</p>
              <ul className="space-y-2 mb-4">
                {step.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              {step.tip && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      <strong>Tip:</strong> {step.tip}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Common Issues */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
            Common Issues & Solutions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-orange-800">Account Verification Delayed</h4>
              <p className="text-sm text-gray-600">
                This usually happens when documents are unclear or information doesn't match. Double-check all details and resubmit clear photos.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-orange-800">Bank Account Verification Failed</h4>
              <p className="text-sm text-gray-600">
                Ensure your bank account is active and the routing/account numbers are correct. Some banks may require additional verification.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-orange-800">Additional Documentation Requested</h4>
              <p className="text-sm text-gray-600">
                Stripe may request additional documents for verification. Respond promptly to avoid delays in your account approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="mb-8 bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            If you run into any issues during setup, we're here to help:
          </p>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Trek Support:</strong> Contact us through the app or email support@trek.com
            </p>
            <p className="text-sm">
              <strong>Stripe Support:</strong> Visit{" "}
              <a 
                href="https://support.stripe.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center"
              >
                support.stripe.com
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          size="lg" 
          onClick={() => setLocation("/profile")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Ready to Set Up Stripe
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => setLocation("/help")}
        >
          Still Have Questions?
        </Button>
      </div>
    </div>
  );
}