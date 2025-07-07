import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  signInWithGooglePopup,
  handlePopupRedirectFallback,
  getPopupAuthDebugInfo,
  signOutPopup
} from '@/lib/firebase-auth-popup-fix';
import { useAuth } from '@/hooks/use-auth-fixed';

export default function FirebasePopupTest() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp}: ${message}`;
    setLogs(prev => [logEntry, ...prev]);
    console.log(`🧪 [POPUP_TEST] ${message}`);
  };

  useEffect(() => {
    addLog('=== FIREBASE POPUP AUTH TEST STARTED ===');
    
    // Get initial debug info
    const info = getPopupAuthDebugInfo();
    setDebugInfo(info);
    
    addLog(`Environment: ${info.isReplit ? 'Replit' : 'Other'}`);
    addLog(`Device: ${info.isMobile ? 'Mobile' : 'Desktop'}`);
    addLog(`Current user: ${currentUser?.email || 'None'}`);
    addLog(`Has fallback flag: ${info.hasFallbackFlag ? 'Yes' : 'No'}`);
    
    // Check for redirect fallback on page load
    const checkFallback = async () => {
      try {
        addLog('🔍 Checking for popup redirect fallback...');
        const user = await handlePopupRedirectFallback();
        
        if (user) {
          addLog(`✅ Fallback redirect found: ${user.email}`);
          addLog('🎉 Authentication successful!');
        } else {
          addLog('ℹ️ No fallback redirect found');
        }
      } catch (error: any) {
        addLog(`❌ Fallback check failed: ${error.message}`);
        setError(error.message);
      }
    };
    
    checkFallback();
  }, [currentUser]);

  const handlePopupSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    addLog('🚀 Starting popup authentication...');
    
    try {
      const user = await signInWithGooglePopup();
      addLog(`✅ Popup authentication successful: ${user.email}`);
      addLog('🎉 User signed in successfully!');
      
      // Refresh debug info
      setDebugInfo(getPopupAuthDebugInfo());
      
    } catch (error: any) {
      if (error.message === 'Redirect initiated') {
        addLog('🔄 Popup blocked, redirect fallback initiated');
        addLog('⏳ Page will redirect for authentication...');
        // Don't set loading to false - redirect will happen
        return;
      }
      
      addLog(`❌ Popup authentication failed: ${error.message}`);
      setError(error.message);
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    addLog('🚪 Signing out...');
    try {
      await signOutPopup();
      addLog('✅ Signed out successfully');
      setDebugInfo(getPopupAuthDebugInfo());
    } catch (error: any) {
      addLog(`❌ Sign out failed: ${error.message}`);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
    setError(null);
    addLog('🧹 Logs cleared');
  };

  const handleRefreshDebug = () => {
    const info = getPopupAuthDebugInfo();
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
              Firebase Popup Authentication Test
            </CardTitle>
            <p className="text-center text-gray-600">
              This tests the popup-based solution for mobile redirect loops
            </p>
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
                <strong>Current User:</strong> {currentUser?.email || 'None'}
              </div>
              <div>
                <strong>Fallback Mode:</strong> {debugInfo?.hasFallbackFlag ? 'Active' : 'Inactive'}
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
                onClick={handlePopupSignIn}
                disabled={isSigningIn || !!currentUser}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSigningIn ? 'Signing In...' : 'Test Popup Sign-In'}
              </Button>
              
              <Button 
                onClick={handleSignOut}
                disabled={!currentUser}
                variant="outline"
              >
                Sign Out
              </Button>
              
              <Button 
                onClick={handleRefreshDebug}
                variant="outline"
              >
                Refresh Debug Info
              </Button>
              
              <Button 
                onClick={handleClearLogs}
                variant="secondary"
              >
                Clear Logs
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/profile'}
                disabled={!currentUser}
                className="bg-green-600 hover:bg-green-700"
              >
                Go to Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>How This Solution Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Tries popup authentication first (works on most desktop browsers)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>If popup is blocked, automatically falls back to redirect</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Handles redirect results properly without infinite loops</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>Validates UF email domain and provides clear error messages</span>
              </div>
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

      </div>
    </div>
  );
}