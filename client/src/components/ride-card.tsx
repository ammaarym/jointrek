import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ride } from "@/lib/types";
import { User, Users, Circle, MapPin } from "lucide-react";

interface RideCardProps {
  ride: Ride;
  onBook: (rideId: string) => void;
}

export default function RideCard({ ride, onBook }: RideCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Driver info */}
          <div className="md:w-1/4">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={ride.driver.photoUrl} alt={ride.driver.name} />
                  <AvatarFallback className="bg-primary-blue text-white">
                    {ride.driver.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h4 className="font-semibold dark:text-white">{ride.driver.name}</h4>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
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
                <div className="w-3 h-3 rounded-full bg-primary-blue"></div>
                <div className="w-0.5 h-10 bg-neutral-300 dark:bg-neutral-600"></div>
                <div className="w-3 h-3 rounded-full bg-primary-orange"></div>
              </div>
              <div>
                <div className="mb-2">
                  <span className="text-neutral-900 dark:text-white font-medium">
                    {ride.origin.city}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm ml-1">
                    {ride.origin.area}
                  </span>
                  <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {new Date(ride.departureTime).toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-900 dark:text-white font-medium">
                    {ride.destination.city}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 text-sm ml-1">
                    {ride.destination.area}
                  </span>
                  <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {new Date(ride.arrivalTime).toLocaleDateString('en-US', { 
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price and booking */}
          <div className="md:w-1/4 flex flex-col items-end justify-between">
            {ride.genderPreference === "female" ? (
              <Badge variant="pink" className="px-3 py-1 rounded-full text-sm font-medium">
                <Users className="w-3 h-3 mr-1" />
                Female riders only
              </Badge>
            ) : ride.genderPreference === "male" ? (
              <Badge variant="blue" className="px-3 py-1 rounded-full text-sm font-medium">
                <Users className="w-3 h-3 mr-1" />
                Male riders only
              </Badge>
            ) : (
              <Badge variant="blue" className="px-3 py-1 rounded-full text-sm font-medium">
                <User className="w-3 h-3 mr-1" />
                {ride.seatsLeft} {ride.seatsLeft === 1 ? "seat" : "seats"} left
              </Badge>
            )}
            <div className="mt-2 md:mt-0">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                ${ride.price}
              </span>
              <Button 
                className="block mt-2 bg-primary-blue text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition"
                onClick={() => onBook(ride.id)}
              >
                Book Ride
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
