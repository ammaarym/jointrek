import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { formatDate } from '../lib/date-utils';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaDollarSign, FaCar, FaTrash, FaEdit } from 'react-icons/fa';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyRidesPostgres() {
  const { currentUser } = useAuth();
  const { myRides, loading, error, loadMyRides, removeRide } = usePostgresRides();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<number | null>(null);

  // Handle posting a new ride
  const handlePostRide = () => {
    setLocation('/post-ride');
  };

  // Handle edit ride
  const handleEditRide = (rideId: number) => {
    // For now, just navigate to post ride - in the future we can add edit functionality
    setLocation(`/post-ride?edit=${rideId}`);
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
      
      if (success) {
        toast({
          title: "Success",
          description: "Ride was successfully deleted",
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

  const navigateToPostRide = () => {
    setLocation('/post-ride');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Rides</h1>
        <Button 
          onClick={handlePostRide} 
          className="bg-primary text-white hover:bg-primary/90"
        >
          Post a New Ride
        </Button>
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
          </DialogHeader>
          <p className="py-4">
            This action cannot be undone. This will permanently delete the ride.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRide}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    <span>{ride.seatsLeft} of {ride.seatsTotal} seats available</span>
                  </div>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-primary mr-2 mt-1 flex-shrink-0" />
                    <div>
                      <div>From: {ride.originArea || ride.origin}</div>
                      <div>To: {ride.destinationArea || ride.destination}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2 p-4 pt-0 mt-4 border-t">
                <Button 
                  variant="outline" 
                  className="text-primary border-primary hover:bg-primary/10"
                  onClick={() => handleEditRide(ride.id)}
                >
                  <FaEdit className="mr-2" /> Edit
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => confirmDelete(ride.id)}
                >
                  <FaTrash className="mr-2" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-card rounded-lg shadow-md">
            <FaCar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">You haven't posted any rides yet.</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Start by creating your first ride offer to help fellow students get around!
            </p>
            <Button 
              onClick={navigateToPostRide} 
              className="mt-6 bg-primary text-white hover:bg-primary/90"
            >
              Post Your First Ride
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}