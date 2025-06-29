import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarTaxiFront, User, MapPin, Shield, Lock, Check, CreditCard, UserCheck, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-fixed";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import findRidesScreenshot from "@assets/image_1751166578599.png";

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  // Add fade-in animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className={`transition-opacity duration-1000 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Sticky Header with Get Started Button */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold font-satoshi transition-colors" style={{ color: '#B8956B' }}>
              Trek
            </span>
          </Link>
          
          <Button
            onClick={handleLogin}
            className="text-white px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ backgroundColor: '#B8956B' }}
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Hero Section with Screenshot */}
      <section className="bg-white text-black min-h-screen pt-16">
        <div className="container mx-auto px-4 pt-0 pb-12 md:pt-0 md:pb-24">
          <div className="max-w-6xl mx-auto">
            <div className={`transform transition-all duration-1000 ease-out delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="text-center mb-4 md:mb-8">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 leading-tight">
                  Share rides with fellow{" "}
                  <span style={{ color: '#B8956B' }}>Gators</span>
                </h1>
                <p className="text-sm sm:text-xl mb-3 md:mb-6 text-stone-600 max-w-2xl mx-auto leading-relaxed px-4">
                  The safe, convenient way for UF students to carpool to campus,
                  back home, or anywhere in between.
                </p>
              </div>

              {/* Find Rides Screenshot */}
              <div className="mb-6 md:mb-12">
                <div className="max-w-sm sm:max-w-4xl mx-auto px-4 sm:px-0">
                  <img 
                    src={findRidesScreenshot} 
                    alt="Trek Find Rides Interface" 
                    className="w-full rounded-lg sm:rounded-2xl shadow-lg sm:shadow-2xl border border-stone-200"
                  />
                </div>
              </div>
            </div>

            <div className={`transform transition-all duration-1000 ease-out delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              {currentUser ? (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button
                    asChild
                    className="text-white px-4 py-2 sm:px-8 sm:py-4 text-sm sm:text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ backgroundColor: '#B8956B' }}
                  >
                    <Link href="/find-rides">Find a Ride</Link>
                  </Button>
                  <Button
                    asChild
                    className="text-white px-4 py-2 sm:px-8 sm:py-4 text-sm sm:text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ backgroundColor: '#9B7F56' }}
                  >
                    <Link href="/setup-post-ride">Offer a Ride</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-2xl mx-auto px-4">
                  <Card className="w-full mb-4 sm:mb-8 shadow-lg border-0" style={{ backgroundColor: '#FEFCF8', borderColor: '#E8DCC6', borderWidth: '1px' }}>
                    <CardContent className="p-4 sm:p-8">
                      <div className="flex items-center justify-center mb-3 sm:mb-4">
                        <div className="rounded-full p-2 sm:p-3 mr-2 sm:mr-3" style={{ backgroundColor: '#F0E6D6' }}>
                          <Lock className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#8A6F47' }} />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold" style={{ color: '#8A6F47' }}>
                          Please sign in to continue
                        </h3>
                      </div>
                      <p className="text-stone-700 mb-4 sm:mb-6 text-center text-sm sm:text-base">
                        Trek is exclusively for University of Florida students. You'll need to sign in with your UF email to access rides.
                      </p>
                      <div className="flex justify-center">
                        <Button 
                          className="text-white px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                          style={{ backgroundColor: '#B8956B' }}
                          onClick={handleLogin}
                        >
                          Get Started
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 w-full">
                    <div className="flex items-start p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#FEFCF8' }}>
                      <div className="shrink-0 rounded-full p-2 sm:p-3 mr-3 sm:mr-4" style={{ backgroundColor: '#F0E6D6' }}>
                        <Shield className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#8A6F47' }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-900 mb-1 text-sm sm:text-base">UF Students Only</h4>
                        <p className="text-xs sm:text-sm text-stone-700">Verified UF emails ensure you're traveling with fellow Gators.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 sm:p-4 rounded-lg" style={{ backgroundColor: '#FEFCF8' }}>
                      <div className="shrink-0 rounded-full p-2 sm:p-3 mr-3 sm:mr-4" style={{ backgroundColor: '#F0E6D6' }}>
                        <Check className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: '#8A6F47' }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-900 mb-1 text-sm sm:text-base">Secure & Easy</h4>
                        <p className="text-xs sm:text-sm text-stone-700">Find rides or offer your own in just a few clicks after signing in.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How Trek Works Section */}
      <section className="py-8 sm:py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className={`transform transition-all duration-1000 ease-out delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-16 text-stone-900">
              How Trek Works
            </h2>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-lg transition-transform duration-300 hover:scale-110" style={{ background: 'linear-gradient(135deg, #F0E6D6, #E8DCC6)' }}>
                  <User className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-4 text-stone-900">Sign Up</h3>
                <p className="text-stone-700 text-sm sm:text-lg leading-relaxed">
                  Create an account using your UF email to join the Gator community.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-lg transition-transform duration-300 hover:scale-110" style={{ background: 'linear-gradient(135deg, #F0E6D6, #E8DCC6)' }}>
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-4 text-stone-900">
                  Find or Post Rides
                </h3>
                <p className="text-stone-700 text-sm sm:text-lg leading-relaxed">
                  Browse available rides or offer a ride to fellow students.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-lg transition-transform duration-300 hover:scale-110" style={{ background: 'linear-gradient(135deg, #F0E6D6, #E8DCC6)' }}>
                  <CarTaxiFront className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-4 text-stone-900">Travel Safe</h3>
                <p className="text-stone-700 text-sm sm:text-lg leading-relaxed">
                  Connect with verified students and enjoy secure, convenient transportation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Section */}
      <section className="py-8 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className={`transform transition-all duration-1000 ease-out delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-2xl sm:text-4xl font-bold text-center mb-6 sm:mb-16 text-stone-900">
              Your Safety is Our Priority
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8 max-w-6xl mx-auto">
              <div className="text-center p-3 sm:p-6">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <UserCheck className="h-5 w-5 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-stone-900">Verified Students</h3>
                <p className="text-xs sm:text-base text-stone-700">All users must verify with UF email addresses</p>
              </div>

              <div className="text-center p-3 sm:p-6">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <CreditCard className="h-5 w-5 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-stone-900">Secure Payments</h3>
                <p className="text-xs sm:text-base text-stone-700">Banking details protected by Stripe encryption</p>
              </div>

              <div className="text-center p-3 sm:p-6">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <Shield className="h-5 w-5 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-stone-900">Ride Tracking</h3>
                <p className="text-xs sm:text-base text-stone-700">SMS notifications and ride verification codes</p>
              </div>

              <div className="text-center p-3 sm:p-6">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <AlertTriangle className="h-5 w-5 sm:h-8 sm:w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-stone-900">Report System</h3>
                <p className="text-xs sm:text-base text-stone-700">Easy reporting for safety concerns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-6 sm:py-20 bg-neutral-50">
        <div className="container mx-auto px-2 sm:px-4">
          <div className={`transform transition-all duration-1000 ease-out delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-xl sm:text-4xl font-bold text-center mb-4 sm:mb-16 text-stone-900">
              Frequently Asked Questions
            </h2>

            <div className="max-w-3xl mx-auto space-y-1 sm:space-y-4">
              {[
                {
                  id: "security",
                  question: "How does Trek protect my banking information?",
                  answer: "Trek uses industry-leading security measures. All payment processing is handled by Stripe, which is PCI DSS compliant and uses bank-level encryption. We never see or store your banking details, credit card numbers, or SSN. Your financial information is encrypted and securely transmitted directly to Stripe's secure servers."
                },
                {
                  id: "scammers", 
                  question: "How does Trek prevent scammers?",
                  answer: "All users must verify their identity using official UF email addresses (@ufl.edu). Additionally, we require phone number verification via SMS before accessing ride features. This dual verification system ensures only legitimate UF students can use the platform."
                },
                {
                  id: "safety",
                  question: "What safety features does Trek provide?",
                  answer: "Trek includes SMS notifications for ride updates, verification codes for ride start/completion, gender preference settings, and an easy reporting system. All users are verified UF students, and we track ride completion to ensure accountability."
                },
                {
                  id: "payments",
                  question: "How do payments work?",
                  answer: "Payments are processed securely through Stripe. Passengers are charged when rides are completed, not when booked. If a ride is cancelled or doesn't occur, you receive automatic refunds. Drivers receive payouts directly to their bank accounts after ride completion."
                }
              ].map((faq) => (
                <Collapsible
                  key={faq.id}
                  open={openFAQ === faq.id}
                  onOpenChange={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between py-1 px-2 sm:p-6 h-auto text-left rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors min-h-[2rem] sm:min-h-auto"
                    >
                      <span className="font-medium text-stone-900 text-[11px] sm:text-lg leading-tight pr-1 flex-1">{faq.question}</span>
                      {openFAQ === faq.id ? (
                        <ChevronUp className="h-3 w-3 sm:h-5 sm:w-5 text-stone-600 shrink-0 ml-1" />
                      ) : (
                        <ChevronDown className="h-3 w-3 sm:h-5 sm:w-5 text-stone-600 shrink-0 ml-1" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 pb-1 sm:px-6 sm:pb-6">
                    <div className="pt-1 sm:pt-4 border-t border-stone-100">
                      <p className="text-stone-700 leading-tight text-[10px] sm:text-base">{faq.answer}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}