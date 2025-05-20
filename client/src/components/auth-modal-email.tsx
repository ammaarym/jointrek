import React, { useState } from "react";
import { CarTaxiFront, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Type definitions
interface AuthModalProps {
  isOpen: boolean;
  initialView: "login" | "signup";
  onClose: () => void;
}

// Email validation function - checks for UF email
const isUFEmail = (email: string) => {
  return email.toLowerCase().endsWith('@ufl.edu');
};

// Login form schema 
const loginSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .refine((email) => isUFEmail(email), {
      message: "Please use your UF email address (@ufl.edu)"
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Signup form schema
const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string()
    .email("Invalid email address")
    .refine((email) => isUFEmail(email), {
      message: "Please use your UF email address (@ufl.edu)"
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and privacy policy",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Type definitions for form values
type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthModal({ isOpen, initialView, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialView);
  const { signIn, signUp } = useAuth();

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form setup
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  // Handle login form submission
  const handleLogin = async (values: LoginFormValues) => {
    try {
      await signIn(values.email, values.password);
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to GatorLift.",
      });
      onClose();
    } catch (error: any) {
      console.error("Login error:", error);
      // Error is already handled in the hook
    }
  };

  // Handle signup form submission
  const handleSignup = async (values: SignupFormValues) => {
    try {
      await signUp(values.email, values.password, values.firstName, values.lastName);
      toast({
        title: "Account created",
        description: "Welcome to GatorLift! Please check your UF email for verification.",
      });
      onClose();
    } catch (error: any) {
      console.error("Signup error:", error);
      // Error is already handled in the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-y-auto max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Tab navigation */}
        <div className="flex sticky top-0 bg-white dark:bg-neutral-800 z-[5]">
          <button
            className={`flex-1 py-4 text-center font-medium border-b-2 ${
              activeTab === "login"
                ? "border-primary-blue dark:border-primary-orange text-primary-blue dark:text-primary-orange"
                : "border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400"
            }`}
            onClick={() => setActiveTab("login")}
          >
            Log In
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium border-b-2 ${
              activeTab === "signup"
                ? "border-primary-orange text-primary-orange"
                : "border-neutral-300 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400"
            }`}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <div className="p-6">
            <div className="mb-6 text-center">
              <CarTaxiFront className="text-primary-orange text-3xl mx-auto" />
              <h2 className="text-2xl font-bold mt-2 dark:text-white">
                Welcome Back
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Log in with your UF email
              </p>
            </div>

            <form onSubmit={loginForm.handleSubmit(handleLogin)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    UF Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your.name@ufl.edu"
                    {...loginForm.register("email")}
                    className="w-full"
                  />
                  {loginForm.formState.errors.email && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {loginForm.formState.errors.email.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    className="w-full"
                  />
                  {loginForm.formState.errors.password && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {loginForm.formState.errors.password.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-blue hover:bg-primary-blue/90 text-white py-2"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Logging in..." : "Log In"}
                </Button>
                
                <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <p className="text-center text-sm text-blue-800 dark:text-blue-300">
                    <strong>GatorLift</strong> is exclusively for University of Florida students.
                    Only @ufl.edu email addresses are permitted.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Signup Form */}
        {activeTab === "signup" && (
          <div className="p-6">
            <div className="mb-6 text-center">
              <CarTaxiFront className="text-primary-orange text-3xl mx-auto" />
              <h2 className="text-2xl font-bold mt-2 dark:text-white">
                Join GatorLift
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Create an account with your UF email
              </p>
            </div>

            <form onSubmit={signupForm.handleSubmit(handleSignup)}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      First Name
                    </label>
                    <Input
                      type="text"
                      placeholder="John"
                      {...signupForm.register("firstName")}
                      className="w-full"
                    />
                    {signupForm.formState.errors.firstName && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {signupForm.formState.errors.firstName.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Last Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Doe"
                      {...signupForm.register("lastName")}
                      className="w-full"
                    />
                    {signupForm.formState.errors.lastName && (
                      <span className="text-red-500 text-sm mt-1 block">
                        {signupForm.formState.errors.lastName.message}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    UF Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your.name@ufl.edu"
                    {...signupForm.register("email")}
                    className="w-full"
                  />
                  {signupForm.formState.errors.email && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {signupForm.formState.errors.email.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...signupForm.register("password")}
                    className="w-full"
                  />
                  {signupForm.formState.errors.password && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {signupForm.formState.errors.password.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...signupForm.register("confirmPassword")}
                    className="w-full"
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <span className="text-red-500 text-sm mt-1 block">
                      {signupForm.formState.errors.confirmPassword.message}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="terms" 
                    {...signupForm.register("termsAccepted")} 
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-700 dark:text-neutral-300"
                  >
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-primary-blue dark:text-primary-orange hover:underline"
                    >
                      terms of service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-primary-blue dark:text-primary-orange hover:underline"
                    >
                      privacy policy
                    </a>
                  </label>
                </div>
                {signupForm.formState.errors.termsAccepted && (
                  <span className="text-red-500 text-sm block">
                    {signupForm.formState.errors.termsAccepted.message}
                  </span>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary-orange hover:bg-primary-orange/90 text-white py-2 mt-4"
                  disabled={signupForm.formState.isSubmitting}
                >
                  {signupForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
                
                <div className="mt-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-4">
                  <p className="text-center text-sm text-orange-800 dark:text-orange-300">
                    <strong>Note:</strong> Only students with valid @ufl.edu email addresses can register.
                    A verification email will be sent to your UF email.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}