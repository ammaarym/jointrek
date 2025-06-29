import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-stone-600 hover:text-stone-900">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-stone-900">Terms of Service</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl">
        <div className="prose prose-stone max-w-none">
          
          {/* Introduction */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-3 sm:mb-4">Welcome to Trek</h2>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
              These Terms of Service ("Terms") govern your use of Trek, a ride-sharing platform designed exclusively for University of Florida students. By accessing or using Trek, you agree to be bound by these Terms.
            </p>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 sm:mt-4">
              <strong>Last Updated:</strong> June 29, 2025
            </p>
          </div>

          {/* Eligibility */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">1. Eligibility</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• You must be a current University of Florida student with a valid @ufl.edu email address</p>
              <p>• You must be at least 18 years old or have parental consent</p>
              <p>• You must provide accurate and complete information during registration</p>
              <p>• You are responsible for maintaining the confidentiality of your account</p>
            </div>
          </section>

          {/* Platform Use */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">2. Platform Use</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p><strong>Permitted Use:</strong> Trek is for arranging rides between UF students for legitimate transportation purposes.</p>
              <p><strong>Prohibited Activities:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Using fake or fraudulent information</li>
                <li>• Harassment, discrimination, or inappropriate behavior</li>
                <li>• Commercial use outside of ride-sharing</li>
                <li>• Sharing contact information for non-ride purposes</li>
                <li>• Circumventing safety features or verification systems</li>
              </ul>
            </div>
          </section>

          {/* Ride Arrangements */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">3. Ride Arrangements</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p><strong>Driver Responsibilities:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Valid driver's license and insurance</li>
                <li>• Safe and reliable vehicle</li>
                <li>• Compliance with all traffic laws</li>
                <li>• Honest representation of ride details</li>
              </ul>
              <p><strong>Passenger Responsibilities:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Arriving on time and at designated locations</li>
                <li>• Respectful behavior during rides</li>
                <li>• Payment as agreed upon</li>
                <li>• Following driver's reasonable requests</li>
              </ul>
            </div>
          </section>

          {/* Payments and Refunds */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">4. Payments and Refunds</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• All payments are processed securely through Stripe</p>
              <p>• Passengers are charged when rides are completed, not when booked</p>
              <p>• Automatic refunds are issued for cancelled or incomplete rides</p>
              <p>• Trek charges a small platform fee for payment processing</p>
              <p>• Drivers receive payouts directly to their verified bank accounts</p>
              <p>• Disputes should be reported within 48 hours of ride completion</p>
            </div>
          </section>

          {/* Safety and Security */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">5. Safety and Security</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• All users must verify their phone number via SMS</p>
              <p>• Ride verification codes are required for ride start and completion</p>
              <p>• Report safety concerns immediately through the app</p>
              <p>• Trek reserves the right to suspend accounts for safety violations</p>
              <p>• Users participate in rides at their own risk</p>
            </div>
          </section>

          {/* Privacy and Data */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">6. Privacy and Data</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• We collect only necessary information for ride coordination and safety</p>
              <p>• Financial information is handled exclusively by Stripe</p>
              <p>• Contact information is shared only with matched riders</p>
              <p>• We use SMS notifications for important ride updates</p>
              <p>• Data is stored securely and not shared with third parties</p>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">7. Cancellation Policy</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• Rides can be cancelled by drivers or passengers</p>
              <p>• Frequent cancellations may result in account restrictions</p>
              <p>• Last-minute cancellations should be avoided for courtesy</p>
              <p>• Automatic refunds are processed for cancelled rides</p>
              <p>• Repeated cancellation violations may result in account suspension</p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">8. Limitation of Liability</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• Trek is a platform that connects users; we are not a transportation company</p>
              <p>• Users are responsible for their own safety and interactions</p>
              <p>• Trek is not liable for accidents, injuries, or disputes between users</p>
              <p>• Maximum liability is limited to the amount paid through the platform</p>
              <p>• Users should maintain appropriate insurance coverage</p>
            </div>
          </section>

          {/* Account Termination */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">9. Account Termination</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• Trek may suspend or terminate accounts for Terms violations</p>
              <p>• Users may delete their accounts at any time</p>
              <p>• Pending payments will be processed before account closure</p>
              <p>• Some data may be retained for legal and safety purposes</p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">10. Changes to Terms</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>• Trek may update these Terms with reasonable notice</p>
              <p>• Continued use constitutes acceptance of updated Terms</p>
              <p>• Major changes will be communicated via email or app notification</p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-2 sm:mb-3">11. Contact Information</h3>
            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-stone-700">
              <p>For questions about these Terms or Trek platform:</p>
              <p>• Email: support@jointrek.com</p>
              <p>• Website: jointrek.replit.app</p>
              <p>• Platform: Use the Help section in the app</p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-stone-200">
            <p className="text-xs sm:text-sm text-stone-600 text-center">
              By using Trek, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <div className="flex justify-center mt-4 sm:mt-6">
              <Link href="/">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8">
                  Return to Trek
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}