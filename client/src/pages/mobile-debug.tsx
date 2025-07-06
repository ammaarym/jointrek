import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  isMobileDevice, 
  authenticateMobilePersistent, 
  processRedirectResultPersistent,
  persistentState,
  getMobileAuthDebugInfo,
  navigateToProfile
} from '@/lib/mobile-auth-persistent';
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
    const debugInfo = getMobileAuthDebugInfo();
    addLog(`Device is mobile: ${debugInfo.isMobile}`);
    addLog(`User agent: ${debugInfo.userAgent}`);
    addLog(`Current user: ${currentUser?.email || 'None'}`);
    addLog(`Loading state: ${loading}`);
    addLog(`Current URL: ${debugInfo.currentUrl}`);
    addLog(`Ready state: ${debugInfo.readyState}`);
    addLog(`Persistent state: ${JSON.stringify(debugInfo.persistentState)}`);
    
    // Check for redirect result immediately
    processRedirectResultPersistent()
      .then(user => {
        if (user) {
          addLog(`✅ Found redirect result: ${user.email}`);
          addLog('🧭 Preparing safe navigation to profile...');
          navigateToProfile(user);
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
    addLog('🚀 Starting persistent mobile authentication...');
    
    try {
      await authenticateMobilePersistent();
      addLog('✅ Authentication initiated successfully');
    } catch (error: any) {
      addLog(`❌ Authentication failed: ${error.message}`);
      setIsAuthenticating(false);
    }
  };

  const handleClearData = () => {
    persistentState.clearAll();
    addLog('🧹 Cleared all persistent mobile auth data');
    setLogs([]);
    window.location.reload();
  };

  const handleCheckRedirect = async () => {
    addLog('🔍 Checking for persistent redirect result...');
    try {
      const user = await processRedirectResultPersistent();
      if (user) {
        addLog(`✅ Redirect found: ${user.email}`);
        addLog('🧭 Initiating safe navigation...');
        navigateToProfile(user);
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
                <strong>Redirect Started:</strong> {persistentState.isRedirectStarted() ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Redirect Checked:</strong> {persistentState.hasRedirectBeenChecked() ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Page Loaded:</strong> {persistentState.isPageLoaded() ? 'Yes' : 'No'}
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