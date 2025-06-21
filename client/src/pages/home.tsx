import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CarTaxiFront, User, MapPin, Shield, Lock, Check, LogIn, UserPlus, ChevronDown, ChevronUp, CreditCard, UserCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-new";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  // Redirect authenticated users to profile (avoid redirect loops)
  useEffect(() => {
    if (!loading && currentUser && window.location.pathname === '/') {
      console.log("Home page: Authenticated user on home, redirecting to profile");
      window.location.replace('/profile');
    }
  }, [currentUser, loading]);

  const handleLogin = () => {
    console.log("[DEBUG] Home page login clicked");
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/login");
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-white text-black">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="grid md:grid-cols-1 gap-8 items-center text-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Share rides with fellow{" "}
                <span style={{ color: '#B8956B' }}>Gators</span>
              </h1>
              <p className="text-lg mb-8 text-stone-700 max-w-3xl mx-auto">
                The safe, convenient way for UF students to carpool to campus,
                back home, or anywhere in between.
              </p>
              
              {currentUser ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    className="text-white px-6 py-6 h-auto rounded-md font-medium transition text-center shadow-lg"
                    style={{ backgroundColor: '#B8956B' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A6855A'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B8956B'}
                  >
                    <Link href="/find-rides">Find a Ride</Link>
                  </Button>
                  <Button
                    asChild
                    className="text-white px-6 py-6 h-auto rounded-md font-medium transition text-center shadow-lg"
                    style={{ backgroundColor: '#9B7F56' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8A6F47'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9B7F56'}
                  >
                    <Link href="/post-ride">Offer a Ride</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-2xl mx-auto">
                  <div className="bg-white p-6 rounded-lg mb-6 text-left w-full shadow-md" style={{ borderColor: '#D4C4A8', borderWidth: '1px' }}>
                    <h3 className="font-semibold text-lg flex items-center mb-2" style={{ color: '#8A6F47' }}>
                      <Lock className="w-5 h-5 mr-2" style={{ color: '#B8956B' }} />
                      Please sign in to continue
                    </h3>
                    <p className="text-stone-700 mb-3">
                      Trek is exclusively for University of Florida students. You'll need to sign in with your UF email to access rides.
                    </p>
                    <div className="flex justify-center mt-4">
                      <Button 
                        className="text-white flex items-center justify-center px-8 py-3 text-lg shadow-lg"
                        style={{ backgroundColor: '#B8956B' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A6855A'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B8956B'}
                        onClick={handleLogin}
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full">
                    <div className="flex items-start">
                      <div className="shrink-0 rounded-full p-2 mt-1 mr-3" style={{ backgroundColor: '#F0E6D6', borderColor: '#D4C4A8', borderWidth: '1px' }}>
                        <Shield className="w-5 h-5" style={{ color: '#8A6F47' }} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-stone-900">UF Students Only</h4>
                        <p className="text-sm text-stone-700">Verified UF emails ensure you're traveling with fellow Gators.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="shrink-0 rounded-full p-2 mt-1 mr-3" style={{ backgroundColor: '#F0E6D6', borderColor: '#D4C4A8', borderWidth: '1px' }}>
                        <Check className="w-5 h-5" style={{ color: '#8A6F47' }} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-stone-900">Secure & Easy</h4>
                        <p className="text-sm text-stone-700">Find rides or offer your own in just a few clicks after signing in.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-stone-900">
            How Trek Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: 'linear-gradient(to bottom right, #F0E6D6, #E8DCC6)', borderColor: '#D4C4A8', borderWidth: '1px' }}>
                <User className="h-6 w-6" style={{ color: '#8A6F47' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-stone-900">Sign Up</h3>
              <p className="text-stone-700">
                Create an account using your UF email to join the Gator community.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: 'linear-gradient(to bottom right, #F0E6D6, #E8DCC6)', borderColor: '#D4C4A8', borderWidth: '1px' }}>
                <MapPin className="h-6 w-6" style={{ color: '#8A6F47' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-stone-900">
                Find or Post Rides
              </h3>
              <p className="text-stone-700">
                Browse available rides or offer a ride to fellow students.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: 'linear-gradient(to bottom right, #F0E6D6, #E8DCC6)', borderColor: '#D4C4A8', borderWidth: '1px' }}>
                <CarTaxiFront className="h-6 w-6" style={{ color: '#8A6F47' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-stone-900">
                Travel Together
              </h3>
              <p className="text-stone-700">
                Connect with drivers or passengers and share your journey.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* Security FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-stone-900">
            Security & Safety
          </h2>
          <p className="text-center text-stone-600 mb-12 max-w-2xl mx-auto">
            Your safety and security are our top priorities. Here are answers to common questions about using Trek safely.
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {/* FAQ 1 - Banking Info */}
            <Collapsible
              open={openFAQ === 'banking'}
              onOpenChange={(isOpen) => setOpenFAQ(isOpen ? 'banking' : null)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 rounded-lg transition-colors" style={{ backgroundColor: '#F0E6D6', borderColor: '#D4C4A8', borderWidth: '1px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8DCC6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F0E6D6'}>
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-3" style={{ color: '#B8956B' }} />
                    <span className="font-medium text-left">Is my banking and payment information secure?</span>
                  </div>
                  {openFAQ === 'banking' ? 
                    <ChevronUp className="w-5 h-5" style={{ color: '#B8956B' }} /> : 
                    <ChevronDown className="w-5 h-5" style={{ color: '#B8956B' }} />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-white border-t-0 rounded-b-lg p-4" style={{ borderColor: '#D4C4A8', borderWidth: '1px' }}>
                <div className="text-stone-700 space-y-3">
                  <p>
                    <strong>Trek never sees your banking or credit card details.</strong> All payment processing is handled by Stripe, 
                    a PCI DSS Level 1 certified payment processor trusted by millions of businesses worldwide.
                  </p>
                  <p>
                    Your payment information is encrypted and stored securely by Stripe. We only receive confirmation that 
                    a payment was successful - never your actual card numbers, bank account details, or SSN.
                  </p>
                  <p>
                    For drivers, your banking information for payouts is also handled exclusively by Stripe Connect. 
                    Trek cannot access your bank account information.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* FAQ 2 - Scammer Prevention */}
            <Collapsible
              open={openFAQ === 'scammers'}
              onOpenChange={(isOpen) => setOpenFAQ(isOpen ? 'scammers' : null)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 rounded-lg transition-colors" style={{ backgroundColor: '#F0E6D6', borderColor: '#D4C4A8', borderWidth: '1px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8DCC6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F0E6D6'}>
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-3" style={{ color: '#B8956B' }} />
                    <span className="font-medium text-left">How does Trek prevent scammers and fake accounts?</span>
                  </div>
                  {openFAQ === 'scammers' ? 
                    <ChevronUp className="w-5 h-5" style={{ color: '#B8956B' }} /> : 
                    <ChevronDown className="w-5 h-5" style={{ color: '#B8956B' }} />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-white border-t-0 rounded-b-lg p-4" style={{ borderColor: '#D4C4A8', borderWidth: '1px' }}>
                <div className="text-stone-700 space-y-3">
                  <p>
                    <strong>UF Email Verification:</strong> Only users with valid @ufl.edu email addresses can create accounts. 
                    This ensures all users are verified University of Florida students.
                  </p>
                  <p>
                    <strong>Driver Identity Verification:</strong> All drivers must complete Stripe's identity verification process, 
                    which includes government ID verification and background checks before they can receive payments.
                  </p>
                  <p>
                    <strong>In-App Communication:</strong> All ride coordination happens through Trek's messaging system, 
                    so you don't need to share personal contact information until you're comfortable.
                  </p>
                  <p>
                    <strong>Community Reporting:</strong> Users can report suspicious activity, and we investigate all reports promptly.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* FAQ 3 - Personal Safety */}
            <Collapsible
              open={openFAQ === 'safety'}
              onOpenChange={(isOpen) => setOpenFAQ(isOpen ? 'safety' : null)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 rounded-lg transition-colors" style={{ backgroundColor: '#F0E6D6', borderColor: '#D4C4A8', borderWidth: '1px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8DCC6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F0E6D6'}>
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 mr-3" style={{ color: '#B8956B' }} />
                    <span className="font-medium text-left">What safety features does Trek provide for rides?</span>
                  </div>
                  {openFAQ === 'safety' ? 
                    <ChevronUp className="w-5 h-5" style={{ color: '#B8956B' }} /> : 
                    <ChevronDown className="w-5 h-5" style={{ color: '#B8956B' }} />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-white border-t-0 rounded-b-lg p-4" style={{ borderColor: '#D4C4A8', borderWidth: '1px' }}>
                <div className="text-stone-700 space-y-3">
                  <p>
                    <strong>Verified Student Community:</strong> All users are verified UF students, creating a trusted community 
                    of fellow Gators rather than random strangers.
                  </p>
                  <p>
                    <strong>Gender Preferences:</strong> Passengers can filter rides by gender preference for added comfort and safety.
                  </p>
                  <p>
                    <strong>Driver and Passenger Profiles:</strong> View ratings, reviews, and ride history before booking 
                    to make informed decisions about who you travel with.
                  </p>
                  <p>
                    <strong>SMS Notifications:</strong> Automatic text alerts keep both parties informed about ride status, 
                    changes, and important updates.
                  </p>
                  <p>
                    <strong>Emergency Contacts:</strong> Always share your ride details with friends or family, and trust your instincts 
                    if something doesn't feel right.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* FAQ 4 - Payment Security */}
            <Collapsible
              open={openFAQ === 'payments'}
              onOpenChange={(isOpen) => setOpenFAQ(isOpen ? 'payments' : null)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 rounded-lg transition-colors" style={{ backgroundColor: '#F0E6D6', borderColor: '#D4C4A8', borderWidth: '1px' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E8DCC6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F0E6D6'}>
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-3" style={{ color: '#B8956B' }} />
                    <span className="font-medium text-left">How are payments protected if something goes wrong?</span>
                  </div>
                  {openFAQ === 'payments' ? 
                    <ChevronUp className="w-5 h-5" style={{ color: '#B8956B' }} /> : 
                    <ChevronDown className="w-5 h-5" style={{ color: '#B8956B' }} />
                  }
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-white border-t-0 rounded-b-lg p-4" style={{ borderColor: '#D4C4A8', borderWidth: '1px' }}>
                <div className="text-stone-700 space-y-3">
                  <p>
                    <strong>Payment Authorization:</strong> When you request a ride, your payment method is authorized but not charged. 
                    Money is only transferred after the ride is completed.
                  </p>
                  <p>
                    <strong>Automatic Refunds:</strong> If a ride is cancelled or doesn't happen, you're automatically refunded. 
                    No need to contact support or wait for manual processing.
                  </p>
                  <p>
                    <strong>Dispute Protection:</strong> If there's an issue with a ride, you can contact our support team. 
                    We work with both parties to resolve disputes fairly.
                  </p>
                  <p>
                    <strong>No Cash Handling:</strong> All transactions are digital and trackable, eliminating the risks 
                    associated with carrying cash for ride payments.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </section>
    </div>
  );
}