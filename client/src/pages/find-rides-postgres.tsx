import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth-new';
import { usePostgresRides } from '../hooks/use-postgres-rides';

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
import GasPriceEstimate from '@/components/gas-price-estimate';
import RideCard from '@/components/ride-card';

// List of major Florida cities
const FLORIDA_CITIES = [
  "Gainesville",
  "Jacksonville",
  "Miami",
  "Orlando",
  "Tampa",
  "Tallahassee",
  "Fort Lauderdale"
];

export default function FindRidesPostgres() {
  const { currentUser } = useAuth();
  const { rides, loading, error, loadAllRides } = usePostgresRides();
  const [, setLocation] = useLocation();

  // Form state
  const [from, setFrom] = useState('Gainesville');
  const [to, setTo] = useState('any');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [genderFilter, setGenderFilter] = useState('no preference');
  const [sortBy, setSortBy] = useState('date');

  const [quickFilter, setQuickFilter] = useState('departures'); // 'departures' or 'arrivals'
  const [rideTypeFilter, setRideTypeFilter] = useState('driver'); // 'driver' or 'passenger'
  
  // Applied filter state (only updated when Apply Filter is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    from: 'Gainesville',
    to: 'any',
    date: '',
    passengers: '1',
    genderFilter: 'no preference'
  });

  // Load all rides when component mounts
  useEffect(() => {
    if (currentUser) {
      loadAllRides();
    }
  }, [currentUser]);

  // Adapter function to convert PostgreSQL ride format to card format
  const adaptPostgresRideToCardFormat = (ride: any) => {
    return {
      id: ride.id,
      origin: {
        city: ride.origin,
        area: ride.originArea || ''
      },
      destination: {
        city: ride.destination,
        area: ride.destinationArea || ''
      },
      departureTime: new Date(ride.departureTime),
      arrivalTime: new Date(ride.arrivalTime),
      seatsTotal: ride.seatsTotal,
      seatsLeft: ride.seatsLeft,
      price: ride.price,
      genderPreference: ride.genderPreference,
      carModel: ride.carModel,
      notes: ride.notes,
      rideType: ride.rideType,
      driverId: ride.driverId,
      isCompleted: ride.isCompleted,
      driver: {
        name: ride.driverName || 'Unknown Driver',
        email: ride.driverEmail || '',
        photoUrl: ride.driverPhoto || '',
        phone: ride.driverPhone || '',
        instagram: ride.driverInstagram || '',
        snapchat: ride.driverSnapchat || '',
        id: ride.driverId,
        rating: 4.8,
        totalRides: 15
      },
      createdAt: new Date(ride.createdAt)
    };
  };

  // Filter rides using applied filters
  const filteredRides = rides
    .filter(ride => {
      if (!ride) return false;
      
      // Filter by ride type (driver or passenger)
      if (ride.rideType !== rideTypeFilter) {
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
        if (ride.origin.toLowerCase() !== appliedFilters.from.toLowerCase() || 
            ride.destination.toLowerCase() !== appliedFilters.to.toLowerCase()) {
          return false;
        }
      } else if (appliedFilters.from && appliedFilters.from !== 'any' && (!appliedFilters.to || appliedFilters.to === 'any')) {
        // Only from selected - show rides starting from that city
        if (ride.origin.toLowerCase() !== appliedFilters.from.toLowerCase()) {
          return false;
        }
      } else if (appliedFilters.to && appliedFilters.to !== 'any') {
        // Only to selected - show rides going to that city
        if (ride.destination.toLowerCase() !== appliedFilters.to.toLowerCase()) {
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

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar with filters */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Find Your Ride</h2>
          
          {/* Quick Filter Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setQuickFilter('departures');
                  setFrom('Gainesville');
                  setTo('any');
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  quickFilter === 'departures'
                    ? 'bg-white shadow text-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                From Gainesville
              </button>
              <button
                onClick={() => {
                  setQuickFilter('arrivals');
                  setFrom('any');
                  setTo('Gainesville');
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  quickFilter === 'arrivals'
                    ? 'bg-white shadow text-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                To Gainesville
              </button>
            </div>
          </div>
          
          <div className="space-y-8">
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
                  id="date"
                  type="date"
                  className="pl-10 h-12 rounded-md border-gray-200"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="passengers" className="block mb-3 text-sm font-medium">Seats Needed</Label>
              <Select value={passengers} onValueChange={setPassengers}>
                <SelectTrigger className="h-12 rounded-md border-gray-200">
                  <SelectValue placeholder="Any number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any number</SelectItem>
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
            
            <div>
              <Label htmlFor="gender" className="block mb-3 text-sm font-medium">Gender Preference</Label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="h-12 rounded-md border-gray-200">
                  <SelectValue placeholder="No preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no preference">No preference</SelectItem>
                  <SelectItem value="male">Male riders only</SelectItem>
                  <SelectItem value="female">Female riders only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full h-12 bg-primary hover:bg-primary/90 font-medium" 
              onClick={applyFilters}
              disabled={loading}
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Apply Filters
            </Button>
          </div>
        </div>
        
        {/* Main content with rides */}
        <div className="lg:col-span-3 mt-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-xl font-semibold">Available Rides</h3>
              
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
              <p className="text-gray-500">Try adjusting your filters or check back later for new rides.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRides.map((ride) => {
                const adaptedRide = adaptPostgresRideToCardFormat(ride);
                
                return (
                  <RideCard key={ride.id} ride={adaptedRide} />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}