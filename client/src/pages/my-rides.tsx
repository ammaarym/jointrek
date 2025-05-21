import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Ride } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { formatDate, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CarTaxiFront, MapPin, Calendar, Clock, Users, Pencil, Trash, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function MyRides() {
  const { currentUser } = useAuth();
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRide, setEditingRide] = useState<Ride | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    seatsLeft: "",
    price: "",
    notes: ""
  });

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchMyRides = async () => {
      setLoading(true);
      try {
        const ridesQuery = query(
          collection(db, "rides"),
          where("driver.id", "==", currentUser.uid)
        );
        
        const ridesSnapshot = await getDocs(ridesQuery);
        const ridesData = ridesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Ride));
        
        setMyRides(ridesData);
        console.log("Fetched rides:", ridesData);
      } catch (error) {
        console.error("Error fetching rides:", error);
        toast({
          title: "Error fetching rides",
          description: "An error occurred while loading your rides. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyRides();
  }, [currentUser]);

  const handleEditClick = (ride: Ride) => {
    setEditingRide(ride);
    setEditFormData({
      seatsLeft: String(ride.seatsLeft),
      price: String(ride.price),
      notes: ride.notes || ""
    });
    setDialogOpen(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };
  
  const handleSeatsChange = (value: string) => {
    setEditFormData({
      ...editFormData,
      seatsLeft: value
    });
  };

  const handleUpdateRide = async () => {
    if (!editingRide) return;

    try {
      const rideRef = doc(db, "rides", editingRide.id);
      
      // Convert form values to appropriate types
      const seatsLeft = parseInt(editFormData.seatsLeft);
      const price = parseFloat(editFormData.price);
      
      // Validate form data
      if (isNaN(seatsLeft) || seatsLeft < 0) {
        toast({
          title: "Invalid number of seats",
          description: "Please enter a valid number of seats.",
          variant: "destructive"
        });
        return;
      }
      
      if (isNaN(price) || price < 0) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price.",
          variant: "destructive"
        });
        return;
      }
      
      // Update document in Firestore
      await updateDoc(rideRef, {
        seatsLeft,
        price,
        notes: editFormData.notes
      });
      
      // Update local state
      setMyRides(prevRides => 
        prevRides.map(ride => 
          ride.id === editingRide.id 
            ? { 
                ...ride, 
                seatsLeft, 
                price, 
                notes: editFormData.notes 
              } 
            : ride
        )
      );
      
      toast({
        title: "Ride updated",
        description: "Your ride has been successfully updated."
      });
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Error updating ride:", error);
      toast({
        title: "Error updating ride",
        description: "An error occurred while updating your ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Rides</h1>
      
      {myRides.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <CarTaxiFront className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">No rides found</h2>
          <p className="mt-2 text-gray-500">You haven't posted any rides yet.</p>
          <Button 
            className="mt-6 bg-orange-600 hover:bg-orange-700"
            onClick={() => window.location.href = '/post-ride'}
          >
            Post a Ride
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {myRides.map(ride => (
            <Card key={ride.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    {ride.origin.city} to {ride.destination.city}
                  </CardTitle>
                  <span className="text-lg font-bold text-orange-600">${ride.price}</span>
                </div>
                <CardDescription>
                  <div className="flex items-center text-gray-500 mt-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(ride.departureTime.toDate())}</span>
                    <Clock className="h-4 w-4 ml-3 mr-1" />
                    <span>{formatTime(ride.departureTime.toDate().toTimeString())}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-5">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Pickup: {ride.origin.area}</p>
                      <p className="text-sm text-gray-500">{ride.origin.city}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Dropoff: {ride.destination.area}</p>
                      <p className="text-sm text-gray-500">{ride.destination.city}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <Users className="h-5 w-5 text-orange-600 mr-3" />
                    <span>{ride.seatsLeft} of {ride.seatsTotal} seats available</span>
                  </div>
                  
                  {ride.notes && (
                    <div className="flex items-start mt-4">
                      <Info className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Notes:</p>
                        <p className="text-sm text-gray-500">{ride.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => handleEditClick(ride)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ride</DialogTitle>
            <DialogDescription>
              Make changes to your ride posting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seatsLeft">Available Seats</Label>
              <Select 
                value={editFormData.seatsLeft} 
                onValueChange={handleSeatsChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select available seats" />
                </SelectTrigger>
                <SelectContent>
                  {editingRide && Array.from({length: editingRide.seatsTotal + 1}, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={editFormData.price}
                onChange={handleEditFormChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={editFormData.notes}
                onChange={handleEditFormChange}
                placeholder="Add any details about your ride"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700" 
              onClick={handleUpdateRide}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}