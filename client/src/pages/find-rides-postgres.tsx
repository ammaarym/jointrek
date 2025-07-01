import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth-fixed';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { useQuery } from '@tanstack/react-query';

import { formatDate } from '../lib/date-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FaCar, FaLocationArrow, FaMapMarkerAlt, FaArrowRight, FaCalendar, FaCalendarAlt, FaUserFriends, FaDollarSign, FaUser } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BiMessageDetail } from 'react-icons/bi';
import { useLocation } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import GasPriceEstimate from '@/components/gas-price-estimate';
import RideCard from '@/components/ride-card';
import { Filter } from 'lucide-react';

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
  "Pensacola",
  "Daytona Beach",
  "Fort Myers",
  "Atlanta",
  "Ocala",
  "Melbourne",
  "West Palm Beach",
  "Boca Raton",
  "Sarasota",
  "Naples"
];

export default function FindRidesPostgres() {
  const { currentUser } = useAuth();
  const { rides, loading, error, loadAllRides } = usePostgresRides();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { showErrorFromException, showError } = useErrorToast();

  // Form state
  const [from, setFrom] = useState('Gainesville');
  const [to, setTo] = useState('any');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [genderFilter, setGenderFilter] = useState('no preference');
  const [sortBy, setSortBy] = useState('date');

  const [quickFilter, setQuickFilter] = useState('departures'); // 'departures' or 'arrivals'
  const [rideTypeFilter, setRideTypeFilter] = useState('driver'); // 'driver' or 'passenger'
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Track requested rides
  const [requestedRides, setRequestedRides] = useState<Set<number>>(new Set());
  // Track approved rides
  const [approvedRides, setApprovedRides] = useState<Set<number>>(new Set());
  // Track rejected rides
  const [rejectedRides, setRejectedRides] = useState<Set<number>>(new Set());
  // Track cancelled rides
  const [cancelledRides, setCancelledRides] = useState<Set<number>>(new Set());
  // Track driver offers
  const [driverOffers, setDriverOffers] = useState<Map<number, any>>(new Map());

  
  // Applied filter state (only updated when Apply Filter is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    from: 'Gainesville',
    to: 'any',
    date: '',
    passengers: '1',
    genderFilter: 'no preference'
  });

  // Load existing driver offers for the current user
  const loadUserDriverOffers = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/driver-offers/for-user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });
      
      if (response.ok) {
        const offers = await response.json();
        const offerMap = new Map<number, any>();
        offers.forEach((offer: any) => {
          // Store the most recent offer for each ride
          if (!offerMap.has(offer.passengerRideId) || 
              new Date(offer.createdAt) > new Date(offerMap.get(offer.passengerRideId).createdAt)) {
            offerMap.set(offer.passengerRideId, offer);
          }
        });
        setDriverOffers(offerMap);
      }
    } catch (error) {
      console.error('Error loading driver offers:', error);
    }
  };

  // Load existing ride requests for the current user
  const loadUserRideRequests = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/ride-requests/user', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });
      
      if (response.ok) {
        const userRequests = await response.json();
        const requestedRideIds = new Set<number>(userRequests.map((req: any) => req.rideId as number));
        setRequestedRides(requestedRideIds);
        
        // Extract ride IDs that have been approved
        const approvedRideIds = userRequests
          .filter((request: any) => request.status === 'approved')
          .map((request: any) => request.rideId as number);
        setApprovedRides(new Set<number>(approvedRideIds));
        
        // Extract ride IDs that have been rejected
        const rejectedRideIds = userRequests
          .filter((request: any) => request.status === 'rejected')
          .map((request: any) => request.rideId as number);
        setRejectedRides(new Set<number>(rejectedRideIds));
        
        // Extract ride IDs that have been cancelled
        const cancelledRideIds = userRequests
          .filter((request: any) => request.status === 'cancelled')
          .map((request: any) => request.rideId as number);
        setCancelledRides(new Set<number>(cancelledRideIds));
      }
    } catch (error) {

    }
  };

  // Prefetch payment methods for faster "Request a Trek" button experience
  const { data: paymentData } = useQuery({
    queryKey: ["/api/payment-methods"],
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
  });

  // Load all rides and user requests when component mounts
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  
  useEffect(() => {
    if (currentUser && !hasLoadedInitialData) {
      loadAllRides();
      loadUserRideRequests();
      loadUserDriverOffers();
      setHasLoadedInitialData(true);
    }
  }, [currentUser?.uid, hasLoadedInitialData]);

  // Only refresh when user performs actions that might change data
  const refreshData = () => {
    if (currentUser) {
      loadAllRides();
      loadUserRideRequests();
      loadUserDriverOffers();
    }
  };

  // Handle ride request - redirect to appropriate page based on ride type
  const handleRequestRide = (rideId: number) => {
    if (!currentUser) return;
    
    // If viewing passenger posts (rideTypeFilter === 'passenger'), driver is offering a ride
    if (rideTypeFilter === 'passenger') {
      setLocation(`/offer-ride/${rideId}`);
    } else {
      // If viewing driver posts (rideTypeFilter === 'driver'), passenger is requesting a ride
      setLocation(`/request-ride/${rideId}`);
    }
  };



  // Adapter function to convert PostgreSQL ride format to card format
  const adaptPostgresRideToCardFormat = (ride: any) => {
    return {
      id: ride.id,
      origin: {
        city: typeof ride.origin === 'object' ? ride.origin.city : ride.origin,
        area: typeof ride.origin === 'object' ? ride.origin.area : (ride.originArea || '')
      },
      destination: {
        city: typeof ride.destination === 'object' ? ride.destination.city : ride.destination,
        area: typeof ride.destination === 'object' ? ride.destination.area : (ride.destinationArea || '')
      },
      departureTime: {
        toDate: () => new Date(ride.departureTime),
        seconds: Math.floor(new Date(ride.departureTime).getTime() / 1000),
        nanoseconds: 0
      },
      arrivalTime: {
        toDate: () => new Date(ride.arrivalTime),
        seconds: Math.floor(new Date(ride.arrivalTime).getTime() / 1000),
        nanoseconds: 0
      },
      seatsTotal: ride.seatsTotal,
      seatsLeft: ride.seatsLeft,
      price: ride.price,
      genderPreference: ride.genderPreference,
      carModel: ride.carModel,
      notes: ride.notes,
      rideType: ride.rideType,
      driverId: ride.driverId,
      isCompleted: ride.isCompleted,
      baggageCheckIn: ride.baggageCheckIn || 0,
      baggagePersonal: ride.baggagePersonal || 0,
      driver: ride.driver || {
        name: ride.driverName || 'Unknown Driver',
        email: ride.driverEmail || '',
        photoUrl: ride.driverPhoto || '',
        phone: ride.driverPhone || '',
        instagram: ride.driverInstagram || '',
        snapchat: ride.driverSnapchat || '',
        id: ride.driverId,
        rating: ride.driverRating || 4.8,
        totalRides: ride.driverTotalRides || 15
      },
      createdAt: {
        toDate: () => new Date(ride.createdAt),
        seconds: Math.floor(new Date(ride.createdAt).getTime() / 1000),
        nanoseconds: 0
      }
    };
  };

  // Filter rides using applied filters
  const filteredRides = rides
    .filter(ride => {

      if (!ride) return false;
      
      // Don't show user's own rides
      if (currentUser && ride.driverId === currentUser.uid) {
        return false;
      }
      
      // Don't show completed rides
      if (ride.isCompleted) {
        return false;
      }
      
      // Don't show rides with 0 seats available
      if (ride.seatsLeft <= 0) {
        return false;
      }
      
      // Don't show rides that the user has already been approved for
      if (approvedRides.has(ride.id)) {
        return false;
      }
      
      // Filter by ride type (driver or passenger)
      if (ride.rideType !== rideTypeFilter) {
        return false;
      }

      // Gainesville requirement: rides must be from or to Gainesville
      let originCity: string;
      let destinationCity: string;
      
      if (typeof ride.origin === 'object' && ride.origin !== null) {
        originCity = (ride.origin as any).city;
      } else {
        originCity = ride.origin as string;
      }
      
      if (typeof ride.destination === 'object' && ride.destination !== null) {
        destinationCity = (ride.destination as any).city;
      } else {
        destinationCity = ride.destination as string;
      }
      
      if (originCity !== 'Gainesville' && destinationCity !== 'Gainesville') {
        return false;
      }
      
      // Filter by gender if selected
      if (appliedFilters.genderFilter !== 'no preference') {
        // When filtering by specific gender, only show rides with that preference or no preference
        if (ride.genderPreference !== appliedFilters.genderFilter && 
            ride.genderPreference !== 'no-preference' && 
            ride.genderPreference !== 'no preference') {
          return false;
        }
      }
      
      // Filter by location - if both from and to are selected, match exact route
      // If only from is selected, show rides starting from that city
      // If only to is selected, show rides going to that city
      if (appliedFilters.from && appliedFilters.from !== 'any' && appliedFilters.to && appliedFilters.to !== 'any') {
        // Both from and to selected - exact route match
        if (originCity.toLowerCase() !== appliedFilters.from.toLowerCase() || 
            destinationCity.toLowerCase() !== appliedFilters.to.toLowerCase()) {
          return false;
        }
      } else if (appliedFilters.from && appliedFilters.from !== 'any' && (!appliedFilters.to || appliedFilters.to === 'any')) {
        // Only from selected - show rides starting from that city
        if (originCity.toLowerCase() !== appliedFilters.from.toLowerCase()) {
          return false;
        }
      } else if (appliedFilters.to && appliedFilters.to !== 'any') {
        // Only to selected - show rides going to that city
        if (destinationCity.toLowerCase() !== appliedFilters.to.toLowerCase()) {
          return false;
        }
      }
      
      // Filter by date (if selected)
      if (appliedFilters.date) {
        const selectedDate = new Date(appliedFilters.date + 'T00:00:00');
        const rideDate = new Date(ride.departureTime);
        
        // Compare dates in local timezone
        const selectedDay = selectedDate.getFullYear() + '-' + 
                           String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(selectedDate.getDate()).padStart(2, '0');
        const rideDay = rideDate.getFullYear() + '-' + 
                       String(rideDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(rideDate.getDate()).padStart(2, '0');
        
        if (selectedDay !== rideDay) {
          return false;
        }
      }
      
      // Filter out rides with zero available seats
      if (ride.seatsLeft <= 0) {
        return false;
      }
      
      // Filter by passenger count (if selected)
      if (appliedFilters.passengers && appliedFilters.passengers !== 'any' && appliedFilters.passengers !== '') {
        const requiredSeats = parseInt(appliedFilters.passengers);
        if (ride.seatsLeft < requiredSeats) {
          return false;
        }
      }
      
      // Filter by gender preference (if selected)
      if (appliedFilters.genderFilter && appliedFilters.genderFilter !== 'no preference') {
        if (ride.genderPreference !== appliedFilters.genderFilter) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      } else if (sortBy === 'price') {
        // Convert price strings to numbers for comparison (low to high)
        const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
        return priceA - priceB;
      } else if (sortBy === 'price-high') {
        // Convert price strings to numbers for comparison (high to low)
        const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
        return priceB - priceA;
      }
      return 0;
    });

  // Handle filter application
  const applyFilters = () => {
    setAppliedFilters({
      from,
      to,
      date,
      passengers,
      genderFilter
    });
  };

  const FilterContent = () => (
    <>
      {/* Quick Filter Toggle */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setQuickFilter('departures');
              setFrom('Gainesville');
              setTo('any');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all ${
              quickFilter === 'departures'
                ? 'bg-white shadow text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            From
          </button>
          <button
            onClick={() => {
              setQuickFilter('arrivals');
              setFrom('any');
              setTo('Gainesville');
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all ${
              quickFilter === 'arrivals'
                ? 'bg-white shadow text-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            To
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="from" className="block mb-3 text-sm font-medium">From</Label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaLocationArrow />
            </div>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="pl-10 h-12 rounded-md border-gray-200">
                <SelectValue placeholder={quickFilter === 'arrivals' ? "Any city" : "Select city"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any city</SelectItem>
                {FLORIDA_CITIES.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="to" className="block mb-3 text-sm font-medium">To</Label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaMapMarkerAlt />
            </div>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="pl-10 h-12 rounded-md border-gray-200">
                <SelectValue placeholder="Any destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any destination</SelectItem>
                {FLORIDA_CITIES.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="date" className="block mb-3 text-sm font-medium">Date</Label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaCalendar />
            </div>
            <Input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 h-12 rounded-md border-gray-200"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="passengers" className="block mb-3 text-sm font-medium">Seats Needed</Label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaUserFriends />
            </div>
            <Select value={passengers} onValueChange={setPassengers}>
              <SelectTrigger className="pl-10 h-12 rounded-md border-gray-200">
                <SelectValue placeholder="1 seat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 seat</SelectItem>
                <SelectItem value="2">2 seats</SelectItem>
                <SelectItem value="3">3 seats</SelectItem>
                <SelectItem value="4">4 seats</SelectItem>
                <SelectItem value="5">5 seats</SelectItem>
                <SelectItem value="6">6 seats</SelectItem>
                <SelectItem value="7">7 seats</SelectItem>
                <SelectItem value="8">8 seats</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="gender" className="block mb-3 text-sm font-medium">Gender Preference</Label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400">
              <FaUser />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="pl-10 h-12 rounded-md border-gray-200">
                <SelectValue placeholder="No preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no preference">No preference</SelectItem>
                <SelectItem value="male">Male only</SelectItem>
                <SelectItem value="female">Female only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Find Your Ride</h1>
        <Dialog open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Rides</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <FilterContent />
            </div>
            <DialogFooter>
              <Button onClick={() => {
                applyFilters();
                setMobileFilterOpen(false);
              }}>
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar with filters */}
        <div className="hidden lg:block lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Find Your Ride</h2>
          
          <FilterContent />
          
          <div className="mt-6">
            <Button onClick={applyFilters} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
        
        {/* Main content with rides */}
        <div className="lg:col-span-3 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {/* Ride Type Toggle Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setRideTypeFilter('driver')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    rideTypeFilter === 'driver'
                      ? 'bg-white shadow text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Available Drivers
                </button>
                <button
                  onClick={() => setRideTypeFilter('passenger')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    rideTypeFilter === 'passenger'
                      ? 'bg-white shadow text-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Available Passengers
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-sm mr-2">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border-gray-200">
                  <SelectValue placeholder="Departure Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Departure Time</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              Error loading rides: {error}
            </div>
          )}
          
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex">
                      <div className="mr-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <div className="h-5 w-24 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-16 bg-gray-200 rounded"></div>
                          </div>
                          <div className="h-6 w-16 bg-gray-200 rounded"></div>
                        </div>
                        <div className="mt-4 flex">
                          <div className="w-10 mr-2">
                            <div className="h-full w-0.5 bg-gray-200 mx-auto relative">
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-200"></div>
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gray-200"></div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 w-40 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRides.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h3 className="text-lg font-medium mb-2">No rides found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or check back later for new rides.</p>
              
              {/* Action buttons for creating rides */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => setLocation('/setup-post-ride')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Post a Ride
                </Button>
                <Button 
                  onClick={() => setLocation('/setup-request-ride')}
                  variant="outline"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                >
                  Request a Ride
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRides.map((ride) => {
                const adaptedRide = adaptPostgresRideToCardFormat(ride);
                const existingOffer = driverOffers.get(ride.id);
                
                return (
                  <RideCard 
                    key={ride.id} 
                    ride={adaptedRide} 
                    showRequestButton={true}
                    onRequestRide={handleRequestRide}
                    isRequested={requestedRides.has(ride.id)}
                    isApproved={approvedRides.has(ride.id)}
                    isRejected={rejectedRides.has(ride.id)}
                    isCancelled={cancelledRides.has(ride.id)}
                    rideTypeFilter={rideTypeFilter}
                    existingDriverOffer={existingOffer}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}