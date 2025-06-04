import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-new';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaCar, FaTrash, FaEdit, FaCheck, FaExclamationTriangle, FaUser } from 'react-icons/fa';
import { BiMessageDetail } from 'react-icons/bi';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EditRideModal from '@/components/edit-ride-modal';
import { Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RideRequestsTab from '@/components/ride-requests-tab';

// Helper function to capitalize car types
const capitalizeCarType = (carType: string) => {
  if (!carType) return 'Car not specified';
  // Handle specific capitalizations
  if (carType.toLowerCase() === 'suv') return 'SUV';
  // Capitalize first letter for other types
  return carType.charAt(0).toUpperCase() + carType.slice(1).toLowerCase();
};

export default function MyRidesPostgres() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('driver');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rideToReview, setRideToReview] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [rideToComplete, setRideToComplete] = useState<any>(null);

  const [completedRides, setCompletedRides] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ride request state
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Pending requests (outgoing) state
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);



  // Load user's rides
  const loadMyRides = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user-rides', {
        headers: {
          'x-user-id': userId,
          'x-user-email': currentUser?.email || '',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setMyRides(data || []);
    } catch (error) {
      console.error('Error loading my rides:', error);
      setError('Failed to load your rides. Please try again.');
      setMyRides([]);
    } finally {
      setLoading(false);
    }
  };

  // Load rides on component mount and when user changes
  useEffect(() => {
    if (currentUser?.uid) {
      loadMyRides(currentUser.uid);
      loadRideRequests();
      loadPendingRequests();
    }
  }, [currentUser?.uid]);

  // Load ride requests for driver
  const loadRideRequests = async () => {
    if (!currentUser) return;
    
    setRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/driver', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });
      
      if (response.ok) {
        const requests = await response.json();
        setRideRequests(requests);
      }
    } catch (error) {
      console.error('Error loading ride requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Load pending ride requests (outgoing requests from user)
  const loadPendingRequests = async () => {
    if (!currentUser) return;
    
    setPendingRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/user', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        const requests = await response.json();
        setPendingRequests(requests);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setPendingRequestsLoading(false);
    }
  };

  // Handle ride request approval/rejection
  const handleRequestResponse = async (requestId: number, status: 'approved' | 'rejected') => {
    if (!currentUser) return;
    
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
          title: `Request ${status}`,
          description: `Passenger request has been ${status}.`
        });
        loadRideRequests(); // Reload requests
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to update request',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update request',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleMarkComplete = (ride: any) => {
    setRideToComplete(ride);
    setCompleteDialogOpen(true);
  };

  const confirmMarkComplete = async () => {
    if (!rideToComplete || !currentUser) return;

    try {
      const response = await fetch(`/api/rides/${rideToComplete.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.uid || '',
        },
      });

      if (response.ok) {
        setCompleteDialogOpen(false);
        setRideToComplete(null);
        
        // Show review modal
        setRideToReview(rideToComplete);
        setReviewModalOpen(true);
      } else {
        throw new Error('Failed to mark ride as complete');
      }
    } catch (error) {
      console.error('Error marking ride complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark ride as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!rideToReview || rating === 0 || !currentUser) {
      toast({
        title: "Invalid Review",
        description: "Please provide a rating to submit your review.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Submit review to backend
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.uid || '',
          'x-user-email': currentUser?.email || '',
          'x-user-name': currentUser?.displayName || '',
        },
        body: JSON.stringify({
          rideId: rideToReview?.id,
          rating,
          revieweeId: rideToReview?.driverId,
          reviewType: rideToReview?.rideType === 'driver' ? 'driver' : 'passenger',
        }),
      });

      if (response.ok) {
        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!",
        });
      } else {
        throw new Error('Failed to submit review');
      }
      
      setReviewModalOpen(false);
      setRating(0);
      
      // Update the ride status immediately in the state
      if (rideToReview) {
        setCompletedRides(prev => new Set(Array.from(prev).concat(rideToReview.id)));
      }
      
      setRideToReview(null);
      
      // Reload rides to sync with server
      if (currentUser) {
        loadMyRides(currentUser.uid);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditRide = (ride: any) => {
    setRideToEdit(ride);
    setEditModalOpen(true);
  };

  const updateRide = async (id: number, data: any): Promise<boolean> => {
    try {
      setMyRides(rides => rides.map(ride => 
        ride.id === id ? { ...ride, ...data } : ride
      ));
      return true;
    } catch (error) {
      console.error('Error updating ride:', error);
      return false;
    }
  };

  const handleDeleteRide = async () => {
    if (!rideToDelete) return;

    if (rideToDelete.isCompleted) {
      toast({
        title: "Cannot Delete",
        description: "Completed rides cannot be deleted.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setRideToDelete(null);
      return;
    }

    try {
      const response = await fetch(`/api/rides/${rideToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser?.uid || '',
        }
      });

      if (response.ok) {
        setMyRides(rides => rides.filter(ride => ride.id !== rideToDelete.id));
        setDeleteDialogOpen(false);
        setRideToDelete(null);
        
        toast({
          title: "Ride deleted successfully",
          description: "Your ride has been removed.",
        });
        
        // Reload rides
        if (currentUser) {
          loadMyRides(currentUser.uid);
        }
      } else {
        throw new Error('Failed to remove ride');
      }
    } catch (error) {
      console.error('Error removing ride:', error);
      toast({
        title: "Error",
        description: "Failed to remove ride. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navigateToPostRide = () => {
    setLocation('/post-ride');
  };

  const renderRideCard = (ride: any) => (
    <Card key={ride.id} className="overflow-hidden h-full flex flex-col">
      <CardContent className="p-4 flex-1">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {ride.origin} → {ride.destination}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(new Date(ride.departureTime))}
            </p>
          </div>
          <span className="text-lg font-semibold text-primary">
            ${ride.price}
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <FaCalendarAlt className="text-primary mr-2 flex-shrink-0" />
            <span>Departure: {formatDate(new Date(ride.departureTime))} at {new Date(ride.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>
          {ride.rideType === 'driver' && (
            <>
              <div className="flex items-center">
                <FaCar className="text-primary mr-2 flex-shrink-0" />
                <span>{capitalizeCarType(ride.carModel || '')}</span>
              </div>
              <div className="flex items-center">
                <FaUserFriends className="text-primary mr-2 flex-shrink-0" />
                <span>{ride.seatsLeft} available</span>
              </div>
            </>
          )}
          {ride.rideType === 'passenger' && (
            <div className="flex items-center">
              <FaUserFriends className="text-primary mr-2 flex-shrink-0" />
              <span>1 passenger needed</span>
            </div>
          )}
          <div className="flex items-start">
            <FaMapMarkerAlt className="text-primary mr-2 mt-1 flex-shrink-0" />
            <div>
              <div>From: {ride.originArea || ride.origin}</div>
              <div>To: {ride.destinationArea || ride.destination}</div>
            </div>
          </div>

        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2 p-4 pt-0">
        {ride.isCompleted ? (
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <FaCheck className="w-4 h-4" />
            Completed
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkComplete(ride)}
            className="flex items-center gap-1 border-green-600 text-green-600 hover:bg-green-50"
          >
            <FaCheck className="w-4 h-4" />
            Mark Complete
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditRide(ride)}
          className="flex items-center gap-1"
        >
          <FaEdit className="w-4 h-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRideToDelete(ride);
            setDeleteDialogOpen(true);
          }}
          className="flex items-center gap-1"
        >
          <FaTrash className="w-4 h-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );

  const renderEmptyState = (type: 'driver' | 'passenger') => (
    <div className="col-span-full text-center py-12">
      <p className="text-muted-foreground mb-4">
        You haven't posted any {type} {type === 'driver' ? 'rides' : 'requests'} yet.
      </p>
      <Button onClick={navigateToPostRide} className="bg-primary hover:bg-primary/90">
        Post a {type === 'driver' ? 'Driver Ride' : 'Passenger Request'}
      </Button>
    </div>
  );

  const renderSkeletonCards = () => (
    Array.from({ length: 3 }).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 p-4 pt-0">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </CardFooter>
      </Card>
    ))
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Rides</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/20 text-destructive p-4 rounded-lg mb-8">
          <p>{error}</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this ride?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the ride.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRide}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit ride modal with automatic pricing */}
      <EditRideModal 
        ride={rideToEdit}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        updateRide={updateRide}
        onRideUpdated={() => {
          if (currentUser) {
            loadMyRides(currentUser.uid);
          }
        }}
      />

      {/* Rides list with tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/30 rounded-lg p-1">
          <TabsTrigger 
            value="driver" 
            className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FaCar className="w-4 h-4" />
            <span>Driver Rides</span>
          </TabsTrigger>
          <TabsTrigger 
            value="passenger" 
            className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FaUser className="w-4 h-4" />
            <span>Passenger Requests</span>
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FaUserFriends className="w-4 h-4" />
            <span>Ride Requests</span>
            {rideRequests.filter(req => req.status === 'pending').length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {rideRequests.filter(req => req.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FaExclamationTriangle className="w-4 h-4" />
            <span>Pending Requests</span>
            {pendingRequests.filter(req => req.status === 'pending').length > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingRequests.filter(req => req.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="driver" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              renderSkeletonCards()
            ) : myRides.filter(ride => ride.rideType === 'driver').length > 0 ? (
              myRides.filter(ride => ride.rideType === 'driver').map(renderRideCard)
            ) : (
              renderEmptyState('driver')
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="passenger" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              renderSkeletonCards()
            ) : myRides.filter(ride => ride.rideType === 'passenger').length > 0 ? (
              myRides.filter(ride => ride.rideType === 'passenger').map(renderRideCard)
            ) : (
              renderEmptyState('passenger')
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-6">
            {requestsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-10 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : rideRequests.length > 0 ? (
              rideRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FaUser className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{request.passengerName}</h3>
                          <p className="text-sm text-muted-foreground">{request.passengerEmail}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            {request.rideOrigin} → {request.rideDestination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            {formatDate(new Date(request.rideDepartureTime))}
                          </span>
                        </div>
                      </div>

                      {request.message && (
                        <div className="bg-muted/50 p-3 rounded-lg mb-4">
                          <p className="text-sm">{request.message}</p>
                        </div>
                      )}

                      {request.passengerPhone && request.status === 'approved' && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-green-800">Contact Information:</p>
                          <p className="text-sm text-green-700">Phone: {request.passengerPhone}</p>
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleRequestResponse(request.id, 'rejected')}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleRequestResponse(request.id, 'approved')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FaUserFriends className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No ride requests yet</h3>
                <p className="text-muted-foreground">
                  Passengers will be able to request seats for your posted rides.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-6">
            {pendingRequestsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FaCar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{request.driverName}</h3>
                          <p className="text-sm text-muted-foreground">{request.driverEmail}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            {request.rideOrigin} → {request.rideDestination}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4 text-primary" />
                          <span className="text-sm">
                            {formatDate(new Date(request.rideDepartureTime))} at {new Date(request.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        {request.message && (
                          <div className="flex items-start gap-2 mt-3">
                            <BiMessageDetail className="w-4 h-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm text-muted-foreground">
                        Sent {formatDate(new Date(request.createdAt))}
                      </span>
                      {request.status === 'pending' && (
                        <span className="text-xs text-orange-600 font-medium">
                          Awaiting response
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span className="text-xs text-green-600 font-medium">
                          Request approved!
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="text-xs text-red-600 font-medium">
                          Request declined
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <FaExclamationTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending requests</h3>
                <p className="text-muted-foreground">
                  You haven't sent any ride requests yet. Browse available rides to get started.
                </p>
                <Button 
                  onClick={() => setLocation('/find-rides')} 
                  className="mt-4"
                >
                  Find Rides
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              How was your ride with {rideToReview?.rideType === 'driver' ? 'your passengers' : 'the driver'}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Route Info */}
            <div className="text-center text-sm text-muted-foreground">
              {rideToReview?.origin} → {rideToReview?.destination}
            </div>
            
            {/* Star Rating */}
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {rating > 0 && (
              <div className="text-center text-sm font-medium">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setReviewModalOpen(false);
                setRating(0);
                setRideToReview(null);
              }}
            >
              Skip
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={rating === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete confirmation dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-500" />
              Mark Ride as Complete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this ride as complete? This action cannot be undone and you'll be asked to rate your experience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCompleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMarkComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}