import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
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
  "Fort Lauderdale",
  "St. Petersburg",
  "Clearwater",
  "Sarasota"
];

export default function FindRidesPostgres() {
  const { currentUser } = useAuth();
  const { rides, loading, error, loadRides } = useRides();
  const [, setLocation] = useLocation();

  // Form state
  const [from, setFrom] = useState('Gainesville');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  // Filter rides
  const filteredRides = rides
    .filter(ride => {
      if (!ride) return false;
      
      // Filter by gender if selected
      if (genderFilter !== 'all' && ride.genderPreference !== genderFilter && ride.genderPreference !== 'no-preference') {
        return false;
      }
      
      // Filter by date if selected
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
      // Sort by departure time, newest first
      const dateA = new Date(a.departureTime);
      const dateB = new Date(b.departureTime);
      return dateA.getTime() - dateB.getTime();
    });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRides(from, to);
  };

  const navigateToPostRide = () => {
    setLocation('/post-ride');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Find Rides</h1>
        <Button 
          onClick={navigateToPostRide} 
          className="bg-primary text-white hover:bg-primary/90"
        >
          Post a Ride
        </Button>
      </div>
      
      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from" className="flex items-center gap-2">
                  <FaLocationArrow className="text-primary" />
                  From
                </Label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLORIDA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to" className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-primary" />
                  To
                </Label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Destination</SelectItem>
                    {FLORIDA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <FaCalendar className="text-primary" />
                  Date (Optional)
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <FaUser className="text-primary" />
                  Gender Preference
                </Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                    <SelectItem value="no-preference">No Preference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                className="bg-primary text-white hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <AiOutlineLoading3Quarters className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search Rides'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Error message */}
      {error && (
        <div className="bg-destructive/20 text-destructive p-4 rounded-lg mb-8">
          <p>{error}</p>
        </div>
      )}
      
      {/* Rides list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted rounded"></div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
                <div className="h-10 w-20 bg-muted rounded"></div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </div>
              <div className="mt-4 h-10 w-32 bg-muted rounded"></div>
            </div>
          ))
        ) : filteredRides.length > 0 ? (
          filteredRides.map((ride) => {
            const adaptedRide = adaptPostgresRideToCardFormat(ride);
            
            return (
              <Dialog key={ride.id}>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {ride.origin} → {ride.destination}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(new Date(ride.departureTime))}
                          </p>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          ${ride.price}
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1 text-sm flex-1">
                        <div className="flex items-center">
                          <FaUser className="text-primary mr-2 flex-shrink-0" />
                          <span className="truncate">Driver: {adaptedRide.driver.name.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-center">
                          <FaCar className="text-primary mr-2 flex-shrink-0" />
                          <span className="truncate">{ride.carModel || 'Car not specified'}</span>
                        </div>
                        <div className="flex items-center">
                          <FaUserFriends className="text-primary mr-2 flex-shrink-0" />
                          <span>{ride.seatsLeft} seat(s) available</span>
                        </div>
                        <div className="flex items-start">
                          <FaMapMarkerAlt className="text-primary mr-2 mt-1 flex-shrink-0" />
                          <div>
                            <div className="truncate">From: {ride.originArea}</div>
                            <div className="truncate">To: {ride.destinationArea}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t">
                        <Button 
                          variant="outline" 
                          className="w-full text-primary border-primary hover:bg-primary/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Contact Driver
                        </Button>
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
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" className="bg-primary text-white hover:bg-primary/90">
                        Done
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          })
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-card rounded-lg shadow-md">
            <FaCar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No rides found</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              We couldn't find any rides matching your criteria.
              Try adjusting your search or post a ride!
            </p>
            <Button 
              onClick={navigateToPostRide} 
              className="mt-6 bg-primary text-white hover:bg-primary/90"
            >
              Post a Ride
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}