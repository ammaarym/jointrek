import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Ride } from "@/lib/types";
import { User, Users, MapPin, Phone, Instagram, Calendar, Clock, Car, ChevronDown, ChevronUp, Info, Edit } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface RideCardProps {
  ride: Ride;
  onBook: (rideId: string) => void;
}

export default function RideCard({ ride, onBook }: RideCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { currentUser } = useAuth();
  
  // Check if the current user is the driver
  const isDriverUser = currentUser && ride.driver.id === currentUser.uid;
  
  // Function to format the time from timestamp
  const formatDateTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setDetailsOpen(true)}
      >
        <div className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Driver info */}
            <div className="md:w-1/4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={ride.driver.photoUrl} alt={ride.driver.name} />
                    <AvatarFallback className="bg-orange-600 text-white">
                      {ride.driver.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h4 className="font-semibold text-black">{ride.driver.name}</h4>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    <span className="text-sm text-neutral-500">
                      {ride.driver.rating} ({ride.driver.totalRides} rides)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Route info */}
            <div className="md:w-2/4">
              <div className="flex items-center mb-3">
                <div className="flex flex-col items-center mr-3">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <div className="w-0.5 h-10 bg-neutral-300"></div>
                  <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                </div>
                <div>
                  <div className="mb-2">
                    <span className="text-neutral-900 font-medium">
                      {ride.origin.city}
                    </span>
                    <span className="text-neutral-500 text-sm ml-1">
                      {ride.origin.area}
                    </span>
                    <div className="text-neutral-500 text-sm">
                      {formatDateTime(ride.departureTime)}
                    </div>
                  </div>
                  <div>
                    <span className="text-neutral-900 font-medium">
                      {ride.destination.city}
                    </span>
                    <span className="text-neutral-500 text-sm ml-1">
                      {ride.destination.area}
                    </span>
                    <div className="text-neutral-500 text-sm">
                      {formatDateTime(ride.arrivalTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price and booking */}
            <div className="md:w-1/4 flex flex-col items-end justify-between">
              {ride.genderPreference === "female" ? (
                <Badge className="px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-800 border-pink-200">
                  <Users className="w-3 h-3 mr-1" />
                  Female riders only
                </Badge>
              ) : ride.genderPreference === "male" ? (
                <Badge className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border-blue-200">
                  <Users className="w-3 h-3 mr-1" />
                  Male riders only
                </Badge>
              ) : (
                <Badge className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border-green-200">
                  <User className="w-3 h-3 mr-1" />
                  {ride.seatsLeft} {ride.seatsLeft === 1 ? "seat" : "seats"} left
                </Badge>
              )}
              <div className="mt-2 md:mt-0">
                <span className="text-2xl font-bold text-neutral-900">
                  ${ride.price}
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <Button 
                    className="block mt-2 bg-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition"
                    onClick={() => onBook(ride.id)}
                  >
                    {isDriverUser ? "Edit Ride" : "Book Ride"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <Button 
              variant="ghost" 
              className="text-neutral-500 text-sm flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                setDetailsOpen(true);
              }}
            >
              <Info className="w-4 h-4 mr-1" />
              View details
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Detailed View Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-orange-600" />
              {ride.origin.city} to {ride.destination.city}
            </DialogTitle>
            <DialogDescription>
              Ride details and driver information
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Driver Info Section */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-orange-600" />
                Driver Information
              </h3>
              
              <div className="flex items-center mb-4">
                <Avatar className="w-16 h-16 mr-4">
                  <AvatarImage src={ride.driver.photoUrl} alt={ride.driver.name} />
                  <AvatarFallback className="bg-orange-600 text-white text-xl">
                    {ride.driver.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h4 className="font-semibold text-lg">{ride.driver.name}</h4>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    <span className="text-neutral-500">
                      {ride.driver.rating} · {ride.driver.totalRides} rides
                    </span>
                  </div>
                </div>
              </div>
              
              {currentUser && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ride.driver.phone && (
                    <div className="flex items-center text-neutral-700">
                      <Phone className="w-4 h-4 mr-2 text-neutral-500" />
                      <span>{ride.driver.phone}</span>
                    </div>
                  )}
                  
                  {ride.driver.instagram && (
                    <div className="flex items-center text-neutral-700">
                      <Instagram className="w-4 h-4 mr-2 text-neutral-500" />
                      <span>@{ride.driver.instagram}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Ride Details Section */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-3 flex items-center">
                <Car className="w-4 h-4 mr-2 text-orange-600" />
                Ride Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-3">
                    <div className="text-neutral-500 text-sm">From</div>
                    <div className="font-medium">{ride.origin.city}, {ride.origin.area}</div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-neutral-500 text-sm">To</div>
                    <div className="font-medium">{ride.destination.city}, {ride.destination.area}</div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-3 flex items-start">
                    <Calendar className="w-4 h-4 mr-2 text-neutral-500 mt-0.5" />
                    <div>
                      <div className="text-neutral-500 text-sm">Departure</div>
                      <div className="font-medium">{formatDateTime(ride.departureTime)}</div>
                    </div>
                  </div>
                  
                  <div className="mb-3 flex items-start">
                    <Clock className="w-4 h-4 mr-2 text-neutral-500 mt-0.5" />
                    <div>
                      <div className="text-neutral-500 text-sm">Arrival (estimated)</div>
                      <div className="font-medium">{formatDateTime(ride.arrivalTime)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <div className="text-neutral-500 text-sm">Price</div>
                  <div className="font-bold text-xl text-orange-600">${ride.price}</div>
                </div>
                
                <div>
                  <div className="text-neutral-500 text-sm">Seats Available</div>
                  <div className="font-medium">{ride.seatsLeft} of {ride.seatsTotal}</div>
                </div>
                
                <div>
                  <div className="text-neutral-500 text-sm">Gender Preference</div>
                  <div className="font-medium">
                    {ride.genderPreference === "female" 
                      ? "Female riders only" 
                      : ride.genderPreference === "male" 
                        ? "Male riders only" 
                        : "No preference"}
                  </div>
                </div>
              </div>
              
              {ride.carModel && (
                <div className="mt-3">
                  <div className="text-neutral-500 text-sm">Car Model</div>
                  <div className="font-medium">{ride.carModel}</div>
                </div>
              )}
              
              {ride.notes && (
                <div className="mt-3">
                  <div className="text-neutral-500 text-sm">Notes</div>
                  <div className="bg-white p-3 rounded border mt-1">{ride.notes}</div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            
            {isDriverUser ? (
              <Button className="bg-orange-600 text-white" onClick={() => {
                setDetailsOpen(false);
                // Implement edit functionality
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Ride
              </Button>
            ) : (
              <Button className="bg-orange-600 text-white" onClick={() => {
                setDetailsOpen(false);
                onBook(ride.id);
              }}>
                Book This Ride
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
