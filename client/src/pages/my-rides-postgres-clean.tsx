import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth-new';
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
import { Skeleton } from '@/components/ui/skeleton';
import EditRideModal from '@/components/edit-ride-modal';
import { Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
  const [activeTab, setActiveTab] = useState('my-posts');
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

  // Passenger cancellation state
  const [passengerCancelDialogOpen, setPassengerCancelDialogOpen] = useState(false);
  const [passengerToCancel, setPassengerToCancel] = useState<any>(null);
  const [cancellingPassenger, setCancellingPassenger] = useState(false);

  const [completedRides, setCompletedRides] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ride request state
  const [rideRequests, setRideRequests] = useState<any[]>([]);
  
  // Debug log in render
  console.log('RENDER DEBUG - rideRequests state:', rideRequests.length, rideRequests);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Pending requests (outgoing) state
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  
  // Approved rides state
  const [approvedRides, setApprovedRides] = useState<any[]>([]);
  const [approvedRidesLoading, setApprovedRidesLoading] = useState(false);
  
  // My Posts sub-tab state
  const [myPostsTab, setMyPostsTab] = useState('driver');
  
  // Approved rides sub-tab state for passenger/driver views
  const [approvedTab, setApprovedTab] = useState('passenger');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
      console.error('Error loading rides:', error);
      setError('Failed to load rides. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load ride requests for the user (incoming requests to user's rides)
  const loadRideRequests = async () => {
    if (!currentUser) return;
    
    setRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/driver', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRideRequests(data || []);
        console.log('COMBINED TAB DEBUG - rideRequests.length:', data?.length || 0, 'pendingRequests.length:', pendingRequests.length);
      }
    } catch (error) {
      console.error('Error loading ride requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Load pending requests (outgoing requests from user)
  const loadPendingRequests = async () => {
    if (!currentUser) return;
    
    setPendingRequestsLoading(true);
    try {
      const response = await fetch('/api/ride-requests/user', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data || []);
        console.log('COMBINED TAB DEBUG - rideRequests.length:', rideRequests.length, 'pendingRequests.length:', data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setPendingRequestsLoading(false);
    }
  };

  // Load approved rides
  const loadApprovedRides = async () => {
    if (!currentUser) return;
    
    setApprovedRidesLoading(true);
    try {
      const response = await fetch('/api/ride-requests/approved', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Approved rides loaded:', data);
        console.log('Passenger rides count:', data.filter(ride => ride.userRole === 'passenger').length);
        console.log('Driver rides count:', data.filter(ride => ride.userRole === 'driver').length);
        
        // Debug each passenger ride
        data.filter(ride => ride.userRole === 'passenger').forEach(ride => {
          console.log('Passenger ride details:', {
            rideId: ride.rideId,
            origin: ride.rideOrigin,
            destination: ride.rideDestination,
            isStarted: ride.isStarted,
            isCompleted: ride.isCompleted,
            shouldShowCancel: !ride.isStarted && !ride.isCompleted
          });
        });
        
        setApprovedRides(data || []);
      }
    } catch (error) {
      console.error('Error loading approved rides:', error);
    } finally {
      setApprovedRidesLoading(false);
    }
  };

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

  useEffect(() => {
    if (currentUser) {
      loadMyRides(currentUser.uid);
      loadRideRequests();
      loadPendingRequests();
      loadApprovedRides();
      loadUserStrikes();
    }
  }, [currentUser]);

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
      const response = await fetch(`/api/rides/${rideToComplete.rideId}/complete`, {
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
        
        // Show review modal
        setRideToReview(rideToComplete);
        setReviewModalOpen(true);
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
          reviewType: 'driver', // Always rating the driver when passenger completes a ride
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
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
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
        
        // Set up polling to automatically refresh when the other party verifies
        const pollForUpdates = setInterval(async () => {
          try {
            await loadApprovedRides();
          } catch (error) {
            console.error('Error polling for updates:', error);
          }
        }, 3000); // Poll every 3 seconds
        
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
                <span>{capitalizeCarType(ride.carModel || '')}</span>
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
              console.log('Ride requests with statuses:', rideRequests.map(req => ({ id: req.id, status: req.status })));
              console.log('Pending requests count:', pendingCount, 'Total requests:', rideRequests.length);
              return pendingCount > 0 ? (
                <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5 shadow-lg ring-2 ring-yellow-300">
                  {pendingCount}
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
              
              <TabsContent value="passenger" className="mt-4">
                <div className="space-y-4">
                  {approvedRidesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-6 w-48" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-64" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : approvedRides.filter(ride => ride.userRole === 'passenger').length > 0 ? (
                    approvedRides.filter(ride => ride.userRole === 'passenger').map((ride) => {
                      // Debug log for ride status
                      console.log('Passenger Ride Debug:', {
                        rideId: ride.rideId,
                        isStarted: ride.isStarted,
                        isCompleted: ride.isCompleted,
                        shouldShowCancel: !ride.isStarted && !ride.isCompleted
                      });
                      return (
                      <Card key={ride.id} className={`p-6 ${ride.isCompleted ? 'border-green-300 bg-green-100' : 'border-green-200 bg-green-50'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <FaCheck className="w-6 h-6 text-green-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{ride.driverName}</h3>
                                  {ride.isCompleted ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                                      COMPLETED
                                    </span>
                                  ) : ride.isStarted ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                                      IN PROGRESS
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      APPROVED
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{ride.driverEmail}</p>
                                {ride.driverPhone && (
                                  <p className="text-sm font-medium text-green-700">📞 {ride.driverPhone}</p>
                                )}
                                {ride.driverInstagram && (
                                  <p className="text-sm text-blue-600">📷 @{ride.driverInstagram}</p>
                                )}
                                {ride.driverSnapchat && (
                                  <p className="text-sm text-yellow-600">👻 @{ride.driverSnapchat}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                                <span className="text-sm">
                                  {ride.rideOrigin} → {ride.rideDestination}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="w-4 h-4 text-primary" />
                                <span className="text-sm">
                                  {formatDate(new Date(ride.rideDepartureTime))} at {new Date(ride.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Price: ${ride.ridePrice}</span>
                                {ride.rideCarModel && (
                                  <span className="text-sm text-muted-foreground">• {ride.rideCarModel}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <span className="text-sm text-muted-foreground">
                              Approved {formatDate(new Date(ride.createdAt))}
                            </span>
                            
                            {/* Show verification buttons or status badges based on ride progress */}
                            {ride.isCompleted ? (
                              <div className="flex items-center gap-1 text-green-600 font-medium">
                                <FaCheck className="w-5 h-5 text-green-600" />
                                <span className="text-sm">COMPLETED</span>
                              </div>
                            ) : ride.isStarted ? (
                              // Ride has started - show completion flow
                              <div className="flex flex-col gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                                  IN PROGRESS
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePassengerVerification({ id: ride.rideId })}
                                  className="flex items-center gap-1 border-green-600 text-green-600 hover:bg-green-50"
                                >
                                  <FaCheck className="w-4 h-4" />
                                  Ride Complete
                                </Button>
                              </div>
                            ) : (
                              // Ride not started yet - show start flow and cancel option for passenger
                              <div className="flex flex-col gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  APPROVED
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePassengerStartCode({ id: ride.rideId })}
                                  className="flex items-center gap-1 border-purple-600 text-purple-600 hover:bg-purple-50"
                                >
                                  <FaKey className="w-4 h-4" />
                                  Enter Start Code
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRideToCancel(ride);
                                    setCancelDialogOpen(true);
                                  }}
                                  className="flex items-center gap-1 border-red-600 text-red-600 hover:bg-red-50"
                                >
                                  <FaTrash className="w-4 h-4" />
                                  Cancel Ride
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <FaUser className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No approved passenger rides yet</h3>
                      <p className="text-muted-foreground">
                        When drivers approve your ride requests, they'll appear here with contact info.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="driver" className="mt-4">
                <div className="space-y-4">
                  {approvedRidesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-6 w-48" />
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-4 w-64" />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (() => {
                    // Group approved rides by rideId to show each ride once with passenger count
                    const groupedRides = approvedRides
                      .filter(ride => ride.userRole === 'driver')
                      .reduce((acc: Record<number, any>, ride: any) => {
                        if (!acc[ride.rideId]) {
                          acc[ride.rideId] = {
                            ...ride,
                            passengerCount: 1
                          };
                        } else {
                          acc[ride.rideId].passengerCount += 1;
                        }
                        return acc;
                      }, {});
                    
                    const uniqueRides = Object.values(groupedRides);
                    
                    if (uniqueRides.length > 0) {
                      return uniqueRides.map((ride: any) => (
                        <Card key={ride.rideId} className={`p-6 ${ride.isCompleted ? 'border-green-300 bg-green-100' : 'border-green-200 bg-green-50'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                  {ride.isCompleted ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                                      COMPLETED
                                    </span>
                                  ) : ride.isStarted ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                                      IN PROGRESS
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      APPROVED
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2">
                                  <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                                  <span className="text-sm font-medium">
                                    {ride.rideOrigin} → {ride.rideDestination}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="w-4 h-4 text-primary" />
                                  <span className="text-sm">
                                    {formatDate(new Date(ride.rideDepartureTime))} at {new Date(ride.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">Price: ${ride.ridePrice}</span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FaUserFriends className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">
                                      {ride.passengerCount} passenger{ride.passengerCount !== 1 ? 's' : ''} coming
                                    </span>
                                  </div>
                                  
                                  {/* Show passenger details with cancel buttons */}
                                  {(() => {
                                    const passengers = approvedRides
                                      .filter(r => r.rideId === ride.rideId && r.userRole === 'driver');
                                    
                                    return (
                                      <div className="space-y-2">
                                        {passengers.map((passenger, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                          >
                                            <div className="flex-1">
                                              <div className="font-medium text-blue-800 text-sm">
                                                {passenger.passengerName}
                                              </div>
                                              <div className="text-blue-600 text-xs">
                                                {passenger.passengerEmail}
                                              </div>
                                              {passenger.passengerPhone && (
                                                <div className="text-blue-600 text-xs">
                                                  📞 {passenger.passengerPhone}
                                                </div>
                                              )}
                                            </div>
                                            {!ride.isCompleted && !ride.isStarted && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                                onClick={() => handleCancelPassenger(passenger)}
                                              >
                                                Cancel
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-sm text-muted-foreground">
                                Approved {formatDate(new Date(ride.createdAt))}
                              </span>
                              
                              {/* Show verification buttons or status badges based on ride progress */}
                              {ride.isCompleted ? (
                                <div className="flex items-center gap-1 text-green-600 font-medium">
                                  <FaCheck className="w-5 h-5 text-green-600" />
                                </div>
                              ) : ride.isStarted ? (
                                // Ride has started - show completion flow for driver
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateVerificationCode({ id: ride.rideId })}
                                  className="flex items-center gap-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                                >
                                  <FaKey className="w-4 h-4" />
                                  Generate Code
                                </Button>
                              ) : (
                                // Ride not started yet - show start flow and cancel option for driver
                                <div className="flex flex-col gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDriverStartVerification({ id: ride.rideId })}
                                    className="flex items-center gap-1 border-orange-600 text-orange-600 hover:bg-orange-50"
                                  >
                                    <FaPlay className="w-4 h-4" />
                                    Start Ride
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setRideToCancel(ride);
                                      setCancelDialogOpen(true);
                                    }}
                                    className="flex items-center gap-1 border-red-600 text-red-600 hover:bg-red-50"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                    Cancel Ride
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ));
                    } else {
                      return (
                        <div className="text-center py-12">
                          <FaCar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No approved driver rides yet</h3>
                          <p className="text-muted-foreground">
                            When passengers request your rides and you approve them, they'll appear here.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
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
          <div className="space-y-8">
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
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Incoming requests (to user's rides) */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <BiMessageDetail className="w-5 h-5" />
                    Incoming Requests ({rideRequests.length})
                  </h2>
                  {rideRequests.length > 0 ? (
                    <div className="space-y-4">
                      {rideRequests.map((request) => (
                        <Card key={request.id} className={`p-6 ${
                          request.status === 'approved' ? 'border-green-200 bg-green-50' : 
                          request.status === 'rejected' ? 'border-red-200 bg-red-50' :
                          'border-yellow-200 bg-yellow-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  request.status === 'approved' ? 'bg-green-100' : 
                                  request.status === 'rejected' ? 'bg-red-100' :
                                  'bg-yellow-100'
                                }`}>
                                  {request.status === 'approved' ? (
                                    <FaCheck className="w-6 h-6 text-green-600" />
                                  ) : request.status === 'rejected' ? (
                                    <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                                  ) : (
                                    <FaUser className="w-6 h-6 text-yellow-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{request.passengerName}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      request.status === 'approved' ? 'bg-green-600 text-white' : 
                                      request.status === 'rejected' ? 'bg-red-600 text-white' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {request.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{request.passengerEmail}</p>
                                  {request.passengerPhone && (
                                    <p className="text-sm font-medium text-green-700">📞 {request.passengerPhone}</p>
                                  )}
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
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm italic">"{request.message}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatDate(new Date(request.createdAt))}
                              </span>
                              
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRequestAction(request.id, 'reject')}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    Reject
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRequestAction(request.id, 'approve')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BiMessageDetail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No incoming requests</h3>
                      <p className="text-muted-foreground">
                        When passengers request to join your rides, they'll appear here.
                      </p>
                    </div>
                  )}
                </div>

                {/* Outgoing requests (from user) */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FaUser className="w-5 h-5" />
                    Your Requests ({pendingRequests.length})
                  </h2>
                  {pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.map((request) => (
                        <Card key={request.id} className={`p-6 ${
                          request.status === 'approved' ? 'border-green-200 bg-green-50' : 
                          request.status === 'rejected' ? 'border-red-200 bg-red-50' :
                          request.status === 'cancelled' ? 'border-gray-200 bg-gray-50' :
                          'border-blue-200 bg-blue-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                  request.status === 'approved' ? 'bg-green-100' : 
                                  request.status === 'rejected' ? 'bg-red-100' :
                                  request.status === 'cancelled' ? 'bg-gray-100' :
                                  'bg-blue-100'
                                }`}>
                                  {request.status === 'approved' ? (
                                    <FaCheck className="w-6 h-6 text-green-600" />
                                  ) : request.status === 'rejected' ? (
                                    <FaExclamationTriangle className="w-6 h-6 text-red-600" />
                                  ) : request.status === 'cancelled' ? (
                                    <FaExclamationTriangle className="w-6 h-6 text-gray-600" />
                                  ) : (
                                    <FaUser className="w-6 h-6 text-blue-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">Request to {request.driverName}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      request.status === 'approved' ? 'bg-green-600 text-white' : 
                                      request.status === 'rejected' ? 'bg-red-600 text-white' :
                                      request.status === 'cancelled' ? 'bg-gray-600 text-white' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {request.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{request.driverEmail}</p>
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
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm italic">Your message: "{request.message}"</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-sm text-muted-foreground">
                                Sent {formatDate(new Date(request.createdAt))}
                              </span>
                              
                              {request.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelRequest(request.id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  Cancel Request
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaUser className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No requests sent</h3>
                      <p className="text-muted-foreground">
                        When you request to join rides, they'll appear here.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Driver Verification Code Display Dialog */}
      <Dialog open={showVerificationCode} onOpenChange={setShowVerificationCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verification Code Generated</DialogTitle>
            <DialogDescription>
              Share this code with the passenger to complete the ride.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="text-4xl font-bold text-primary bg-primary/10 px-6 py-4 rounded-lg">
              {generatedCode}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Passengers need this 6-digit code to confirm ride completion and process payment.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowVerificationCode(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passenger Verification Code Input Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code provided by the driver to complete the ride and process payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={inputVerificationCode}
                onChange={(e) => setInputVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg font-mono"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Once verified, your payment will be processed and the ride will be marked as complete.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setVerificationDialogOpen(false);
                setInputVerificationCode('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={verifyAndCompleteRide}
              disabled={inputVerificationCode.length !== 6}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Complete Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Ride Verification Modal */}
      <Dialog open={verificationModalOpen} onOpenChange={setVerificationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{verificationModalTitle}</DialogTitle>
            <DialogDescription>{verificationModalDescription}</DialogDescription>
          </DialogHeader>
          
          {verificationCode ? (
            // Show code to passenger
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl font-bold tracking-widest bg-gray-100 px-6 py-4 rounded-lg">
                {verificationCode}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Show this code to your driver to start the ride
              </p>
            </div>
          ) : (
            // Input field for driver
            <div className="space-y-4">
              <Label htmlFor="start-verification-code">Enter 4-digit code from passenger:</Label>
              <Input
                id="start-verification-code"
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value)}
                placeholder="1234"
                maxLength={4}
                className="text-center text-2xl tracking-widest"
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
                disabled={verificationCodeInput.length !== 4}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Start Ride
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              How was your ride? Your feedback helps improve the service.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Click a star to rate your experience
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)} className="flex-1">
              Skip
            </Button>
            <Button onClick={handleSubmitReview} disabled={rating === 0} className="flex-1">
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ride Cancellation Dialog with Penalty Warning */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Ride</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this ride? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {rideToCancel && (
            <div className="space-y-4 py-4">
              {/* Ride Details */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium">{rideToCancel.rideOrigin || rideToCancel.origin} → {rideToCancel.rideDestination || rideToCancel.destination}</div>
                <div className="text-xs text-gray-600">
                  {rideToCancel.rideDepartureTime ? 
                    `${formatDate(new Date(rideToCancel.rideDepartureTime))} at ${new Date(rideToCancel.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` :
                    `${formatDate(new Date(rideToCancel.departureTime))} at ${new Date(rideToCancel.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                  }
                </div>
              </div>

              {/* Penalty Warning */}
              {(() => {
                const departureTime = rideToCancel.rideDepartureTime || rideToCancel.departureTime;
                const hoursUntilDeparture = calculateHoursUntilDeparture(departureTime);
                const willHavePenalty = hoursUntilDeparture < 48 && userStrikes >= 1;
                
                if (hoursUntilDeparture < 48) {
                  return (
                    <div className={`p-3 rounded-lg border ${willHavePenalty ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-start gap-2">
                        <FaExclamationTriangle className={`w-5 h-5 mt-0.5 ${willHavePenalty ? 'text-red-600' : 'text-yellow-600'}`} />
                        <div className="text-sm">
                          <div className={`font-medium ${willHavePenalty ? 'text-red-800' : 'text-yellow-800'}`}>
                            {willHavePenalty ? 'Penalty Will Apply' : 'Warning'}
                          </div>
                          <div className={willHavePenalty ? 'text-red-700' : 'text-yellow-700'}>
                            {hoursUntilDeparture > 0 
                              ? `Departure is in ${Math.round(hoursUntilDeparture)} hours (less than 48 hours).`
                              : 'This ride has already departed.'
                            }
                          </div>
                          {willHavePenalty && (
                            <div className="text-red-700 mt-1">
                              You have {userStrikes} strike(s). A 20% cancellation penalty will be charged.
                            </div>
                          )}
                          {!willHavePenalty && hoursUntilDeparture < 48 && hoursUntilDeparture > 0 && (
                            <div className="text-yellow-700 mt-1">
                              This will count as your first strike. Future cancellations within 48 hours will incur a 20% penalty.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Cancellation Reason */}
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">Reason for cancellation (optional)</Label>
                <textarea
                  id="cancellation-reason"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Let others know why you're cancelling..."
                  className="w-full p-2 border rounded-md resize-none h-20 text-sm"
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 text-right">
                  {cancellationReason.length}/200
                </div>
              </div>
            </div>
          )}
          
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