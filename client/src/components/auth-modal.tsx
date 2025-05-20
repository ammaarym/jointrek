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
import { FcGoogle } from "react-icons/fc";

// Type definitions
interface AuthModalProps {
  isOpen: boolean;
  initialView: "login" | "signup";
  onClose: () => void;
}

// Login form schema - validate UF email
const loginSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .refine((email) => email.endsWith("@ufl.edu"), {
      message: "Please use your UF email address (@ufl.edu)"
    }),
  password: z.string().min(1, "Password is required"),
});

// Signup form schema - validate UF email
const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string()
    .email("Invalid email address")
    .refine((email) => email.endsWith("@ufl.edu"), {
      message: "Please use your UF email address (@ufl.edu)"
    }),
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
  const { signIn, signUp, signInWithGoogle } = useAuth();

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
  
  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    try {
      // Show warning that this feature might not be fully configured
      toast({
        title: "Google Sign-in",
        description: "Please use your UF email (@ufl.edu) for authentication. If Google sign-in fails, try email/password instead.",
        duration: 5000,
      });
      
      await signInWithGoogle();
      onClose();
    } catch (error: any) {
      console.log("Google sign-in process ended");
      
      // If it's a Firebase configuration error, show a helpful message
      if (error?.code === 'auth/configuration-not-found') {
        toast({
          title: "Google Sign-in Unavailable",
          description: "Please use email/password login instead. Remember to use your UF email (@ufl.edu).",
          duration: 5000,
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
          title: "Signup failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Tab navigation */}
        <div className="flex">
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
            <div className="mb-8 text-center">
              <CarTaxiFront className="text-primary-blue text-3xl mx-auto" />
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
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Password
                  </label>
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
                
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-neutral-300 dark:border-neutral-600" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white dark:bg-neutral-800 px-2 text-neutral-500 dark:text-neutral-400">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-white"
                      onClick={handleGoogleSignIn}
                      disabled={loginForm.formState.isSubmitting}
                    >
                      <FcGoogle className="h-5 w-5" />
                      Sign in with Google (UF Emails Only)
                    </Button>
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                      Only @ufl.edu email addresses are allowed to access this application
                    </p>
                  </div>
                </div>
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
                    Email
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
                
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-neutral-300 dark:border-neutral-600" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white dark:bg-neutral-800 px-2 text-neutral-500 dark:text-neutral-400">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-white"
                      onClick={handleGoogleSignIn}
                      disabled={signupForm.formState.isSubmitting}
                    >
                      <FcGoogle className="h-5 w-5" />
                      Sign up with Google (UF Emails Only)
                    </Button>
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                      Only @ufl.edu email addresses are allowed to access this application
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}