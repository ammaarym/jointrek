import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth-new';
import { useRides } from '../hooks/use-rides';
import { adaptPostgresRideToCardFormat } from '../lib/ride-adapter';
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
  const { rides, loading, error, loadRides } = useRides();
  const [, setLocation] = useLocation();

  // Form state
  const [from, setFrom] = useState('Gainesville');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [genderFilter, setGenderFilter] = useState('no preference');
  const [sortBy, setSortBy] = useState('date');

  // Filter rides
  const filteredRides = rides
    .filter(ride => {
      if (!ride) return false;
      
      // Filter by gender if selected
      if (genderFilter !== 'no preference' && 
          ride.genderPreference !== genderFilter && 
          ride.genderPreference !== 'no-preference') {
        return false;
      }
      
      // Filter by origin (if selected)
      if (from && ride.origin.toLowerCase() !== from.toLowerCase()) {
        return false;
      }
      
      // Filter by destination (if selected)
      if (to && to !== 'Any destination' && ride.destination.toLowerCase() !== to.toLowerCase()) {
        return false;
      }
      
      // Filter by date (if selected)
      if (date) {
        const selectedDate = new Date(date);
        const rideDate = new Date(ride.departureTime);
        
        if (selectedDate.getFullYear() !== rideDate.getFullYear() ||
            selectedDate.getMonth() !== rideDate.getMonth() ||
            selectedDate.getDate() !== rideDate.getDate()) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
      } else {
        // Convert price strings to numbers for comparison
        const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
        const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
        return priceA - priceB;
      }
    });

  // Handle filter application
  const applyFilters = () => {
    loadRides();
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with filters */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Find Your Ride</h2>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="from" className="block mb-2">From</Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FaLocationArrow />
                </div>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger className="pl-10 h-12 rounded-md border-gray-200">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLORIDA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="to" className="block mb-2">To</Label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-400">
                  <FaMapMarkerAlt />
                </div>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger className="pl-10 h-12 rounded-md border-gray-200">
                    <SelectValue placeholder="Any destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any destination</SelectItem>
                    {FLORIDA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="date" className="block mb-2">Date</Label>
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
              <Label htmlFor="passengers" className="block mb-2">Passengers</Label>
              <Select value={passengers} onValueChange={setPassengers}>
                <SelectTrigger className="h-12 rounded-md border-gray-200">
                  <SelectValue placeholder="1 passenger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 passenger</SelectItem>
                  <SelectItem value="2">2 passengers</SelectItem>
                  <SelectItem value="3">3 passengers</SelectItem>
                  <SelectItem value="4">4 passengers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="gender" className="block mb-2">Gender Preference</Label>
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
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Available Rides</h1>
            
            <div className="flex items-center">
              <span className="text-sm mr-2">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border-gray-200">
                  <SelectValue placeholder="Departure Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Departure Time</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
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
                  <Dialog key={ride.id}>
                    <DialogTrigger asChild>
                      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-0">
                          <div className="flex p-5">
                            <div className="mr-4">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                {adaptedRide.driver.photoUrl ? (
                                  <img src={adaptedRide.driver.photoUrl} alt={adaptedRide.driver.name} className="w-full h-full object-cover" />
                                ) : (
                                  <FaUser className="text-gray-400 text-xl" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <h3 className="font-semibold">{adaptedRide.driver.name.split(' ')[0]}</h3>
                                  <div className="flex items-center text-sm text-yellow-500">
                                    <span>★</span>
                                    <span className="ml-1">{adaptedRide.driver.rating?.toFixed(1) || '4.8'}</span>
                                    <span className="text-gray-400 ml-1">({adaptedRide.driver.totalRides || '42'} rides)</span>
                                  </div>
                                </div>
                                {ride.seatsLeft > 0 && (
                                  <div className="text-green-500 text-sm font-medium">
                                    ✓ {ride.seatsLeft} {ride.seatsLeft === 1 ? 'seat' : 'seats'} left
                                  </div>
                                )}
                                <div className="text-xl font-bold text-right">
                                  ${ride.price}
                                </div>
                              </div>
                              
                              <div className="mt-4 flex">
                                <div className="relative w-10 mr-2">
                                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                  <div className="absolute top-0 left-2.5 w-3 h-3 rounded-full bg-blue-500"></div>
                                  <div className="absolute bottom-0 left-2.5 w-3 h-3 rounded-full bg-orange-500"></div>
                                </div>
                                <div className="flex-1">
                                  <div className="mb-4">
                                    <div className="font-medium">{ride.origin} <span className="text-sm text-gray-500 font-normal">{ride.originArea}</span></div>
                                    <div className="text-sm text-gray-500">{new Date(ride.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                  </div>
                                  <div>
                                    <div className="font-medium">{ride.destination} <span className="text-sm text-gray-500 font-normal">{ride.destinationArea}</span></div>
                                  </div>
                                </div>
                              </div>
                              
                              {ride.genderPreference === 'female' && (
                                <div className="mt-3 text-sm text-pink-600 flex items-center">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-pink-50 text-xs">Female riders only</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl text-primary">Ride Details</DialogTitle>
                        <DialogDescription>
                          Connect with the driver to coordinate your ride
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium flex items-center text-primary mb-2">
                              <FaUser className="mr-2" /> Driver
                            </h4>
                            <p className="text-lg">{adaptedRide.driver.name.split(' ')[0]}</p>
                            <p className="text-sm break-all mt-1">{adaptedRide.driver.contactInfo.email}</p>
                          </div>
                          
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium flex items-center text-primary mb-2">
                              <FaCalendarAlt className="mr-2" /> Schedule
                            </h4>
                            <p>{formatDate(new Date(ride.departureTime))}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium flex items-center text-primary mb-2">
                              <FaMapMarkerAlt className="mr-2" /> Route
                            </h4>
                            <p><span className="font-medium">From:</span> {ride.origin} ({ride.originArea})</p>
                            <p><span className="font-medium">To:</span> {ride.destination} ({ride.destinationArea})</p>
                          </div>
                          
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-medium flex items-center text-primary mb-2">
                              <FaCar className="mr-2" /> Ride Info
                            </h4>
                            <p><span className="font-medium">Seats:</span> {ride.seatsLeft} available</p>
                            <p><span className="font-medium">Price:</span> ${ride.price}</p>
                            {ride.carModel && <p><span className="font-medium">Car:</span> {ride.carModel}</p>}
                          </div>
                        </div>
                      </div>
                      
                      {ride.notes && (
                        <div className="bg-muted/50 p-4 rounded-lg mb-6">
                          <h4 className="font-medium flex items-center text-primary mb-2">
                            <BiMessageDetail className="mr-2" /> Notes
                          </h4>
                          <p>{ride.notes}</p>
                        </div>
                      )}
                      
                      <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                          <Button type="button" className="bg-primary text-white hover:bg-primary/90">
                            Book Ride
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}