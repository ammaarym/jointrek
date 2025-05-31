import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth-new';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { formatDate } from '../lib/date-utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaDollarSign, FaCar, FaTrash, FaEdit, FaStar, FaCheck } from 'react-icons/fa';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EditRideModal from '@/components/edit-ride-modal';
import { Star } from 'lucide-react';

// Helper function to capitalize car types
const capitalizeCarType = (carType: string) => {
  if (!carType) return 'Car not specified';
  
  // Handle special cases
  if (carType.toLowerCase() === 'suv') return 'SUV';
  
  // Capitalize first letter for other types
  return carType.charAt(0).toUpperCase() + carType.slice(1).toLowerCase();
};

export default function MyRidesPostgres() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rideToReview, setRideToReview] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const [completedRides, setCompletedRides] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { 
    myRides, 
    loading, 
    error, 
    loadMyRides, 
    removeRide,
    updateRide 
  } = usePostgresRides();

  // Load rides only once when component mounts
  React.useEffect(() => {
    if (currentUser) {
      loadMyRides(currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Handle posting a new ride
  const handlePostRide = () => {
    setLocation('/post-ride');
  };

  // Handle marking ride as complete
  const handleMarkComplete = (ride: any) => {
    setCompletedRides(prev => new Set(Array.from(prev).concat(ride.id)));
    setRideToReview(ride);
    setReviewModalOpen(true);
  };

  // Handle submitting review
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      // For now, just show success - you can connect to backend later
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });
      
      setReviewModalOpen(false);
      setRating(0);
      setRideToReview(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Open the edit modal with automatic pricing
  const handleEditRide = (ride: any) => {
    setRideToEdit(ride);
    setEditModalOpen(true);
  };

  // Handle delete ride
  const handleDeleteRide = async () => {
    if (rideToDelete) {
      try {
        await removeRide(rideToDelete.id);
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
      } catch (error) {
        console.error('Error removing ride:', error);
        toast({
          title: "Error",
          description: "Failed to remove ride. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const navigateToPostRide = () => {
    setLocation('/post-ride');
  };

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
            <Button variant="destructive" onClick={handleDeleteRide}>
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

      {/* Rides list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
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
        ) : myRides.length > 0 ? (
          myRides.map((ride) => (
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
                  <div className="text-lg font-bold text-primary">
                    ${ride.price}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-primary mr-2 flex-shrink-0" />
                    <span>Departure: {formatDate(new Date(ride.departureTime))} at {new Date(ride.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCar className="text-primary mr-2 flex-shrink-0" />
                    <span>{capitalizeCarType(ride.carModel)}</span>
                  </div>
                  <div className="flex items-center">
                    <FaUserFriends className="text-primary mr-2 flex-shrink-0" />
                    <span>{ride.seatsLeft} available</span>
                  </div>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-primary mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <div>From: {ride.originArea || ride.origin}</div>
                      <div>To: {ride.destinationArea || ride.destination}</div>
                    </div>
                  </div>
                  {ride.notes && (
                    <div className="text-muted-foreground">
                      <strong>Notes:</strong> {ride.notes}
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2 p-4 pt-0">
                {completedRides.has(ride.id) ? (
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
                  variant="destructive"
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
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't posted any rides yet.</p>
            <Button onClick={navigateToPostRide} className="bg-primary hover:bg-primary/90">
              Post Your First Ride
            </Button>
          </div>
        )}
      </div>

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
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            {/* Rating Text */}
            <div className="text-center text-sm">
              {rating === 0 && 'Select a rating'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </div>
            

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
    </div>
  );
}