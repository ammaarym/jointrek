import React, { useState, useEffect } from 'react';
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

export default function FindRidesOriginalUI() {
  const { currentUser } = useAuth();
  const { rides, loading, error, loadRides } = useRides();
  const [, setLocation] = useLocation();

  // Form state
  const [from, setFrom] = useState('Gainesville');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  // Load rides on component mount
  useEffect(() => {
    loadRides(from, to);
  }, []);

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
        
        if (selectedDate.toDateString() !== rideDate.toDateString()) {
          return false;
        }
      }
      
      return true;
    });

  // Handle search
  const handleSearch = (e) => {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from" className="flex items-center gap-2">
                  <FaLocationArrow className="text-primary" />
                  From
                </Label>
                <Input
                  id="from"
                  placeholder="City (e.g. Gainesville)"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to" className="flex items-center gap-2">
                  <FaMapMarkerAlt className="text-primary" />
                  To
                </Label>
                <Input
                  id="to"
                  placeholder="City (e.g. Orlando)"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="gender" className="flex items-center gap-2">
                  <FaUser className="text-primary" />
                  Gender Preference
                </Label>
                <select
                  id="gender"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                  <option value="no-preference">No Preference</option>
                </select>
              </div>
              
              <div className="md:col-span-2 flex justify-end">
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
      <div className="space-y-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted rounded"></div>
                  <div className="h-4 w-32 bg-muted rounded"></div>
                </div>
                <div className="h-10 w-20 bg-muted rounded"></div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-12 w-full bg-muted rounded"></div>
                <div className="h-12 w-full bg-muted rounded"></div>
                <div className="h-12 w-full bg-muted rounded"></div>
              </div>
            </div>
          ))
        ) : filteredRides.length > 0 ? (
          filteredRides.map((ride) => {
            const adaptedRide = adaptPostgresRideToCardFormat(ride);
            
            return (
              <Card key={ride.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold flex items-center">
                          <FaMapMarkerAlt className="text-primary mr-2" />
                          {ride.origin}
                          <FaArrowRight className="mx-2" />
                          {ride.destination}
                        </h3>
                        <p className="text-muted-foreground">
                          {formatDate(new Date(ride.departureTime))}
                        </p>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        ${ride.price}
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <FaUser className="text-primary mr-2" />
                        <span>Driver: {adaptedRide.driver.name}</span>
                      </div>
                      <div className="flex items-center">
                        <FaCar className="text-primary mr-2" />
                        <span>{ride.carModel || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <FaUserFriends className="text-primary mr-2" />
                        <span>{ride.seatsLeft} seat(s) available</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-4">
                      <Button 
                        variant="outline" 
                        className="text-primary border-primary hover:bg-primary/10"
                        onClick={() => window.open(`mailto:${adaptedRide.driver.contactInfo.email}`)}
                      >
                        Contact Driver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow-md">
            <FaCar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No rides found</h3>
            <p className="mt-2 text-muted-foreground">
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