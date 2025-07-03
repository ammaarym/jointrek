import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface WaitlistComponentProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: {
    idle: string;
    loading: string;
    success: string;
  };
  theme?: "light" | "dark" | "system";
  className?: string;
}

// Device detection utility
const getDeviceType = (): "mobile" | "desktop" => {
  if (typeof window === "undefined") return "desktop";
  const userAgent = navigator.userAgent || "";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  return isMobile ? "mobile" : "desktop";
};

export default function WaitlistComponent({
  title,
  subtitle,
  placeholder = "Enter your email address",
  buttonText = {
    idle: "Join Waitlist",
    loading: "Joining...",
    success: "Welcome aboard!"
  },
  theme = "light",
  className = ""
}: WaitlistComponentProps) {
  const [step, setStep] = useState<"question" | "waitlist">("question");
  const [userIntent, setUserIntent] = useState<"driver" | "passenger" | "">("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleQuestionSubmit = (intent: "driver" | "passenger") => {
    setUserIntent(intent);
    setStep("waitlist");
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    
    try {
      const deviceType = getDeviceType();
      
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          userIntent, 
          deviceType 
        }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("You've been added to our waitlist!");
        setEmail("");
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setStatus("error");
          setMessage("Email already on waitlist");
        } else {
          setStatus("error");
          setMessage(errorData.message || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full max-w-md mx-auto ${className}`}
    >
      {step === "question" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-4"
        >
          <h3 className="text-lg font-semibold text-stone-900">
            How would you use Trek?
          </h3>
          <p className="text-sm text-stone-600">
            Help us understand your needs better
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => handleQuestionSubmit("driver")}
              className="w-full bg-[#B8956B] hover:bg-[#8A6F47] text-white rounded-full py-3 text-sm font-medium transition-colors"
            >
              I'd offer rides to other students
            </Button>
            
            <Button
              onClick={() => handleQuestionSubmit("passenger")}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-full py-3 text-sm font-medium transition-colors"
            >
              I'd request rides from other students
            </Button>
          </div>
        </motion.div>
      )}

      {step === "waitlist" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {title && (
            <h3 className="text-lg font-semibold text-center mb-2 text-stone-900">
              {title}
            </h3>
          )}
          
          {subtitle && (
            <p className="text-sm text-stone-600 text-center mb-4">
              {subtitle}
            </p>
          )}

          <form onSubmit={handleWaitlistSubmit} className="space-y-3">
            <div className="relative flex items-center bg-white rounded-full border border-stone-300 focus-within:border-[#B8956B] focus-within:ring-1 focus-within:ring-[#B8956B] h-12 pr-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                disabled={status === "loading" || status === "success"}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-stone-900 placeholder:text-stone-500 rounded-full px-4 py-3 h-full"
              />
              
              <Button
                type="submit"
                disabled={status === "loading" || status === "success"}
                className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-2 whitespace-nowrap rounded-full h-9 text-sm font-medium"
              >
                {status === "loading" && buttonText.loading}
                {status === "success" && buttonText.success}
                {(status === "idle" || status === "error") && buttonText.idle}
              </Button>
            </div>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center ${
                  status === "success" 
                    ? "text-[#8A6F47] text-base font-semibold" 
                    : status === "error" 
                    ? "text-red-600 text-sm" 
                    : "text-stone-600 text-sm"
                }`}
              >
                {message}
              </motion.p>
            )}
          </form>
          
          <div className="mt-4 text-center">
            <Button
              onClick={() => setStep("question")}
              variant="ghost"
              className="text-xs text-stone-500 hover:text-stone-700 underline"
            >
              Change my answer
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}