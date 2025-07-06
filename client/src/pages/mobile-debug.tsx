import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  isMobileDevice, 
  authenticateDirectMobile, 
  processDirectRedirectResult,
  clearMobileAuthData 
} from '@/lib/mobile-auth-direct-fix';
import { useAuth } from '@/hooks/use-auth-fixed';

export default function MobileDebug() {
  const { currentUser, loading } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev]);
    console.log(`📱 [MOBILE_DEBUG] ${message}`);
  };

  useEffect(() => {
    // Run initial diagnostics
    addLog('=== MOBILE DEBUG STARTED ===');
    addLog(`Device is mobile: ${isMobileDevice()}`);
    addLog(`User agent: ${navigator.userAgent.substring(0, 100)}...`);
    addLog(`Current user: ${currentUser?.email || 'None'}`);
    addLog(`Loading state: ${loading}`);
    addLog(`Current URL: ${window.location.href}`);
    
    // Check for redirect result immediately
    processDirectRedirectResult()
      .then(user => {
        if (user) {
          addLog(`✅ Found redirect result: ${user.email}`);
        } else {
          addLog('ℹ️ No redirect result found');
        }
      })
      .catch(error => {
        addLog(`❌ Redirect result error: ${error.message}`);
      });
  }, [currentUser, loading]);

  const handleMobileAuth = async () => {
    setIsAuthenticating(true);
    addLog('🚀 Starting mobile authentication...');
    
    try {
      await authenticateDirectMobile();
      addLog('✅ Authentication initiated successfully');
    } catch (error: any) {
      addLog(`❌ Authentication failed: ${error.message}`);
      setIsAuthenticating(false);
    }
  };

  const handleClearData = () => {
    clearMobileAuthData();
    addLog('🧹 Cleared all mobile auth data');
    setLogs([]);
    window.location.reload();
  };

  const handleCheckRedirect = async () => {
    addLog('🔍 Checking for redirect result...');
    try {
      const user = await processDirectRedirectResult();
      if (user) {
        addLog(`✅ Redirect found: ${user.email}`);
      } else {
        addLog('ℹ️ No redirect result');
      }
    } catch (error: any) {
      addLog(`❌ Redirect check failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">
              Mobile Authentication Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Mobile Device:</strong> {isMobileDevice() ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Current User:</strong> {currentUser?.email || 'None'}
              </div>
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Auth Started:</strong> {sessionStorage.getItem('mobile_auth_started') ? 'Yes' : 'No'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleMobileAuth}
                disabled={isAuthenticating || !!currentUser}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isAuthenticating ? 'Authenticating...' : 'Test Mobile Auth'}
              </Button>
              
              <Button 
                onClick={handleCheckRedirect}
                variant="outline"
              >
                Check Redirect Result
              </Button>
              
              <Button 
                onClick={handleClearData}
                variant="destructive"
              >
                Clear All Data
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

        {/* Current User Info */}
        {currentUser && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Authentication Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Name:</strong> {currentUser.displayName}</p>
                <p><strong>Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}</p>
                <p><strong>UID:</strong> {currentUser.uid}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
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