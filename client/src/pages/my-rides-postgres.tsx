import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { formatDate } from '../lib/date-utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaDollarSign, FaCar, FaTrash, FaEdit } from 'react-icons/fa';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EditRideModal from '@/components/edit-ride-modal';

// Helper function to capitalize car types
const capitalizeCarType = (carType: string) => {
  if (!carType) return 'Car not specified';
  return carType.charAt(0).toUpperCase() + carType.slice(1).toLowerCase();
};

export default function MyRidesPostgres() {
  const { currentUser } = useAuth();
  const { myRides, loading, error, loadMyRides, updateRide, removeRide } = usePostgresRides();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<any>(null);

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

  // Open the edit modal
  const handleEditRide = (ride: any) => {
    setRideToEdit(ride);
    setEditModalOpen(true);
  };

  // Handle delete confirmation
  const confirmDelete = (rideId: number) => {
    setRideToDelete(rideId);
    setDeleteDialogOpen(true);
  };

  // Handle delete ride
  const handleDeleteRide = async () => {
    if (rideToDelete) {
      const success = await removeRide(rideToDelete);
      setDeleteDialogOpen(false);
      setRideToDelete(null);
      
      if (success) {
        toast({
          title: "Success",
          description: "Ride deleted successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete ride. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please sign in to view your rides.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
      
      {/* Edit ride modal */}
      <EditRideModal 
        ride={rideToEdit}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        updateRide={updateRide}
        onRideUpdated={() => {
          if (currentUser) {
            loadMyRides(currentUser.uid, true);
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
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-8 w-20" />
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
                      {formatDate(new Date(ride.departureTime))} at {new Date(ride.departureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRide(ride)}
                  className="flex items-center gap-1"
                >
                  <FaEdit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete(ride.id)}
                  className="flex items-center gap-1"
                >
                  <FaTrash className="h-3 w-3" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          // Empty state
          <div className="col-span-full text-center py-12">
            <div className="max-w-md mx-auto">
              <FaCar className="text-6xl text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No rides posted yet</h3>
              <p className="text-muted-foreground mb-6">
                Start sharing rides with your fellow Gators by posting your first ride.
              </p>
              <Button onClick={handlePostRide} className="bg-primary hover:bg-primary/90">
                Post Your First Ride
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}