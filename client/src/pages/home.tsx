import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CarTaxiFront, User, MapPin, Shield, Lock, Check, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-new";

export default function Home() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users to profile (avoid redirect loops)
  useEffect(() => {
    if (!loading && currentUser) {
      console.log("Home page: Authenticated user detected, redirecting to profile");
      // Use replace to avoid adding to browser history
      window.location.replace('/profile');
    }
  }, [currentUser, loading]);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSignup = () => {
    navigate("/login");
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-stone-100 text-black">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="grid md:grid-cols-1 gap-8 items-center text-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Share rides with fellow{" "}
                <span className="text-stone-600">Gators</span>
              </h1>
              <p className="text-lg mb-8 text-stone-700 max-w-3xl mx-auto">
                The safe, convenient way for UF students to carpool to campus,
                back home, or anywhere in between.
              </p>
              
              {currentUser ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    className="bg-stone-600 text-white px-6 py-6 h-auto rounded-md font-medium hover:bg-stone-700 transition text-center"
                  >
                    <Link href="/find-rides">Find a Ride</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-stone-800 text-white px-6 py-6 h-auto rounded-md font-medium hover:bg-stone-900 transition text-center"
                  >
                    <Link href="/post-ride">Offer a Ride</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-2xl mx-auto">
                  <div className="bg-stone-50 p-4 rounded-lg border border-stone-300 mb-6 text-left w-full">
                    <h3 className="font-semibold text-stone-800 text-lg flex items-center mb-2">
                      <Lock className="w-5 h-5 mr-2" />
                      Please sign in to continue
                    </h3>
                    <p className="text-stone-700 mb-3">
                      Trek is exclusively for University of Florida students. You'll need to sign in with your UF email to access rides.
                    </p>
                    <div className="flex justify-center mt-4">
                      <Button 
                        className="bg-stone-600 text-white flex items-center justify-center px-8 py-3 text-lg hover:bg-stone-700"
                        onClick={handleLogin}
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full">
                    <div className="flex items-start">
                      <div className="shrink-0 bg-stone-200 rounded-full p-2 mt-1 mr-3">
                        <Shield className="w-5 h-5 text-stone-700" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-stone-900">UF Students Only</h4>
                        <p className="text-sm text-stone-700">Verified UF emails ensure you're traveling with fellow Gators.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="shrink-0 bg-stone-200 rounded-full p-2 mt-1 mr-3">
                        <Check className="w-5 h-5 text-stone-700" />
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
              <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border border-stone-200">
                <User className="h-6 w-6 text-stone-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-stone-900">Sign Up</h3>
              <p className="text-stone-700">
                Create an account using your UF email to join the Gator community.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border border-stone-200">
                <MapPin className="h-6 w-6 text-stone-700" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-stone-900">
                Find or Post Rides
              </h3>
              <p className="text-stone-700">
                Browse available rides or offer a ride to fellow students.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border border-stone-200">
                <CarTaxiFront className="h-6 w-6 text-stone-700" />
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

      {/* Testimonials Section */}
      <section className="py-16 bg-stone-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-stone-900">
            What Fellow Gators Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-stone-50 p-6 rounded-lg shadow-sm border border-stone-200">
              <div className="mb-4">
                <h4 className="font-semibold text-stone-900">Sarah Johnson</h4>
                <p className="text-sm text-stone-600">
                  Senior, Biology
                </p>
              </div>
              <p className="text-stone-700 italic">
                "Trek has saved me so much money on trips home to Orlando.
                I've also made some great friends along the way!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-stone-50 p-6 rounded-lg shadow-sm border border-stone-200">
              <div className="mb-4">
                <h4 className="font-semibold text-stone-900">Michael Torres</h4>
                <p className="text-sm text-stone-600">
                  Junior, Engineering
                </p>
              </div>
              <p className="text-stone-700 italic">
                "As a driver, I like that I can offset my gas costs while
                helping out other Gators. The platform is super easy to use."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-stone-50 p-6 rounded-lg shadow-sm border border-stone-200">
              <div className="mb-4">
                <h4 className="font-semibold text-stone-900">Jamie Chen</h4>
                <p className="text-sm text-stone-600">
                  Sophomore, Business
                </p>
              </div>
              <p className="text-stone-700 italic">
                "I feel so much safer knowing I'm riding with verified UF
                students. The gender preference filter is also a huge plus."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}