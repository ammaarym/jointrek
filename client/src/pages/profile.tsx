import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FaPhone, FaInstagram } from 'react-icons/fa';
import { RiSnapchatFill } from 'react-icons/ri';

export default function Profile() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [snapchat, setSnapchat] = useState('');

  // Load user profile data on mount
  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/firebase/${currentUser.uid}`);
      if (response.ok) {
        const userData = await response.json();
        setPhone(userData.phone || '');
        setInstagram(userData.instagram || '');
        setSnapchat(userData.snapchat || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/firebase/${currentUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone || null,
          instagram: instagram || null,
          snapchat: snapchat || null,
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your contact information has been saved successfully",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600">You need to be signed in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={currentUser.displayName || ''} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={currentUser.email || ''} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <p className="text-sm text-gray-600">
              This information will be shown to other users when they view your rides
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center">
                <FaPhone className="mr-2 text-primary" />
                Phone Number
              </Label>
              <Input
                id="phone"
                placeholder="e.g. 352-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center">
                <FaInstagram className="mr-2 text-primary" />
                Instagram Username
              </Label>
              <Input
                id="instagram"
                placeholder="e.g. yourusername (without @)"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="snapchat" className="flex items-center">
                <RiSnapchatFill className="mr-2 text-primary" />
                Snapchat Username
              </Label>
              <Input
                id="snapchat"
                placeholder="e.g. yourusername"
                value={snapchat}
                onChange={(e) => setSnapchat(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "Saving..." : "Save Contact Information"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}