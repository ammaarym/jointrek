import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CarTaxiFront,
  User,
  MapPin,
  Shield,
  Lock,
  Check,
  CreditCard,
  UserCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { StarBorder } from "@/components/ui/star-border";
import WaitlistComponent from "@/components/ui/waiting-list";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import findRidesScreenshot from "@assets/image_1751477334294.png";
import trekLogo from "@assets/TREK (Presentation)_1751439938143.png";

function Home() {
  const [, navigate] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  // Optimized page initialization - removed forced scrolling
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    console.log("[DEBUG] Home page login clicked");
    navigate("/login");
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FCFAF7] to-[#F0EBE1] relative">
      {/* Simplified Hero Section - Removed heavy animations */}
      <section className="relative bg-transparent overflow-hidden pt-8 pb-4 flex items-start justify-center">
        {/* Simplified background - static gradient instead of animated aurora */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#B48A5C]/10 via-transparent to-[#B48A5C]/10 pointer-events-none"></div>

        <div className="relative flex flex-col items-center justify-center px-4 z-10 text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            className="flex flex-col gap-4 items-center justify-center"
          >
            {/* Trek Logo - Removed complex animations */}
            <div className="-mb-6 sm:-mb-4">
              <img
                src={trekLogo}
                alt="Trek"
                className="h-24 sm:h-32 md:h-40 lg:h-48 w-auto"
                style={{ backgroundColor: "transparent" }}
              />
            </div>

            <div className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2 leading-tight">
              Rideshare Marketplace Built for{" "}
              <span style={{ color: "#B8956B" }}>Gators</span>
            </div>

            <p className="text-sm sm:text-lg mb-2 md:mb-4 text-stone-600 max-w-2xl mx-auto leading-relaxed px-4">
              Getting in and out of the Swamp doesn't have to suck
            </p>

            {/* Coming Soon Button - Simplified animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.3,
                duration: 0.5,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="mb-4"
            >
              <StarBorder
                className="bg-white/90 text-[#B8956B] border-[#B8956B] px-8 py-3 rounded-full text-lg font-semibold cursor-pointer hover:bg-[#B8956B] hover:text-white transition-colors duration-300"
                speed={0.3}
              >
                Coming Soon
              </StarBorder>
            </motion.div>

            {/* Find Rides Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-4"
            >
              <div className="max-w-sm sm:max-w-4xl mx-auto px-4 sm:px-0">
                <img
                  src={findRidesScreenshot}
                  alt="Trek Find Rides Interface"
                  className="w-full rounded-lg sm:rounded-2xl shadow-lg sm:shadow-2xl border border-stone-200"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How Trek Works Section - Optimized */}
      <section className="py-8 sm:py-12 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-stone-900">
                How Trek Works
              </h2>
              <p className="text-stone-600 text-sm sm:text-lg max-w-3xl mx-auto">
                Simple, safe, and convenient ridesharing for the UF community
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
              {[
                {
                  icon: MapPin,
                  title: "Find or Post Rides",
                  description: "Browse available rides or offer a ride to fellow students.",
                },
                {
                  icon: UserCheck,
                  title: "Connect Safely",
                  description: "All users verified with UF email. Meet fellow Gators you can trust.",
                },
                {
                  icon: CreditCard,
                  title: "Easy Payments",
                  description: "Secure, cashless transactions handled through the app.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div
                    className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-lg transition-transform duration-300 hover:scale-110"
                    style={{
                      background: "linear-gradient(135deg, #F0E6D6, #E8DCC6)",
                    }}
                  >
                    <feature.icon
                      className="h-6 w-6 sm:h-8 sm:w-8"
                      style={{ color: "#8A6F47" }}
                    />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-4 text-stone-900">
                    {feature.title}
                  </h3>
                  <p className="text-stone-700 text-sm sm:text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safety Features Section - Optimized */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-stone-900">
                Your Safety is Our Priority
              </h2>
              <p className="text-stone-600 text-sm sm:text-lg max-w-3xl mx-auto">
                Built with multiple layers of protection for the UF community
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
              {[
                {
                  icon: Shield,
                  title: "UF Email Verification",
                  description: "Only verified UF students can join our platform.",
                },
                {
                  icon: Lock,
                  title: "Contact Privacy",
                  description: "Phone numbers only shared after both parties approve rides.",
                },
                {
                  icon: CreditCard,
                  title: "Secure Payments",
                  description: "All payment data encrypted and protected by Stripe.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-8 shadow-lg border border-stone-200 hover:shadow-xl transition-shadow duration-300"
                >
                  <div
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-6"
                    style={{
                      background: "linear-gradient(135deg, #B48A5C, #8A6F47)",
                    }}
                  >
                    <feature.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-stone-900 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-stone-700 text-sm sm:text-base text-center leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Optimized */}
      <section className="py-8 sm:py-12 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-stone-900">
                FAQ
              </h2>
              <p className="text-stone-600 text-sm sm:text-lg">
                Common questions about Trek
              </p>
            </motion.div>

            <div className="space-y-2 sm:space-y-4">
              {[
                {
                  id: "students",
                  question: "Is Trek only for UF students?",
                  answer:
                    "Yes, Trek is exclusively for University of Florida students. You must have a valid @ufl.edu email address to create an account.",
                },
                {
                  id: "safety",
                  question: "How do you ensure ride safety?",
                  answer:
                    "All users must verify their UF email, and we provide in-app messaging and payment systems. Contact information is only shared after ride approval.",
                },
                {
                  id: "payments",
                  question: "How do payments work?",
                  answer:
                    "Payments are processed securely through Stripe. Passengers pay when requesting rides, and funds are held until completion.",
                },
                {
                  id: "costs",
                  question: "Are there any fees?",
                  answer:
                    "Trek takes a small service fee from completed rides to maintain the platform and ensure safety features.",
                },
              ].map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <Collapsible
                    open={openFAQ === faq.id}
                    onOpenChange={(isOpen) =>
                      setOpenFAQ(isOpen ? faq.id : null)
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-3 sm:p-6 bg-white/80 hover:bg-white/90 rounded-xl border border-stone-200 text-left font-semibold text-stone-900 text-sm sm:text-base transition-colors duration-200"
                      >
                        {faq.question}
                        {openFAQ === faq.id ? (
                          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 sm:px-6 pb-3 sm:pb-6 bg-white/80 rounded-b-xl border-x border-b border-stone-200 border-t-0">
                      <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                        {faq.answer}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <WaitlistComponent />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;