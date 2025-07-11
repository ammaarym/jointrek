import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth-fixed';
import { auth } from '@/lib/firebase';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { combineDateTime, formatTime, calculateArrivalTime } from '../lib/date-utils';
import { toast } from '../hooks/use-toast';
import { useErrorToast } from '@/hooks/use-error-toast';
import { calculateRidePrice, CITY_DISTANCES } from '../../../shared/pricing';
import { CAR_MAKES, CAR_MODELS, CAR_YEARS, getMaxSeatsForModel, getBaggageCapacity } from '../data/car-data';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaCarSide, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { TbGenderMale, TbGenderFemale } from 'react-icons/tb';
import { FileText } from 'lucide-react';

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
  const { showErrorFromException } = useErrorToast();
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [checkingDriverStatus, setCheckingDriverStatus] = useState(false);
  const [insuranceStatus, setInsuranceStatus] = useState<{ verified: boolean } | null>(null);
  const [checkingInsurance, setCheckingInsurance] = useState(false);
  
  // Form state - auto-select passenger tab if on request-ride route
  const [rideType, setRideType] = useState<'driver' | 'passenger'>(
    location === '/request-ride' ? 'passenger' : 'driver'
  );

  // Update rideType when location changes
  useEffect(() => {
    setRideType(location === '/request-ride' ? 'passenger' : 'driver');
  }, [location]);

  // Check driver status and insurance when switching to driver mode
  useEffect(() => {
    if (rideType === 'driver' && currentUser) {
      checkDriverStatus();
      checkInsuranceStatus();
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
      showErrorFromException(error, 'driver_onboarding');
    } finally {
      setCheckingDriverStatus(false);
    }
  };

  const checkInsuranceStatus = async () => {
    if (!currentUser) return;

    setCheckingInsurance(true);
    try {
      const response = await fetch('/api/users/insurance/status', {
        headers: {
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        }
      });

      if (response.ok) {
        const status = await response.json();
        setInsuranceStatus(status);
      }
    } catch (error) {
      console.error('Error checking insurance status:', error);
      showErrorFromException(error, 'insurance_check');
    } finally {
      setCheckingInsurance(false);
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
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [baggageCheckIn, setBaggageCheckIn] = useState('0');
  const [baggagePersonal, setBaggagePersonal] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);



  // Available models for selected make
  const availableModels = carMake ? CAR_MODELS[carMake] || [] : [];
  
  // Maximum seats for selected car
  const maxSeats = carMake && carModel ? getMaxSeatsForModel(carMake, carModel) : 8;

  // Reset model and year when make changes
  useEffect(() => {
    setCarModel('');
    setCarYear('');
  }, [carMake]);

  // Reset year when model changes
  useEffect(() => {
    setCarYear('');
  }, [carModel]);

  // Auto-update baggage capacity when car is selected
  useEffect(() => {
    if (carMake && carModel && rideType === 'driver') {
      const capacity = getBaggageCapacity(carMake, carModel);
      setBaggageCheckIn(capacity.checkIn.toString());
      setBaggagePersonal(capacity.personal.toString());
    }
  }, [carMake, carModel, rideType]);

  
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
    
    // Use Firebase auth directly to avoid context race conditions
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      toast({
        title: "Error",
        description: "Authentication required. Please refresh the page and try again.",
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

    // Check insurance verification for drivers
    if (rideType === 'driver' && insuranceStatus && !insuranceStatus.verified) {
      toast({
        title: "Insurance Verification Required",
        description: "You must verify your auto insurance before posting rides. Please go to your profile to complete verification.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    // Validate Gainesville requirement
    if (origin !== 'Gainesville' && destination !== 'Gainesville') {
      toast({
        title: "Invalid Route",
        description: "Rides must be from Gainesville to another city or from another city to Gainesville",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    if (origin === destination) {
      toast({
        title: "Invalid Route",
        description: "Origin and destination cannot be the same",
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
      if (!availableSeats || !carMake || !carModel || !carYear) {
        toast({
          title: "Missing Information",
          description: "Please fill in available seats, car make, model, and year",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Driver verification handled at routing level - users can only reach this page if verified
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
        driverId: firebaseUser.uid,
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
        carMake: carMake || null,
        carModel: carModel || null,
        carYear: carYear ? parseInt(carYear) : null,
        baggageCheckIn: parseInt(baggageCheckIn) || 0,
        baggagePersonal: parseInt(baggagePersonal) || 0,
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

      {/* Insurance Verification Warning for Drivers */}
      {rideType === 'driver' && insuranceStatus && !insuranceStatus.verified && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Insurance Verification Required
                </h3>
                <p className="text-yellow-700 text-sm mb-4">
                  You must verify your auto insurance before posting rides. This ensures passenger safety and meets Trek's driver requirements.
                </p>
                <Button
                  type="button"
                  onClick={() => setLocation('/profile')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Verify Insurance Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
                <div className="space-y-4">
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
                        {Array.from({length: maxSeats}, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Car Information */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Vehicle Information (Required)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="carMake">Car Make</Label>
                        <Select value={carMake} onValueChange={setCarMake}>
                          <SelectTrigger id="carMake">
                            <SelectValue placeholder="Select make" />
                          </SelectTrigger>
                          <SelectContent>
                            {CAR_MAKES.map(make => (
                              <SelectItem key={make} value={make}>
                                {make}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="carModel">Car Model</Label>
                        <Select 
                          value={carModel} 
                          onValueChange={setCarModel}
                          disabled={!carMake}
                        >
                          <SelectTrigger id="carModel">
                            <SelectValue placeholder={carMake ? "Select model" : "Select make first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableModels.map(model => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="carYear">Year</Label>
                        <Select 
                          value={carYear} 
                          onValueChange={setCarYear}
                          disabled={!carModel}
                        >
                          <SelectTrigger id="carYear">
                            <SelectValue placeholder={carModel ? "Select year" : "Select model first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {CAR_YEARS.map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Baggage Options */}
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    {rideType === 'driver' ? 'Available Baggage Space' : 'Baggage Requirements'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {rideType === 'driver' 
                      ? 'How many bags can you accommodate in your vehicle?' 
                      : 'How many bags will you be bringing?'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baggageCheckIn">
                        Check-in Bags {rideType === 'driver' ? '(Can accommodate)' : '(Bringing)'}
                      </Label>
                      <Select value={baggageCheckIn} onValueChange={setBaggageCheckIn}>
                        <SelectTrigger id="baggageCheckIn">
                          <SelectValue placeholder="Number of check-in bags" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'bag' : 'bags'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Large suitcases, duffel bags</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="baggagePersonal">
                        Personal Bags {rideType === 'driver' ? '(Can accommodate)' : '(Bringing)'}
                      </Label>
                      <Select value={baggagePersonal} onValueChange={setBaggagePersonal}>
                        <SelectTrigger id="baggagePersonal">
                          <SelectValue placeholder="Number of personal bags" />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'bag' : 'bags'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Backpacks, smaller bags</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalPrice" className="text-sm text-gray-600">
                    <FaMoneyBillWave className="inline mr-2" />
                    {rideType === 'passenger' ? 'Price willing to pay ($5 - $50)' : 'Total Price ($5 - $50)'}
                  </Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={rideType === 'passenger' ? 'Enter price' : 'Enter total price'}
                    className="text-lg font-semibold"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {rideType === 'passenger' ? (
                      'Set the price you\'re willing to pay'
                    ) : (
                      price && availableSeats ? (
                        <>Price per person: ${(parseFloat(price) / parseInt(availableSeats)).toFixed(2)}</>
                      ) : (
                        'Set your total trip price (will be divided by available seats)'
                      )
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
          

          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading || isSubmitting}
            >
              {(loading || isSubmitting) ? (rideType === 'passenger' ? "Requesting..." : "Posting...") : (rideType === 'passenger' ? "Request Ride" : "Post Ride")}
            </Button>
          </div>
        </form>
    </div>
  );
}