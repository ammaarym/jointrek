import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth-fixed';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaCar, FaTrash, FaEdit, FaCheck, FaExclamationTriangle, FaUser, FaKey, FaPlay } from 'react-icons/fa';
import { BiMessageDetail } from 'react-icons/bi';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EditRideModal from '@/components/edit-ride-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Optimized component with reduced polling frequency and smart data comparison
export default function MyRidesOptimized() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('my-posts');
  
  // Core ride data
  const [myRides, setMyRides] = useState<any[]>([]);
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [approvedRides, setApprovedRides] = useState<any[]>([]);
  const [driverOffers, setDriverOffers] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  const [approvedRidesLoading, setApprovedRidesLoading] = useState(false);
  const [driverOffersLoading, setDriverOffersLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Tab states
  const [myPostsTab, setMyPostsTab] = useState('driver');
  const [approvedTab, setApprovedTab] = useState('passenger');
  
  // Modals and dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<any>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [rideToComplete, setRideToComplete] = useState<any>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [inputVerificationCode, setInputVerificationCode] = useState<string>('');
  const [isPassenger, setIsPassenger] = useState(false);
  
  // Verification states
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationModalTitle, setVerificationModalTitle] = useState('');
  const [verificationModalDescription, setVerificationModalDescription] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [currentRideId, setCurrentRideId] = useState<number | null>(null);
  
  // Cancellation states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [userStrikes, setUserStrikes] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [passengerCancelDialogOpen, setPassengerCancelDialogOpen] = useState(false);
  const [passengerToCancel, setPassengerToCancel] = useState<any>(null);
  const [cancellingPassenger, setCancellingPassenger] = useState(false);
  
  const [completedRides, setCompletedRides] = useState<Set<number>>(new Set());
  
  // Optimized data management
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<any>({});
  const isActiveRef = useRef(true);
  
  const { toast } = useToast();
  const { showErrorFromException } = useErrorToast();

  // Smart data comparison to prevent unnecessary re-renders
  const dataHasChanged = useCallback((newData: any, oldData: any): boolean => {
    if (!oldData || !newData) return true;
    if (Array.isArray(newData) && Array.isArray(oldData)) {
      if (newData.length !== oldData.length) return true;
      return newData.some((item, index) => JSON.stringify(item) !== JSON.stringify(oldData[index]));
    }
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  }, []);

  // Optimized data loading with reduced polling frequency
  const loadMyRides = useCallback(async (userId: string, silent = false) => {
    if (!userId || !isActiveRef.current) return;

    if (!silent) setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/rides/postgres', {
        headers: {
          'x-user-id': userId,
          'x-user-email': currentUser?.email || '',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rides');
      }
      
      const data = await response.json();
      if (dataHasChanged(data, lastDataRef.current.myRides)) {
        setMyRides(data || []);
        lastDataRef.current.myRides = data;
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      if (!silent) setError('Failed to load rides. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [currentUser, dataHasChanged]);

  const loadRideRequests = useCallback(async (silent = false) => {
    if (!currentUser || !isActiveRef.current) return;
    
    if (!silent) setRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/driver', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (dataHasChanged(data, lastDataRef.current.rideRequests)) {
          setRideRequests(data || []);
          lastDataRef.current.rideRequests = data;
        }
      }
    } catch (error) {
      console.error('Error loading ride requests:', error);
    } finally {
      if (!silent) setRequestsLoading(false);
    }
  }, [currentUser, dataHasChanged]);

  const loadPendingRequests = useCallback(async (silent = false) => {
    if (!currentUser || !isActiveRef.current) return;
    
    if (!silent) setPendingRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/user', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (dataHasChanged(data, lastDataRef.current.pendingRequests)) {
          setPendingRequests(data || []);
          lastDataRef.current.pendingRequests = data;
        }
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      if (!silent) setPendingRequestsLoading(false);
    }
  }, [currentUser, dataHasChanged]);

  const loadApprovedRides = useCallback(async (silent = false) => {
    if (!currentUser || !isActiveRef.current) return;
    
    if (!silent) setApprovedRidesLoading(true);
    try {
      const response = await fetch('/api/ride-requests/approved', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (dataHasChanged(data, lastDataRef.current.approvedRides)) {
          setApprovedRides(data || []);
          lastDataRef.current.approvedRides = data;
        }
      }
    } catch (error) {
      console.error('Error loading approved rides:', error);
    } finally {
      if (!silent) setApprovedRidesLoading(false);
    }
  }, [currentUser, dataHasChanged]);

  const loadDriverOffers = useCallback(async (silent = false) => {
    if (!currentUser || !isActiveRef.current) return;
    
    if (!silent) setDriverOffersLoading(true);
    try {
      const response = await fetch('/api/driver-offers/for-user', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (dataHasChanged(data, lastDataRef.current.driverOffers)) {
          setDriverOffers(data || []);
          lastDataRef.current.driverOffers = data;
        }
      }
    } catch (error) {
      console.error('Error loading driver offers:', error);
    } finally {
      if (!silent) setDriverOffersLoading(false);
    }
  }, [currentUser, dataHasChanged]);

  // Optimized polling with reduced frequency (15 seconds instead of 5)
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(() => {
      if (currentUser && isActiveRef.current) {
        // Use silent loading to prevent loading states during polling
        loadMyRides(currentUser.uid, true);
        loadRideRequests(true);
        loadPendingRequests(true);
        loadApprovedRides(true);
        loadDriverOffers(true);
      }
    }, 15000); // Reduced from 5000ms to 15000ms to prevent flashing
  }, [currentUser, loadMyRides, loadRideRequests, loadPendingRequests, loadApprovedRides, loadDriverOffers]);

  // Initial load and setup
  useEffect(() => {
    if (currentUser) {
      // Initial load (non-silent)
      Promise.all([
        loadMyRides(currentUser.uid),
        loadRideRequests(),
        loadPendingRequests(),
        loadApprovedRides(),
        loadDriverOffers()
      ]);
      
      // Start optimized polling
      startPolling();
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentUser, loadMyRides, loadRideRequests, loadPendingRequests, loadApprovedRides, loadDriverOffers, startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // URL param navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'requests') {
      setActiveTab('requests');
    }
  }, []);

  // Utility functions
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const capitalizeCarType = (carType: string) => {
    if (!carType) return 'Car not specified';
    if (carType.toLowerCase() === 'suv') return 'SUV';
    return carType.charAt(0).toUpperCase() + carType.slice(1).toLowerCase();
  };

  // Memoized computed values to prevent unnecessary recalculations
  const passengerRides = useMemo(() => {
    return approvedRides.filter(ride => ride.userRole === 'passenger');
  }, [approvedRides]);

  const driverRides = useMemo(() => {
    return approvedRides.filter(ride => ride.userRole === 'driver');
  }, [approvedRides]);

  const activeRides = useMemo(() => {
    return myRides.filter(ride => 
      new Date(ride.departureTime) > new Date() && ride.status !== 'cancelled'
    );
  }, [myRides]);

  const hasActiveRides = useMemo(() => {
    return activeRides.length > 0 || passengerRides.length > 0;
  }, [activeRides, passengerRides]);

  if (loading && myRides.length === 0) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Treks</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-posts">My Posts</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="approved">Approved Rides</TabsTrigger>
          <TabsTrigger value="offers">Driver Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="my-posts" className="space-y-4">
          <Tabs value={myPostsTab} onValueChange={setMyPostsTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="driver">Driver Posts</TabsTrigger>
              <TabsTrigger value="passenger">Passenger Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="driver" className="space-y-4">
              {activeRides.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active driver posts
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRides.map((ride) => (
                    <Card key={ride.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <FaMapMarkerAlt />
                              <span>{ride.origin?.city || 'Unknown'} → {ride.destination?.city || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <FaCalendarAlt />
                              <span>
                                {formatDate(new Date(ride.departureTime))} at {formatTime(new Date(ride.departureTime))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <FaCar />
                              <span>{ride.carMake} {ride.carModel} ({ride.carYear})</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaUserFriends />
                              <span>{ride.seatsLeft}/{ride.seatsTotal} seats available</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 mb-2">
                              ${ride.price}
                            </div>
                            <div className="space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRideToEdit(ride);
                                  setEditModalOpen(true);
                                }}
                              >
                                <FaEdit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="passenger" className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                Passenger request posts coming soon
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            {requestsLoading ? "Loading requests..." : "No pending requests"}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Tabs value={approvedTab} onValueChange={setApprovedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="passenger">As Passenger</TabsTrigger>
              <TabsTrigger value="driver">As Driver</TabsTrigger>
            </TabsList>

            <TabsContent value="passenger" className="space-y-4">
              {passengerRides.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No approved rides as passenger
                </div>
              ) : (
                <div className="space-y-4">
                  {passengerRides.map((ride) => (
                    <Card key={ride.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <FaMapMarkerAlt />
                              <span>{ride.origin?.city || 'Unknown'} → {ride.destination?.city || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <FaCalendarAlt />
                              <span>
                                {formatDate(new Date(ride.departureTime))} at {formatTime(new Date(ride.departureTime))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaUser />
                              <span>Driver: {ride.driverName}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${ride.price}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="driver" className="space-y-4">
              {driverRides.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No approved rides as driver
                </div>
              ) : (
                <div className="space-y-4">
                  {driverRides.map((ride) => (
                    <Card key={ride.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <FaMapMarkerAlt />
                              <span>{ride.origin?.city || 'Unknown'} → {ride.destination?.city || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <FaCalendarAlt />
                              <span>
                                {formatDate(new Date(ride.departureTime))} at {formatTime(new Date(ride.departureTime))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaUserFriends />
                              <span>{ride.passengers?.length || 0} passengers</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ${ride.price}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <div className="text-center py-8 text-gray-500">
            {driverOffersLoading ? "Loading offers..." : "No driver offers"}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {editModalOpen && rideToEdit && (
        <EditRideModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setRideToEdit(null);
          }}
          ride={rideToEdit}
          onRideUpdated={() => {
            if (currentUser) {
              loadMyRides(currentUser.uid);
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
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
              onClick={async () => {
                if (rideToDelete && currentUser) {
                  try {
                    const response = await fetch(`/api/rides/${rideToDelete.id}`, {
                      method: 'DELETE',
                      headers: {
                        'x-user-id': currentUser.uid,
                        'x-user-email': currentUser.email || '',
                      }
                    });

                    if (response.ok) {
                      toast({
                        title: "Ride deleted successfully",
                      });
                      loadMyRides(currentUser.uid);
                    } else {
                      throw new Error('Failed to delete ride');
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to delete ride. Please try again.",
                      variant: "destructive",
                    });
                  }
                  setDeleteDialogOpen(false);
                  setRideToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}