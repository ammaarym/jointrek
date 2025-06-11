import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Car, User, Phone, Mail, Instagram } from 'lucide-react';
import { FaSnapchatGhost } from 'react-icons/fa';

interface UserStats {
  driverRating: number;
  passengerRating: number;
  totalDriverRatings: number;
  totalPassengerRatings: number;
  ridesAsDriver: number;
  ridesAsPassenger: number;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    phone?: string;
    instagram?: string;
    snapchat?: string;
  };
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user.id) {
      loadUserStats();
    }
  }, [isOpen, user.id]);

  const loadUserStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/stats`);
      if (response.ok) {
        const userStats = await response.json();
        setStats(userStats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.photoUrl} alt={user.name} />
              <AvatarFallback className="text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            {user.phone && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.instagram && (
              <div className="flex items-center space-x-2 text-sm">
                <Instagram className="w-4 h-4 text-muted-foreground" />
                <span>@{user.instagram}</span>
              </div>
            )}
            {user.snapchat && (
              <div className="flex items-center space-x-2 text-sm">
                <FaSnapchatGhost className="w-4 h-4 text-muted-foreground" />
                <span>{user.snapchat}</span>
              </div>
            )}
          </div>

          {/* Ratings and Stats */}
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Loading stats...</p>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {/* Driver Stats */}
              {stats.totalDriverRatings > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">As Driver</span>
                      </div>
                      <Badge variant="secondary">
                        {stats.ridesAsDriver} ride{stats.ridesAsDriver !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(stats.driverRating)}</div>
                      <span className="text-sm font-medium">
                        {stats.driverRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({stats.totalDriverRatings} review{stats.totalDriverRatings !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Passenger Stats */}
              {stats.totalPassengerRatings > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-green-600" />
                        <span className="font-medium">As Passenger</span>
                      </div>
                      <Badge variant="secondary">
                        {stats.ridesAsPassenger} ride{stats.ridesAsPassenger !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(stats.passengerRating)}</div>
                      <span className="text-sm font-medium">
                        {stats.passengerRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({stats.totalPassengerRatings} review{stats.totalPassengerRatings !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No ratings yet */}
              {stats.totalDriverRatings === 0 && stats.totalPassengerRatings === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No ratings yet</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Unable to load stats</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}