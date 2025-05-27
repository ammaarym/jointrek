import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CarTaxiFront, User, MapPin, Shield, Lock, Check, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();

  const handleLogin = () => {
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
                <span className="text-orange-600">Gators</span>
              </h1>
              <p className="text-lg mb-8 text-black max-w-3xl mx-auto">
                The safe, convenient way for UF students to carpool to campus,
                back home, or anywhere in between.
              </p>
              
              {currentUser ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    className="bg-orange-600 text-white px-6 py-6 h-auto rounded-md font-medium hover:bg-opacity-90 transition text-center"
                  >
                    <Link href="/find-rides">Find a Ride</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-black text-white px-6 py-6 h-auto rounded-md font-medium hover:bg-opacity-90 transition text-center"
                  >
                    <Link href="/post-ride">Offer a Ride</Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-2xl mx-auto">
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-6 text-left w-full">
                    <h3 className="font-semibold text-orange-700 text-lg flex items-center mb-2">
                      <Lock className="w-5 h-5 mr-2" />
                      Please sign in to continue
                    </h3>
                    <p className="text-orange-700 mb-3">
                      GatorLift is exclusively for University of Florida students. You'll need to sign in with your UF email to access rides.
                    </p>
                    <div className="flex justify-center mt-4">
                      <Button 
                        className="bg-orange-600 text-white flex items-center justify-center px-8 py-3 text-lg"
                        onClick={handleLogin}
                      >
                        Get Started
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 w-full">
                    <div className="flex items-start">
                      <div className="shrink-0 bg-orange-100 rounded-full p-2 mt-1 mr-3">
                        <Shield className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">UF Students Only</h4>
                        <p className="text-sm text-gray-600">Verified UF emails ensure you're traveling with fellow Gators.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="shrink-0 bg-orange-100 rounded-full p-2 mt-1 mr-3">
                        <Check className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Secure & Easy</h4>
                        <p className="text-sm text-gray-600">Find rides or offer your own in just a few clicks after signing in.</p>
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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">
            How GatorLift Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border border-gray-100">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up</h3>
              <p className="text-neutral-600">
                Create an account using your UF email to join the Gator community.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border border-gray-100">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Find or Post Rides
              </h3>
              <p className="text-neutral-600">
                Browse available rides or offer a ride to fellow students.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md border border-gray-100">
                <CarTaxiFront className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Travel Together
              </h3>
              <p className="text-neutral-600">
                Connect with drivers or passengers and share your journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">
            What Fellow Gators Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="mb-4">
                <h4 className="font-semibold">Sarah Johnson</h4>
                <p className="text-sm text-neutral-500">
                  Senior, Biology
                </p>
              </div>
              <p className="text-neutral-700 italic">
                "GatorLift has saved me so much money on trips home to Orlando.
                I've also made some great friends along the way!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="mb-4">
                <h4 className="font-semibold">Michael Torres</h4>
                <p className="text-sm text-neutral-500">
                  Junior, Engineering
                </p>
              </div>
              <p className="text-neutral-700 italic">
                "As a driver, I like that I can offset my gas costs while
                helping out other Gators. The platform is super easy to use."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="mb-4">
                <h4 className="font-semibold">Jamie Chen</h4>
                <p className="text-sm text-neutral-500">
                  Sophomore, Business
                </p>
              </div>
              <p className="text-neutral-700 italic">
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