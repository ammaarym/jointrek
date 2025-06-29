import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CarTaxiFront, User, MapPin, Shield, Lock, Check, CreditCard, UserCheck, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-fixed";

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

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
      {/* Hero Section */}
      <section className="bg-white text-black min-h-screen flex items-center">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transform transition-all duration-1000 ease-out delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Share rides with fellow{" "}
                <span style={{ color: '#B8956B' }}>Gators</span>
              </h1>
              <p className="text-xl mb-12 text-stone-600 max-w-2xl mx-auto leading-relaxed">
                The safe, convenient way for UF students to carpool to campus,
                back home, or anywhere in between.
              </p>
            </div>

            <div className={`transform transition-all duration-1000 ease-out delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              {currentUser ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    className="text-white px-8 py-4 text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ backgroundColor: '#B8956B' }}
                  >
                    <Link href="/find-rides">Find a Ride</Link>
                  </Button>
                  <Button
                    asChild
                    className="text-white px-8 py-4 text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ backgroundColor: '#9B7F56' }}
                  >
                    <Link href="/setup-post-ride">Offer a Ride</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-2xl mx-auto">
                  <Card className="w-full mb-8 shadow-lg border-0" style={{ backgroundColor: '#FEFCF8', borderColor: '#E8DCC6', borderWidth: '1px' }}>
                    <CardContent className="p-8">
                      <div className="flex items-center justify-center mb-4">
                        <div className="rounded-full p-3 mr-3" style={{ backgroundColor: '#F0E6D6' }}>
                          <Lock className="w-6 h-6" style={{ color: '#8A6F47' }} />
                        </div>
                        <h3 className="text-xl font-semibold" style={{ color: '#8A6F47' }}>
                          Please sign in to continue
                        </h3>
                      </div>
                      <p className="text-stone-700 mb-6 text-center">
                        Trek is exclusively for University of Florida students. You'll need to sign in with your UF email to access rides.
                      </p>
                      <div className="flex justify-center">
                        <Button 
                          className="text-white px-8 py-3 text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                          style={{ backgroundColor: '#B8956B' }}
                          onClick={handleLogin}
                        >
                          Get Started
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                    <div className="flex items-start p-4 rounded-lg" style={{ backgroundColor: '#FEFCF8' }}>
                      <div className="shrink-0 rounded-full p-3 mr-4" style={{ backgroundColor: '#F0E6D6' }}>
                        <Shield className="w-6 h-6" style={{ color: '#8A6F47' }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-900 mb-1">UF Students Only</h4>
                        <p className="text-sm text-stone-700">Verified UF emails ensure you're traveling with fellow Gators.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-4 rounded-lg" style={{ backgroundColor: '#FEFCF8' }}>
                      <div className="shrink-0 rounded-full p-3 mr-4" style={{ backgroundColor: '#F0E6D6' }}>
                        <Check className="w-6 h-6" style={{ color: '#8A6F47' }} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-stone-900 mb-1">Secure & Easy</h4>
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

      {/* How Trek Works Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className={`transform transition-all duration-1000 ease-out delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 text-stone-900">
              How Trek Works
            </h2>

            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110" style={{ background: 'linear-gradient(135deg, #F0E6D6, #E8DCC6)' }}>
                  <User className="h-8 w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-stone-900">Sign Up</h3>
                <p className="text-stone-700 text-lg leading-relaxed">
                  Create an account using your UF email to join the Gator community.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110" style={{ background: 'linear-gradient(135deg, #F0E6D6, #E8DCC6)' }}>
                  <MapPin className="h-8 w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-stone-900">
                  Find or Post Rides
                </h3>
                <p className="text-stone-700 text-lg leading-relaxed">
                  Browse available rides or offer a ride to fellow students.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-300 hover:scale-110" style={{ background: 'linear-gradient(135deg, #F0E6D6, #E8DCC6)' }}>
                  <CarTaxiFront className="h-8 w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-stone-900">Travel Safe</h3>
                <p className="text-stone-700 text-lg leading-relaxed">
                  Connect with verified students and enjoy secure, convenient transportation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className={`transform transition-all duration-1000 ease-out delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-4xl font-bold text-center mb-16 text-stone-900">
              Your Safety is Our Priority
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <UserCheck className="h-8 w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-stone-900">Verified Students</h3>
                <p className="text-stone-700">All users must verify with UF email addresses</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <CreditCard className="h-8 w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-stone-900">Secure Payments</h3>
                <p className="text-stone-700">Banking details protected by Stripe encryption</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <Shield className="h-8 w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-stone-900">Ride Tracking</h3>
                <p className="text-stone-700">SMS notifications and ride verification codes</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md" style={{ backgroundColor: '#F0E6D6' }}>
                  <AlertTriangle className="h-8 w-8" style={{ color: '#8A6F47' }} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-stone-900">Report System</h3>
                <p className="text-stone-700">Easy reporting for safety concerns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 text-white" style={{ background: 'linear-gradient(135deg, #B8956B, #9B7F56)' }}>
        <div className="container mx-auto px-4 text-center">
          <div className={`transform transition-all duration-1000 ease-out delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of UF students already using Trek for safe, convenient transportation.
            </p>
            {!currentUser && (
              <Button 
                className="bg-white text-stone-900 hover:bg-stone-100 px-8 py-4 text-lg rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                onClick={handleLogin}
              >
                Get Started Today
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}