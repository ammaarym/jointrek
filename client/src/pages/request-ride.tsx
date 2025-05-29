import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please log in to request a ride.",
        variant: "destructive"
      });
      return;
    }

    if (!fromCity || !toCity || !departureDate || !departureTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // Convert time to 24-hour format and create proper datetime
      const [time, period] = departureTime.split(' ');
      const [hours, minutes] = time.split(':');
      let hour24 = parseInt(hours);
      
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }

      const departureDateTime = new Date(`${departureDate}T${hour24.toString().padStart(2, '0')}:${minutes}:00`);
      const arrivalDateTime = new Date(departureDateTime.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours

      const rideData = {
        driverId: currentUser.uid,
        origin: fromArea ? `${fromCity}, ${fromArea}` : fromCity,
        destination: toArea ? `${toCity}, ${toArea}` : toCity,
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalDateTime.toISOString(),
        seatsTotal: 1, // Default for passenger requests
        seatsLeft: 1,
        price: 0, // Passengers don't set price
        genderPreference: genderPreference,
        notes: notes,
        rideType: 'passenger' as const
      };

      await apiRequest('/api/rides', 'POST', rideData);

      toast({
        title: "Ride request posted!",
        description: "Your ride request has been posted successfully. Drivers can now see your request.",
        duration: 5000
      });

      // Redirect to My Rides page
      setLocation('/my-rides');

    } catch (error: any) {
      console.error('Error posting ride request:', error);
      toast({
        title: "Error posting ride request",
        description: error.message || "There was a problem posting your ride request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Request a Ride</CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Looking for a ride? Post your request and let drivers find you!
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Origin Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Origin</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromCity" className="text-sm font-medium">
                      From City (Required)
                    </Label>
                    <div className="relative mt-1">
                      <FaLocationArrow className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Select value={fromCity} onValueChange={setFromCity}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {FLORIDA_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fromArea" className="text-sm font-medium">
                      Area (Required)
                    </Label>
                    <Input
                      id="fromArea"
                      value={fromArea}
                      onChange={(e) => setFromArea(e.target.value)}
                      placeholder="e.g., UF Campus, Midtown"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Destination Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Destination</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="toCity" className="text-sm font-medium">
                      To City (Required)
                    </Label>
                    <div className="relative mt-1">
                      <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Select value={toCity} onValueChange={setToCity}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          {FLORIDA_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="toArea" className="text-sm font-medium">
                      Area (Required)
                    </Label>
                    <Input
                      id="toArea"
                      value={toArea}
                      onChange={(e) => setToArea(e.target.value)}
                      placeholder="e.g., Downtown, UCF Area"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Departure Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Departure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departureDate" className="text-sm font-medium">
                      Departure Date (Required)
                    </Label>
                    <div className="relative mt-1">
                      <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="departureDate"
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        min={today}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="departureTime" className="text-sm font-medium">
                      Departure Time (Required)
                    </Label>
                    <div className="relative mt-1">
                      <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Select value={departureTime} onValueChange={setDepartureTime}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gender Preference */}
              <div>
                <Label htmlFor="genderPreference" className="text-sm font-medium">
                  Gender Preference
                </Label>
                <div className="relative mt-1">
                  <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Select value={genderPreference} onValueChange={setGenderPreference}>
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">No preference</SelectItem>
                      <SelectItem value="male">Male drivers only</SelectItem>
                      <SelectItem value="female">Female drivers only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Additional Notes (Optional)
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information for drivers..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {notes.length}/200 characters
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3"
              >
                {submitting ? 'Posting Request...' : 'Post Ride Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}