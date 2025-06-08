import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth-new';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { combineDateTime, formatTime, calculateArrivalTime } from '../lib/date-utils';
import { toast } from '../hooks/use-toast';
import { calculateRidePrice, CITY_DISTANCES } from '../../../shared/pricing';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaCarSide, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { TbGenderMale, TbGenderFemale } from 'react-icons/tb';

interface DriverStatus {
  isOnboarded: boolean;
  canAcceptRides: boolean;
  accountId?: string;
  payoutsEnabled?: boolean;
}

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


export default function PostRidePostgres() {
  const [location, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { createRide, loading, error } = usePostgresRides();
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [checkingDriverStatus, setCheckingDriverStatus] = useState(false);
  
  // Form state - auto-select passenger tab if on request-ride route
  const [rideType, setRideType] = useState<'driver' | 'passenger'>(
    location === '/request-ride' ? 'passenger' : 'driver'
  );

  // Update rideType when location changes
  useEffect(() => {
    setRideType(location === '/request-ride' ? 'passenger' : 'driver');
  }, [location]);

  // Check driver status when switching to driver mode
  useEffect(() => {
    if (rideType === 'driver' && currentUser) {
      checkDriverStatus();
    }
  }, [rideType, currentUser]);

  const checkDriverStatus = async () => {
    if (!currentUser) return;

    setCheckingDriverStatus(true);
    try {
      const response = await fetch('/api/driver/status', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        const status = await response.json();
        setDriverStatus(status);
      }
    } catch (error) {
      console.error('Error checking driver status:', error);
    } finally {
      setCheckingDriverStatus(false);
    }
  };
  const [origin, setOrigin] = useState('Gainesville');
  const [originArea, setOriginArea] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationArea, setDestinationArea] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState('1');
  const [price, setPrice] = useState('');
  const [genderPreference, setGenderPreference] = useState('no-preference');
  const [carModel, setCarModel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  
  // Auto-calculate price for all requests (COMMENTED OUT - NOW USING FREE MARKET PRICING)
  // useEffect(() => {
  //   if (origin && destination) {
  //     let distance = 0;
  //     
  //     // Calculate distance based on origin and destination
  //     if (origin === 'Gainesville' && destination !== 'Gainesville') {
  //       // From Gainesville to other cities
  //       const cityData = CITY_DISTANCES[destination as keyof typeof CITY_DISTANCES];
  //       if (cityData) {
  //         distance = cityData.miles;
  //       }
  //     } else if (destination === 'Gainesville' && origin !== 'Gainesville') {
  //       // From other cities to Gainesville
  //       const cityData = CITY_DISTANCES[origin as keyof typeof CITY_DISTANCES];
  //       if (cityData) {
  //         distance = cityData.miles;
  //       }
  //     }
  //     
  //     if (distance > 0) {
  //       try {
  //         const calculatedPrice = calculateRidePrice({
  //           distance: distance,
  //           mpg: 30,
  //           gasPrice: 3.50,
  //           destination: destination,
  //           seatsTotal: parseInt(availableSeats) || 1,
  //           date: departureDate ? new Date(departureDate) : undefined
  //         });
  //         setPrice(calculatedPrice.toString());
  //       } catch (error) {
  //         setPrice('15');
  //       }
  //     } else {
  //       setPrice('15');
  //     }
  //   }
  // }, [rideType, origin, destination, departureDate, availableSeats]);
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || loading) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Validate form
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to post a ride",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    if (!origin || !destination || !departureDate || !departureTime || !price) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    // Validate price range
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 5 || priceNum > 50) {
      toast({
        title: "Invalid Price",
        description: "Price must be between $5 and $50",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }
    
    // Additional validation for drivers
    if (rideType === 'driver') {
      if (!availableSeats || !carModel) {
        toast({
          title: "Missing Information",
          description: "Please fill in available seats and car model",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Check if driver has completed Stripe Connect setup
      if (driverStatus && !driverStatus.canAcceptRides) {
        toast({
          title: "Driver Setup Required",
          description: "Please complete driver payment setup before offering rides",
          variant: "destructive"
        });
        setIsSubmitting(false);
        setLocation('/driver-onboard');
        return;
      }
    }
    
    console.log('Form submission started with data:', {
      rideType,
      origin,
      originArea,
      destination,
      destinationArea,
      departureDate,
      departureTime,
      availableSeats,
      price,
      genderPreference,
      carModel
    });
    
    try {
      // Convert form data to ride object
      const departureDateTime = combineDateTime(departureDate, departureTime);
      
      // Estimate arrival time (2 hours later for now)
      const arrivalTime = calculateArrivalTime(departureDateTime, 120);
      
      // Create ride data object - Note: We need to convert dates to ISO strings 
      // for proper transmission over API and then server will parse them
      const rideData = {
        driverId: currentUser.uid,
        origin,
        originArea,
        destination,
        destinationArea,
        departureTime: departureDateTime,
        arrivalTime: arrivalTime,
        seatsTotal: rideType === 'passenger' ? 1 : parseInt(availableSeats),
        seatsLeft: rideType === 'passenger' ? 1 : parseInt(availableSeats),
        price: price,
        genderPreference,
        carModel: carModel || null,

        rideType
      };
      
      console.log('Posting ride with data:', rideData);
      
      // Post the ride
      const ride = await createRide(rideData);
      
      if (ride) {
        toast({
          title: "Success!",
          description: "Your ride has been posted successfully.",
          variant: "default"
        });
        
        // Navigate to find rides page
        setLocation('/find-rides');
      } else {
        throw new Error('Failed to post ride');
      }
    } catch (err) {
      console.error('Error posting ride:', err);
      toast({
        title: "Error",
        description: "Failed to post your ride. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {rideType === 'passenger' ? 'Request a Ride' : 'Post a Ride'}
      </h1>
      
      {!currentUser ? (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You need to be logged in to post a ride.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/login')}>Log In</Button>
          </CardFooter>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Route Information</CardTitle>
              <CardDescription>Tell us about your journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">
                    <FaMapMarkerAlt className="inline mr-2" />
                    From City (Required)
                  </Label>
                  <Select value={origin} onValueChange={setOrigin}>
                    <SelectTrigger id="origin">
                      <SelectValue placeholder="Select departure city" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLORIDA_CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originArea">Area/Location</Label>
                  <Input
                    id="originArea"
                    placeholder="e.g. UF Campus, Butler Plaza"
                    value={originArea}
                    onChange={(e) => setOriginArea(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">
                    <FaMapMarkerAlt className="inline mr-2" />
                    To City (Required)
                  </Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger id="destination">
                      <SelectValue placeholder="Select destination city" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLORIDA_CITIES.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinationArea">Area/Location</Label>
                  <Input
                    id="destinationArea"
                    placeholder="e.g. Disney World, Downtown"
                    value={destinationArea}
                    onChange={(e) => setDestinationArea(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
              <CardDescription>When are you traveling?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departureDate">
                    <FaClock className="inline mr-2" />
                    Departure Date (Required)
                  </Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureTime">
                    <FaClock className="inline mr-2" />
                    Departure Time (Required)
                  </Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {rideType === 'driver' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="availableSeats">
                      <FaUser className="inline mr-2" />
                      Available Seats (Required)
                    </Label>
                    <Select 
                      value={availableSeats} 
                      onValueChange={setAvailableSeats}
                    >
                      <SelectTrigger id="availableSeats">
                        <SelectValue placeholder="Select available seats" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carModel">Car Model (Required)</Label>
                    <Select value={carModel} onValueChange={setCarModel}>
                      <SelectTrigger id="carModel">
                        <SelectValue placeholder="Select car type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUV">SUV</SelectItem>
                        <SelectItem value="Sedan">Sedan</SelectItem>
                        <SelectItem value="Truck">Truck</SelectItem>
                        <SelectItem value="Minivan">Minivan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              

              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalPrice" className="text-sm text-gray-600">
                    <FaMoneyBillWave className="inline mr-2" />
                    Total Price ($5 - $50)
                  </Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter total price"
                    className="text-lg font-semibold"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {price && availableSeats ? (
                      <>Price per person: ${(parseFloat(price) / parseInt(availableSeats)).toFixed(2)}</>
                    ) : (
                      'Set your total trip price (will be divided by available seats)'
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genderPreference">
                    <TbGenderMale className="inline mr-1" />
                    <TbGenderFemale className="inline mr-2" />
                    Gender Preference
                  </Label>
                  <Select 
                    value={genderPreference} 
                    onValueChange={setGenderPreference}
                  >
                    <SelectTrigger id="genderPreference">
                      <SelectValue placeholder="Select gender preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">No Preference</SelectItem>
                      <SelectItem value="male">Male Only</SelectItem>
                      <SelectItem value="female">Female Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          

          

          
          {error && (
            <div className="bg-destructive/20 text-destructive p-4 rounded-lg mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {rideType === 'driver' && driverStatus && !driverStatus.canAcceptRides && (
            <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FaCarSide className="text-orange-600" />
                <span className="font-medium text-orange-800">Driver Setup Required</span>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                You need to complete driver payment setup before offering rides. This allows you to receive payments from passengers.
              </p>
              <Button 
                type="button"
                onClick={() => setLocation('/driver-onboard')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Complete Driver Setup
              </Button>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading || isSubmitting || (rideType === 'driver' && driverStatus && !driverStatus.canAcceptRides)}
            >
{(loading || isSubmitting) ? (rideType === 'passenger' ? "Requesting..." : "Posting...") : (rideType === 'passenger' ? "Request Ride" : "Post Ride")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}