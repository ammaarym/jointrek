import React, { useState } from "react";
import { CarTaxiFront, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

// Type definitions
interface AuthModalProps {
  isOpen: boolean;
  initialView: "login" | "signup";
  onClose: () => void;
}

// Login form schema - allow any email for testing
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Signup form schema - allow any email for testing
const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and privacy policy",
  }),
});

// Type definition for login form
type LoginFormValues = z.infer<typeof loginSchema>;

// Type definition for signup form
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthModal({ isOpen, initialView, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialView);
  const { signIn, signUp } = useAuth();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
  });

  // Handle login form submission
  const handleLogin = async (values: LoginFormValues) => {
    try {
      await signIn(values.email, values.password);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  // Handle signup form submission
  const handleSignup = async (values: SignupFormValues) => {
    try {
      await signUp(values.email, values.password, values.firstName, values.lastName);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex relative">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === "login"
                ? "border-b-2 border-primary-orange text-neutral-900 dark:text-white"
                : "border-b-2 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === "signup"
                ? "border-b-2 border-primary-orange text-neutral-900 dark:text-white"
                : "border-b-2 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
            }`}
          >
            Sign Up
          </button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-2 top-2" 
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <div className="p-6">
            <div className="mb-8 text-center">
              <CarTaxiFront className="text-primary-orange text-3xl mx-auto" />
              <h2 className="text-2xl font-bold mt-2 dark:text-white">
                Welcome back to GatorLift
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Log in with your UF email
              </p>
            </div>

            <form onSubmit={loginForm.handleSubmit(handleLogin)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your.name@ufl.edu"
                    {...loginForm.register("email")}
                    className="w-full pl-3 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                  />
                  {loginForm.formState.errors.email && (
                    <span className="text-red-500 text-sm">
                      {loginForm.formState.errors.email.message}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Password
                    </label>
                    <a
                      href="#"
                      className="text-sm text-primary-blue dark:text-primary-orange hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    className="w-full pl-3 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                  />
                  {loginForm.formState.errors.password && (
                    <span className="text-red-500 text-sm">
                      {loginForm.formState.errors.password.message}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary-blue text-white py-3 rounded-md font-medium hover:bg-opacity-90 transition"
                  disabled={loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Logging in..." : "Log In"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Signup Form */}
        {activeTab === "signup" && (
          <div className="p-6">
            <div className="mb-8 text-center">
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
                      placeholder="First Name"
                      {...signupForm.register("firstName")}
                      className="w-full pl-3 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                    />
                    {signupForm.formState.errors.firstName && (
                      <span className="text-red-500 text-sm">
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
                      placeholder="Last Name"
                      {...signupForm.register("lastName")}
                      className="w-full pl-3 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                    />
                    {signupForm.formState.errors.lastName && (
                      <span className="text-red-500 text-sm">
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
                    className="w-full pl-3 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                  />
                  {signupForm.formState.errors.email && (
                    <span className="text-red-500 text-sm">
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
                    className="w-full pl-3 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                  />
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Must be at least 8 characters
                  </p>
                  {signupForm.formState.errors.password && (
                    <span className="text-red-500 text-sm">
                      {signupForm.formState.errors.password.message}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="termsAccepted"
                    {...signupForm.register("termsAccepted")}
                  />
                  <label
                    htmlFor="termsAccepted"
                    className="text-sm text-neutral-600 dark:text-neutral-400 select-none"
                  >
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-primary-blue dark:text-primary-orange hover:underline"
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-primary-blue dark:text-primary-orange hover:underline"
                    >
                      Privacy Policy
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
                  className="w-full bg-primary-orange text-white py-3 rounded-md font-medium hover:bg-opacity-90 transition"
                  disabled={signupForm.formState.isSubmitting}
                >
                  {signupForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
