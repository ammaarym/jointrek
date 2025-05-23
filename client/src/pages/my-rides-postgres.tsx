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

// Define the schema for the edit form
const editRideSchema = z.object({
  origin: z.string().min(1, "Origin city is required"),
  originArea: z.string().min(1, "Origin area is required"),
  destination: z.string().min(1, "Destination city is required"),
  destinationArea: z.string().min(1, "Destination area is required"),
  price: z.string().min(1, "Price is required"),
  seatsTotal: z.number().min(1, "At least 1 seat is required"),
  carModel: z.string().optional(),
  notes: z.string().optional(),
  genderPreference: z.string().default("no-preference")
});

type EditRideFormValues = z.infer<typeof editRideSchema>;

// Florida cities for dropdown
const FLORIDA_CITIES = [
  "Gainesville",
  "Miami",
  "Orlando",
  "Tampa",
  "Jacksonville",
  "Tallahassee",
  "Fort Lauderdale",
  "St. Petersburg",
  "Pensacola",
  "West Palm Beach",
  "Boca Raton",
  "Sarasota"
];

export default function MyRidesPostgres() {
  const { currentUser } = useAuth();
  const { myRides, loading, error, loadMyRides, updateRide: editRide, removeRide } = usePostgresRides();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rideToEdit, setRideToEdit] = useState<any>(null);

  // Set up form for editing rides
  const form = useForm<EditRideFormValues>({
    resolver: zodResolver(editRideSchema),
    defaultValues: {
      origin: "",
      originArea: "",
      destination: "",
      destinationArea: "",
      price: "",
      seatsTotal: 1,
      carModel: "",
      notes: "",
      genderPreference: "no-preference"
    }
  });

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

  // Submit edit form
  const onSubmitEdit = async (data: EditRideFormValues) => {
    if (rideToEdit) {
      const rideData = {
        ...data,
        price: data.price.toString()
      };

      const success = await editRide(rideToEdit.id, rideData);
      setEditDialogOpen(false);
      
      if (success) {
        toast({
          title: "Success",
          description: "Ride was successfully updated",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update ride. Please try again.",
          variant: "destructive",
        });
      }
    }
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Origin City */}
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From City</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FLORIDA_CITIES.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Origin Area */}
                <FormField
                  control={form.control}
                  name="originArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Area</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. University, Downtown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Destination City */}
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To City</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FLORIDA_CITIES.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Destination Area */}
                <FormField
                  control={form.control}
                  name="destinationArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Area</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Airport, Downtown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Seats Total */}
                <FormField
                  control={form.control}
                  name="seatsTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Seats</FormLabel>
                      <Select 
                        value={field.value.toString()} 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seats" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Car Model */}
                <FormField
                  control={form.control}
                  name="carModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Toyota Camry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Gender Preference */}
                <FormField
                  control={form.control}
                  name="genderPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender Preference</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-preference">No Preference</SelectItem>
                          <SelectItem value="male">Male Only</SelectItem>
                          <SelectItem value="female">Female Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Any other details about your trip" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="bg-primary text-white hover:bg-primary/90">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
                    <span>{ride.seatsLeft} available</span>
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
                  onClick={() => handleEditRide(ride)}
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