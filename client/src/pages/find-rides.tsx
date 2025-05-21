import React, { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { MapPin, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RideCard from "@/components/ride-card";
import { Ride } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
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
      // Create a reference to the rides collection
      const ridesCollection = collection(db, "rides");
      
      // Create a query to get all rides, ordered by creation date
      const ridesQuery = query(ridesCollection, orderBy("createdAt", "desc"));
      
      // Execute the query
      const querySnapshot = await getDocs(ridesQuery);
      
      // Log the fetched rides for debugging
      console.log("Fetched rides:", querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      // Convert the query snapshot to an array of Ride objects
      const fetchedRides = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as Ride;
      });
      
      // Update the state with the fetched rides
      setRides(fetchedRides);
    } catch (error) {
      console.error("Error fetching rides:", error);
      toast({
        title: "Error loading rides",
        description: "There was a problem loading rides. Please try again.",
        variant: "destructive"
      });
      
      // Set empty rides array on error
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to filter and sort rides
  const filterAndSortRides = () => {
    let filteredRides = [...rides];
    
    // Filter by origin
    if (origin) {
      filteredRides = filteredRides.filter(ride => 
        ride.origin.city.toLowerCase().includes(origin.toLowerCase()));
    }
    
    // Filter by destination
    if (destination) {
      filteredRides = filteredRides.filter(ride => 
        ride.destination.city.toLowerCase().includes(destination.toLowerCase()));
    }
    
    // Filter by date (if specified)
    if (date) {
      const filterDate = new Date(date);
      // Only compare the date part, not the time
      filteredRides = filteredRides.filter(ride => {
        const rideDate = ride.departureTime.toDate ? ride.departureTime.toDate() : new Date(ride.departureTime);
        return rideDate.toDateString() === filterDate.toDateString();
      });
    }
    
    // Sort rides
    if (sortBy === "departureTime") {
      filteredRides.sort((a, b) => {
        const dateA = a.departureTime.toDate ? a.departureTime.toDate() : new Date(a.departureTime);
        const dateB = b.departureTime.toDate ? b.departureTime.toDate() : new Date(b.departureTime);
        return dateA.getTime() - dateB.getTime();
      });
    } else if (sortBy === "price") {
      filteredRides.sort((a, b) => a.price - b.price);
    } else if (sortBy === "rating") {
      filteredRides.sort((a, b) => b.driver.rating - a.driver.rating);
    }
    
    // Filter by gender preference
    if (genderPreference !== "no-preference") {
      filteredRides = filteredRides.filter(ride => 
        ride.genderPreference === "no-preference" || ride.genderPreference === genderPreference);
    }
    
    return filteredRides;
  };
  
  // Function to handle search
  const handleSearch = () => {
    // Apply filters
    loadRides();
  };
  
  // Load rides on component mount
  useEffect(() => {
    loadRides();
  }, []);
  
  // Handle "Post a Ride" button click
  const handlePostRide = () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with your UF email to post a ride.",
        variant: "destructive",
      });
      return;
    }
    
    setLocation("/post-ride");
  };
  
  // The displayed rides after filtering and sorting
  const displayedRides = filterAndSortRides();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter Sidebar */}
        <div className="md:w-1/4 bg-white rounded-lg shadow-md p-5">
          <h2 className="text-xl font-bold mb-4">Find a Ride</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">From</label>
              <div className="relative">
                <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                <Input 
                  placeholder="Origin city" 
                  className="pl-10"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <div className="relative">
                <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                <Input 
                  placeholder="Destination city" 
                  className="pl-10"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                <Input 
                  type="date" 
                  className="pl-10"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Passengers</label>
              <Select value={passengers} onValueChange={setPassengers}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select number of passengers" />
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
            
            <div>
              <label className="block text-sm font-medium mb-1">Gender Preference</label>
              <Select value={genderPreference} onValueChange={setGenderPreference}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Select gender preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="no-preference">No preference</SelectItem>
                    <SelectItem value="female">Female only</SelectItem>
                    <SelectItem value="male">Male only</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="departureTime">Departure time</SelectItem>
                    <SelectItem value="price">Price (low to high)</SelectItem>
                    <SelectItem value="rating">Driver rating</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handlePostRide}
            >
              Post a Ride
            </Button>
          </div>
        </div>
        
        {/* Results Section */}
        <div className="md:w-3/4">
          <h2 className="text-xl font-bold mb-4">
            Available Rides
            {origin && ` from ${origin}`}
            {destination && ` to ${destination}`}
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
            </div>
          ) : displayedRides.length > 0 ? (
            <div className="space-y-4">
              {displayedRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-5 text-center">
              <p className="text-neutral-600">No rides match your search criteria.</p>
              <p className="mt-2">Try adjusting your filters or <Link href="/post-ride" className="text-orange-600 hover:underline">post a ride</Link> yourself!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}