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
import { User, Users, MapPin, Phone, Instagram, Calendar, Clock, Car, ChevronDown, ChevronUp, Info, Edit, Calculator } from "lucide-react";
import { CAR_TYPE_MPG, CITY_DISTANCES } from "@shared/pricing";
// Don't rely on useAuth in a component that may appear in both authenticated and unauthenticated contexts

interface RideCardProps {
  ride: Ride;
  onEdit?: (ride: Ride) => void;
  isDriverUser?: boolean;
}

export default function RideCard({ ride, onEdit, isDriverUser = false }: RideCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  
  // Function to format the time from timestamp
  const formatDateTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Calculate pricing breakdown
  const getPricingBreakdown = () => {
    const carType = ride.carModel?.split(' - ')[0] || ride.carModel || 'sedan';
    const mpg = CAR_TYPE_MPG[carType as keyof typeof CAR_TYPE_MPG] || 32;
    const destinationCity = typeof ride.destination === 'string' ? ride.destination : ride.destination?.city || 'destination';
    const cityData = CITY_DISTANCES[destinationCity as keyof typeof CITY_DISTANCES];
    const gasPrice = 3.20;
    
    if (!cityData) return null;
    
    const baseCost = (cityData.miles / mpg) * gasPrice;
    const withBuffer = baseCost * 1.2;
    const tollCities = ["Miami", "Tampa"];
    const tollFee = tollCities.includes(destinationCity) ? 2.50 : 0;
    const totalCost = withBuffer + tollFee;
    const perPersonCost = totalCost / ride.seatsTotal;
    
    return {
      distance: cityData.miles,
      mpg,
      gasPrice,
      baseCost,
      buffer: baseCost * 0.2,
      tollFee,
      totalCost,
      perPersonCost,
      carType,
      destinationCity
    };
  };

  // Calculate estimated arrival time
  const getEstimatedArrival = () => {
    const destinationCity = typeof ride.destination === 'string' ? ride.destination : ride.destination?.city || 'destination';
    const cityData = CITY_DISTANCES[destinationCity as keyof typeof CITY_DISTANCES];
    if (!cityData) return null;
    
    const departureDate = new Date(ride.departureTime as any);
    const arrivalDate = new Date(departureDate.getTime() + (cityData.hours * 60 * 60 * 1000));
    
    return formatTime(arrivalDate);
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
                      {formatDateTime(ride.departureTime)} at {formatTime(ride.departureTime)}
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
            <div className="md:w-1/4 flex flex-col items-end">
              <div className="flex flex-col items-end w-full mb-2">
                {/* Price with calculator icon */}
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-neutral-900 text-right">
                    ${ride.price}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 p-1 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPricingOpen(true);
                    }}
                  >
                    <Calculator className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
                
                {/* Gender preference badges moved under price */}
                <div className="mt-1">
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
                  ) : null}
                </div>
              </div>
              
              <div onClick={(e) => e.stopPropagation()}>
                <Button 
                  className="block mt-2 bg-orange-600 text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDriverUser && onEdit) {
                      onEdit(ride);
                    } else {
                      setDetailsOpen(true); // Show contact details dialog
                    }
                  }}
                >
                  {isDriverUser ? "Edit Ride" : "View Contact Info"}
                </Button>
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
              
              <div className="mt-4 bg-white p-4 rounded-lg border border-neutral-200">
                <h5 className="font-medium text-neutral-900 mb-3">Contact Information</h5>
                <div className="grid grid-cols-1 gap-3">
                  {ride.driver.phone && (
                    <div className="flex items-center text-neutral-700">
                      <Phone className="w-5 h-5 mr-3 text-orange-600" />
                      <span className="font-medium">{ride.driver.phone}</span>
                    </div>
                  )}
                  
                  {ride.driver.instagram && (
                    <div className="flex items-center text-neutral-700">
                      <Instagram className="w-5 h-5 mr-3 text-orange-600" />
                      <span className="font-medium">@{ride.driver.instagram}</span>
                    </div>
                  )}
                  
                  {ride.driver.snapchat && (
                    <div className="flex items-center text-neutral-700">
                      <svg 
                        className="w-5 h-5 mr-3 text-orange-600" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2ZM18.5 12.75C18.5 12.75 16.5 12.5 16 12.5C15.5 12.5 15.25 12.75 15 13C14.75 13.25 14 14.1383 13.5 14C13 13.8617 11.8 13 10.5 11.5C9.2 10 8.75 9 8.75 9C8.75 9 8.5 8.75 8 9.5C7.5 10.25 7 10.5 6.5 10.5C6 10.5 5 10.5 5 10.5C5 8.25 6.5 6.25 8.75 6.25C11 6.25 12.25 7.75 13.5 7.75C14.75 7.75 16.25 6.25 18.5 6.25C18.5 7.75 18.5 10.625 18.5 12.75Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="font-medium">{ride.driver.snapchat}</span>
                    </div>
                  )}
                </div>
              </div>
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
            
            {isDriverUser && onEdit ? (
              <Button className="bg-orange-600 text-white" onClick={() => {
                setDetailsOpen(false);
                onEdit(ride);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Ride
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Breakdown Popup */}
      <Dialog open={pricingOpen} onOpenChange={setPricingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-orange-600" />
              How is ${ride.price} calculated?
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Trip Breakdown:</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Distance to {getPricingBreakdown()?.destinationCity || 'destination'}:</span>
                  <span className="font-medium">{getPricingBreakdown()?.distance || 350} miles</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Car type ({ride.carModel || 'sedan'}):</span>
                  <span className="font-medium">
                    {ride.carModel?.includes('minivan') ? '28' : 
                     ride.carModel?.includes('suv') ? '25' : 
                     ride.carModel?.includes('truck') ? '22' : '32'} MPG
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Gas price (Gainesville):</span>
                  <span className="font-medium">$3.20/gallon</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Base gas cost:</span>
                  <span className="font-medium">
                    ${((350 / (ride.carModel?.includes('minivan') ? 28 : 
                              ride.carModel?.includes('suv') ? 25 : 
                              ride.carModel?.includes('truck') ? 22 : 32)) * 3.20).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Safety buffer (20%):</span>
                  <span className="font-medium">
                    +${(((350 / (ride.carModel?.includes('minivan') ? 28 : 
                                ride.carModel?.includes('suv') ? 25 : 
                                ride.carModel?.includes('truck') ? 22 : 32)) * 3.20) * 0.2).toFixed(2)}
                  </span>
                </div>
                
                {((typeof ride.destination === 'string' ? ride.destination : ride.destination?.city) === 'Miami' || 
                  (typeof ride.destination === 'string' ? ride.destination : ride.destination?.city) === 'Tampa') && (
                  <div className="flex justify-between">
                    <span>Toll fees:</span>
                    <span className="font-medium">+$2.50</span>
                  </div>
                )}
                
                <hr className="my-2" />
                
                <div className="flex justify-between font-medium">
                  <span>Total trip cost:</span>
                  <span>
                    ${Math.round(
                      ((350 / (ride.carModel?.includes('minivan') ? 28 : 
                              ride.carModel?.includes('suv') ? 25 : 
                              ride.carModel?.includes('truck') ? 22 : 32)) * 3.20) * 1.2 + 
                      (((typeof ride.destination === 'string' ? ride.destination : ride.destination?.city) === 'Miami' || 
                        (typeof ride.destination === 'string' ? ride.destination : ride.destination?.city) === 'Tampa') ? 2.50 : 0)
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg font-bold text-orange-600">
                  <span>Per person ({ride.seatsTotal} seats):</span>
                  <span>${ride.price}</span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              Price calculated automatically based on distance, car efficiency, gas prices, and passenger count
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setPricingOpen(false)}>
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
