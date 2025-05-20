import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import FindRides from "@/pages/find-rides";
import PostRide from "@/pages/post-ride";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import AuthModal from "@/components/auth-modal";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/find-rides" component={FindRides} />
      <Route path="/post-ride" component={PostRide} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authType, setAuthType] = useState<"login" | "signup">("login");

  const openLogin = () => {
    setAuthType("login");
    setShowAuthModal(true);
  };

  const openSignup = () => {
    setAuthType("signup");
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Toaster />
            <Header onLogin={openLogin} onSignup={openSignup} />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
            {showAuthModal && (
              <AuthModal 
                isOpen={showAuthModal} 
                initialView={authType}
                onClose={closeAuthModal} 
              />
            )}
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
