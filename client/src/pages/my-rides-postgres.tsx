import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { Ride } from '@shared/schema';
import { formatDate, formatTime } from '../lib/date-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaClock, 
  FaUserFriends, 
  FaDollarSign, 
  FaTrash, 
  FaPencilAlt 
} from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useLocation } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// List of major Florida cities
const FLORIDA_CITIES = [
  "Gainesville",
  "Jacksonville",
  "Miami",
  "Orlando",
  "Tampa",
  "Tallahassee",
  "Fort Lauderdale",
  "St. Petersburg",
  "Clearwater",
  "Sarasota"
];

// Time periods for departure
const TIME_PERIODS = [
  { label: "Morning (8am-12pm)", value: "morning", hour: 9 },
  { label: "Afternoon (12pm-5pm)", value: "afternoon", hour: 14 },
  { label: "Evening (5pm-9pm)", value: "evening", hour: 18 }
];

// Gender preference options
const GENDER_PREFERENCES = [
  { label: "No Preference", value: "no-preference" },
  { label: "Male Only", value: "male" },
  { label: "Female Only", value: "female" }
];

export default function MyRidesPostgres() {
  const { currentUser } = useAuth();
  const { myRides, loading, error, loadMyRides, editRide, removeRide } = usePostgresRides();
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<number | null>(null);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [editFormData, setEditFormData] = useState({
    origin: '',
    originArea: '',
    destination: '',
    destinationArea: '',
    departureDate: '',
    departureTime: '',
    availableSeats: '',
    price: '',
    genderPreference: '',
    carModel: '',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Load user's rides on component mount
  useEffect(() => {
    loadMyRides();
  }, []);

  // Navigate to the post ride page
  const navigateToPostRide = () => {
    setLocation('/post-ride');
  };

  // Handle deleting a ride
  const handleDeleteRide = async () => {
    if (!rideToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const success = await removeRide(rideToDelete);
      
      if (success) {
        toast({
          title: "Ride deleted",
          description: "Your ride has been deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete ride");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete ride. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setRideToDelete(null);
    }
  };

  // Open the edit ride dialog and populate form
  const openEditDialog = (ride: Ride) => {
    const departureDate = new Date(ride.departureTime);
    
    // Determine time period based on hour
    let timePeriod = "afternoon";
    const hour = departureDate.getHours();
    if (hour < 12) {
      timePeriod = "morning";
    } else if (hour >= 17) {
      timePeriod = "evening";
    }
    
    setEditingRide(ride);
    setEditFormData({
      origin: ride.origin,
      originArea: ride.originArea,
      destination: ride.destination,
      destinationArea: ride.destinationArea,
      departureDate: formatDate(departureDate),
      departureTime: timePeriod,
      availableSeats: ride.seatsTotal.toString(),
      price: ride.price.toString(),
      genderPreference: ride.genderPreference,
      carModel: ride.carModel || '',
      notes: ride.notes || ''
    });
  };

  // Handle form field changes
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select field changes
  const handleSelectChange = (name: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit the edit form
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRide) return;
    
    setIsEditing(true);
    
    try {
      // Parse the selected time period to get actual hours
      const selectedTimePeriod = TIME_PERIODS.find(t => t.value === editFormData.departureTime);
      const departureHour = selectedTimePeriod ? selectedTimePeriod.hour : 12; // Default to noon
      
      // Create date objects
      const departureDate = new Date(editFormData.departureDate);
      departureDate.setHours(departureHour, 0, 0, 0);
      
      // Estimate arrival time (2 hours after departure)
      const arrivalTime = new Date(departureDate);
      arrivalTime.setHours(arrivalTime.getHours() + 2);
      
      // Prepare the updated ride data
      const updatedRideData = {
        origin: editFormData.origin,
        originArea: editFormData.originArea,
        destination: editFormData.destination,
        destinationArea: editFormData.destinationArea,
        departureTime: departureDate.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        seatsTotal: parseInt(editFormData.availableSeats),
        seatsLeft: parseInt(editFormData.availableSeats), // Reset available seats
        price: editFormData.price,
        genderPreference: editFormData.genderPreference,
        carModel: editFormData.carModel || null,
        notes: editFormData.notes || null
      };
      
      const success = await editRide(editingRide.id, updatedRideData);
      
      if (success) {
        toast({
          title: "Ride updated",
          description: "Your ride has been updated successfully.",
        });
        setEditingRide(null);
      } else {
        throw new Error("Failed to update ride");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ride. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Render the rides
  const renderRides = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-10">
          <AiOutlineLoading3Quarters className="animate-spin text-3xl text-orange-500" />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      );
    }
    
    if (myRides.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">You haven't posted any rides yet.</p>
          <Button onClick={navigateToPostRide}>Post Your First Ride</Button>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 gap-6">
        {myRides.map(ride => (
          <Card key={ride.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">
                    {ride.origin} to {ride.destination}
                  </h3>
                  <div className="text-xl font-bold text-orange-500">
                    ${ride.price}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-orange-500 mr-2" />
                      <span>{formatDate(new Date(ride.departureTime))}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FaClock className="text-orange-500 mr-2" />
                      <span>{formatTime(new Date(ride.departureTime))}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <FaUserFriends className="text-orange-500 mr-2" />
                      <span>{ride.seatsLeft} of {ride.seatsTotal} seats available</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-orange-500 mr-2 mt-1" />
                      <div>
                        <div>Pickup: {ride.originArea}</div>
                        <div className="text-sm text-gray-500">{ride.origin}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <FaMapMarkerAlt className="text-orange-500 mr-2 mt-1" />
                      <div>
                        <div>Dropoff: {ride.destinationArea}</div>
                        <div className="text-sm text-gray-500">{ride.destination}</div>
                      </div>
                    </div>
                    
                    {ride.notes && (
                      <div className="mt-2">
                        <div className="font-semibold">Notes:</div>
                        <div>{ride.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 bg-gray-50 p-4 flex justify-end space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => openEditDialog(ride)}
                    >
                      <FaPencilAlt className="mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Edit Ride</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Origin */}
                        <div>
                          <Label htmlFor="origin">From City</Label>
                          <Select 
                            value={editFormData.origin}
                            onValueChange={(value) => handleSelectChange('origin', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {FLORIDA_CITIES.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="originArea">From Area</Label>
                          <Input 
                            id="originArea" 
                            name="originArea" 
                            value={editFormData.originArea} 
                            onChange={handleEditFormChange} 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Destination */}
                        <div>
                          <Label htmlFor="destination">To City</Label>
                          <Select 
                            value={editFormData.destination}
                            onValueChange={(value) => handleSelectChange('destination', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {FLORIDA_CITIES.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="destinationArea">To Area</Label>
                          <Input 
                            id="destinationArea" 
                            name="destinationArea" 
                            value={editFormData.destinationArea} 
                            onChange={handleEditFormChange} 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date and Time */}
                        <div>
                          <Label htmlFor="departureDate">Departure Date</Label>
                          <Input 
                            id="departureDate" 
                            name="departureDate" 
                            type="date" 
                            value={editFormData.departureDate} 
                            onChange={handleEditFormChange} 
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="departureTime">Departure Time</Label>
                          <Select 
                            value={editFormData.departureTime}
                            onValueChange={(value) => handleSelectChange('departureTime', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_PERIODS.map((period) => (
                                <SelectItem key={period.value} value={period.value}>
                                  {period.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Seats and Price */}
                        <div>
                          <Label htmlFor="availableSeats">Available Seats</Label>
                          <Select 
                            value={editFormData.availableSeats}
                            onValueChange={(value) => handleSelectChange('availableSeats', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select seats" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="price">Price per Person ($)</Label>
                          <Input 
                            id="price" 
                            name="price" 
                            value={editFormData.price} 
                            onChange={handleEditFormChange} 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Gender and Car Model */}
                        <div>
                          <Label htmlFor="genderPreference">Gender Preference</Label>
                          <Select 
                            value={editFormData.genderPreference}
                            onValueChange={(value) => handleSelectChange('genderPreference', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select preference" />
                            </SelectTrigger>
                            <SelectContent>
                              {GENDER_PREFERENCES.map((pref) => (
                                <SelectItem key={pref.value} value={pref.value}>
                                  {pref.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="carModel">Car Model</Label>
                          <Input 
                            id="carModel" 
                            name="carModel" 
                            value={editFormData.carModel} 
                            onChange={handleEditFormChange} 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea 
                          id="notes" 
                          name="notes" 
                          value={editFormData.notes} 
                          onChange={handleEditFormChange} 
                        />
                      </div>
                      
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isEditing}>
                          {isEditing ? (
                            <>
                              <AiOutlineLoading3Quarters className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => setRideToDelete(ride.id)}
                    >
                      <FaTrash className="mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <p className="py-4">
                      Are you sure you want to delete this ride? This action cannot be undone.
                    </p>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={handleDeleteRide} disabled={isDeleting}>
                        {isDeleting ? (
                          <>
                            <AiOutlineLoading3Quarters className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Ride'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Rides</h1>
        <Button 
          onClick={navigateToPostRide} 
          className="bg-primary text-white hover:bg-primary/90"
        >
          Post a New Ride
        </Button>
      </div>
      
      {renderRides()}
    </div>
  );
}