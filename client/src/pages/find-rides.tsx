import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { MapPin, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RideCard from "@/components/ride-card";
import { Ride } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

export default function FindRides() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("Gainesville");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [genderPreference, setGenderPreference] = useState("no-preference");
  const [sortBy, setSortBy] = useState("departureTime");

  // Function to load rides from Firestore
  const loadRides = async () => {
    setLoading(true);
    try {
      let ridesQuery = query(
        collection(db, "rides"),
        where("origin.city", "==", origin),
        orderBy("departureTime")
      );

      // Add destination filter if provided
      if (destination) {
        ridesQuery = query(
          collection(db, "rides"),
          where("origin.city", "==", origin),
          where("destination.city", "==", destination),
          orderBy("departureTime")
        );
      }

      const querySnapshot = await getDocs(ridesQuery);
      const ridesList: Ride[] = [];

      querySnapshot.forEach((doc) => {
        ridesList.push({ id: doc.id, ...doc.data() } as Ride);
      });

      // Filter by date if provided
      if (date) {
        const selectedDate = new Date(date).setHours(0, 0, 0, 0);
        setRides(
          ridesList.filter((ride) => {
            const rideDate = new Date(ride.departureTime).setHours(0, 0, 0, 0);
            return rideDate === selectedDate;
          })
        );
      } else {
        setRides(ridesList);
      }
    } catch (error) {
      console.error("Error loading rides:", error);
      toast({
        title: "Error",
        description: "Could not load rides. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRides();
  }, []);

  // Handle search button click
  const handleSearch = () => {
    loadRides();
  };

  // Function to handle booking a ride
  const handleBookRide = (rideId: string) => {
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "You need to log in to book a ride",
        variant: "destructive",
      });
      return;
    }

    // This would be implemented with Firestore in a real application
    toast({
      title: "Ride booked!",
      description: "Your ride has been booked successfully.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="w-full md:w-80 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 dark:text-white">Find Your Ride</h3>

          <div className="space-y-6">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                From
              </label>
              <div className="relative">
                <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Gainesville"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                To
              </label>
              <div className="relative">
                <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Any destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                />
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-blue dark:focus:ring-primary-orange focus:border-transparent"
                />
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Passengers
              </label>
              <Select value={passengers} onValueChange={setPassengers}>
                <SelectTrigger className="w-full bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600">
                  <SelectValue placeholder="Select passengers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="1">1 passenger</SelectItem>
                    <SelectItem value="2">2 passengers</SelectItem>
                    <SelectItem value="3">3 passengers</SelectItem>
                    <SelectItem value="4">4+ passengers</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Gender Preference */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Gender Preference
              </label>
              <Select value={genderPreference} onValueChange={setGenderPreference}>
                <SelectTrigger className="w-full bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600">
                  <SelectValue placeholder="Select gender preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="no-preference">No preference</SelectItem>
                    <SelectItem value="female">Female riders only</SelectItem>
                    <SelectItem value="male">Male riders only</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-primary-orange text-white py-3 rounded-md font-medium hover:bg-opacity-90 transition"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Search Rides
            </Button>
          </div>
        </div>

        {/* Ride Results */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold dark:text-white">
              Available Rides
            </h2>
            <div className="flex items-center">
              <span className="text-neutral-500 dark:text-neutral-400 mr-3">
                Sort by:
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="departureTime">Departure Time</SelectItem>
                    <SelectItem value="priceLow">Price (Low to High)</SelectItem>
                    <SelectItem value="priceHigh">Price (High to Low)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-5 animate-pulse"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-1/4 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 mr-3"></div>
                      <div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-2"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
                      </div>
                    </div>
                    
                    <div className="md:w-2/4">
                      <div className="flex">
                        <div className="mr-3 flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                          <div className="w-0.5 h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                          <div className="w-3 h-3 rounded-full bg-neutral-200 dark:bg-neutral-700"></div>
                        </div>
                        <div className="flex-1">
                          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
                          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-1/4 flex flex-col items-end justify-between">
                      <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                      <div>
                        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-12 mb-2"></div>
                        <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : rides.length > 0 ? (
            <div className="space-y-4">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} onBook={handleBookRide} />
              ))}
              
              {rides.length > 5 && (
                <div className="text-center mt-8">
                  <Button
                    variant="link"
                    className="text-primary-blue dark:text-primary-orange hover:underline font-medium"
                  >
                    Load More Rides
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-8 max-w-md mx-auto">
                <Search className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2 dark:text-white">No rides found</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Try adjusting your search filters or create your own ride.
                </p>
                <Button
                  asChild
                  className="bg-primary-orange text-white"
                >
                  <Link href="/post-ride">Post a Ride</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
