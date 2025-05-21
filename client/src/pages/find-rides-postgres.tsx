import React, { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useRides } from '../hooks/use-rides';
import { adaptPostgresRideToCardFormat } from '../lib/ride-adapter';
import { formatDate } from '../lib/date-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FaCar, FaLocationArrow, FaMapMarkerAlt, FaArrowRight, FaCalendar, FaUserFriends, FaDollarSign, FaUser } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useLocation } from 'wouter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';

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
              <Card key={ride.id} className="overflow-hidden h-full flex flex-col">
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
                      <span className="truncate">Driver: {adaptedRide.driver.name}</span>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full text-primary border-primary hover:bg-primary/10"
                        >
                          Contact Driver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Driver Contact Information</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Driver</h4>
                            <p>{adaptedRide.driver.name.split(' ')[0]}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Email</h4>
                            <p>{adaptedRide.driver.contactInfo.email}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Ride Details</h4>
                            <p>From: {ride.origin} ({ride.originArea})</p>
                            <p>To: {ride.destination} ({ride.destinationArea})</p>
                            <p>Departure: {formatDate(new Date(ride.departureTime))}</p>
                            <p>Available Seats: {ride.seatsLeft}</p>
                            <p>Price: ${ride.price}</p>
                            {ride.carModel && <p>Car: {ride.carModel}</p>}
                            {ride.notes && <p>Notes: {ride.notes}</p>}
                          </div>
                        </div>
                        <DialogFooter className="sm:justify-start">
                          <DialogClose asChild>
                            <Button type="button" variant="secondary">
                              Close
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
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