import React, { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
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
  // Mock data function to generate rides
  const getMockRides = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    // Create 10 mock rides with realistic data
    const mockRides: Ride[] = [
      {
        id: "ride1",
        driver: {
          id: "driver1",
          name: "Alex Johnson",
          photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
          rating: 4.8,
          totalRides: 42,
          phone: "352-555-1234",
          instagram: "alex_j_driver"
        },
        origin: {
          city: "Gainesville",
          area: "UF Campus"
        },
        destination: {
          city: "Orlando",
          area: "UCF Area"
        },
        departureTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0)
        },
        arrivalTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30)
        },
        seatsTotal: 4,
        seatsLeft: 2,
        price: 25,
        genderPreference: "no-preference",
        carModel: "Honda Civic 2022",
        notes: "I'll be leaving from Reitz Union. No smoking please. Small bags only.",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
        },
        rideType: "driver"
      },
      {
        id: "ride2",
        driver: {
          id: "driver2",
          name: "Sophia Williams",
          photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
          rating: 4.9,
          totalRides: 78,
          phone: "352-555-2345",
          instagram: "sophia_drives",
          snapchat: "sophia_uf"
        },
        origin: {
          city: "Gainesville",
          area: "Butler Plaza"
        },
        destination: {
          city: "Miami",
          area: "South Beach"
        },
        departureTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0)
        },
        arrivalTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30)
        },
        seatsTotal: 3,
        seatsLeft: 1,
        price: 45,
        genderPreference: "female",
        carModel: "Toyota Camry 2023",
        notes: "AC will be on. Stops for lunch, my treat!",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        },
        rideType: "driver"
      },
      {
        id: "ride3",
        driver: {
          id: "driver3",
          name: "Michael Chen",
          photoUrl: "https://randomuser.me/api/portraits/men/67.jpg",
          rating: 4.7,
          totalRides: 24,
          phone: "352-555-3456"
        },
        origin: {
          city: "Gainesville",
          area: "The Swamp"
        },
        destination: {
          city: "Tampa",
          area: "Downtown"
        },
        departureTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30)
        },
        arrivalTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0)
        },
        seatsTotal: 5,
        seatsLeft: 3,
        price: 20,
        genderPreference: "no-preference",
        carModel: "Tesla Model 3",
        notes: "Electric car, smooth ride. USB chargers available.",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3)
        },
        rideType: "driver"
      },
      {
        id: "ride4",
        driver: {
          id: "driver4",
          name: "Emma Rodriguez",
          photoUrl: "https://randomuser.me/api/portraits/women/23.jpg",
          rating: 4.6,
          totalRides: 18,
          instagram: "emma_r23"
        },
        origin: {
          city: "Gainesville",
          area: "Oaks Mall"
        },
        destination: {
          city: "Jacksonville",
          area: "Riverside"
        },
        departureTime: {
          toDate: () => tomorrow
        },
        arrivalTime: {
          toDate: () => new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000)
        },
        seatsTotal: 4,
        seatsLeft: 4,
        price: 15,
        genderPreference: "no-preference",
        notes: "New driver, but experienced! Just moved from California.",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        },
        rideType: "driver"
      },
      {
        id: "ride5",
        driver: {
          id: "driver5",
          name: "James Smith",
          photoUrl: "https://randomuser.me/api/portraits/men/42.jpg",
          rating: 5.0,
          totalRides: 112,
          phone: "352-555-7890",
          instagram: "jsmith_rides"
        },
        origin: {
          city: "Gainesville",
          area: "UF Health"
        },
        destination: {
          city: "Tallahassee",
          area: "FSU Campus"
        },
        departureTime: {
          toDate: () => tomorrow
        },
        arrivalTime: {
          toDate: () => new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000)
        },
        seatsTotal: 3,
        seatsLeft: 2,
        price: 30,
        genderPreference: "male",
        carModel: "Jeep Wrangler",
        notes: "Going to visit friends at FSU. I drive safely but like my music loud!",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2)
        },
        rideType: "driver"
      },
      {
        id: "ride6",
        driver: {
          id: "driver6",
          name: "Olivia Garcia",
          photoUrl: "https://randomuser.me/api/portraits/women/57.jpg",
          rating: 4.9,
          totalRides: 34,
          phone: "352-555-4321",
          instagram: "olivia_drives_uf"
        },
        origin: {
          city: "Gainesville",
          area: "Sorority Row"
        },
        destination: {
          city: "Atlanta",
          area: "Midtown"
        },
        departureTime: {
          toDate: () => new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        },
        arrivalTime: {
          toDate: () => new Date(tomorrow.getTime() + 28 * 60 * 60 * 1000)
        },
        seatsTotal: 4,
        seatsLeft: 3,
        price: 40,
        genderPreference: "no-preference",
        carModel: "Subaru Outback",
        notes: "Weekend trip to Atlanta! Good vibes only, please.",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        },
        rideType: "driver"
      },
      {
        id: "ride7",
        driver: {
          id: "driver7",
          name: "David Wilson",
          photoUrl: "https://randomuser.me/api/portraits/men/22.jpg",
          rating: 4.8,
          totalRides: 56,
          phone: "352-555-9876",
          instagram: "david_wilson_uf"
        },
        origin: {
          city: "Gainesville",
          area: "Innovation Square"
        },
        destination: {
          city: "St. Augustine",
          area: "Historic District"
        },
        departureTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0)
        },
        arrivalTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0)
        },
        seatsTotal: 3,
        seatsLeft: 2,
        price: 22,
        genderPreference: "no-preference",
        carModel: "Kia Soul",
        notes: "Day trip to St. Augustine! Will stop for coffee along the way.",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        },
        rideType: "driver"
      },
      {
        id: "ride8",
        driver: {
          id: "driver8",
          name: "Jessica Taylor",
          photoUrl: "https://randomuser.me/api/portraits/women/29.jpg",
          rating: 4.9,
          totalRides: 37,
          phone: "352-555-2468",
          snapchat: "jess_taylor_uf"
        },
        origin: {
          city: "Orlando",
          area: "Disney Springs"
        },
        destination: {
          city: "Gainesville",
          area: "UF Campus"
        },
        departureTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30)
        },
        arrivalTime: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 45)
        },
        seatsTotal: 4,
        seatsLeft: 1,
        price: 27,
        genderPreference: "female",
        carModel: "Mazda CX-5",
        notes: "Heading back to UF after a day at Disney. Good music and good vibes!",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        },
        rideType: "driver"
      },
      {
        id: "ride9",
        driver: {
          id: "driver9",
          name: "Ryan Clark",
          photoUrl: "https://randomuser.me/api/portraits/men/75.jpg",
          rating: 4.6,
          totalRides: 19,
          phone: "352-555-3698",
          instagram: "ryanc_drives"
        },
        origin: {
          city: "Gainesville",
          area: "UF Health"
        },
        destination: {
          city: "Tampa",
          area: "USF Campus"
        },
        departureTime: {
          toDate: () => new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 7, 30)
        },
        arrivalTime: {
          toDate: () => new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 10, 0)
        },
        seatsTotal: 2,
        seatsLeft: 2,
        price: 18,
        genderPreference: "no-preference",
        carModel: "Ford Focus",
        notes: "Early morning ride to Tampa. Coffee included!",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate())
        },
        rideType: "driver"
      },
      {
        id: "ride10",
        driver: {
          id: "driver10",
          name: "Maria Lopez",
          photoUrl: "https://randomuser.me/api/portraits/women/62.jpg",
          rating: 5.0,
          totalRides: 88,
          phone: "352-555-7412",
          instagram: "maria_lopez_uf",
          snapchat: "maria_lopez22"
        },
        origin: {
          city: "Jacksonville",
          area: "Downtown"
        },
        destination: {
          city: "Gainesville",
          area: "Butler Plaza"
        },
        departureTime: {
          toDate: () => new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 14, 0)
        },
        arrivalTime: {
          toDate: () => new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 16, 0)
        },
        seatsTotal: 4,
        seatsLeft: 3,
        price: 20,
        genderPreference: "no-preference",
        carModel: "Volkswagen Jetta",
        notes: "Regular commuter between Jacksonville and Gainesville. Very reliable!",
        createdAt: {
          toDate: () => new Date(now.getFullYear(), now.getMonth(), now.getDate())
        },
        rideType: "driver"
      }
    ];
    
    return mockRides;
  };

  const loadRides = async () => {
    setLoading(true);
    try {
      // Use mock data instead of Firestore
      let ridesList = getMockRides();
      
      // Filter by origin
      if (origin) {
        ridesList = ridesList.filter(ride => 
          ride.origin.city.toLowerCase().includes(origin.toLowerCase()));
      }
      
      // Filter by destination
      if (destination) {
        ridesList = ridesList.filter(ride => 
          ride.destination.city.toLowerCase().includes(destination.toLowerCase()));
      }
      
      // Filter by date if provided
      if (date) {
        const selectedDate = new Date(date).setHours(0, 0, 0, 0);
        ridesList = ridesList.filter(ride => {
          const rideDate = ride.departureTime.toDate().setHours(0, 0, 0, 0);
          return rideDate === selectedDate;
        });
      }
      
      // Sort rides
      if (sortBy === "priceLow") {
        ridesList.sort((a, b) => a.price - b.price);
      } else if (sortBy === "priceHigh") {
        ridesList.sort((a, b) => b.price - a.price);
      } else {
        // Default sort by departure time
        ridesList.sort((a, b) => a.departureTime.toDate().getTime() - b.departureTime.toDate().getTime());
      }
      
      // Filter by gender preference if selected
      if (genderPreference === "female") {
        ridesList = ridesList.filter(ride => ride.genderPreference === "female");
      } else if (genderPreference === "male") {
        ridesList = ridesList.filter(ride => ride.genderPreference === "male");
      }
      
      setRides(ridesList);
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

  // Function to handle editing a ride
  const handleEditRide = (ride: Ride) => {
    if (!currentUser) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in with your UF email to edit a ride.",
        variant: "destructive",
      });
      return;
    }
    
    // Only allow editing if the user is the ride creator
    if (ride.driver.id !== currentUser.uid) {
      toast({
        title: "Access denied",
        description: "You can only edit rides that you've created.",
        variant: "destructive",
      });
      return;
    }
    
    // For now, just show a toast indicating this feature is coming soon
    toast({
      title: "Edit ride",
      description: "Ride editing functionality is coming soon!",
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
              className="w-full bg-orange-600 text-white py-6 h-auto rounded-md font-medium hover:bg-opacity-90 transition"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Apply Filters
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
              <Select value={sortBy} onValueChange={(value) => {
                setSortBy(value);
                // Apply sorting immediately when changed
                setTimeout(handleSearch, 100);
              }}>
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
                <RideCard key={ride.id} ride={ride} onEdit={handleEditRide} />
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
