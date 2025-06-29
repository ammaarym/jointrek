import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/lib/error-boundary";

import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Home from "@/pages/home-enhanced-fixed";
import Login from "@/pages/login";
import AuthTab from "@/pages/auth-tab";
import FindRidesPostgres from "@/pages/find-rides-postgres";
import PostRidePostgres from "@/pages/post-ride-postgres";
import RequestRidePage from "@/pages/request-ride";
import RequestRideSimplePage from "@/pages/request-ride-simple";
import OfferRidePage from "@/pages/offer-ride";
import ProfilePaymentPage from "@/pages/profile-payment";
import RideRequestApproval from "@/pages/ride-request-approval";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";

import MyRidesPostgresClean from "@/pages/my-rides-postgres-clean";
import Profile from "@/pages/profile";
import TestPayment from "@/pages/test-payment";
import Help from "@/pages/help";
import NotificationsPage from "@/pages/notifications";
import StripeSetupGuide from "@/pages/stripe-setup-guide";
import SetupCheck from "@/pages/setup-check";
import TermsOfService from "@/pages/terms-of-service";
import React, { useEffect, useState, Suspense } from "react";
import { useAuth, AuthProvider } from "@/hooks/use-auth-fixed";
import { ThemeProvider } from "@/lib/theme";
import { toast } from "@/hooks/use-toast";

// Navigation handlers
const openLogin = () => {
  window.location.href = '/login';
};

const openSignup = () => {
  window.location.href = '/login';
};

// This component will be used inside the AuthProvider
function AppRoutes() {
  const { currentUser, loading } = useAuth();
  

  
  // Protected route component that redirects to login page if not authenticated
  const ProtectedRoute = ({ component: Component, requiresContactInfo = false, ...rest }: { component: React.ComponentType<any>, path: string, requiresContactInfo?: boolean }) => {
    const [, setLocation] = useLocation();
    const [userContactInfo, setUserContactInfo] = useState<any>(null);
    const [contactInfoLoading, setContactInfoLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [hasLoadedContactInfo, setHasLoadedContactInfo] = useState(false);
    const [authStateStable, setAuthStateStable] = useState(false);

    // Load user contact info when component mounts and user is available
    useEffect(() => {
      const checkAuth = async () => {
        console.log('🔒 [PROTECTED_ROUTE] Auth check started', {
          loading,
          currentUser: currentUser?.email || 'null',
          requiresContactInfo,
          hasLoadedContactInfo,
          authChecked,
          path: rest.path
        });
        
        // Wait for auth loading to complete
        if (loading) {
          console.log('🔒 [PROTECTED_ROUTE] Auth still loading, waiting...');
          return;
        }
        
        if (currentUser) {
          console.log('🔒 [PROTECTED_ROUTE] User authenticated:', currentUser.email);
          if (requiresContactInfo && !hasLoadedContactInfo) {
            console.log('🔒 [PROTECTED_ROUTE] Loading contact info for user');
            await loadUserContactInfo();
            setHasLoadedContactInfo(true);
          } else if (!requiresContactInfo) {
            console.log('🔒 [PROTECTED_ROUTE] No contact info required, setting not loading');
            setContactInfoLoading(false);
          }
        } else {
          console.log('🔒 [PROTECTED_ROUTE] ❌ RACE CONDITION DETECTED - No current user found', {
            loadingState: loading,
            authCheckedState: authChecked,
            authStateStable,
            currentUserType: typeof currentUser,
            currentUserValue: currentUser,
            timestamp: new Date().toISOString(),
            path: rest.path,
            stackTrace: new Error().stack
          });
          setContactInfoLoading(false);
        }
        setAuthChecked(true);
        console.log('🔒 [PROTECTED_ROUTE] Auth check completed', {
          finalCurrentUser: currentUser?.email || 'null',
          authChecked: true,
          authStateStable,
          timestamp: new Date().toISOString()
        });
      };
      
      checkAuth();
    }, [currentUser?.uid, requiresContactInfo, loading, hasLoadedContactInfo]);

    // Add delay to prevent race condition and window event listeners
    useEffect(() => {
      // Set auth state as stable after initial load
      const timer = setTimeout(() => {
        setAuthStateStable(true);
      }, 300);

      const handleWindowFocus = () => {
        if (currentUser && requiresContactInfo && !contactInfoLoading && hasLoadedContactInfo) {
          loadUserContactInfo();
        }
      };

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'profile_updated' && currentUser && requiresContactInfo) {
          setTimeout(() => {
            loadUserContactInfo();
            setHasLoadedContactInfo(true);
          }, 500);
          localStorage.removeItem('profile_updated');
        }
      };

      window.addEventListener('focus', handleWindowFocus);
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('storage', handleStorageChange);
      };
    }, [currentUser, requiresContactInfo, contactInfoLoading, hasLoadedContactInfo]);

    const loadUserContactInfo = async () => {
      try {
        const response = await fetch(`/api/users/firebase/${currentUser?.uid}`, {
          cache: 'no-cache', // Always fetch fresh data
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
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

    // Show loading while auth is being determined or while contact info is being fetched
    if (loading || !authChecked || (requiresContactInfo && contactInfoLoading)) {
      console.log('🔒 [PROTECTED_ROUTE] Showing loading state', {
        loading,
        authChecked,
        requiresContactInfo,
        contactInfoLoading,
        path: rest.path
      });
      return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">
          {loading || !authChecked ? 'Loading...' : 'Loading contact info...'}
        </span>
      </div>;
    }

    // Only show authentication required if we're certain auth is loaded, stable, and user is null
    if (!loading && authChecked && !currentUser && authStateStable) {
      console.log('🔒 [PROTECTED_ROUTE] ❌ AUTHENTICATION REQUIRED - showing login prompt', {
        loading,
        authChecked,
        currentUser: currentUser?.email || 'null',
        currentUserType: typeof currentUser,
        authStateStable,
        path: rest.path,
        timestamp: new Date().toISOString(),
        possibleRaceCondition: 'User was authenticated but now appears null'
      });
      return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Authentication Required</h2>
          <p className="mb-6 text-gray-600">You need to be logged in to access this page.</p>
          <button 
            onClick={() => setLocation("/login")}
            className="px-6 py-3 text-white rounded-lg font-medium"
            style={{ backgroundColor: '#B8956B' }}
          >
            Log In
          </button>
        </div>
      </div>;
    }

    // If route requires contact info and user doesn't have phone number or phone not verified, redirect to profile
    const hasValidPhone = userContactInfo?.phone && userContactInfo.phone.trim().length > 0;
    const isPhoneVerified = userContactInfo?.phoneVerified === true;
    
    console.log('🔒 [PROTECTED_ROUTE] Contact info validation', {
      requiresContactInfo,
      userContactInfo: userContactInfo ? {
        hasPhone: !!userContactInfo.phone,
        phoneLength: userContactInfo.phone?.length || 0,
        phoneVerified: userContactInfo.phoneVerified
      } : 'null',
      hasValidPhone,
      isPhoneVerified,
      path: rest.path
    });
    
    if (requiresContactInfo && userContactInfo && (!hasValidPhone || !isPhoneVerified)) {
      console.log('🔒 [PROTECTED_ROUTE] Redirecting to profile - missing contact info');
      setTimeout(() => {
        setLocation("/profile");
      }, 100);
      
      return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-4 text-orange-600 font-semibold">Phone number required</p>
          <p>Please add your phone number to access ride features for safety...</p>
        </div>
      </div>;
    }

    console.log('🔒 [PROTECTED_ROUTE] All checks passed - rendering component', {
      path: rest.path,
      userEmail: currentUser?.email
    });
    return <Component {...rest} />;
  };

  // Show loading or main app
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster />
      <Header onLogin={openLogin} onSignup={openSignup} />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/auth-tab" component={AuthTab} />
          <Route path="/find-rides">
            {(params) => <ProtectedRoute component={FindRidesPostgres} path="/find-rides" requiresContactInfo={true} />}
          </Route>
          <Route path="/find-rides-postgres">
            {(params) => <ProtectedRoute component={FindRidesPostgres} path="/find-rides-postgres" requiresContactInfo={true} />}
          </Route>
          <Route path="/setup-post-ride">
            {(params) => <ProtectedRoute component={() => <SetupCheck mode="post" />} path="/setup-post-ride" requiresContactInfo={true} />}
          </Route>
          <Route path="/setup-request-ride">
            {(params) => <ProtectedRoute component={() => <SetupCheck mode="request" />} path="/setup-request-ride" requiresContactInfo={true} />}
          </Route>
          <Route path="/post-ride">
            {(params) => <ProtectedRoute component={PostRidePostgres} path="/post-ride" requiresContactInfo={true} />}
          </Route>
          <Route path="/request-ride">
            {(params) => <ProtectedRoute component={PostRidePostgres} path="/request-ride" requiresContactInfo={true} />}
          </Route>
          <Route path="/request-ride/:id">
            {(params) => <ProtectedRoute component={RequestRidePage} path="/request-ride/:id" requiresContactInfo={true} />}
          </Route>
          <Route path="/request-ride-simple/:id">
            {(params) => <ProtectedRoute component={RequestRideSimplePage} path="/request-ride-simple/:id" requiresContactInfo={true} />}
          </Route>
          <Route path="/offer-ride/:id">
            {(params) => <ProtectedRoute component={OfferRidePage} path="/offer-ride/:id" requiresContactInfo={true} />}
          </Route>
          <Route path="/profile/payment">
            {(params) => <ProtectedRoute component={ProfilePaymentPage} path="/profile/payment" requiresContactInfo={true} />}
          </Route>
          <Route path="/profile-payment">
            {(params) => <ProtectedRoute component={ProfilePaymentPage} path="/profile-payment" requiresContactInfo={true} />}
          </Route>
          <Route path="/test-payment">
            {(params) => <ProtectedRoute component={TestPayment} path="/test-payment" />}
          </Route>
          <Route path="/my-rides">
            {(params) => <ProtectedRoute component={MyRidesPostgresClean} path="/my-rides" requiresContactInfo={true} />}
          </Route>
          <Route path="/help">
            {(params) => <ProtectedRoute component={Help} path="/help" />}
          </Route>
          <Route path="/notifications">
            {(params) => <ProtectedRoute component={NotificationsPage} path="/notifications" />}
          </Route>
          <Route path="/stripe-setup-guide">
            {(params) => <ProtectedRoute component={StripeSetupGuide} path="/stripe-setup-guide" />}
          </Route>
          <Route path="/profile">
            {(params) => <ProtectedRoute component={Profile} path="/profile" />}
          </Route>
          <Route path="/requests/:requestId">
            {(params) => <ProtectedRoute component={RideRequestApproval} path="/requests/:requestId" />}
          </Route>
          <Route path="/admin-login" component={AdminLogin} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;