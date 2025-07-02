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
  DialogClose,
} from "@/components/ui/dialog";
import { Ride } from "@/lib/types";
import {
  User,
  Users,
  MapPin,
  Phone,
  Instagram,
  Calendar,
  Clock,
  Car,
  ChevronDown,
  ChevronUp,
  Info,
  Edit,
  Mail,
  Star,
} from "lucide-react";
import UserProfileModal from "@/components/user-profile-modal";
// Don't rely on useAuth in a component that may appear in both authenticated and unauthenticated contexts

interface RideCardProps {
  ride: Ride;
  onEdit?: (ride: Ride) => void;
  isDriverUser?: boolean;
  onMarkComplete?: (rideId: number) => void;
  showCompleteButton?: boolean;
  onRequestRide?: (rideId: number) => void;
  showRequestButton?: boolean;
  isRequested?: boolean;
  rideTypeFilter?: string;
  isApproved?: boolean; // New prop to show if request is approved
  isRejected?: boolean; // New prop to show if request is rejected
  isCancelled?: boolean; // New prop to show if request is cancelled
  existingDriverOffer?: any; // Driver offer data if exists
}

export default function RideCard({
  ride,
  onEdit,
  isDriverUser = false,
  onMarkComplete,
  showCompleteButton = false,
  onRequestRide,
  showRequestButton = false,
  isRequested = false,
  rideTypeFilter = 'driver',
  isApproved = false,
  isRejected = false,
  isCancelled = false,
  existingDriverOffer = null,
}: RideCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Function to format the time from timestamp
  const formatDateTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Use the provided arrival time from the ride data
  const getEstimatedArrival = () => {
    return formatTime(ride.arrivalTime);
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
                <Avatar className="w-12 h-12 mr-3 ring-2 ring-gray-200">
                  <AvatarImage
                    src={ride.driver.photoUrl}
                    alt={ride.driver.name}
                    className="object-cover object-center w-full h-full"
                  />
                  <AvatarFallback className="bg-primary text-white">
                    {ride.driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-black">
                    {ride.driver.name}
                  </h4>
                  <div className="flex items-center">
                    {/* <svg
                      className="w-4 h-4 text-yellow-400 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg> */}
                    <span className="text-sm text-neutral-500">
                      {ride.driver.totalRides} rides
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Interest Tags */}
              {(ride.driver as any).interestTags && (ride.driver as any).interestTags.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {(ride.driver as any).interestTags.map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Route info */}
            <div className="md:w-2/4">
              <div className="flex mb-3">
                <div className="flex flex-col mr-3 relative h-20">
                  <div className="w-3 h-3 rounded-full bg-black self-center"></div>
                  <div className="w-0.5 flex-1 bg-neutral-300 self-center"></div>
                  <div className="w-3 h-3 rounded-full bg-primary self-center"></div>
                </div>
                <div className="flex-1 flex flex-col justify-between h-20">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-neutral-900 font-medium">
                        {ride.origin.city}
                      </span>
                      <span className="text-neutral-500 text-sm ml-1">
                        {ride.origin.area}
                      </span>
                      <div className="text-neutral-500 text-sm">
                        {formatDateTime(ride.departureTime)}
                      </div>
                      <div className="text-neutral-500 text-xs">
                        {formatTime(ride.departureTime)}
                      </div>
                    </div>
                    
                    {/* Gender preference badge aligned with upper city */}
                    <div className="ml-4">
                      {ride.genderPreference === "female_only" ? (
                        <div className="flex items-center px-3 py-1 rounded-full bg-pink-50 border border-pink-200">
                          <User className="w-3 h-3 mr-1 text-pink-600" />
                          <span className="text-xs font-medium text-pink-700">Female only</span>
                        </div>
                      ) : ride.genderPreference === "male_only" ? (
                        <div className="flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
                          <User className="w-3 h-3 mr-1 text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">Male only</span>
                        </div>
                      ) : null}
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
                    <div className="text-neutral-500 text-xs">
                      {getEstimatedArrival() || formatTime(ride.arrivalTime)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price and booking */}
            <div className="md:w-1/4 flex flex-col items-end">
              <div className="flex flex-col items-end w-full mb-2">
                {/* Price moved above available text */}
                <div className="text-2xl font-bold text-neutral-900 text-right mb-1">
                  ${ride.price}
                </div>

                {/* Seats available information */}
                <div className="text-sm text-gray-600">
                  {ride.seatsLeft} of {ride.seatsTotal} seats available
                </div>

                {/* Baggage Information - compact display */}
                {((ride.baggageCheckIn || 0) > 0 || (ride.baggagePersonal || 0) > 0) && (
                  <div className="text-xs text-neutral-500 text-right mt-2">
                    <div className="flex flex-col items-end space-y-1">
                      <span className="mb-1">{ride.rideType === 'driver' ? 'Baggage space:' : 'Baggage needed:'}</span>
                      <div className="flex items-center space-x-2">
                        {(ride.baggageCheckIn || 0) > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                            {ride.baggageCheckIn} check-in
                          </span>
                        )}
                        {(ride.baggagePersonal || 0) > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                            {ride.baggagePersonal} personal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {isDriverUser && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    className="block mt-2 bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEdit) {
                        onEdit(ride);
                      }
                    }}
                  >
                    Edit Ride
                  </Button>
                </div>
              )}
              
              {showRequestButton && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    className={`block mt-2 px-4 py-2 rounded-md font-medium transition ${
                      isApproved
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : isRejected
                        ? "bg-red-500 text-white cursor-not-allowed"
                        : isCancelled
                        ? "bg-gray-500 text-white cursor-not-allowed"
                        : existingDriverOffer && rideTypeFilter === 'passenger'
                        ? existingDriverOffer.status === 'pending'
                          ? "bg-orange-500 text-white cursor-not-allowed"
                          : existingDriverOffer.status === 'accepted'
                          ? "bg-green-600 text-white cursor-not-allowed"
                          : existingDriverOffer.status === 'rejected'
                          ? "bg-red-500 text-white cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary/90"
                        : isRequested 
                        ? "bg-orange-500 text-white hover:bg-orange-600" 
                        : "bg-primary text-white hover:bg-primary/90"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRequestRide && !isRequested && !isApproved && !isRejected && !isCancelled && 
                          !(existingDriverOffer && rideTypeFilter === 'passenger')) {
                        onRequestRide(Number(ride.id));
                      }
                    }}
                    disabled={isRequested || isApproved || isRejected || isCancelled || 
                             (existingDriverOffer && rideTypeFilter === 'passenger')}
                  >
                    {isApproved
                      ? "Ride Approved"
                      : isRejected
                      ? "Request Denied"
                      : isCancelled
                      ? "CANCELLED"
                      : existingDriverOffer && rideTypeFilter === 'passenger'
                      ? existingDriverOffer.status === 'pending'
                        ? `Offer Sent ($${existingDriverOffer.price})`
                        : existingDriverOffer.status === 'accepted'
                        ? `Offer Accepted ($${existingDriverOffer.price})`
                        : existingDriverOffer.status === 'rejected'
                        ? `Offer Rejected ($${existingDriverOffer.price})`
                        : "Offer a Trek"
                      : isRequested 
                      ? "Request Sent" 
                      : rideTypeFilter === 'passenger' 
                        ? "Offer a Trek" 
                        : "Request a Trek"
                    }
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Detailed View Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-[900px] w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" />
              {ride.origin.city} to {ride.destination.city}
            </DialogTitle>
            <DialogDescription>
              Ride details and driver information
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
            {/* Driver Info Section */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-3 flex items-center">
                <User className="w-4 h-4 mr-2 text-primary" />
                Driver Information
              </h3>

              <div className="flex items-center mb-4">
                <Avatar className="w-16 h-16 mr-4">
                  <AvatarImage
                    src={ride.driver.photoUrl}
                    alt={ride.driver.name}
                  />
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {ride.driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h4 className="font-semibold text-lg">{ride.driver.name}</h4>
                  <div className="flex items-center">
                    {/* <svg
                      className="w-4 h-4 text-yellow-400 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg> */}
                    <span className="text-neutral-500">
                      {ride.driver.totalRides} rides
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-white p-4 rounded-lg border border-neutral-200">
                <h5 className="font-medium text-neutral-900 mb-3">
                  Contact Information
                </h5>
                
                {/* Only show contact info if user is driver or request is approved */}
                {(isDriverUser || isApproved) ? (
                  <div className="grid grid-cols-1 gap-3">
                    {/* Show phone first if available */}
                    {(ride.driver.contactInfo?.phone || ride.driver.phone) && (
                      <div className="flex items-center text-neutral-700">
                        <Phone className="w-5 h-5 mr-3 text-primary" />
                        <span className="font-medium">
                          {ride.driver.contactInfo?.phone || ride.driver.phone}
                        </span>
                      </div>
                    )}

                    {/* Show email if no phone available */}
                    {!(ride.driver.contactInfo?.phone || ride.driver.phone) &&
                      (ride.driver.contactInfo?.email || ride.driver.email) && (
                        <div className="flex items-center text-neutral-700">
                          <Mail className="w-5 h-5 mr-3 text-primary" />
                          <span className="font-medium">
                            {ride.driver.contactInfo?.email || ride.driver.email}
                          </span>
                        </div>
                      )}

                    {/* Show Instagram */}
                    {(ride.driver.contactInfo?.instagram ||
                      ride.driver.instagram) && (
                      <div className="flex items-center text-neutral-700">
                        <Instagram className="w-5 h-5 mr-3 text-primary" />
                        <span className="font-medium">
                          @
                          {ride.driver.contactInfo?.instagram ||
                            ride.driver.instagram}
                        </span>
                      </div>
                    )}

                  {/* Show Snapchat */}
                  {(ride.driver.contactInfo?.snapchat ||
                    ride.driver.snapchat) && (
                    <div className="flex items-center text-neutral-700">
                      <svg
                        className="w-5 h-5 mr-3 text-primary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M12.166 3C7.482 3.071 4.37 4.133 4.37 11.5c0 1.433.201 2.467.37 3.25.169.783.37 1.216.37 2 0 .5-.268.834-.669 1.166-.401.333-.835.667-.835 1.5 0 .667.5 1.084 1.5 1.084 1.146 0 1.917-.5 3.167-.5s2.083.5 3.333.5 2.083-.5 3.333-.5 2.021.5 3.167.5c1 0 1.5-.417 1.5-1.084 0-.833-.434-1.167-.835-1.5-.401-.332-.669-.666-.669-1.166 0-.784.201-1.217.37-2s.37-1.817.37-3.25c0-7.367-3.112-8.429-7.796-8.5z" />
                      </svg>
                      <span className="font-medium">
                        {ride.driver.contactInfo?.snapchat ||
                          ride.driver.snapchat}
                      </span>
                    </div>
                  )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div className="flex items-center justify-center mb-2">
                      <Info className="w-5 h-5 mr-2" />
                      <span className="font-medium">Contact info hidden</span>
                    </div>
                    <p className="text-sm">
                      Request this trek to see driver contact information
                    </p>
                  </div>
                )}
              </div>
              
              {/* Interest Tags Section */}
              {(ride.driver as any).interestTags && (ride.driver as any).interestTags.length > 0 && (
                <div className="mt-4 bg-white p-4 rounded-lg border border-neutral-200">
                  <h5 className="font-medium text-neutral-900 mb-3">
                    Driver Interests
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {(ride.driver as any).interestTags.map((tag: string, index: number) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ride Details Section */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold mb-3 flex items-center">
                <Car className="w-4 h-4 mr-2 text-primary" />
                Ride Details
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="mb-3">
                    <div className="text-neutral-500 text-sm">From</div>
                    <div className="font-medium">
                      {ride.origin.city}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-neutral-500 text-sm">To</div>
                    <div className="font-medium">
                      {ride.destination.city}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-start">
                    <Calendar className="w-4 h-4 mr-2 text-neutral-500 mt-0.5" />
                    <div>
                      <div className="text-neutral-500 text-sm">Departure</div>
                      <div className="font-medium">
                        {formatDateTime(ride.departureTime)}
                      </div>
                      <div className="text-neutral-500 text-xs">
                        {formatTime(ride.departureTime)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 flex items-start">
                    <Clock className="w-4 h-4 mr-2 text-neutral-500 mt-0.5" />
                    <div>
                      <div className="text-neutral-500 text-sm">
                        Arrival (estimated)
                      </div>
                      <div className="font-medium">
                        {formatDateTime(ride.arrivalTime)}
                      </div>
                      <div className="text-neutral-500 text-xs">
                        {getEstimatedArrival() || formatTime(ride.arrivalTime)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 ${ride.rideType === "driver" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-4 mt-2`}
              >
                <div>
                  <div className="text-neutral-500 text-sm">Price</div>
                  <div className="font-bold text-xl text-primary">
                    ${ride.price}
                  </div>
                </div>

                {ride.rideType === "driver" && (
                  <div>
                    <div className="text-neutral-500 text-sm">
                      Seats Available
                    </div>
                    <div className="font-medium">
                      {ride.seatsLeft} seats available
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-neutral-500 text-sm">
                    Gender Preference
                  </div>
                  <div className="font-medium">
                    {ride.genderPreference === "female_only"
                      ? "Female riders only"
                      : ride.genderPreference === "male_only"
                        ? "Male riders only"
                        : "No preference"}
                  </div>
                </div>
              </div>

              {((ride.carMake || ride.carModel) && ride.rideType === "driver") && (
                <div className="mt-3">
                  <div className="text-neutral-500 text-sm">Vehicle</div>
                  <div className="font-medium">
                    {ride.carYear && `${ride.carYear} `}
                    {ride.carMake && `${ride.carMake} `}
                    {ride.carModel && ride.carModel}
                  </div>
                </div>
              )}

              {/* Baggage Information */}
              {((ride.baggageCheckIn || 0) > 0 || (ride.baggagePersonal || 0) > 0) && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-neutral-500 text-sm mb-2">
                    {ride.rideType === 'driver' ? 'Available Baggage Space' : 'Baggage Requirements'}
                  </div>
                  <div className="space-y-1">
                    {(ride.baggageCheckIn || 0) > 0 && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-blue-700">
                          {ride.baggageCheckIn} check-in bag{(ride.baggageCheckIn || 0) > 1 ? 's' : ''}
                          {ride.rideType === 'driver' ? ' (can accommodate)' : ''}
                        </span>
                        <span className="text-neutral-500 ml-2">(large luggage)</span>
                      </div>
                    )}
                    {(ride.baggagePersonal || 0) > 0 && (
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-blue-700">
                          {ride.baggagePersonal} personal bag{(ride.baggagePersonal || 0) > 1 ? 's' : ''}
                          {ride.rideType === 'driver' ? ' (can accommodate)' : ''}
                        </span>
                        <span className="text-neutral-500 ml-2">(backpacks, smaller bags)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>

            {isDriverUser && onEdit ? (
              <Button
                className="bg-primary text-white"
                onClick={() => {
                  setDetailsOpen(false);
                  onEdit(ride);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Ride
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </>
  );
}
