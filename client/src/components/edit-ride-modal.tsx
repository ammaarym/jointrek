import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../hooks/use-toast";
import { usePostgresRides } from "../hooks/use-postgres-rides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { addHours, format } from "date-fns";
import { Ride } from "@/lib/types";
// Car type options with MPG values
const CAR_TYPES = [
  { label: "Sedan", value: "sedan", mpg: 32 },
  { label: "SUV", value: "suv", mpg: 25 },
  { label: "Truck", value: "truck", mpg: 22 },
  { label: "Minivan", value: "minivan", mpg: 28 },
];

// Distance data from Gainesville to major Florida cities
const CITY_DISTANCES = {
  Orlando: { miles: 113, hours: 2 },
  Tampa: { miles: 125, hours: 2.5 },
  Miami: { miles: 350, hours: 5.5 },
  Jacksonville: { miles: 73, hours: 1.5 },
  Tallahassee: { miles: 140, hours: 2.5 },
  "Fort Lauderdale": { miles: 340, hours: 5 },
  "St. Petersburg": { miles: 135, hours: 2.5 },
  Pensacola: { miles: 340, hours: 5 },
  "Daytona Beach": { miles: 125, hours: 2 },
  "Fort Myers": { miles: 200, hours: 3.5 },
};

// Enhanced pricing calculation
function calculateRidePrice(params: {
  distance: number;
  mpg: number;
  gasPrice: number;
  destination: string;
  date?: Date;
}): number {
  const { distance, mpg, gasPrice, destination, date } = params;
  const buffer = 0.2; // 20% markup
  const tollCities = ["Miami", "Tampa"];
  const tollFee = tollCities.includes(destination) ? 2.5 : 0;

  // Raw cost calculation
  let baseCost = (distance / mpg) * gasPrice;
  let total = baseCost * (1 + buffer) + tollFee;

  // Weekend check (Friday = 5, Saturday = 6)
  if (date) {
    const day = date.getDay();
    if (day === 5 || day === 6) {
      total *= 1.1; // 10% increase on weekends
    }
  }

  // Apply floor and ceiling
  total = Math.max(8, Math.min(total, 60));

  // Round to nearest dollar
  return Math.round(total);
}

// List of Florida cities
const FLORIDA_CITIES = [
  "Gainesville",
  "Orlando",
  "Tampa",
  "Miami",
  "Jacksonville",
  "Tallahassee",
  "Fort Lauderdale",
  "St. Petersburg",
  "Pensacola",
  "Daytona Beach",
  "Fort Myers",
  "Sarasota",
  "Key West",
  "Naples",
];

// Time options
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
  { label: "10:00 PM", value: "22:00" },
];

// Gender preference options
const GENDER_PREFERENCES = [
  { label: "No Preference", value: "no-preference" },
  { label: "Male Only", value: "male" },
  { label: "Female Only", value: "female" },
];

// Validation schema (no price field - automatically calculated)
const editRideSchema = z.object({
  destination: z.string().min(1, { message: "Destination is required" }),
  destinationArea: z
    .string()
    .min(1, { message: "Destination area is required" }),
  departureDate: z.string().min(1, { message: "Departure date is required" }),
  departureTime: z.string().min(1, { message: "Departure time is required" }),
  seatsTotal: z.string().min(1, { message: "Number of seats is required" }),
  carType: z.string().min(1, { message: "Car type is required" }),
  genderPreference: z.string().default("no-preference"),
  notes: z.string().optional(),
});

interface EditRideModalProps {
  ride: Ride | null;
  isOpen: boolean;
  onClose: () => void;
  onRideUpdated: () => void;
  updateRide: (id: number, data: any) => Promise<boolean>;
}

export default function EditRideModal({
  ride,
  isOpen,
  onClose,
  onRideUpdated,
  updateRide,
}: EditRideModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof editRideSchema>>({
    resolver: zodResolver(editRideSchema),
    defaultValues: {
      destination: "",
      destinationArea: "",
      departureDate: "",
      departureTime: "",
      seatsTotal: "",
      carType: "",
      genderPreference: "no-preference",
      notes: "",
    },
  });

  // Update form when ride changes
  useEffect(() => {
    if (ride) {
      try {
        const departureDate = new Date(ride.departureTime as any);
        const timeString = `${departureDate.getHours().toString().padStart(2, "0")}:${departureDate.getMinutes().toString().padStart(2, "0")}`;

        form.reset({
          destination: ride.destination || "",
          destinationArea: ride.destinationArea || "",
          departureDate: format(departureDate, "yyyy-MM-dd"),
          departureTime: timeString,
          seatsTotal: ride.seatsTotal.toString(),
          carType: ride.carModel || "sedan",
          genderPreference: ride.genderPreference || "no-preference",
          notes: ride.notes || "",
        });
      } catch (error) {
        console.log("Error updating form:", error);
      }
    }
  }, [ride, form]);

  const onSubmit = async (data: z.infer<typeof editRideSchema>) => {
    if (!ride) return;

    setIsSubmitting(true);
    try {
      // Create departure datetime
      const departureDate = new Date(data.departureDate);
      const [hours, minutes] = data.departureTime.split(":").map(Number);
      departureDate.setHours(hours, minutes);

      // Calculate realistic arrival time based on destination
      const cityData =
        CITY_DISTANCES[data.destination as keyof typeof CITY_DISTANCES];
      const travelHours = cityData ? cityData.hours : 2;
      const arrivalTime = addHours(departureDate, travelHours);

      // Calculate automatic price using enhanced formula
      let calculatedPrice = "25"; // fallback price

      const carType = CAR_TYPES.find((car) => car.value === data.carType);
      if (carType && cityData) {
        const price = calculateRidePrice({
          distance: cityData.miles,
          mpg: carType.mpg,
          gasPrice: 3.45, // fallback gas price
          destination: data.destination,
          date: departureDate,
        });
        calculatedPrice = price.toString();
      }

      // Update ride object
      const updatedRide = {
        destination: data.destination,
        destinationArea: data.destinationArea,
        departureTime: departureDate,
        arrivalTime: arrivalTime,
        seatsTotal: parseInt(data.seatsTotal),
        seatsLeft: parseInt(data.seatsTotal), // Reset available seats
        price: calculatedPrice,
        genderPreference: data.genderPreference,
        carModel: data.carType,
        notes: data.notes || "",
      };

      // Update ride via hook
      console.log('Updating ride with data:', updatedRide);
      const success = await updateRide(
        parseInt(ride.id.toString()),
        updatedRide,
      );

      if (success) {
        toast({
          title: "Ride updated successfully!",
        });
        onRideUpdated();
        onClose();
      } else {
        throw new Error("Failed to update ride");
      }
    } catch (error) {
      console.error("Error updating ride:", error);
      toast({
        title: "Error updating ride",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ride) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Ride</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination City (Required)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FLORIDA_CITIES.filter(
                          (city) => city !== "Gainesville",
                        ).map((city) => (
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
                    <FormLabel>Destination Area (Required)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Downtown, Beach" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        {TIME_OPTIONS.map((time) => (
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

            {/* Car Type and Seats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="carType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car Type (Required)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select car type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAR_TYPES.map((car) => (
                          <SelectItem key={car.value} value={car.value}>
                            {car.label}
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
                name="seatsTotal"
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
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
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
            </div>

            {/* Gender Preference */}
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about the ride..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Updating..." : "Update Ride"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
