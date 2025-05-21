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

const postRideSchema = z.object({
  rideType: z.enum(["driver", "passenger"]),
  origin: z.string().min(1, "Origin is required"),
  originArea: z.string().min(1, "Origin area is required"),
  destination: z.string().min(1, "Destination is required"),
  destinationArea: z.string().min(1, "Destination area is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  availableSeats: z.string().optional(),
  price: z.string().optional(),
  genderPreference: z.string(),
  carModel: z.string().optional(),
  notes: z.string().optional(),
});

type PostRideFormValues = z.infer<typeof postRideSchema>;

export default function PostRide() {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const [isDriver, setIsDriver] = useState(true);

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
    },
  });

  const onSubmit = async (data: PostRideFormValues) => {
    // Check if user is logged in
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with your UF email to post a ride.",
        variant: "destructive",
      });
      return;
    }

    // Indicate submitting state in the UI
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.setAttribute('disabled', 'true');
      submitButton.textContent = 'Posting...';
    }

    try {
      // Calculate estimated arrival time (2 hours after departure for now)
      const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
      const arrivalDateTime = new Date(departureDateTime.getTime() + 2 * 60 * 60 * 1000);

      // Create simplified ride data to avoid serialization issues
      const rideData = {
        driver: {
          id: currentUser.uid,
          name: currentUser.displayName || "Anonymous",
          photoUrl: currentUser.photoURL || "",
          rating: 5.0, // Default for new users
          totalRides: 0,
          contactInfo: {
            email: currentUser.email || '',
            phone: currentUser.phoneNumber || '',
          },
        },
        origin: {
          city: data.origin,
          area: data.originArea,
        },
        destination: {
          city: data.destination,
          area: data.destinationArea,
        },
        departureTime: {
          seconds: Math.floor(departureDateTime.getTime() / 1000),
          nanoseconds: 0
        },
        arrivalTime: {
          seconds: Math.floor(arrivalDateTime.getTime() / 1000),
          nanoseconds: 0
        },
        seatsTotal: parseInt(data.availableSeats || "1"),
        seatsLeft: parseInt(data.availableSeats || "1"),
        price: parseFloat(data.price || "0"),
        genderPreference: data.genderPreference,
        carModel: data.carModel,
        notes: data.notes,
        createdAt: {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0
        },
        rideType: data.rideType,
      };

      console.log("Posting ride with data:", rideData);
      
      // First save to local storage as a backup
      localStorage.setItem('pendingRide', JSON.stringify(rideData));
      
      // Now try to save to Firestore
      const ridesCollection = collection(db, "rides");
      
      // Convert timestamp objects back to Firestore Timestamps
      const firestoreRideData = {
        ...rideData,
        departureTime: Timestamp.fromDate(departureDateTime),
        arrivalTime: Timestamp.fromDate(arrivalDateTime),
        createdAt: Timestamp.now()
      };
      
      try {
        const docRef = await addDoc(ridesCollection, firestoreRideData);
        console.log("Document written with ID: ", docRef.id);
        
        // Clear the local backup on success
        localStorage.removeItem('pendingRide');
        
        toast({
          title: "Success!",
          description: "Your ride has been posted successfully.",
        });
        
        // Navigate to find-rides after successful submission
        setLocation("/find-rides");
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        
        toast({
          title: "Partial Success",
          description: "Your ride was saved locally but not synced to the cloud yet. It will be available when you reconnect.",
        });
        
        // Still navigate away
        setLocation("/find-rides");
      }
    } catch (error) {
      console.error("Error posting ride:", error);
      toast({
        title: "Error",
        description: "There was a problem posting your ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset button state
      if (submitButton) {
        submitButton.removeAttribute('disabled');
        submitButton.textContent = 'Post Ride';
      }
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
            {/* Ride Type */}
            <FormField
              control={form.control}
              name="rideType"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>I am a...</FormLabel>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex items-center justify-center p-4 border-2 ${
                        isDriver
                          ? "border-orange-600 bg-orange-50 text-orange-600"
                          : "border-neutral-300 text-neutral-700"
                      } rounded-lg font-medium`}
                      onClick={() => handleRideTypeChange("driver")}
                    >
                      <Car className="mr-2 h-5 w-5" />
                      Driver
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className={`flex items-center justify-center p-4 border-2 ${
                        !isDriver
                          ? "border-orange-600 bg-orange-50 text-orange-600"
                          : "border-neutral-300 text-neutral-700"
                      } rounded-lg font-medium`}
                      onClick={() => handleRideTypeChange("passenger")}
                    >
                      <User className="mr-2 h-5 w-5" />
                      Passenger
                    </Button>
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origin */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                          <Input
                            placeholder="Departure city"
                            {...field}
                            className="w-full pl-10 pr-3 py-2"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Origin Area */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="originArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin Area</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Specific area (e.g., UF Campus, Midtown)"
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
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-500 h-4 w-4" />
                          <Input
                            placeholder="Arrival city"
                            {...field}
                            className="w-full pl-10 pr-3 py-2"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Destination Area */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="destinationArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Area</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Specific area (e.g., Downtown, UCF Area)"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date and Time */}
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
                            className="w-full pl-10 pr-3 py-2"
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
                            className="w-full pl-10 pr-3 py-2"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Available Seats (if driver) */}
              {isDriver && (
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
                            <SelectGroup>
                              <SelectItem value="1">1 seat</SelectItem>
                              <SelectItem value="2">2 seats</SelectItem>
                              <SelectItem value="3">3 seats</SelectItem>
                              <SelectItem value="4">4+ seats</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Price per Seat (if driver) */}
              {isDriver && (
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
                              placeholder="15"
                              {...field}
                              className="w-full pl-8 pr-3 py-2"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

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
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Posting..." : "Post Ride"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
