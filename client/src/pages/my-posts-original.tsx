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
import { ComplaintDialog } from '@/components/complaint-dialog';
import { Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

// Helper function to capitalize car types
const capitalizeCarType = (carType: string) => {
  if (!carType) return 'Car not specified';
  // Handle specific capitalizations
  if (carType.toLowerCase() === 'suv') return 'SUV';
  // Capitalize first letter for other types
  return carType.charAt(0).toUpperCase() + carType.slice(1).toLowerCase();
};

export default function MyPostsOriginal() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('my-posts');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<any>(null);

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [rideToComplete, setRideToComplete] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [inputVerificationCode, setInputVerificationCode] = useState<string>('');
  const [isPassenger, setIsPassenger] = useState(false);
  
  // Start ride verification state
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationModalTitle, setVerificationModalTitle] = useState('');
  const [verificationModalDescription, setVerificationModalDescription] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [currentRideId, setCurrentRideId] = useState<number | null>(null);

  // Cancellation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rideToCancel, setRideToCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [userStrikes, setUserStrikes] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  // Optimized state management to prevent flashing
  const [dataCache, setDataCache] = useState<any>({});
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Passenger cancellation state
  const [passengerCancelDialogOpen, setPassengerCancelDialogOpen] = useState(false);
  const [passengerToCancel, setPassengerToCancel] = useState<any>(null);
  const [cancellingPassenger, setCancellingPassenger] = useState(false);

  const [completedRides, setCompletedRides] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { showErrorFromException } = useErrorToast();

  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ride request state
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Pending requests (outgoing) state
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  
  // Approved rides state
  const [approvedRides, setApprovedRides] = useState<any[]>([]);
  const [approvedRidesLoading, setApprovedRidesLoading] = useState(false);
  
  // Driver offers state
  const [driverOffers, setDriverOffers] = useState<any[]>([]);
  const [driverOffersLoading, setDriverOffersLoading] = useState(false);
  
  // My Posts sub-tab state
  const [myPostsTab, setMyPostsTab] = useState('driver');
  
  // Approved rides sub-tab state for passenger/driver views
  const [approvedTab, setApprovedTab] = useState('passenger');

  // Check URL params for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'requests') {
      setActiveTab('requests');
    }
  }, []);

  // Data comparison function to prevent unnecessary re-renders
  const deepEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      return obj1.every((item, index) => deepEqual(item, obj2[index]));
    }
    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) return false;
      return keys1.every(key => deepEqual(obj1[key], obj2[key]));
    }
    return false;
  }, []);

  // Smart data setter that only updates if data actually changed
  const updateDataIfChanged = useCallback((setter: (data: any) => void, newData: any, currentData: any) => {
    if (!deepEqual(newData, currentData)) {
      setter(newData);
      return true;
    }
    return false;
  }, [deepEqual]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Optimized load functions that only update when data changes
  const loadApprovedRides = useCallback(async (forceUpdate = false) => {
    if (!currentUser || !isMountedRef.current) return;
    
    if (!forceUpdate) setApprovedRidesLoading(true);
    try {
      const response = await fetch('/api/ride-requests/approved', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const hasChanges = updateDataIfChanged(setApprovedRides, data || [], approvedRides);
        if (hasChanges) {
          console.log('Approved rides updated:', data);
        }
      }
    } catch (error) {
      console.error('Error loading approved rides:', error);
    } finally {
      if (!forceUpdate) setApprovedRidesLoading(false);
    }
  }, [currentUser, updateDataIfChanged, approvedRides]);

  const loadRideRequests = useCallback(async (forceUpdate = false) => {
    if (!currentUser || !isMountedRef.current) return;
    
    if (!forceUpdate) setRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/driver', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        updateDataIfChanged(setRideRequests, data || [], rideRequests);
      }
    } catch (error) {
      console.error('Error loading ride requests:', error);
    } finally {
      if (!forceUpdate) setRequestsLoading(false);
    }
  }, [currentUser, updateDataIfChanged, rideRequests]);

  const loadPendingRequests = useCallback(async (forceUpdate = false) => {
    if (!currentUser || !isMountedRef.current) return;
    
    if (!forceUpdate) setPendingRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/user', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        updateDataIfChanged(setPendingRequests, data || [], pendingRequests);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      if (!forceUpdate) setPendingRequestsLoading(false);
    }
  }, [currentUser, updateDataIfChanged, pendingRequests]);

  const loadMyRides = useCallback(async (userId: string, forceUpdate = false) => {
    if (!userId || !isMountedRef.current) return;

    if (!forceUpdate) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch('/api/user-rides', {
        headers: {
          'x-user-id': userId,
          'x-user-email': currentUser?.email || '',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch rides: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      updateDataIfChanged(setMyRides, data || [], myRides);
    } catch (error) {
      console.error('Error loading rides:', error);
      if (!forceUpdate) setError('Failed to load rides. Please try again.');
    } finally {
      if (!forceUpdate) {
        setLoading(false);
      }
    }
  }, [currentUser, updateDataIfChanged, myRides]);

  // Load user strikes count
  const loadUserStrikes = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`/api/users/${currentUser.uid}/strikes`, {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStrikes(data.strikes || 0);
      }
    } catch (error) {
      console.error('Error loading user strikes:', error);
    }
  };

  // Load driver offers for user's ride requests
  const loadDriverOffers = async () => {
    if (!currentUser) return;
    
    setDriverOffersLoading(true);
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
        console.log('Driver offers loaded:', data);
        setDriverOffers(data || []);
      }
    } catch (error) {
      console.error('Error loading driver offers:', error);
    } finally {
      setDriverOffersLoading(false);
    }
  };

  // Set isMountedRef to true when component mounts
  useEffect(() => {
    console.log('🚀 [MY_POSTS] Component mounted, setting isMountedRef to true');
    isMountedRef.current = true;
    
    return () => {
      console.log('🗑️ [MY_POSTS] Component unmounting, setting isMountedRef to false');
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      // Use a flag to prevent multiple calls
      let hasLoaded = false;
      
      const loadData = async () => {
        if (hasLoaded) return;
        hasLoaded = true;
        
        try {
          await Promise.all([
            loadMyRides(currentUser.uid),
            loadRideRequests(),
            loadPendingRequests(),
            loadApprovedRides(),
            loadUserStrikes(),
            loadDriverOffers()
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      
      loadData();
    }
  }, [currentUser?.uid]); // Simplified dependencies to prevent constant re-renders

  // Add real-time polling for ride status updates (only when needed)
  useEffect(() => {
    if (!currentUser) return;

    const pollForRideUpdates = setInterval(async () => {
      try {
        // Get current state to check for active rides without triggering re-renders
        const currentMyRides = myRides;
        const currentApprovedRides = approvedRides;
        
        const hasActiveRides = currentMyRides.some(ride => 
          ride.status === 'started' || ride.status === 'in_progress'
        ) || currentApprovedRides.some(ride => 
          ride.status === 'started' || ride.status === 'in_progress'
        );
        
        if (hasActiveRides) {
          // Only update ride requests and approved rides - skip my rides to reduce flashing
          await Promise.all([
            loadRideRequests(),
            loadApprovedRides()
          ]);
        }
      } catch (error) {
        console.error('Error during polling:', error);
      }
    }, 30000); // Poll every 30 seconds to reduce flashing

    // Cleanup interval on unmount
    return () => clearInterval(pollForRideUpdates);
  }, [currentUser?.uid]); // Only depend on user ID to prevent constant recreation

  // Handle ride request approval/rejection
  const handleRequestAction = async (requestId: number, action: 'approve' | 'reject') => {
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
        body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'rejected' })
      });

      if (response.ok) {
        toast({
          title: action === 'approve' ? "Request Approved" : "Request Rejected",
          description: `The ride request has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
        });
        // Refresh the requests
        loadRideRequests();
        loadApprovedRides();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} request`);
      }
    } catch (error: any) {
      console.error(`Error ${action}ing request:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} request. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Handle driver offer response
  const handleDriverOfferResponse = async (offerId: number, action: 'accepted' | 'rejected') => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/driver-offers/${offerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        toast({
          title: action === 'accepted' ? "Offer Accepted" : "Offer Declined",
          description: `The driver offer has been ${action}.`,
        });
        // Refresh the offers
        loadDriverOffers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} offer`);
      }
    } catch (error: any) {
      console.error(`Error ${action} offer:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} offer. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Generate verification code
  const generateVerificationCode = async ({ id }: { id: number }) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/rides/${id}/generate-verification`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCode(data.verificationCode);
        setShowVerificationCode(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate verification code');
      }
    } catch (error: any) {
      console.error('Error generating verification code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate verification code. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle passenger verification
  const handlePassengerVerification = async ({ id }: { id: number }) => {
    if (!currentUser) return;

    setRideToComplete({ id, rideId: id });
    setIsPassenger(true);
    setVerificationDialogOpen(true);
  };

  // Verify code and complete ride
  const verifyAndCompleteRide = async () => {
    if (!rideToComplete || !currentUser) return;

    if (!inputVerificationCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/rides/${rideToComplete.rideId}/verify-complete`, {
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
        const result = await response.json();
        
        toast({
          title: "Ride Completed",
          description: result.message || "Ride has been completed successfully. Payment has been processed.",
        });
        
        setVerificationDialogOpen(false);
        setInputVerificationCode('');
        setRideToComplete(null);
        setIsPassenger(false);
        
        console.log('Payment capture results:', result.paymentResults);
        
        // Refresh the rides data
        if (currentUser) {
          loadMyRides(currentUser.uid);
        }
        
        // Ride completed successfully - no review system needed
        toast({
          title: "Ride Completed!",
          description: "Thank you for using Trek!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark ride as complete');
      }
    } catch (error: any) {
      console.error('Error marking ride complete:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark ride as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle ride cancellation
  const handleCancelRide = async () => {
    if (!currentUser || !rideToCancel) return;
    
    setCancelling(true);
    try {
      const response = await fetch(`/api/rides/${rideToCancel.rideId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        },
        body: JSON.stringify({ 
          cancellationReason: cancellationReason.trim() || undefined 
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Ride Cancelled",
          description: result.penaltyApplied 
            ? `Ride cancelled. Penalty of $${result.penaltyAmount} applied. You now have ${result.strikeCount} strike(s) this month.`
            : result.strikeCount > 0 
              ? `Ride cancelled. Warning: You now have ${result.strikeCount} strike(s) this month.`
              : "Ride cancelled successfully.",
          variant: result.penaltyApplied ? "destructive" : "default",
        });
        
        // Close dialog and reset state
        setCancelDialogOpen(false);
        setRideToCancel(null);
        setCancellationReason('');
        
        // Refresh data
        loadMyRides(currentUser.uid);
        loadRideRequests();
        loadApprovedRides();
        loadUserStrikes();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel ride');
      }
    } catch (error: any) {
      console.error('Error cancelling ride:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  // Calculate hours until departure for penalty warning
  const calculateHoursUntilDeparture = (departureTime: string) => {
    const now = new Date();
    const departure = new Date(departureTime);
    return (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
  };

  // Handle individual passenger cancellation by driver
  const handleCancelPassenger = (passenger: any) => {
    setPassengerToCancel(passenger);
    setPassengerCancelDialogOpen(true);
  };

  // Cancel specific passenger from ride
  const confirmCancelPassenger = async () => {
    if (!currentUser || !passengerToCancel) return;

    setCancellingPassenger(true);
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
          reason: 'Driver cancelled passenger'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: "Passenger Cancelled",
          description: `${passengerToCancel.passengerName} has been removed from this ride. ${result.refundProcessed ? 'Payment has been refunded.' : ''}`,
        });
        
        // Close dialog and reset state
        setPassengerCancelDialogOpen(false);
        setPassengerToCancel(null);
        
        // Refresh data
        loadRideRequests();
        loadApprovedRides();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel passenger');
      }
    } catch (error: any) {
      console.error('Error cancelling passenger:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel passenger. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingPassenger(false);
    }
  };

  // Cancel ride request
  const handleCancelRequest = async (requestId: number) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/ride-requests/${requestId}/cancel`, {
        method: 'DELETE',
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        toast({
          title: "Request Cancelled",
          description: "Your ride request has been cancelled successfully.",
        });
        // Refresh the pending requests
        loadPendingRequests();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel request');
      }
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Start ride verification handlers
  const handlePassengerStartCode = async ({ id }: { id: number }) => {
    if (!currentUser) return;

    setVerificationModalTitle("Enter Start Code from Driver");
    setVerificationModalDescription("Enter the 4-digit code shown by your driver to start the ride:");
    setVerificationModalOpen(true);
    
    // Store the ride ID for verification
    setCurrentRideId(id);
  };

  const handleDriverStartVerification = async ({ id }: { id: number }) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/rides/${id}/generate-start-verification`, {
        method: 'POST',
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationCode(data.startVerificationCode);
        setVerificationModalTitle("Show Start Code to Passenger");
        setVerificationModalDescription(`Show this 4-digit code to the passenger. They will enter it to start the ride:`);
        setVerificationModalOpen(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate start code');
      }
    } catch (error: any) {
      console.error('Error generating start code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate start code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartVerification = async () => {
    if (!currentUser || !currentRideId) return;

    if (!verificationCodeInput.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter the verification code.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/rides/${currentRideId}/verify-start`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        },
        body: JSON.stringify({
          startVerificationCode: verificationCodeInput.trim()
        })
      });

      if (response.ok) {
        toast({
          title: "Ride Started",
          description: "The ride has been started successfully. Payment will be captured automatically after 24 hours if not completed.",
        });
        setVerificationModalOpen(false);
        setVerificationCodeInput('');
        setCurrentRideId(null);
        
        // Refresh the approved rides to show updated status
        loadApprovedRides();
        
        // Set up polling to automatically refresh when the other party verifies (reduced frequency)
        const pollForUpdates = setInterval(async () => {
          try {
            await loadApprovedRides();
          } catch (error) {
            console.error('Error polling for updates:', error);
          }
        }, 10000); // Poll every 10 seconds instead of 3
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollForUpdates);
        }, 120000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error verifying start code:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify start code. Please try again.",
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
                <span>{capitalizeCarType(`${ride.carMake || ''} ${ride.carModel || ''}`.trim())}</span>
              </div>
              <div className="flex items-center">
                <FaUserFriends className="text-primary mr-2 flex-shrink-0" />
                <span>{ride.seatsLeft} available</span>
              </div>
              
              {/* Show approved passengers */}
              {(() => {
                const approvedPassengers = rideRequests.filter(req => 
                  req.rideId === ride.id && req.status === 'approved'
                );
                
                if (approvedPassengers.length > 0) {
                  return (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2 text-sm flex items-center gap-1">
                        <FaCheck className="w-3 h-3" />
                        Passengers Coming ({approvedPassengers.length})
                      </h4>
                      <div className="space-y-2">
                        {approvedPassengers.map((passenger) => (
                          <div key={passenger.id} className="text-xs flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-green-800">{passenger.passengerName}</div>
                              <div className="text-green-600">{passenger.passengerEmail}</div>
                              {passenger.passengerPhone && (
                                <div className="text-green-600">📞 {passenger.passengerPhone}</div>
                              )}
                              {/* Show passenger baggage requirements */}
                              {((passenger.baggageCheckIn || 0) > 0 || (passenger.baggagePersonal || 0) > 0) && (
                                <div className="mt-1 flex items-center gap-1 text-xs">
                                  <span className="text-green-600">Baggage:</span>
                                  {(passenger.baggageCheckIn || 0) > 0 && (
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                                      {passenger.baggageCheckIn} check-in
                                    </span>
                                  )}
                                  {(passenger.baggagePersonal || 0) > 0 && (
                                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">
                                      {passenger.baggagePersonal} personal
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2 h-6 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleCancelPassenger(passenger)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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
        ) : null}
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
        <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/30 rounded-lg p-1">
          <TabsTrigger 
            value="approved" 
            className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FaCheck className="w-4 h-4" />
            <span>Approved Rides</span>
            {approvedRides.length > 0 && (
              <span className="ml-1 bg-green-500 text-white text-xs rounded-full px-2 py-0.5">
                {approvedRides.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="my-posts" 
            className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FaCar className="w-4 h-4" />
            <span>My Posts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="flex items-center gap-2 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FaUserFriends className="w-4 h-4" />
            <span>Ride Requests</span>
            {(() => {
              const pendingCount = rideRequests.filter(req => req.status === 'pending').length;
              const pendingOffers = driverOffers.filter(offer => offer.status === 'pending').length;
              const totalPending = pendingCount + pendingOffers;

              return totalPending > 0 ? (
                <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5 shadow-lg ring-2 ring-yellow-300">
                  {totalPending}
                </span>
              ) : null;
            })()}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="approved" className="mt-6">
          <div className="space-y-6">
            {/* Sub-tabs for Passenger and Driver approved rides */}
            <Tabs value={approvedTab} onValueChange={setApprovedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/30 rounded-lg p-1">
                <TabsTrigger 
                  value="passenger" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <FaUser className="w-3 h-3" />
                  <span>As Passenger</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="driver" 
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <FaCar className="w-3 h-3" />
                  <span>As Driver</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Passenger approved rides */}
              <TabsContent value="passenger" className="mt-4">
                {approvedRidesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderSkeletonCards()}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedRides.filter(ride => ride.userRole === 'passenger').length > 0 ? (
                      approvedRides.filter(ride => ride.userRole === 'passenger').map((ride) => (
                        <Card key={`passenger-${ride.id}`} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {ride.rideOrigin} → {ride.rideDestination}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(new Date(ride.rideDepartureTime))}
                                </p>
                              </div>
                              <span className="text-lg font-semibold text-primary">
                                ${ride.originalPrice || ride.ridePrice}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center">
                                <FaCalendarAlt className="text-primary mr-2 flex-shrink-0" />
                                <span>Departure: {formatDate(new Date(ride.rideDepartureTime))} at {new Date(ride.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                              <div className="flex items-center">
                                <FaCar className="text-primary mr-2 flex-shrink-0" />
                                <span>Driver: {ride.driverName}</span>
                              </div>
                              <div className="flex items-start">
                                <FaMapMarkerAlt className="text-primary mr-2 mt-1 flex-shrink-0" />
                                <div>
                                  <div>From: {ride.rideOriginArea || ride.rideOrigin}</div>
                                  <div>To: {ride.rideDestinationArea || ride.rideDestination}</div>
                                </div>
                              </div>
                              
                              {/* Status badges */}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {ride.isStarted && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <FaPlay className="w-3 h-3 mr-1" />
                                    Started
                                  </span>
                                )}
                                {ride.isCompleted && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <FaCheck className="w-3 h-3 mr-1" />
                                    Completed
                                  </span>
                                )}
                                {!ride.isStarted && !ride.isCompleted && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Approved
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex justify-between gap-2 p-4 pt-0">
                            {/* Show different actions based on ride status */}
                            {!ride.isStarted && !ride.isCompleted && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePassengerStartCode({ id: ride.rideId })}
                                  className="flex items-center gap-1 flex-1"
                                >
                                  <FaKey className="w-3 h-3" />
                                  Enter Start Code
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRideToCancel({ rideId: ride.rideId, ...ride });
                                    setCancelDialogOpen(true);
                                  }}
                                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {ride.isStarted && !ride.isCompleted && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePassengerVerification({ id: ride.rideId })}
                                  className="flex items-center gap-1 flex-1"
                                >
                                  <FaCheck className="w-3 h-3" />
                                  Complete Ride
                                </Button>
                                <ComplaintDialog rideId={ride.rideId} />
                              </>
                            )}
                            {ride.isCompleted && (
                              <div className="flex items-center gap-1 text-green-600 font-medium">
                                <FaCheck className="w-4 h-4" />
                                Completed
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground mb-4">No approved passenger rides yet.</p>
                        <Button onClick={() => setLocation('/find-rides')} className="bg-primary hover:bg-primary/90">
                          Find a Ride
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              {/* Driver approved rides */}
              <TabsContent value="driver" className="mt-4">
                {approvedRidesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {renderSkeletonCards()}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {approvedRides.filter(ride => ride.userRole === 'driver').length > 0 ? (
                      approvedRides.filter(ride => ride.userRole === 'driver').map((ride) => (
                        <Card key={`driver-${ride.id}`} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {ride.rideOrigin} → {ride.rideDestination}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(new Date(ride.rideDepartureTime))}
                                </p>
                              </div>
                              <span className="text-lg font-semibold text-primary">
                                ${ride.originalPrice || ride.ridePrice}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center">
                                <FaCalendarAlt className="text-primary mr-2 flex-shrink-0" />
                                <span>Departure: {formatDate(new Date(ride.rideDepartureTime))} at {new Date(ride.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                              </div>
                              <div className="flex items-center">
                                <FaUser className="text-primary mr-2 flex-shrink-0" />
                                <span>Passenger: {ride.passengerName}</span>
                              </div>
                              <div className="flex items-start">
                                <FaMapMarkerAlt className="text-primary mr-2 mt-1 flex-shrink-0" />
                                <div>
                                  <div>From: {ride.rideOriginArea || ride.rideOrigin}</div>
                                  <div>To: {ride.rideDestinationArea || ride.rideDestination}</div>
                                </div>
                              </div>
                              
                              {/* Status badges */}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {ride.isStarted && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <FaPlay className="w-3 h-3 mr-1" />
                                    Started
                                  </span>
                                )}
                                {ride.isCompleted && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <FaCheck className="w-3 h-3 mr-1" />
                                    Completed
                                  </span>
                                )}
                                {!ride.isStarted && !ride.isCompleted && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Approved
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                          
                          <CardFooter className="flex justify-between gap-2 p-4 pt-0">
                            {/* Show different actions based on ride status */}
                            {!ride.isStarted && !ride.isCompleted && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDriverStartVerification({ id: ride.rideId })}
                                  className="flex items-center gap-1 flex-1"
                                >
                                  <FaKey className="w-3 h-3" />
                                  Generate Start Code
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRideToCancel({ rideId: ride.rideId, ...ride });
                                    setCancelDialogOpen(true);
                                  }}
                                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {ride.isStarted && !ride.isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateVerificationCode({ id: ride.rideId })}
                                className="flex items-center gap-1 flex-1"
                              >
                                <FaCheck className="w-3 h-3" />
                                Complete Ride
                              </Button>
                            )}
                            {ride.isCompleted && (
                              <div className="flex items-center gap-1 text-green-600 font-medium">
                                <FaCheck className="w-4 h-4" />
                                Completed
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-muted-foreground mb-4">No approved driver rides yet.</p>
                        <Button onClick={() => setLocation('/post-ride')} className="bg-primary hover:bg-primary/90">
                          Post a Ride
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
        
        <TabsContent value="my-posts" className="mt-6">
          <Tabs value={myPostsTab} onValueChange={setMyPostsTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/30 rounded-lg p-1">
              <TabsTrigger 
                value="driver" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <FaCar className="w-3 h-3" />
                <span>Driver Posts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="passenger" 
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                <FaUser className="w-3 h-3" />
                <span>Passenger Posts</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="driver" className="mt-4">
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
            
            <TabsContent value="passenger" className="mt-4">
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
          </Tabs>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-6">
            {/* Incoming Ride Requests (for drivers) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUserFriends className="w-5 h-5" />
                Incoming Requests ({rideRequests.filter(req => req.status === 'pending').length})
              </h3>
              
              {requestsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderSkeletonCards()}
                </div>
              ) : rideRequests.filter(req => req.status === 'pending').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rideRequests.filter(req => req.status === 'pending').map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold">{request.passengerName}</h4>
                            <p className="text-sm text-muted-foreground">{request.passengerEmail}</p>
                          </div>
                          <span className="text-lg font-semibold text-primary">
                            ${request.originalPrice || request.ridePrice}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="text-primary mr-2 flex-shrink-0" />
                            <span>{request.rideOrigin} → {request.rideDestination}</span>
                          </div>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-primary mr-2 flex-shrink-0" />
                            <span>{formatDate(new Date(request.rideDepartureTime))}</span>
                          </div>
                          {request.passengerPhone && (
                            <div className="flex items-center">
                              <span className="text-primary mr-2">📞</span>
                              <span>{request.passengerPhone}</span>
                            </div>
                          )}
                          
                          {/* Show passenger baggage requirements */}
                          {((request.baggageCheckIn || 0) > 0 || (request.baggagePersonal || 0) > 0) && (
                            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                              <h5 className="font-medium text-blue-800 text-xs mb-1">Baggage Requirements:</h5>
                              <div className="flex items-center gap-2">
                                {(request.baggageCheckIn || 0) > 0 && (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                    {request.baggageCheckIn} check-in bag{(request.baggageCheckIn || 0) > 1 ? 's' : ''}
                                  </span>
                                )}
                                {(request.baggagePersonal || 0) > 0 && (
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                    {request.baggagePersonal} personal item{(request.baggagePersonal || 0) > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex gap-2 p-4 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRequestAction(request.id, 'reject')}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRequestAction(request.id, 'approve')}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          Approve
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">No pending ride requests.</p>
                </div>
              )}
            </div>

            {/* Driver Offers Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaCar className="w-5 h-5" />
                Driver Offers ({driverOffers.filter(offer => offer.status === 'pending').length})
              </h3>
              
              {driverOffersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderSkeletonCards()}
                </div>
              ) : driverOffers.filter(offer => offer.status === 'pending').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {driverOffers.filter(offer => offer.status === 'pending').map((offer) => (
                    <Card key={offer.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold">{offer.driverName}</h4>
                            <p className="text-sm text-muted-foreground">{offer.driverEmail}</p>
                          </div>
                          <span className="text-lg font-semibold text-primary">
                            ${offer.counterOfferPrice}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="text-primary mr-2 flex-shrink-0" />
                            <span>{offer.rideOrigin} → {offer.rideDestination}</span>
                          </div>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-primary mr-2 flex-shrink-0" />
                            <span>{formatDate(new Date(offer.rideDepartureTime))}</span>
                          </div>
                          
                          {offer.message && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                              <h5 className="font-medium text-gray-800 text-xs mb-1">Message from driver:</h5>
                              <p className="text-sm text-gray-700">{offer.message}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex gap-2 p-4 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDriverOfferResponse(offer.id, 'rejected')}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDriverOfferResponse(offer.id, 'accepted')}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          Accept Offer
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">No pending driver offers.</p>
                </div>
              )}
            </div>

            {/* Outgoing Requests (passenger requests) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUser className="w-5 h-5" />
                My Outgoing Requests ({pendingRequests.filter(req => req.status === 'pending').length})
              </h3>
              
              {pendingRequestsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderSkeletonCards()}
                </div>
              ) : pendingRequests.filter(req => req.status === 'pending').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingRequests.filter(req => req.status === 'pending').map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold">Request to {request.driverName}</h4>
                            <p className="text-sm text-muted-foreground">{request.driverEmail}</p>
                          </div>
                          <span className="text-lg font-semibold text-primary">
                            ${request.originalPrice || request.ridePrice}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <FaMapMarkerAlt className="text-primary mr-2 flex-shrink-0" />
                            <span>{request.rideOrigin} → {request.rideDestination}</span>
                          </div>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-primary mr-2 flex-shrink-0" />
                            <span>{formatDate(new Date(request.rideDepartureTime))}</span>
                          </div>
                          
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending Response
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex gap-2 p-4 pt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel Request
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">No outgoing requests.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Modal for Start/Complete */}
      <Dialog open={verificationModalOpen} onOpenChange={setVerificationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{verificationModalTitle}</DialogTitle>
            <DialogDescription>
              {verificationModalDescription}
            </DialogDescription>
          </DialogHeader>
          
          {verificationCode ? (
            <div className="text-center py-8">
              <div className="text-4xl font-mono font-bold text-primary mb-4 tracking-widest">
                {verificationCode}
              </div>
              <p className="text-sm text-muted-foreground">
                Share this code with the passenger
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Label htmlFor="verification-code">Enter 4-digit code</Label>
              <Input
                id="verification-code"
                type="text"
                maxLength={4}
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                placeholder="0000"
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setVerificationModalOpen(false);
                setVerificationCode('');
                setVerificationCodeInput('');
                setCurrentRideId(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            {!verificationCode && (
              <Button 
                onClick={handleStartVerification}
                disabled={!verificationCodeInput.trim()}
                className="flex-1"
              >
                Verify Code
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Ride</DialogTitle>
            <DialogDescription>
              Enter the verification code from the driver to complete the ride.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Label htmlFor="completion-code">Enter verification code</Label>
            <Input
              id="completion-code"
              type="text"
              value={inputVerificationCode}
              onChange={(e) => setInputVerificationCode(e.target.value)}
              placeholder="Enter code..."
              className="text-center"
            />
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setVerificationDialogOpen(false);
                setInputVerificationCode('');
                setRideToComplete(null);
                setIsPassenger(false);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={verifyAndCompleteRide}
              disabled={!inputVerificationCode.trim()}
              className="flex-1"
            >
              Complete Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show verification code dialog */}
      <Dialog open={showVerificationCode} onOpenChange={setShowVerificationCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ride Completion Code</DialogTitle>
            <DialogDescription>
              Share this code with the passenger to complete the ride.
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-8">
            <div className="text-4xl font-mono font-bold text-primary mb-4 tracking-widest">
              {generatedCode}
            </div>
            <p className="text-sm text-muted-foreground">
              Passenger will enter this code to complete the ride
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowVerificationCode(false);
                setGeneratedCode('');
              }}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Ride Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />
              Cancel Ride
            </DialogTitle>
            <DialogDescription>
              {rideToCancel && (() => {
                const hoursUntil = calculateHoursUntilDeparture(rideToCancel.rideDepartureTime || rideToCancel.departureTime);
                const willHavePenalty = hoursUntil < 24;
                return (
                  <div className="space-y-2">
                    <p>Are you sure you want to cancel this ride?</p>
                    {willHavePenalty && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Warning: Cancelling within 24 hours may result in penalties
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Current strikes: {userStrikes}/3 this month
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellation-reason">Reason for cancellation (optional)</Label>
              <Input
                id="cancellation-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g., Emergency, Change of plans..."
                maxLength={200}
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setCancelDialogOpen(false);
                setRideToCancel(null);
                setCancellationReason('');
              }}
              disabled={cancelling}
              className="flex-1"
            >
              Keep Ride
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelRide}
              disabled={cancelling}
              className="flex-1"
            >
              {cancelling ? "Cancelling..." : "Cancel Ride"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passenger Cancellation Dialog */}
      <Dialog open={passengerCancelDialogOpen} onOpenChange={setPassengerCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Passenger</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {passengerToCancel?.passengerName} from this ride? 
              Their payment will be automatically refunded.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setPassengerCancelDialogOpen(false);
                setPassengerToCancel(null);
              }}
              disabled={cancellingPassenger}
              className="flex-1"
            >
              Keep Passenger
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmCancelPassenger}
              disabled={cancellingPassenger}
              className="flex-1"
            >
              {cancellingPassenger ? "Cancelling..." : "Remove Passenger"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}