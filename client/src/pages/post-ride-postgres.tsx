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


export default function PostRidePostgres() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { createRide, loading, error } = usePostgresRides();
  
  // Form state
  const [rideType, setRideType] = useState<'driver' | 'passenger'>('driver');
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

  
  // Auto-calculate price for passenger requests
  useEffect(() => {
    // Always log regardless of conditions
    window.console?.log('PASSENGER PRICE CALC TRIGGERED:', { rideType, origin, destination, departureDate, availableSeats });
    
    if (rideType === 'passenger' && origin && destination && departureDate) {
      window.console?.log('PASSENGER CONDITIONS MET - CALCULATING PRICE');
      
      let distance = 0;
      window.console?.log('Available cities:', Object.keys(CITY_DISTANCES));
      
      // Calculate distance based on origin and destination
      if (origin === 'Gainesville' && destination !== 'Gainesville') {
        // From Gainesville to other cities
        const cityData = CITY_DISTANCES[destination as keyof typeof CITY_DISTANCES];
        window.console?.log(`Route: Gainesville to ${destination}`, cityData);
        if (cityData) {
          distance = cityData.miles;
        }
      } else if (destination === 'Gainesville' && origin !== 'Gainesville') {
        // From other cities to Gainesville
        const cityData = CITY_DISTANCES[origin as keyof typeof CITY_DISTANCES];
        window.console?.log(`Route: ${origin} to Gainesville`, cityData);
        if (cityData) {
          distance = cityData.miles;
        }
      }
      
      window.console?.log('Calculated distance:', distance);
      
      if (distance > 0) {
        try {
          const calculatedPrice = calculateRidePrice({
            distance: distance,
            mpg: 30,
            gasPrice: 3.50,
            destination: destination,
            seatsTotal: parseInt(availableSeats) || 1,
            date: departureDate ? new Date(departureDate) : undefined
          });
          window.console?.log('CALCULATED PRICE:', calculatedPrice);
          setPrice(calculatedPrice.toString());
        } catch (error) {
          window.console?.error('Price calculation error:', error);
          setPrice('15');
        }
      } else {
        window.console?.log('No distance found, setting default price');
        setPrice('15');
      }
    } else {
      window.console?.log('Passenger price calculation conditions not met');
    }
  }, [rideType, origin, destination, departureDate, availableSeats]);
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to post a ride",
        variant: "destructive"
      });
      return;
    }
    
    if (!origin || !destination || !departureDate || !departureTime || !price) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
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
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        seatsTotal: parseInt(availableSeats),
        seatsLeft: parseInt(availableSeats),
        price: parseFloat(price),
        genderPreference,
        carModel: carModel || null,
        notes: null,
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
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Post a Ride</h1>
      
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
          <div className="mb-6">
            <Tabs 
              defaultValue="driver" 
              value={rideType}
              onValueChange={(value) => setRideType(value as 'driver' | 'passenger')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="driver" className="flex items-center gap-2">
                  <FaCarSide /> Offering a Ride
                </TabsTrigger>
                <TabsTrigger value="passenger" className="flex items-center gap-2">
                  <FaUser /> Looking for a Ride
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
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
                  <Input
                    id="origin"
                    placeholder="e.g. Gainesville"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    required
                  />
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
                  <Input
                    id="destination"
                    placeholder="e.g. Orlando"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
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
                    <Label htmlFor="carModel">Car Model (Optional)</Label>
                    <Input
                      id="carModel"
                      placeholder="e.g. Toyota Camry"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    <FaMoneyBillWave className="inline mr-2" />
                    {rideType === 'driver' ? 'Price per Person ($) (Required)' : 'Amount Willing to Pay ($) (Auto-calculated)'}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={rideType === 'driver' ? "e.g. 15.00" : "Calculated automatically"}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    readOnly={rideType === 'passenger'}
                    disabled={rideType === 'passenger'}
                    className={rideType === 'passenger' ? 'bg-gray-100 cursor-not-allowed' : ''}
                    required
                  />
                  {rideType === 'passenger' && (
                    <p className="text-sm text-gray-600">
                      Price calculated based on distance, gas costs, and passenger count
                    </p>
                  )}
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
          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? "Posting..." : "Post Ride"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}