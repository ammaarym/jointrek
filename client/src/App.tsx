import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Home from "@/pages/home";
import Login from "@/pages/login";
import FindRides from "@/pages/find-rides";
import PostRide from "@/pages/post-ride";
import FindRidesOriginalUI from "@/pages/find-rides-original-ui";
import FindRidesPostgres from "@/pages/find-rides-postgres";
import PostRidePostgres from "@/pages/post-ride-postgres";
import PostRidePostgresNew from "@/pages/post-ride-postgres-new";
import PostRideEnhanced from "@/pages/post-ride-enhanced";
import MyRidesPostgresClean from "@/pages/my-rides-postgres-clean";
import Profile from "@/pages/profile";
import React, { useEffect, useState, Suspense } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";

// This component will be used inside the AuthProvider
function AppRoutes() {
  const { currentUser, loading } = useAuth();
  
  // Protected route component that redirects to login page if not authenticated
  const ProtectedRoute = ({ component: Component, requiresContactInfo = false, ...rest }: { component: React.ComponentType<any>, path: string, requiresContactInfo?: boolean }) => {
    const [, setLocation] = useLocation();
    const [userContactInfo, setUserContactInfo] = useState<any>(null);
    const [contactInfoLoading, setContactInfoLoading] = useState(true);

    // Load user contact info when component mounts and user is available
    useEffect(() => {
      if (currentUser && requiresContactInfo) {
        loadUserContactInfo();
      } else {
        setContactInfoLoading(false);
      }
    }, [currentUser, requiresContactInfo]);

    const loadUserContactInfo = async () => {
      try {
        const response = await fetch(`/api/users/firebase/${currentUser?.uid}`);
        if (response.ok) {
          const userData = await response.json();
          setUserContactInfo(userData);
        }
      } catch (error) {
        console.error('Error loading user contact info:', error);
      } finally {
        setContactInfoLoading(false);
      }
    };

    if (loading || (requiresContactInfo && contactInfoLoading)) {
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
      </div>;
    }

    // If not authenticated, redirect to login page
    if (!currentUser) {
      // Use timeout to avoid immediate redirect issues
      setTimeout(() => {
        setLocation("/login");
      }, 100);
      
      return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-4 text-orange-600 font-semibold">Access restricted</p>
          <p>Redirecting to login page...</p>
        </div>
      </div>;
    }

    // If route requires contact info and user doesn't have any, redirect to profile
    if (requiresContactInfo && userContactInfo && !userContactInfo.phone && !userContactInfo.instagram && !userContactInfo.snapchat) {
      setTimeout(() => {
        setLocation("/profile");
      }, 100);
      
      return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-4 text-orange-600 font-semibold">Profile completion required</p>
          <p>Please add contact information to access ride features...</p>
        </div>
      </div>;
    }

    return <Component {...rest} />;
  };

  // Header navigation handlers that redirect to login page
  const openLogin = () => {
    window.location.href = '/login';
  };

  const openSignup = () => {
    window.location.href = '/login';
  };

  // This renders after successful login - redirect to profile page
  useEffect(() => {
    if (currentUser && window.location.pathname === '/') {
      window.location.href = '/profile';
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <Header onLogin={openLogin} onSignup={openSignup} />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/find-rides">
            {(params) => <ProtectedRoute component={FindRidesPostgres} path="/find-rides" requiresContactInfo={true} />}
          </Route>
          <Route path="/post-ride">
            {(params) => <ProtectedRoute component={PostRidePostgresNew} path="/post-ride" requiresContactInfo={true} />}
          </Route>
          <Route path="/my-rides">
            {(params) => <ProtectedRoute component={MyRidesPostgresClean} path="/my-rides" requiresContactInfo={true} />}
          </Route>
          <Route path="/profile">
            {(params) => <ProtectedRoute component={Profile} path="/profile" />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;