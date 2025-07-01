import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth-fixed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaCar, FaTrash, FaEdit, FaCheck, FaExclamationTriangle, FaUser, FaKey, FaPlay, FaClock, FaStop } from 'react-icons/fa';
import { BiMessageDetail } from 'react-icons/bi';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function MyRidesClean() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // Core data states
  const [myRides, setMyRides] = useState<any[]>([]);
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [approvedRides, setApprovedRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-posts');
  
  // Ride management states
  const [rideToDelete, setRideToDelete] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Passenger management states
  const [passengerToCancel, setPassengerToCancel] = useState<any>(null);
  const [passengerCancelDialogOpen, setPassengerCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  
  // Ride verification states
  const [rideToStart, setRideToStart] = useState<any>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startCodeGenerated, setStartCodeGenerated] = useState<string>('');
  const [showStartCode, setShowStartCode] = useState(false);
  
  // Completion verification states
  const [rideToComplete, setRideToComplete] = useState<any>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [inputVerificationCode, setInputVerificationCode] = useState('');
  const [isPassenger, setIsPassenger] = useState(false);
  
  // Polling management
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

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

  // Load ride requests (incoming requests for user's posted rides)
  const loadRideRequests = async () => {
    if (!currentUser?.uid) return;
    
    setRequestsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/ride-requests');
      const data = await response.json();
      setRideRequests(data || []);
    } catch (error) {
      console.error('Error loading ride requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Load approved rides (rides user has been approved to join)
  const loadApprovedRides = async () => {
    if (!currentUser?.uid) return;
    
    setApprovedLoading(true);
    try {
      const response = await apiRequest('GET', '/api/ride-requests/approved');
      const data = await response.json();
      setApprovedRides(data || []);
    } catch (error) {
      console.error('Error loading approved rides:', error);
    } finally {
      setApprovedLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      loadMyRides();
      loadRideRequests();
      loadApprovedRides();
      startPolling();
    }
    
    return () => {
      isActiveRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentUser?.uid]);

  // Optimized polling to refresh data every 15 seconds
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      if (currentUser && isActiveRef.current) {
        loadMyRides(true); // Silent refresh
        loadRideRequests();
        loadApprovedRides();
      }
    }, 15000);
  };

  // Generate start verification code for ride
  const generateStartCode = async (rideId: number) => {
    if (!currentUser?.uid) return;

    try {
      const response = await fetch(`/api/rides/${rideId}/generate-start-verification`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate start code');
      }

      const data = await response.json();
      
      setStartCodeGenerated(data.startVerificationCode);
      setShowStartCode(true);
      
      toast({
        title: "Start Code Generated",
        description: `Share code ${data.startVerificationCode} with passengers to verify ride start`,
      });
    } catch (error: any) {
      console.error('Error generating start code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate start code",
        variant: "destructive",
      });
    }
  };

  // Generate completion verification code for ride
  const generateVerificationCode = async (rideId: number) => {
    if (!currentUser?.uid) return;

    try {
      const response = await fetch(`/api/rides/${rideId}/generate-verification`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate verification code');
      }

      const data = await response.json();
      
      setGeneratedCode(data.verificationCode);
      setShowVerificationCode(true);
      
      toast({
        title: "Completion Code Generated",
        description: `Share code ${data.verificationCode} with passengers to complete ride`,
      });
    } catch (error: any) {
      console.error('Error generating verification code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate verification code",
        variant: "destructive",
      });
    }
  };

  // Complete ride verification
  const handleCompleteVerification = async () => {
    if (!rideToComplete || !currentUser?.uid || !inputVerificationCode.trim()) return;

    try {
      const response = await fetch(`/api/rides/${rideToComplete.id}/verify-complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        },
        body: JSON.stringify({
          verificationCode: inputVerificationCode.trim(),
          isPassenger
        })
      });

      if (response.ok) {
        toast({
          title: "Ride Completed",
          description: "Ride has been successfully completed!",
        });
        
        setVerificationDialogOpen(false);
        setInputVerificationCode('');
        setRideToComplete(null);
        
        // Reload data
        loadMyRides(true);
        loadApprovedRides();
      }
    } catch (error: any) {
      console.error('Error completing ride:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete ride verification",
        variant: "destructive",
      });
    }
  };

  // Delete ride
  const handleDeleteRide = async () => {
    if (!rideToDelete || !currentUser?.uid) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/rides/${rideToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        toast({
          title: "Ride Deleted",
          description: "Your ride has been successfully deleted",
        });
        
        setDeleteDialogOpen(false);
        setRideToDelete(null);
        loadMyRides(true);
      }
    } catch (error: any) {
      console.error('Error deleting ride:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete ride",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Cancel passenger from ride
  const handleCancelPassenger = async () => {
    if (!passengerToCancel || !currentUser?.uid) return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/ride-requests/${passengerToCancel.id}/cancel-by-driver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        },
        body: JSON.stringify({
          cancellationReason: 'Cancelled by driver'
        })
      });

      if (response.ok) {
        toast({
          title: "Passenger Cancelled",
          description: "Passenger has been removed from the ride",
        });
        
        setPassengerCancelDialogOpen(false);
        setPassengerToCancel(null);
        loadMyRides(true);
        loadRideRequests();
      }
    } catch (error: any) {
      console.error('Error cancelling passenger:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel passenger",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-posts">My Posts</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
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
            myRides.map((ride) => {
              const isUpcoming = new Date(ride.departureTime) > new Date();
              const isStarted = ride.isStarted;
              const approvedPassengers = ride.approvedPassengers || [];
              
              return (
                <Card key={ride.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {ride.origin?.city || 'Unknown'} → {ride.destination?.city || 'Unknown'}
                          </h3>
                          {isStarted && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              In Progress
                            </span>
                          )}
                          {!isUpcoming && !isStarted && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                              Past
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="w-4 h-4" />
                            <span>{formatDate(ride.departureTime)} at {formatTime(ride.departureTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaUserFriends className="w-4 h-4" />
                            <span>{ride.seatsLeft}/{ride.seatsTotal} seats available</span>
                          </div>
                          {ride.carMake && ride.carModel && (
                            <div className="flex items-center gap-2">
                              <FaCar className="w-4 h-4" />
                              <span>{ride.carMake} {ride.carModel}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="w-4 h-4" />
                            <span>From {ride.origin?.area || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          ${ride.price}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRideToDelete(ride);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <FaTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Approved Passengers Section */}
                    {approvedPassengers.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          Approved Passengers ({approvedPassengers.length})
                        </h4>
                        <div className="space-y-2">
                          {approvedPassengers.map((passenger: any) => (
                            <div key={passenger.id} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <FaUser className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">{passenger.passengerName}</span>
                                <span className="text-xs text-gray-500">({passenger.passengerPhone})</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setPassengerToCancel(passenger);
                                  setPassengerCancelDialogOpen(true);
                                }}
                              >
                                <FaTrash className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ride Management Actions */}
                    {isUpcoming && approvedPassengers.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {!isStarted && (
                          <Button
                            size="sm"
                            onClick={() => generateStartCode(ride.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <FaPlay className="w-4 h-4 mr-1" />
                            Generate Start Code
                          </Button>
                        )}
                        
                        {isStarted && (
                          <Button
                            size="sm"
                            onClick={() => generateVerificationCode(ride.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <FaCheck className="w-4 h-4 mr-1" />
                            Generate Completion Code
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRideToComplete(ride);
                            setIsPassenger(false);
                            setVerificationDialogOpen(true);
                          }}
                        >
                          <FaKey className="w-4 h-4 mr-1" />
                          Complete Ride
                        </Button>
                      </div>
                    )}

                    {/* Empty State for No Passengers */}
                    {approvedPassengers.length === 0 && isUpcoming && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
                        <p className="text-sm text-blue-600">
                          Waiting for passengers to request this ride
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4 mt-6">
          {requestsLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading requests...</p>
            </div>
          ) : rideRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No ride requests yet</p>
              <p className="text-sm text-gray-400 mt-2">Requests for your posted rides will appear here</p>
            </div>
          ) : (
            rideRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">
                      Request for {request.rideOrigin} → {request.rideDestination}
                    </h3>
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>👤 From: {request.passengerName}</p>
                    <p>📅 {formatDate(request.createdAt)}</p>
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="default">
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        Decline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading approved rides...</p>
            </div>
          ) : approvedRides.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No approved rides yet</p>
              <p className="text-sm text-gray-400 mt-2">Rides you've been approved to join will appear here</p>
            </div>
          ) : (
            approvedRides.map((ride) => {
              const isUpcoming = new Date(ride.rideDepartureTime) > new Date();
              const isStarted = ride.isStarted;
              const isCompleted = ride.isCompleted;
              
              return (
                <Card key={ride.id} className="border border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {ride.rideOrigin} → {ride.rideDestination}
                          </h3>
                          {isCompleted && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Completed
                            </span>
                          )}
                          {isStarted && !isCompleted && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              In Progress
                            </span>
                          )}
                          {!isStarted && isUpcoming && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                              Upcoming
                            </span>
                          )}
                          {!isUpcoming && !isStarted && !isCompleted && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                              Past
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="w-4 h-4" />
                            <span>{formatDate(ride.rideDepartureTime)} at {formatTime(ride.rideDepartureTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaUser className="w-4 h-4" />
                            <span>Driver: {ride.driverName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BiMessageDetail className="w-4 h-4" />
                            <span>Phone: {ride.driverPhone || 'Not available'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaCheck className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Approved</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${ride.ridePrice}
                        </div>
                      </div>
                    </div>

                    {/* Ride Actions for Passengers */}
                    {isUpcoming && !isCompleted && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {isStarted && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setRideToComplete(ride);
                              setIsPassenger(true);
                              setVerificationDialogOpen(true);
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <FaCheck className="w-4 h-4 mr-1" />
                            Complete Ride
                          </Button>
                        )}
                        
                        {!isStarted && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            <FaClock className="w-4 h-4" />
                            <span>Waiting for driver to start ride</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion Status */}
                    {isCompleted && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <FaCheck className="w-4 h-4" />
                          <span>Ride completed successfully</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Ride Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ride</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ride? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRide}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Passenger Dialog */}
      <AlertDialog open={passengerCancelDialogOpen} onOpenChange={setPassengerCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Passenger</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {passengerToCancel?.passengerName} from this ride? 
              They will be notified of the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelPassenger}
              disabled={cancelling}
            >
              {cancelling ? 'Removing...' : 'Remove Passenger'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Start Code Display Dialog */}
      <Dialog open={showStartCode} onOpenChange={setShowStartCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ride Start Code</DialogTitle>
            <DialogDescription>
              Share this 4-digit code with your passengers to verify the ride has started.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {startCodeGenerated}
            </div>
            <p className="text-gray-600">
              Passengers need this code to confirm ride start
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowStartCode(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Code Display Dialog */}
      <Dialog open={showVerificationCode} onOpenChange={setShowVerificationCode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ride Completion Code</DialogTitle>
            <DialogDescription>
              Share this 6-digit code with your passengers to complete the ride.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-6xl font-bold text-green-600 mb-4">
              {generatedCode}
            </div>
            <p className="text-gray-600">
              Passengers need this code to complete the ride
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowVerificationCode(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ride Completion Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Ride</DialogTitle>
            <DialogDescription>
              {isPassenger 
                ? "Enter the 6-digit completion code provided by your driver"
                : "Enter the 6-digit completion code to mark this ride as complete"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                value={inputVerificationCode}
                onChange={(e) => setInputVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setVerificationDialogOpen(false);
                setInputVerificationCode('');
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteVerification}
              disabled={!inputVerificationCode.trim() || inputVerificationCode.length !== 6}
            >
              Complete Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}