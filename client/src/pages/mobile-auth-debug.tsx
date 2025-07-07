import { useState, useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth-fixed';

export default function MobileAuthDebug() {
  const { currentUser, loading, signInWithGoogle } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [authStateLog, setAuthStateLog] = useState<any[]>([]);
  const [redirectResult, setRedirectResult] = useState<any>(null);

  // Collect comprehensive debug information
  useEffect(() => {
    const collectDebugInfo = () => {
      const info = {
        // Device & Browser Info
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isSafari: /Safari/i.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent),
        isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
        
        // Current State
        currentURL: window.location.href,
        domain: window.location.hostname,
        pathname: window.location.pathname,
        search: window.location.search,
        
        // Firebase Config
        firebaseAuthDomain: auth.app.options.authDomain,
        firebaseProjectId: auth.app.options.projectId,
        
        // Local Storage
        localStorage: {
          trek_firebase_auth_backup: localStorage.getItem('trek_firebase_auth_backup'),
          mobile_auth_completed: localStorage.getItem('mobile_auth_completed'),
          trek_redirect_count: localStorage.getItem('trek_redirect_count'),
        },
        
        // Session Storage
        sessionStorage: {
          firebase_popup_fallback: sessionStorage.getItem('firebase_popup_fallback'),
          firebase_redirect_auth: sessionStorage.getItem('firebase_redirect_auth'),
          mobile_auth_redirect: sessionStorage.getItem('mobile_auth_redirect'),
          auth_redirect_in_progress: sessionStorage.getItem('auth_redirect_in_progress'),
        },
        
        // Auth State
        currentUser: currentUser ? {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
          displayName: currentUser.displayName,
        } : null,
        loading,
        
        // Timestamp
        timestamp: new Date().toISOString(),
      };
      
      setDebugInfo(info);
    };

    collectDebugInfo();
    
    // Update every 2 seconds
    const interval = setInterval(collectDebugInfo, 2000);
    
    return () => clearInterval(interval);
  }, [currentUser, loading]);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event: 'onAuthStateChanged',
        user: user ? {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
        } : null,
      };
      
      setAuthStateLog(prev => [logEntry, ...prev].slice(0, 10)); // Keep last 10 entries
    });

    return unsubscribe;
  }, []);

  // Check redirect result
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setRedirectResult({
            timestamp: new Date().toISOString(),
            user: result.user ? {
              uid: result.user.uid,
              email: result.user.email,
              emailVerified: result.user.emailVerified,
            } : null,
            providerId: result.providerId,
            operationType: result.operationType,
          });
        }
      } catch (error) {
        setRedirectResult({
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    checkRedirectResult();
  }, []);

  const clearAllStorage = () => {
    // Clear relevant localStorage items
    localStorage.removeItem('trek_firebase_auth_backup');
    localStorage.removeItem('mobile_auth_completed');
    localStorage.removeItem('trek_redirect_count');
    
    // Clear relevant sessionStorage items
    sessionStorage.removeItem('firebase_popup_fallback');
    sessionStorage.removeItem('firebase_redirect_auth');
    sessionStorage.removeItem('mobile_auth_redirect');
    sessionStorage.removeItem('auth_redirect_in_progress');
    
    console.log('🧹 Cleared all auth-related storage');
    window.location.reload();
  };

  const testGoogleSignIn = async () => {
    try {
      console.log('🧪 [DEBUG] Testing Google Sign-In...');
      await signInWithGoogle();
    } catch (error) {
      console.error('🧪 [DEBUG] Sign-in error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Mobile Auth Debug Screen</h1>
      
      <div className="grid gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testGoogleSignIn} className="w-full">
              Test Google Sign-In
            </Button>
            <Button onClick={clearAllStorage} variant="destructive" className="w-full">
              Clear All Auth Storage & Reload
            </Button>
          </CardContent>
        </Card>

        {/* Current Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current State</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Auth State Log */}
        <Card>
          <CardHeader>
            <CardTitle>Auth State Changes (Last 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
              {JSON.stringify(authStateLog, null, 2)}
            </pre>
          </CardContent>
        </Card>

        {/* Redirect Result */}
        {redirectResult && (
          <Card>
            <CardHeader>
              <CardTitle>Redirect Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(redirectResult, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}