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

export default function WaitlistComponent({
  title = "Join our waitlist",
  subtitle = "Be the first to know when we launch",
  placeholder = "Enter your email address",
  buttonText = {
    idle: "Join Waitlist",
    loading: "Joining...",
    success: "Welcome aboard!"
  },
  theme = "light",
  className = ""
}: WaitlistComponentProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    
    try {
      // Simulate API call - replace with actual waitlist API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus("success");
      setMessage("You've been added to our waitlist!");
      setEmail("");
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            disabled={status === "loading" || status === "success"}
            className="flex-1 bg-white border-stone-300 focus:border-[#B8956B] focus:ring-[#B8956B] text-stone-900 placeholder:text-stone-500 rounded-full px-4 py-3 h-12"
          />
          
          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 whitespace-nowrap rounded-full h-12"
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
            className={`text-sm text-center ${
              status === "success" 
                ? "text-green-600" 
                : status === "error" 
                ? "text-red-600" 
                : "text-stone-600"
            }`}
          >
            {message}
          </motion.p>
        )}
      </form>
    </motion.div>
  );
}