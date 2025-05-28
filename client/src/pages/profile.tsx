import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { FaPhone, FaInstagram, FaEdit } from 'react-icons/fa';
import { RiSnapchatFill } from 'react-icons/ri';


export default function Profile() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      const response = await fetch(`/api/users/firebase/${currentUser?.uid}`);
      if (response.ok) {
        const userData = await response.json();
        setPhone(userData.phone || '');
        setInstagram(userData.instagram || '');
        setSnapchat(userData.snapchat || '');
        // If no contact info exists, start in edit mode
        if (!userData.phone && !userData.instagram && !userData.snapchat) {
          setIsEditing(true);
        }
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
          phone,
          instagram,
          snapchat,
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile updated",
          description: "Your contact information has been saved successfully.",
        });
        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    loadUserProfile(); // Reset to original values
    setIsEditing(false);
  };

  if (!currentUser) {
    return (
      <div className="container px-4 py-6 mx-auto">
        <div className="text-center">
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto max-w-2xl space-y-6">
      {/* Contact Information Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Profile</CardTitle>
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600">
            This information will be shown to other users when they view your rides
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Email Section */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-500 text-lg font-semibold">
                  {currentUser.displayName?.charAt(0) || currentUser.email?.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{currentUser.displayName || 'User'}</h3>
              <p className="text-sm text-gray-600">{currentUser.email}</p>
              <p className="text-xs text-gray-500">University of Florida Email</p>
            </div>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Add photo upload functionality
                  toast({
                    title: "Coming Soon",
                    description: "Profile picture upload will be available soon!",
                  });
                }}
              >
                Change Photo
              </Button>
            )}
          </div>

          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                  <FaPhone className="text-orange-600" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="instagram" className="flex items-center gap-2 mb-2">
                  <FaInstagram className="text-orange-600" />
                  Instagram Username
                </Label>
                <Input
                  id="instagram"
                  placeholder="Enter your Instagram username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="snapchat" className="flex items-center gap-2 mb-2">
                  <RiSnapchatFill className="text-orange-600" />
                  Snapchat Username
                </Label>
                <Input
                  id="snapchat"
                  placeholder="Enter your Snapchat username"
                  value={snapchat}
                  onChange={(e) => setSnapchat(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                >
                  {loading ? 'Saving...' : 'Save Contact Information'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className="space-y-6">
              {phone && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FaPhone className="text-orange-600 w-5 h-5" />
                  <div>
                    <p className="font-medium text-gray-900">Phone Number</p>
                    <p className="text-gray-600">{phone}</p>
                  </div>
                </div>
              )}

              {instagram && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <FaInstagram className="text-orange-600 w-5 h-5" />
                  <div>
                    <p className="font-medium text-gray-900">Instagram</p>
                    <p className="text-gray-600">@{instagram}</p>
                  </div>
                </div>
              )}

              {snapchat && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <RiSnapchatFill className="text-orange-600 w-5 h-5" />
                  <div>
                    <p className="font-medium text-gray-900">Snapchat</p>
                    <p className="text-gray-600">{snapchat}</p>
                  </div>
                </div>
              )}

              {!phone && !instagram && !snapchat && (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No contact information added yet</p>
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Add Contact Information
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}