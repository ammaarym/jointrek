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

export default function MyRidesPostgres() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<any>(null);
  const { toast } = useToast();

  const { 
    myRides, 
    loading, 
    error, 
    loadMyRides, 
    removeRide 
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
                    <span>Departure: {formatDate(new Date(ride.departureTime))}</span>
                  </div>
                  <div className="flex items-center">
                    <FaCar className="text-primary mr-2 flex-shrink-0" />
                    <span>{ride.carModel || 'Car not specified'}</span>
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
    </div>
  );
}