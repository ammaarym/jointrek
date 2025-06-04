import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-new';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, User, Phone, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RideRequest {
  id: number;
  rideId: number;
  passengerId: string;
  status: string;
  message: string;
  createdAt: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  rideOrigin: string;
  rideDestination: string;
  rideDepartureTime: string;
  ridePrice: string;
}

export default function RideRequestsTab() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchRequests();
    }
  }, [currentUser]);

  const fetchRequests = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ride-requests/driver', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Ride requests received:', data.length);
        console.log('Ride requests with statuses:', data.map(r => ({ id: r.id, status: r.status })));
        setRequests(data);
      } else {
        throw new Error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load ride requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (requestId: number, status: 'approved' | 'rejected') => {
    if (!currentUser) return;
    
    setActionLoading(requestId);
    try {
      const response = await fetch(`/api/ride-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Request ${status} successfully`,
        });
        // Refresh the requests list
        fetchRequests();
      } else {
        throw new Error(`Failed to ${status} request`);
      }
    } catch (error) {
      console.error(`Error ${status}ing request:`, error);
      toast({
        title: "Error",
        description: `Failed to ${status} request. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-stone-600">Loading requests...</div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');
  
  console.log('Pending requests count:', pendingRequests.length, 'Total requests:', requests.length);

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Pending Requests ({pendingRequests.length})</h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-stone-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-stone-900">New Trek Request</CardTitle>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Passenger Info */}
                  <div className="bg-stone-50 p-3 rounded-lg">
                    <h4 className="font-medium text-stone-900 mb-2 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Passenger Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {request.passengerName}</p>
                      <p><span className="font-medium">Email:</span> {request.passengerEmail}</p>
                      {request.passengerPhone && (
                        <p><span className="font-medium">Phone:</span> {request.passengerPhone}</p>
                      )}
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="bg-stone-50 p-3 rounded-lg">
                    <h4 className="font-medium text-stone-900 mb-2">Trip Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-stone-600" />
                        <span>{request.rideOrigin} → {request.rideDestination}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-stone-600" />
                        <span>{formatTime(request.rideDepartureTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-stone-600" />
                        <span>${request.ridePrice}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {request.message && (
                    <div className="bg-stone-50 p-3 rounded-lg">
                      <h4 className="font-medium text-stone-900 mb-2 flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </h4>
                      <p className="text-sm text-stone-700">{request.message}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleRequestResponse(request.id, 'approved')}
                      disabled={actionLoading === request.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading === request.id ? 'Processing...' : 'Approve Request'}
                    </Button>
                    <Button
                      onClick={() => handleRequestResponse(request.id, 'rejected')}
                      disabled={actionLoading === request.id}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    >
                      {actionLoading === request.id ? 'Processing...' : 'Decline Request'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Previous Requests ({processedRequests.length})</h3>
          <div className="space-y-3">
            {processedRequests.map((request) => (
              <Card key={request.id} className="border-stone-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <User className="w-4 h-4 text-stone-600" />
                      <span className="font-medium">{request.passengerName}</span>
                      <span className="text-stone-600">•</span>
                      <span className="text-sm text-stone-600">{request.rideOrigin} → {request.rideDestination}</span>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Requests */}
      {requests.length === 0 && (
        <div className="text-center py-8">
          <User className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-stone-900 mb-2">No ride requests yet</h3>
          <p className="text-stone-600">Passengers will see your rides and can request to join them.</p>
        </div>
      )}
    </div>
  );
}