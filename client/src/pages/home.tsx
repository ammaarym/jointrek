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
      <section className="bg-gradient-to-r from-primary-blue to-blue-700 text-white">
        <div className="container mx-auto px-4 py-12 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Share rides with fellow{" "}
                <span className="text-primary-orange">Gators</span>
              </h1>
              <p className="text-lg mb-8 text-neutral-100">
                The safe, convenient way for UF students to carpool to campus,
                back home, or anywhere in between.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  className="bg-primary-orange text-white px-6 py-6 h-auto rounded-md font-medium hover:bg-opacity-90 transition text-center"
                >
                  <Link href="/find-rides">Find a Ride</Link>
                </Button>
                <Button
                  asChild
                  className="bg-white text-primary-blue px-6 py-6 h-auto rounded-md font-medium hover:bg-opacity-90 transition text-center"
                >
                  <Link href="/post-ride">Offer a Ride</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-64 md:h-96">
              <img
                src="https://pixabay.com/get/g32827592f86c14f97afb5215e69dd5a35a3831184a23833417a562ea91f551c5258163d894354b20544f80bd89d6a8bcaa1395ad151fe48bb77a576c1d1d8f6e_1280.jpg"
                alt="College students carpooling"
                className="rounded-lg shadow-lg object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white dark:bg-dark-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary-blue dark:text-white">
            How GatorLift Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-6 w-6 text-primary-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">Sign Up</h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Create an account using your UF email to join the Gator community.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-50 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">
                Find or Post Rides
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Browse available rides or offer a ride to fellow students.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-50 dark:bg-neutral-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CarTaxiFront className="h-6 w-6 text-primary-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">
                Travel Together
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300">
                Connect with drivers or passengers and share your journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-surface">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-primary-blue dark:text-white">
            Popular Destinations
          </h2>
          <p className="text-center text-neutral-600 dark:text-neutral-300 mb-12 max-w-2xl mx-auto">
            Looking for a ride home or back to campus? These are the most
            popular routes among fellow Gators.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Orlando Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src="https://pixabay.com/get/g3bfb66ca8a8104738527eb98058e58516275f820f2e7c5e0cb23ee86f69b1f5dbe2829921279c3f87562f20d7dd07feea3151f29988a71a4efa5830f4c86e6fa_1280.jpg"
                alt="Orlando skyline"
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold dark:text-white">Orlando</h3>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    2.5 hours
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                  Most rides on Friday afternoons and Sunday evenings.
                </p>
                <Link href="/find-rides?destination=Orlando">
                  <a className="text-primary-blue dark:text-primary-orange hover:underline text-sm font-medium">
                    Find 28 rides available →
                  </a>
                </Link>
              </div>
            </div>

            {/* Miami Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1535498730771-e735b998cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300&q=80"
                alt="Miami skyline"
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold dark:text-white">Miami</h3>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    5 hours
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                  Popular for long weekends and holiday breaks.
                </p>
                <Link href="/find-rides?destination=Miami">
                  <a className="text-primary-blue dark:text-primary-orange hover:underline text-sm font-medium">
                    Find 15 rides available →
                  </a>
                </Link>
              </div>
            </div>

            {/* Tampa Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img
                src="https://pixabay.com/get/g381677b8944d6166607522341f68f78e2cf0de35a10ae7604ab5bad3b5d7665576f08176482515ecb33afae4d8e20d94832b821653793d008ad833631f266322_1280.jpg"
                alt="Tampa skyline"
                className="w-full h-40 object-cover"
              />
              <div className="p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xl font-semibold dark:text-white">Tampa</h3>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    2 hours
                  </span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                  Frequent rides throughout the week and weekends.
                </p>
                <Link href="/find-rides?destination=Tampa">
                  <a className="text-primary-blue dark:text-primary-orange hover:underline text-sm font-medium">
                    Find 22 rides available →
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white dark:bg-dark-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary-blue dark:text-white">
            What Fellow Gators Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Sarah Johnson"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold dark:text-white">Sarah Johnson</h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Senior, Biology
                  </p>
                </div>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic">
                "GatorLift has saved me so much money on trips home to Orlando.
                I've also made some great friends along the way!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80"
                    alt="Michael Torres"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold dark:text-white">Michael Torres</h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Junior, Engineering
                  </p>
                </div>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic">
                "As a driver, I like that I can offset my gas costs while
                helping out other Gators. The platform is super easy to use."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src="https://pixabay.com/get/gb1a721f4c24c045d7ea82ec3de057369635faa8ff108d86c20ff63649a2385d4fc2861199f23e2a7d024ca1b0076ca2669a019e23860027a9972798250ce5212_1280.jpg"
                    alt="Jamie Chen"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold dark:text-white">Jamie Chen</h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Sophomore, Business
                  </p>
                </div>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 italic">
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
