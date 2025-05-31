import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addHours, format } from 'date-fns';

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
  "Clearwater",
  "Sarasota"
];

// Time periods for departure
const TIME_PERIODS = [
  { label: "Morning (8am-12pm)", value: "morning", hour: 9 },
  { label: "Afternoon (12pm-5pm)", value: "afternoon", hour: 14 },
  { label: "Evening (5pm-9pm)", value: "evening", hour: 18 }
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
  departureDate: z.string().min(1, { message: "Departure date is required" })
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, { message: "Departure date cannot be in the past" }),
  departureTime: z.string().min(1, { message: "Departure time is required" }),
  availableSeats: z.string().min(1, { message: "Available seats is required" }),
  price: z.string().min(1, { message: "Price is required" }),
  genderPreference: z.string().min(1, { message: "Gender preference is required" }),
  carModel: z.string().optional(),
  notes: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  snapchat: z.string().optional()
});

type RideFormValues = z.infer<typeof rideSchema>;

export default function PostRidePage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RideFormValues>({
    resolver: zodResolver(rideSchema),
    defaultValues: {
      rideType: "driver",
      origin: "",
      originArea: "",
      destination: "",
      destinationArea: "",
      departureDate: format(new Date(), 'yyyy-MM-dd'),
      departureTime: "afternoon",
      availableSeats: "1",
      price: "",
      genderPreference: "no-preference",
      carModel: "",
      notes: "",
      phone: "",
      instagram: "",
      snapchat: ""
    }
  });

  const onSubmit = async (data: RideFormValues) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post a ride",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log("Form submission started with data:", data);

    try {
      // Parse the selected time period to get actual hours
      const selectedTimePeriod = TIME_PERIODS.find(t => t.value === data.departureTime);
      const departureHour = selectedTimePeriod ? selectedTimePeriod.hour : 12; // Default to noon if not found
      
      // Create a date object from the form data
      const departureDate = new Date(data.departureDate);
      departureDate.setHours(departureHour, 0, 0, 0);
      
      // Estimate arrival time (2 hours after departure)
      const arrivalTime = addHours(departureDate, 2);

      // Prepare ride data
      const rideData = {
        driverId: currentUser.uid,
        origin: data.origin,
        originArea: data.originArea,
        destination: data.destination,
        destinationArea: data.destinationArea,
        departureTime: departureDate.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        seatsTotal: parseInt(data.availableSeats),
        seatsLeft: parseInt(data.availableSeats),
        price: data.price,
        genderPreference: data.genderPreference,
        carModel: data.carModel || null,
        notes: data.notes || null,
        rideType: data.rideType
      };

      console.log("Posting ride with data:", rideData);

      // Post the ride to your API
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rideData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post ride');
      }

      const createdRide = await response.json();
      setSuccess(true);
      toast({
        title: "Ride posted successfully!",
        description: "Your ride has been created and is now visible to others.",
      });
      
      // Reset the form
      form.reset();
    } catch (err: any) {
      console.error("Error posting ride:", err);
      setError("Failed to post ride. Please try again.");
      toast({
        title: "Error",
        description: err.message || "Failed to post your ride. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-6">Post a Ride</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Ride Details</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Origin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From City (Required)</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FLORIDA_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
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
                name="originArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From Area (Required)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. University, Downtown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To City (Required)</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FLORIDA_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
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
                name="destinationArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To Area (Required)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Airport, Downtown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Departure Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Date (Required)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Departure Time (Required)</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_PERIODS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Seats and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="availableSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Seats (Required)</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seats" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}
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
                    <FormLabel>Price per Person ($) (Required)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g. 25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Gender Preference and Car Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="genderPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender Preference</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GENDER_PREFERENCES.map((pref) => (
                          <SelectItem key={pref.value} value={pref.value}>
                            {pref.label}
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
                name="carModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Toyota Camry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Additional Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Any other details about your trip</p>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details about your trip..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Contact Information */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Add optional contact methods (will be visible to others)</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 3527881234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="snapchat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Snapchat</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Posting..." : "Post Ride"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}