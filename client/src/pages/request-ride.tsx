import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { FaLocationArrow, FaMapMarkerAlt, FaCalendar, FaClock, FaUser } from 'react-icons/fa';

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

// Time options for departure
const TIME_OPTIONS = [
  "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
  "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM",
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
];

export default function RequestRide() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Form state
  const [fromCity, setFromCity] = useState('');
  const [fromArea, setFromArea] = useState('');
  const [toCity, setToCity] = useState('');
  const [toArea, setToArea] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [genderPreference, setGenderPreference] = useState('no-preference');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a ride.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!fromCity || !fromArea || !toCity || !toArea || !departureDate || !departureTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate departure date is not in the past
    const selectedDate = new Date(departureDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Departure date cannot be in the past.",
        variant: "destructive"
      });
      return;
    }

    // Prevent rides from same city to same city
    if (fromCity === toCity) {
      toast({
        title: "Invalid Route",
        description: "Origin and destination cities cannot be the same.",
        variant: "destructive"
      });
      return;
    }

    // Only allow rides from/to Gainesville
    if (fromCity !== 'Gainesville' && toCity !== 'Gainesville') {
      toast({
        title: "Invalid Route",
        description: "All rides must start from or end in Gainesville.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create departure datetime string
      const departureDateTime = `${departureDate}T${convertTo24Hour(departureTime)}:00`;

      const rideData = {
        origin: fromCity,
        originArea: fromArea,
        destination: toCity,
        destinationArea: toArea,
        departureTime: departureDateTime,
        arrivalTime: departureDateTime, // Same as departure for requests
        seatsTotal: 1,
        seatsLeft: 1,
        price: '0', // Requests don't have set prices
        genderPreference: genderPreference === 'no-preference' ? 'no-preference' : genderPreference,
        notes: notes || null,
        rideType: 'passenger',
        driverId: currentUser.uid
      };

      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rideData)
      });

      if (!response.ok) {
        throw new Error('Failed to post ride request');
      }

      toast({
        title: "Ride request posted successfully!"
      });

      // Redirect to My Rides page
      setLocation('/my-rides');
    } catch (error: any) {
      console.error('Error posting ride request:', error);
      toast({
        title: "Error",
        description: "Failed to post ride request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to convert 12-hour time to 24-hour time
  const convertTo24Hour = (time12h: string): string => {
    const [time, period] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (period === 'AM' && hours === '12') {
      hours = '00';
    } else if (period === 'PM' && hours !== '12') {
      hours = (parseInt(hours) + 12).toString();
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Request a Ride</h1>
              <p className="text-gray-600">Looking for a ride? Post your request and let drivers find you!</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Origin Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaLocationArrow className="mr-2 text-primary" />
                Origin
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fromCity" className="block mb-2">From City (Required)</Label>
                  <Select value={fromCity} onValueChange={setFromCity}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLORIDA_CITIES.filter(city => city !== toCity).map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fromArea" className="block mb-2">Area (Required)</Label>
                  <Input
                    id="fromArea"
                    value={fromArea}
                    onChange={(e) => setFromArea(e.target.value)}
                    placeholder="e.g., UF Campus, Midtown"
                    className="h-12"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const tempCity = fromCity;
                  const tempArea = fromArea;
                  setFromCity(toCity);
                  setFromArea(toArea);
                  setToCity(tempCity);
                  setToArea(tempArea);
                }}
                className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                title="Swap origin and destination"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Destination Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-primary" />
                Destination
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="toCity" className="block mb-2">To City (Required)</Label>
                  <Select value={toCity} onValueChange={setToCity}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLORIDA_CITIES.filter(city => city !== fromCity).map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="toArea" className="block mb-2">Area (Required)</Label>
                  <Input
                    id="toArea"
                    value={toArea}
                    onChange={(e) => setToArea(e.target.value)}
                    placeholder="e.g., Downtown, UCF Area"
                    className="h-12"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Departure Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaCalendar className="mr-2 text-primary" />
                Departure
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="departureDate" className="block mb-2">Departure Date (Required)</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="departureTime" className="block mb-2">Departure Time (Required)</Label>
                  <Select value={departureTime} onValueChange={setDepartureTime}>
                    <SelectTrigger className="h-12">
                      <FaClock className="mr-2" />
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Gender Preference */}
            <div>
              <Label htmlFor="genderPreference" className="block mb-2 flex items-center">
                <FaUser className="mr-2 text-primary" />
                Gender Preference
              </Label>
              <Select value={genderPreference} onValueChange={setGenderPreference}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="No preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-preference">No preference</SelectItem>
                  <SelectItem value="male">Male only</SelectItem>
                  <SelectItem value="female">Female only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="notes" className="block mb-2">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information for drivers..."
                rows={3}
                className="resize-none"
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">{notes.length}/200 characters</p>
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full h-12 bg-primary hover:bg-primary/90 font-medium"
            >
              {submitting ? "Posting..." : "Post Ride Request"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}