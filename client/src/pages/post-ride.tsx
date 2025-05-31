import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Car, User, Calendar, Clock, MapPin, DollarSign } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define the form schema
const postRideSchema = z.object({
  rideType: z.enum(["driver", "passenger"]),
  origin: z.string().min(1, "Origin is required"),
  originArea: z.string().min(1, "Origin area is required"),
  destination: z.string().min(1, "Destination is required"),
  destinationArea: z.string().min(1, "Destination area is required"),
  departureDate: z.string().min(1, "Departure date is required")
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, { message: "Departure date cannot be in the past" }),
  departureTime: z.string().min(1, "Departure time is required"),
  availableSeats: z.string().optional(),
  price: z.string().optional(),
  genderPreference: z.string(),
  carModel: z.string().optional(),
  notes: z.string().optional(),
  // Contact fields
  phone: z.string().optional(),
  instagram: z.string().optional(),
  snapchat: z.string().optional(),
});

// Type for form values
type PostRideFormValues = z.infer<typeof postRideSchema>;

export default function PostRide() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const [isDriver, setIsDriver] = useState(true);
  
  // Form setup with validation
  const form = useForm<PostRideFormValues>({
    resolver: zodResolver(postRideSchema),
    defaultValues: {
      rideType: "driver",
      origin: "Gainesville",
      originArea: "",
      destination: "",
      destinationArea: "",
      departureDate: "",
      departureTime: "",
      availableSeats: "1",
      price: "",
      genderPreference: "no-preference",
      carModel: "",
      notes: "",
      // Contact fields
      phone: "",
      instagram: "",
      snapchat: "",
    },
  });

  // Track submission state for UI feedback
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const onSubmit = async (data: PostRideFormValues) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring duplicate submission");
      return;
    }
    
    console.log("Form submission started with data:", data);
    
    // Check authentication
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with your UF email to post a ride.",
        variant: "destructive",
      });
      return;
    }

    // Update UI to show loading state
    setIsSubmitting(true);
    
    try {
      // Calculate ride times
      const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
      const arrivalDateTime = new Date(departureDateTime.getTime() + 2 * 60 * 60 * 1000);
      
      // Create ride data object compatible with existing components
      const rideData = {
        driver: {
          id: currentUser.uid,
          name: currentUser.displayName || "Anonymous",
          photoUrl: currentUser.photoURL || "",
          rating: 5.0,
          totalRides: 0,
          contactInfo: {
            email: currentUser.email || '',
            phone: data.phone || '',
            instagram: data.instagram || '',
            snapchat: data.snapchat || ''
          }
        },
        origin: {
          city: data.origin,
          area: data.originArea || '',
        },
        destination: {
          city: data.destination,
          area: data.destinationArea || '',
        },
        departureTime: Timestamp.fromDate(departureDateTime),
        arrivalTime: Timestamp.fromDate(arrivalDateTime),
        seatsTotal: parseInt(data.availableSeats || "1"),
        seatsLeft: parseInt(data.availableSeats || "1"),
        price: parseFloat(data.price || "0"),
        genderPreference: data.genderPreference,
        carModel: data.carModel || '',
        notes: data.notes || '',
        createdAt: Timestamp.now(),
        rideType: data.rideType,
      };
      
      console.log("Posting ride with data:", rideData);
      
      // Get reference to the rides collection
      const ridesCollection = collection(db, "rides");
      
      // Add document to Firestore
      const docRef = await addDoc(ridesCollection, rideData);
      console.log("Ride posted successfully with ID:", docRef.id);
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your ride has been posted successfully.",
      });

      // Navigate to find-rides page
      setLocation("/find-rides");
      
    } catch (error: any) {
      console.error("Error posting ride:", error);
      
      // Show error message with details
      toast({
        title: "Posting Error",
        description: error.message || "Failed to post ride. Please try again.",
        variant: "destructive",
      });
      
      // Reset submission state
      setIsSubmitting(false);
    }
  };

  const handleRideTypeChange = (type: "driver" | "passenger") => {
    setIsDriver(type === "driver");
    form.setValue("rideType", type);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 dark:text-white">Post a Ride</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Ride Type Selection */}
            <div className="flex space-x-4 mb-6">
              <Button
                type="button"
                onClick={() => handleRideTypeChange("driver")}
                className={`flex-1 py-3 ${
                  isDriver
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                <Car className="mr-2 h-5 w-5" />
                I'm a Driver
              </Button>
              
              <Button
                type="button"
                onClick={() => handleRideTypeChange("passenger")}
                className={`flex-1 py-3 ${
                  !isDriver
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100"
                }`}
              >
                <User className="mr-2 h-5 w-5" />
                I'm a Passenger
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origin */}
              <div>
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                          <Input
                            placeholder="e.g. Gainesville"
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="originArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin Area</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Campus, Midtown"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Destination */}
              <div>
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination City</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                          <Input
                            placeholder="e.g. Orlando"
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="destinationArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Area</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Downtown, UCF"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Departure Date & Time */}
              <div>
                <FormField
                  control={form.control}
                  name="departureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                          <Input
                            type="date"
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="departureTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Time</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Clock className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                          <Input
                            type="time"
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Seats & Price */}
              <div>
                <FormField
                  control={form.control}
                  name="availableSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Seats</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-neutral-700">
                            <SelectValue placeholder="Select seats" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 seat</SelectItem>
                          <SelectItem value="2">2 seats</SelectItem>
                          <SelectItem value="3">3 seats</SelectItem>
                          <SelectItem value="4">4 seats</SelectItem>
                          <SelectItem value="5">5+ seats</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Seat</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Gender Preference */}
              <div>
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
                          <SelectTrigger className="bg-white dark:bg-neutral-700">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no-preference">No preference</SelectItem>
                          <SelectItem value="female">Female riders only</SelectItem>
                          <SelectItem value="male">Male riders only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Car Details (if driver) */}
              {isDriver && (
                <div>
                  <FormField
                    control={form.control}
                    name="carModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Car Model</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Toyota Camry, Silver"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Additional Notes */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information about the ride..."
                          rows={3}
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Submit Button */}
              <div className="md:col-span-2 mt-4">
                <Button
                  type="submit"
                  className="submit-btn w-full bg-orange-600 text-white py-6 h-auto rounded-md font-medium hover:bg-opacity-90 transition text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="mr-2 animate-spin w-5 h-5 border-2 border-t-transparent border-white rounded-full"></div>
                      Posting...
                    </div>
                  ) : (
                    "Post Ride"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}