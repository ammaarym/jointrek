import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CarTaxiFront, User, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { currentUser } = useAuth();

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

      {/* Popular Destinations */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-black">
            Popular Destinations
          </h2>
          <p className="text-center text-neutral-600 mb-12 max-w-2xl mx-auto">
            Looking for a ride home or back to campus? These are the most
            popular routes among fellow Gators.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Orlando Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
              <img
                src="https://pixabay.com/get/g3bfb66ca8a8104738527eb98058e58516275f820f2e7c5e0cb23ee86f69b1f5dbe2829921279c3f87562f20d7dd07feea3151f29988a71a4efa5830f4c86e6fa_1280.jpg"
                alt="Orlando skyline"
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold">Orlando</h3>
                  <span className="text-sm text-neutral-500">
                    2.5 hours
                  </span>
                </div>
                <p className="text-neutral-600 mb-4">
                  Most rides on Friday afternoons and Sunday evenings.
                </p>
                <Link href="/find-rides?destination=Orlando">
                  <a className="text-orange-600 hover:underline text-sm font-medium">
                    Find 28 rides available →
                  </a>
                </Link>
              </div>
            </div>

            {/* Miami Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
              <img
                src="https://images.unsplash.com/photo-1535498730771-e735b998cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80"
                alt="Miami skyline"
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold">Miami</h3>
                  <span className="text-sm text-neutral-500">
                    5 hours
                  </span>
                </div>
                <p className="text-neutral-600 mb-4">
                  Popular for long weekends and holiday breaks.
                </p>
                <Link href="/find-rides?destination=Miami">
                  <a className="text-orange-600 hover:underline text-sm font-medium">
                    Find 15 rides available →
                  </a>
                </Link>
              </div>
            </div>

            {/* Tampa Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
              <img
                src="https://pixabay.com/get/g381677b8944d6166607522341f68f78e2cf0de35a10ae7604ab5bad3b5d7665576f08176482515ecb33afae4d8e20d94832b821653793d008ad833631f266322_1280.jpg"
                alt="Tampa skyline"
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold">Tampa</h3>
                  <span className="text-sm text-neutral-500">
                    2 hours
                  </span>
                </div>
                <p className="text-neutral-600 mb-4">
                  Frequent rides throughout the week and weekends.
                </p>
                <Link href="/find-rides?destination=Tampa">
                  <a className="text-orange-600 hover:underline text-sm font-medium">
                    Find 22 rides available →
                  </a>
                </Link>
              </div>
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
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Sarah Johnson"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-neutral-500">
                    Senior, Biology
                  </p>
                </div>
              </div>
              <p className="text-neutral-700 italic">
                "GatorLift has saved me so much money on trips home to Orlando.
                I've also made some great friends along the way!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Michael Torres"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Michael Torres</h4>
                  <p className="text-sm text-neutral-500">
                    Junior, Engineering
                  </p>
                </div>
              </div>
              <p className="text-neutral-700 italic">
                "As a driver, I like that I can offset my gas costs while
                helping out other Gators. The platform is super easy to use."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src="https://pixabay.com/get/gb1a721f4c24c045d7ea82ec3de057369635faa8ff108d86c20ff63649a2385d4fc2861199f23e2a7d024ca1b0076ca2669a019e23860027a9972798250ce5212_1280.jpg"
                    alt="Jamie Chen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">Jamie Chen</h4>
                  <p className="text-sm text-neutral-500">
                    Sophomore, Business
                  </p>
                </div>
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
