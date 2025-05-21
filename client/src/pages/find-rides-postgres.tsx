import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import RideCard from '../components/ride-card';
import { adaptPostgresRideToCardFormat } from '../lib/ride-adapter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FaSearch } from 'react-icons/fa';
import { RiFilterFill } from 'react-icons/ri';
import { Ride } from '@shared/schema';

export default function FindRidesPage() {
  const { currentUser } = useAuth();
  const { rides, loading, error, loadRides } = usePostgresRides();
  const [origin, setOrigin] = useState('Gainesville');
  const [destination, setDestination] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Load rides on component mount
  useEffect(() => {
    loadRides(origin, destination);
  }, [origin, destination]);
  
  // Filter and sort rides based on user selections
  const filteredRides = rides
    .filter(ride => {
      // Filter by gender
      if (genderFilter !== 'all' && ride.genderPreference !== genderFilter && ride.genderPreference !== 'no-preference') {
        return false;
      }
      
      // Filter by date
      if (dateFilter !== 'all') {
        const now = new Date();
        const rideDate = new Date(ride.departureTime);
        
        if (dateFilter === 'today') {
          return rideDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'tomorrow') {
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          return rideDate.toDateString() === tomorrow.toDateString();
        } else if (dateFilter === 'week') {
          const weekFromNow = new Date(now);
          weekFromNow.setDate(now.getDate() + 7);
          return rideDate >= now && rideDate <= weekFromNow;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by price
      if (priceSort === 'asc') {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Find Rides</h1>
      
      {/* Search Form */}
      <div className="bg-card rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="origin">From</Label>
            <Input
              id="origin"
              placeholder="City (e.g. Gainesville)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="destination">To</Label>
            <Input
              id="destination"
              placeholder="City (e.g. Orlando)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <Button
            onClick={() => loadRides(origin, destination)}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <FaSearch className="mr-2" /> Search Rides
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2"
          >
            <RiFilterFill /> Filters
          </Button>
        </div>
        
        {/* Filters */}
        {isFilterOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gender-filter">Gender Preference</Label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger id="gender-filter">
                  <SelectValue placeholder="Filter by gender preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male only</SelectItem>
                  <SelectItem value="female">Female only</SelectItem>
                  <SelectItem value="no-preference">No preference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-filter">Date</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="week">Next 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="price-sort">Price</Label>
              <Select value={priceSort} onValueChange={setPriceSort}>
                <SelectTrigger id="price-sort">
                  <SelectValue placeholder="Sort by price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Lowest to highest</SelectItem>
                  <SelectItem value="desc">Highest to lowest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-destructive/20 text-destructive p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* Rides list */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-60" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))
        ) : filteredRides.length > 0 ? (
          filteredRides.map((ride) => (
            <RideCard 
              key={ride.id.toString()} 
              ride={adaptPostgresRideToCardFormat(ride)}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No rides found with your criteria.</p>
            <p className="text-muted-foreground mt-2">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}