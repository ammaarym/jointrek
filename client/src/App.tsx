import { Switch, Route, useLocation, Redirect } from "wouter";
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
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";

// Modified protected route component - bypass authentication for testing
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { currentUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
    </div>;
  }

  // Always allow access regardless of authentication status
  // This is for testing purposes only
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/find-rides">
        {(params) => <ProtectedRoute component={FindRides} path="/find-rides" />}
      </Route>
      <Route path="/post-ride">
        {(params) => <ProtectedRoute component={PostRide} path="/post-ride" />}
      </Route>
      <Route path="/messages">
        {(params) => <ProtectedRoute component={Messages} path="/messages" />}
      </Route>
      <Route path="/profile">
        {(params) => <ProtectedRoute component={Profile} path="/profile" />}
      </Route>
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
        <ThemeProvider>
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
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
