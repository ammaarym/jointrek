import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-fixed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function MyRidesClean() {
  const { currentUser } = useAuth();
  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-posts');
  const { toast } = useToast();

  // Load user's rides with proper authentication
  const loadMyRides = async (forceReload = false) => {
    if (!currentUser?.uid) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    if (myRides.length > 0 && !forceReload && !error) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('GET', '/api/user-rides');
      const data = await response.json();
      setMyRides(data || []);
    } catch (error) {
      console.error('Error loading rides:', error);
      setError('Failed to load rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadMyRides();
    }
  }, [currentUser?.uid]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Rides</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Rides</h1>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => loadMyRides(true)}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Rides</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-posts">My Posts</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-posts" className="space-y-4 mt-6">
          {myRides.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No rides posted yet</p>
              <Button onClick={() => window.location.href = '/post-ride'}>
                Post Your First Ride
              </Button>
            </div>
          ) : (
            myRides.map((ride) => (
              <Card key={ride.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">
                      {ride.origin?.city || 'Unknown'} → {ride.destination?.city || 'Unknown'}
                    </h3>
                    <span className="text-lg font-bold text-green-600">
                      ${ride.price}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📅 {formatDate(ride.departureTime)} at {formatTime(ride.departureTime)}</p>
                    <p>👥 {ride.seatsLeft}/{ride.seatsTotal} seats available</p>
                    {ride.carMake && ride.carModel && (
                      <p>🚗 {ride.carMake} {ride.carModel}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4 mt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Ride requests will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}