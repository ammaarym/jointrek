import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import { useToast } from '../hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRide } from '../lib/postgres-api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaCarSide, FaClock, FaMoneyBillWave, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { addHours, format } from 'date-fns';

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

// Specific time options for departure
const TIME_OPTIONS = [
  { label: "6:00 AM", value: "06:00" },
  { label: "7:00 AM", value: "07:00" },
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
  { label: "5:00 PM", value: "17:00" },
  { label: "6:00 PM", value: "18:00" },
  { label: "7:00 PM", value: "19:00" },
  { label: "8:00 PM", value: "20:00" },
  { label: "9:00 PM", value: "21:00" },
  { label: "10:00 PM", value: "22:00" }
];

// Gender preference options
const GENDER_PREFERENCES = [
  { label: "No Preference", value: "no-preference" },
  { label: "Male Only", value: "male" },
  { label: "Female Only", value: "female" }
];

// Validation schema
const rideSchema = z.object({
  rideType: z.string().default("driver"),
  origin: z.string().min(1, { message: "Origin city is required" }),
  originArea: z.string().min(1, { message: "Origin area is required" }),
  destination: z.string().min(1, { message: "Destination city is required" }),
  destinationArea: z.string().min(1, { message: "Destination area is required" }),
  departureDate: z.string().min(1, { message: "Departure date is required" }),
  departureTime: z.string().min(1, { message: "Departure time is required" }),
  seatsTotal: z.string().min(1, { message: "Number of seats is required" }),
  price: z.string().min(1, { message: "Price is required" }),
  genderPreference: z.string().default("no-preference"),
  carModel: z.string().optional(),
  notes: z.string().optional()
});

export default function PostRidePostgres() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // State for ride type toggle (not part of form)
  const [rideTypeDisplay, setRideTypeDisplay] = useState<'driver' | 'passenger'>('driver');
  
  // Form setup using React Hook Form with Zod validation
  const form = useForm<z.infer<typeof rideSchema>>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      rideType: "driver",
      origin: "Gainesville",
      originArea: "",
      destination: "",
      destinationArea: "",
      departureDate: format(new Date(), 'yyyy-MM-dd'),
      departureTime: "",
      seatsTotal: "1",
      price: "",
      genderPreference: "no-preference",
      carModel: "",
      notes: ""
    }
  });
  
  // Update the hidden rideType field when toggle button changes
  const handleRideTypeChange = (type: 'driver' | 'passenger') => {
    setRideTypeDisplay(type);
    form.setValue('rideType', type);
  };
  
  // Form submission
  const onSubmit = async (data: z.infer<typeof rideSchema>) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to post a ride",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate departure time by combining date and time
      const departureDate = new Date(data.departureDate);
      const [hours, minutes] = data.departureTime.split(':').map(Number);
      
      departureDate.setHours(hours, minutes);
      
      // Estimate arrival time (2 hours later)
      const arrivalTime = addHours(departureDate, 2);
      
      // Create ride object
      const ride = {
        driverId: currentUser.uid,
        origin: data.origin,
        originArea: data.originArea,
        destination: data.destination,
        destinationArea: data.destinationArea,
        departureTime: departureDate,
        arrivalTime: arrivalTime,
        seatsTotal: parseInt(data.seatsTotal),
        seatsLeft: parseInt(data.seatsTotal),
        price: data.price,
        genderPreference: data.genderPreference,
        carModel: data.carModel || "",
        notes: data.notes || "",
        rideType: data.rideType
      };
      
      // Post ride using the postgres API directly
      const newRide = await createRide(ride);
      
      if (!newRide) {
        throw new Error("Failed to create ride");
      }
      
      // Show success message
      toast({
        title: "Ride posted!",
        description: "Your ride has been successfully posted",
      });
      
      // Redirect to My Rides page
      setLocation('/my-rides');
    } catch (err: any) {
      console.error("Error posting ride:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to post ride",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Post a Ride</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6">
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">I am a...</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={rideTypeDisplay === 'driver' ? 'default' : 'outline'}
                className={`h-14 ${rideTypeDisplay === 'driver' ? 'bg-primary text-white' : 'border-gray-200'}`}
                onClick={() => handleRideTypeChange('driver')}
              >
                <FaCarSide className="mr-2 text-xl" />
                Driver
              </Button>
              <Button
                type="button"
                variant={rideTypeDisplay === 'passenger' ? 'default' : 'outline'}
                className={`h-14 ${rideTypeDisplay === 'passenger' ? 'bg-primary text-white' : 'border-gray-200'}`}
                onClick={() => handleRideTypeChange('passenger')}
              >
                <FaUser className="mr-2 text-xl" />
                Passenger
              </Button>
            </div>
            
            {/* Hidden ride type field */}
            <FormField
              control={form.control}
              name="rideType"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4">Origin</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">From City (Required)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-md border-gray-200">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FLORIDA_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="originArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Area (Required)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., UF Campus, Midtown" 
                          className="h-12 rounded-md border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <h2 className="text-xl font-bold mb-4">Destination</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">To City (Required)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-md border-gray-200">
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FLORIDA_CITIES.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="destinationArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Area (Required)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Downtown, UCF Area" 
                          className="h-12 rounded-md border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <h2 className="text-xl font-bold mb-4">Departure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Departure Date (Required)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          className="h-12 rounded-md border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Departure Time (Required)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-md border-gray-200">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_OPTIONS.map(time => (
                            <SelectItem key={time.value} value={time.value}>
                              {time.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <FormField
                  control={form.control}
                  name="seatsTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Available Seats (Required)</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-md border-gray-200">
                            <SelectValue placeholder="Select seats" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} seat{num > 1 ? 's' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Price per Person ($) (Required)</FormLabel>
                      <FormControl>
                        <Input 
                          type="text"
                          placeholder="e.g. 25" 
                          className="h-12 rounded-md border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <FormField
                  control={form.control}
                  name="genderPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Gender Preference</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-md border-gray-200">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GENDER_PREFERENCES.map(pref => (
                            <SelectItem key={pref.value} value={pref.value}>{pref.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="carModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Car Model</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Toyota Camry, Silver" 
                          className="h-12 rounded-md border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mb-8">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block mb-2">Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information about the ride..." 
                          className="rounded-md border-gray-200"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
      </Form>
    </div>
  );
}