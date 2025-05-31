import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth-new';
import { usePostgresRides } from '../hooks/use-postgres-rides';
import { combineDateAndTime, calculateArrivalTime } from '../lib/date-utils';
import { toast } from '../hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaCarSide, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { TbGenderMale, TbGenderFemale } from 'react-icons/tb';
import { BiMessageDetail } from 'react-icons/bi';

export default function PostRidePostgres() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { postRide, loading, error } = usePostgresRides();
  
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
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [snapchat, setSnapchat] = useState('');
  
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
      carModel,
      notes,
      phone,
      instagram,
      snapchat
    });
    
    try {
      // Convert form data to ride object
      const departureDateTime = combineDateAndTime(departureDate, departureTime);
      
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
        notes: notes || null,
        rideType,
        phone: phone || null,
        instagram: instagram || null,
        snapchat: snapchat || null
      };
      
      console.log('Posting ride with data:', rideData);
      
      // Post the ride
      const ride = await postRide(rideData);
      
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
                    {rideType === 'driver' ? 'Price per Person ($) (Required)' : 'Amount Willing to Pay ($) (Required)'}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 15.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
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
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Any other details about your trip</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">
                  <BiMessageDetail className="inline mr-2" />
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional details about your trip..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Add optional contact methods (will be visible to others)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 352-123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="Your Instagram username"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="snapchat">Snapchat</Label>
                  <Input
                    id="snapchat"
                    placeholder="Your Snapchat username"
                    value={snapchat}
                    onChange={(e) => setSnapchat(e.target.value)}
                  />
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