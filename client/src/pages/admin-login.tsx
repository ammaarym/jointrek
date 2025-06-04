import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passkey })
      });

      if (response.ok) {
        const { token } = await response.json();
        sessionStorage.setItem('adminToken', token);
        toast({
          title: "Access Granted",
          description: "Welcome to Trek Admin Dashboard",
        });
        setLocation('/admin-dashboard');
      } else {
        toast({
          title: "Access Denied",
          description: "Invalid admin passkey",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-stone-900">Trek Admin</CardTitle>
          <p className="text-stone-600">Enter admin passkey to continue</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                <Input
                  type="password"
                  placeholder="Admin passkey"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white"
            >
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}