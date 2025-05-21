import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { useRides } from '../hooks/use-rides';
import { useToast } from '../hooks/use-toast';
import { combineDateTime } from '../lib/date-utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaCarSide, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaUser } from 'react-icons/fa';

// List of Florida cities for dropdowns
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
  const [notes, setNotes] = useState('');
  
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
        title: "Missing required fields",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Calculate departure time by combining date and time
      const combinedDepartureTime = combineDateTime(departureDate, departureTime);
      
      // Create ride object
      const ride = {
        driverId: currentUser.uid,
        origin,
        originArea,
        destination,
        destinationArea,
        departureTime: combinedDepartureTime,
        arrivalTime: new Date(combinedDepartureTime.getTime() + 2 * 60 * 60 * 1000), // Estimate 2 hours later
        seatsTotal: parseInt(availableSeats),
        seatsLeft: parseInt(availableSeats),
        price: parseFloat(price),
        genderPreference,
        carModel,
        notes,
        rideType
      };
      
      // Post ride
      await createRide(ride);
      
      // Show success message
      toast({
        title: "Ride posted!",
        description: "Your ride has been successfully posted",
      });
      
      // Redirect to My Rides page
      setLocation('/my-rides');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to post ride",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Post a Ride</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">I am a...</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={rideType === 'driver' ? 'default' : 'outline'}
              className={`h-14 ${rideType === 'driver' ? 'bg-primary text-white' : 'border-gray-200'}`}
              onClick={() => setRideType('driver')}
            >
              <FaCarSide className="mr-2 text-xl" />
              Driver
            </Button>
            <Button
              type="button"
              variant={rideType === 'passenger' ? 'default' : 'outline'}
              className={`h-14 ${rideType === 'passenger' ? 'bg-primary text-white' : 'border-gray-200'}`}
              onClick={() => setRideType('passenger')}
            >
              <FaUser className="mr-2 text-xl" />
              Passenger
            </Button>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4">Origin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label htmlFor="origin" className="block mb-2">From City (Required)</Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger id="origin" className="h-12 rounded-md border-gray-200">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLORIDA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="originArea" className="block mb-2">Area (e.g., UF Campus, Midtown)</Label>
                <Input
                  id="originArea"
                  placeholder="Specific area (e.g., UF Campus, Midtown)"
                  value={originArea}
                  onChange={(e) => setOriginArea(e.target.value)}
                  className="h-12 rounded-md border-gray-200"
                />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-4">Destination</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label htmlFor="destination" className="block mb-2">To City (Required)</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger id="destination" className="h-12 rounded-md border-gray-200">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLORIDA_CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="destinationArea" className="block mb-2">Area (e.g., Downtown, UCF Area)</Label>
                <Input
                  id="destinationArea"
                  placeholder="Specific area (e.g., Downtown, UCF Area)"
                  value={destinationArea}
                  onChange={(e) => setDestinationArea(e.target.value)}
                  className="h-12 rounded-md border-gray-200"
                />
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-4">Departure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label htmlFor="departureDate" className="block mb-2">Departure Date (Required)</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="h-12 rounded-md border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="departureTime" className="block mb-2">Departure Time (Required)</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="h-12 rounded-md border-gray-200"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label htmlFor="availableSeats" className="block mb-2">Available Seats (Required)</Label>
                <Select value={availableSeats} onValueChange={setAvailableSeats}>
                  <SelectTrigger id="availableSeats" className="h-12 rounded-md border-gray-200">
                    <SelectValue placeholder="Select seats" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} seat{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price" className="block mb-2">Price per Person ($) (Required)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 25"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="h-12 rounded-md border-gray-200"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <Label htmlFor="genderPreference" className="block mb-2">Gender Preference</Label>
                <Select value={genderPreference} onValueChange={setGenderPreference}>
                  <SelectTrigger id="genderPreference" className="h-12 rounded-md border-gray-200">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-preference">No Preference</SelectItem>
                    <SelectItem value="male">Male Only</SelectItem>
                    <SelectItem value="female">Female Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="carModel" className="block mb-2">Car Model</Label>
                <Input
                  id="carModel"
                  placeholder="e.g. Toyota Camry, Silver"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="h-12 rounded-md border-gray-200"
                />
              </div>
            </div>
            
            <div className="mb-8">
              <Label htmlFor="notes" className="block mb-2">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the ride..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-md border-gray-200"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 font-medium"
            >
              {loading ? "Posting..." : "Post Ride"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}