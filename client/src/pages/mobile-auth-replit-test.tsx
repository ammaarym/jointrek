import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  replitMobileAuth,
  signInWithGoogleMobile,
  handleMobileRedirectResult,
  setupMobileAuthListener,
  getMobileAuthDebugInfo
} from '@/lib/mobile-auth-replit-solution';
import { useAuth } from '@/hooks/use-auth-fixed';

export default function MobileAuthReplitTest() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    setLogs(prev => [logEntry, ...prev]);
    console.log(`📱 [REPLIT_TEST] ${message}`);
  };

  useEffect(() => {
    addLog('=== REPLIT MOBILE AUTH TEST STARTED ===');
    
    // Get initial debug info
    const info = getMobileAuthDebugInfo();
    setDebugInfo(info);
    
    addLog(`Environment: ${info.isReplit ? 'Replit' : 'Other'}`);
    addLog(`Device: ${info.isMobile ? 'Mobile' : 'Desktop'}`);
    addLog(`WebView: ${info.isWebView ? 'Yes' : 'No'}`);
    addLog(`Current user: ${currentUser?.email || 'None'}`);
    
    // Check for redirect result on page load
    const checkRedirect = async () => {
      try {
        addLog('🔍 Checking for redirect result...');
        const user = await handleMobileRedirectResult();
        
        if (user) {
          addLog(`✅ Redirect result found: ${user.email}`);
          addLog('🎉 Authentication successful!');
          
          // Navigate to profile after short delay
          setTimeout(() => {
            addLog('🧭 Navigating to profile...');
            window.location.replace('/profile');
          }, 2000);
        } else {
          addLog('ℹ️ No redirect result found');
        }
      } catch (error: any) {
        addLog(`❌ Redirect check failed: ${error.message}`);
        setError(error.message);
      }
    };
    
    checkRedirect();
    
    // Setup auth state listener
    const unsubscribe = setupMobileAuthListener((user) => {
      addLog(`🔥 Auth state changed: ${user?.email || 'null'}`);
      
      if (user && user.email?.endsWith('@ufl.edu')) {
        addLog('✅ Valid UF user authenticated');
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    addLog('🚀 Starting Replit mobile sign-in...');
    
    try {
      await signInWithGoogleMobile();
      addLog('✅ Sign-in initiated successfully');
      addLog('⏳ Waiting for redirect...');
      
      // Keep loading state - redirect will happen
    } catch (error: any) {
      addLog(`❌ Sign-in failed: ${error.message}`);
      setError(error.message);
      setIsSigningIn(false);
    }
  };

  const handleClearState = () => {
    addLog('🧹 Clearing all auth state...');
    localStorage.clear();
    sessionStorage.clear();
    setLogs([]);
    setError(null);
    window.location.reload();
  };

  const handleRefreshDebug = () => {
    const info = getMobileAuthDebugInfo();
    setDebugInfo(info);
    addLog('🔄 Debug info refreshed');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">
              Replit Mobile Authentication Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Environment:</strong> {debugInfo?.isReplit ? 'Replit' : 'Other'}
              </div>
              <div>
                <strong>Device Type:</strong> {debugInfo?.isMobile ? 'Mobile' : 'Desktop'}
              </div>
              <div>
                <strong>WebView:</strong> {debugInfo?.isWebView ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Current User:</strong> {currentUser?.email || 'None'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {currentUser && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ Successfully authenticated as {currentUser.email}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleSignIn}
                disabled={isSigningIn || !!currentUser}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSigningIn ? 'Signing In...' : 'Test Replit Mobile Auth'}
              </Button>
              
              <Button 
                onClick={handleRefreshDebug}
                variant="outline"
              >
                Refresh Debug Info
              </Button>
              
              <Button 
                onClick={handleClearState}
                variant="destructive"
              >
                Clear All State
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/profile'}
                disabled={!currentUser}
                variant="secondary"
              >
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        {debugInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded text-sm font-mono">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Live Logs ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1 break-all">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open this page on your mobile device</li>
              <li>Click "Test Replit Mobile Auth" to start authentication</li>
              <li>Complete Google OAuth flow</li>
              <li>Check logs for any errors or loops</li>
              <li>Should redirect to profile on success</li>
            </ol>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}