import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth-fixed';
import { isMobileBrowser, isReplitEnvironment, clearAllMobileAuthState } from '@/lib/mobile-auth-ultimate-fix';
import { MobileAuthCircuitBreaker } from '@/lib/mobile-auth-circuit-breaker';

export default function MobileAuthTest() {
  const { currentUser, signInWithGoogle } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  useEffect(() => {
    // Run initial diagnostics
    addResult(`Mobile Browser: ${isMobileBrowser()}`);
    addResult(`Replit Environment: ${isReplitEnvironment()}`);
    addResult(`Current User: ${currentUser?.email || 'None'}`);
    addResult(`Current URL: ${window.location.href}`);
    
    // Check session storage flags
    const mobileFlags = [
      'mobile_auth_redirect',
      'mobile_auth_timestamp', 
      'auth_redirect_in_progress',
      'mobile_auth_completed',
      'mobile_replit_mode'
    ];
    
    mobileFlags.forEach(flag => {
      const value = sessionStorage.getItem(flag) || localStorage.getItem(flag);
      addResult(`Flag ${flag}: ${value || 'not set'}`);
    });
  }, [currentUser]);

  const runMobileAuthTest = async () => {
    addResult('Starting mobile auth test...');
    
    try {
      await signInWithGoogle();
      addResult('Google sign-in initiated successfully');
    } catch (error) {
      addResult(`Error during sign-in: ${error}`);
    }
  };

  const clearAllState = () => {
    clearAllMobileAuthState();
    MobileAuthCircuitBreaker.forceReset();
    addResult('Cleared all mobile auth state');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runMobileAuthTest} disabled={!!currentUser}>
                Test Mobile Auth
              </Button>
              <Button onClick={clearAllState} variant="outline">
                Clear All State
              </Button>
              <Button onClick={() => window.location.href = '/profile'} disabled={!currentUser}>
                Go to Profile
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="mb-1">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current User</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Email:</strong> {currentUser.email}</p>
                  <p><strong>Name:</strong> {currentUser.displayName}</p>
                  <p><strong>Verified:</strong> {currentUser.emailVerified ? 'Yes' : 'No'}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}