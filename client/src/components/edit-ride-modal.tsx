import React, { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FaMapMarkerAlt, FaClock, FaUser } from "react-icons/fa";
import { Ride } from "@/lib/types";

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
  "Fort Myers",
  "West Palm Beach",
  "Daytona Beach",
  "Boca Raton",
  "Sarasota",
  "Naples"
];

// Car makes for the vehicle dropdown
const CAR_MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes-Benz",
  "Audi", "Lexus", "Hyundai", "Kia", "Mazda", "Subaru", "Volkswagen", 
  "Jeep", "GMC", "Cadillac", "Infiniti", "Acura", "Buick", "Chrysler",
  "Dodge", "Ram", "Lincoln", "Volvo", "Jaguar", "Land Rover"
];

// Simplified car models - most popular models for each make
const CAR_MODELS: Record<string, string[]> = {
  "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Prius", "Sienna", "Tacoma", "4Runner"],
  "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey", "HR-V", "Ridgeline", "Passport"],
  "Ford": ["F-150", "Explorer", "Escape", "Edge", "Expedition", "Mustang", "Fusion", "Transit"],
  "Chevrolet": ["Silverado", "Equinox", "Tahoe", "Malibu", "Traverse", "Suburban", "Camaro", "Impala"],
  "Nissan": ["Altima", "Sentra", "Rogue", "Pathfinder", "Armada", "Titan", "Murano", "Versa"],
  "BMW": ["3 Series", "5 Series", "X3", "X5", "X1", "7 Series", "X7", "i3"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLE", "GLC", "S-Class", "A-Class", "GLS", "Sprinter"],
  "Audi": ["A4", "Q5", "A6", "Q7", "A3", "Q3", "A8", "e-tron"],
  "Lexus": ["ES", "RX", "NX", "GX", "LS", "IS", "LX", "UX"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Accent", "Venue", "Genesis"],
  "Kia": ["Forte", "Optima", "Sorento", "Sportage", "Telluride", "Rio", "Soul", "Stinger"],
  "Mazda": ["Mazda3", "CX-5", "CX-9", "Mazda6", "CX-3", "CX-30", "MX-5 Miata", "CX-90"],
  "Subaru": ["Outback", "Forester", "Impreza", "Ascent", "Legacy", "Crosstrek", "WRX", "BRZ"],
  "Volkswagen": ["Jetta", "Passat", "Tiguan", "Atlas", "Golf", "Beetle", "Arteon", "ID.4"],
  "Jeep": ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator", "Grand Wagoneer", "Avenger"],
  "GMC": ["Sierra", "Terrain", "Acadia", "Yukon", "Canyon", "Savana", "Hummer EV", "Denali"],
  "Cadillac": ["Escalade", "XT5", "XT4", "CT5", "XT6", "Lyriq", "CT4", "Celestiq"],
  "Infiniti": ["Q50", "QX60", "QX80", "Q60", "QX50", "QX55", "Q70", "QX30"],
  "Acura": ["TLX", "MDX", "RDX", "ILX", "NSX", "TSX", "TL", "ZDX"],
  "Buick": ["Enclave", "Encore", "Envision", "Lacrosse", "Regal", "Verano", "Cascada", "Envista"],
  "Chrysler": ["Pacifica", "300", "Voyager", "Aspen", "Town & Country", "Sebring", "200", "Crossfire"],
  "Dodge": ["Charger", "Challenger", "Durango", "Journey", "Grand Caravan", "Ram", "Viper", "Dart"],
  "Ram": ["1500", "2500", "3500", "ProMaster", "ProMaster City", "Dakota", "Rebel", "TRX"],
  "Lincoln": ["Navigator", "Aviator", "Corsair", "Nautilus", "Continental", "MKZ", "MKX", "Blackwood"],
  "Volvo": ["XC90", "XC60", "S60", "V60", "XC40", "S90", "V90", "C40"],
  "Jaguar": ["F-PACE", "XE", "XF", "E-PACE", "I-PACE", "XJ", "F-TYPE", "XK"],
  "Land Rover": ["Range Rover", "Discovery", "Range Rover Sport", "Range Rover Evoque", "Defender", "Discovery Sport", "Range Rover Velar", "Freelander"]
};

// Generate years from 1980 to 2026
const CAR_YEARS = Array.from({ length: 47 }, (_, i) => (2026 - i).toString());

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

  // Form fields - initialize with current ride data
  const [origin, setOrigin] = useState('');
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

  // Available models for selected make
  const availableModels = carMake ? CAR_MODELS[carMake] || [] : [];

  // Reset model and year when make changes
  useEffect(() => {
    setCarModel('');
    setCarYear('');
  }, [carMake]);

  // Reset year when model changes
  useEffect(() => {
    setCarYear('');
  }, [carModel]);

  // Update form when ride changes
  useEffect(() => {
    if (ride) {
      try {
        const departureDate = new Date(ride.departureTime as any);
        const dateString = departureDate.toISOString().split('T')[0];
        const timeString = `${departureDate.getHours().toString().padStart(2, "0")}:${departureDate.getMinutes().toString().padStart(2, "0")}`;

        setOrigin((ride as any).origin || 'Gainesville');
        setOriginArea((ride as any).originArea || '');
        setDestination((ride as any).destination || '');
        setDestinationArea((ride as any).destinationArea || '');
        setDepartureDate(dateString);
        setDepartureTime(timeString);
        setAvailableSeats((ride.seatsTotal || 1).toString());
        setPrice((ride.price || '').toString());
        setGenderPreference(ride.genderPreference || 'no-preference');
        setCarMake(ride.carMake || '');
        setCarModel(ride.carModel || '');
        setCarYear(ride.carYear ? ride.carYear.toString() : '');
        setBaggageCheckIn((ride.baggageCheckIn || 0).toString());
        setBaggagePersonal((ride.baggagePersonal || 0).toString());
      } catch (error) {
        console.error('Error parsing ride data:', error);
      }
    }
  }, [ride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ride) return;

    // Prevent multiple submissions
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Basic validation
    if (!destination || !departureDate || !departureTime || !price) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields",
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
    if (ride.rideType === 'driver') {
      if (!availableSeats || !carMake || !carModel || !carYear) {
        toast({
          title: "Missing Information",
          description: "Please fill in available seats, car make, model, and year",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Create combined date-time
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
      
      // Calculate arrival time (2 hours later)
      const arrivalTime = new Date(departureDateTime.getTime() + (2 * 60 * 60 * 1000));

      // Prepare update data
      const updateData = {
        origin,
        originArea,
        destination,
        destinationArea,
        departureTime: departureDateTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        seatsTotal: ride.rideType === 'passenger' ? 1 : parseInt(availableSeats),
        seatsLeft: ride.rideType === 'passenger' ? 1 : parseInt(availableSeats),
        price: price,
        genderPreference,
        carMake: ride.rideType === 'driver' ? carMake : null,
        carModel: ride.rideType === 'driver' ? carModel : null,
        carYear: ride.rideType === 'driver' && carYear ? parseInt(carYear) : null,
        baggageCheckIn: parseInt(baggageCheckIn) || 0,
        baggagePersonal: parseInt(baggagePersonal) || 0,
      };

      const success = await updateRide(parseInt(ride.id as any), updateData);

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

  const isDriverRide = ride.rideType === 'driver';
  const isPassengerRequest = ride.rideType === 'passenger';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Your {isDriverRide ? 'Ride Post' : 'Ride Request'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Route Information */}
          <Card>
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

          {/* Trip Details */}
          <Card>
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

              {isDriverRide && (
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
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'seat' : 'seats'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vehicle Information (only for drivers) */}
          {isDriverRide && (
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information (Required)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carMake">Car Make</Label>
                    <Select value={carMake} onValueChange={setCarMake}>
                      <SelectTrigger id="carMake">
                        <SelectValue placeholder="Select make" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAR_MAKES.map((make) => (
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
                        {availableModels.map((model) => (
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
                        {CAR_YEARS.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Baggage Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isDriverRide ? 'Available Baggage Space' : 'Baggage Requirements'}
              </CardTitle>
              <CardDescription>
                {isDriverRide 
                  ? 'How many bags can you accommodate in your vehicle?' 
                  : 'How many bags will you be bringing?'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baggageCheckIn">
                    {isDriverRide ? 'Check-in Bags (Can accommodate)' : 'Check-in Bags (Bringing)'}
                  </Label>
                  <Select value={baggageCheckIn} onValueChange={setBaggageCheckIn}>
                    <SelectTrigger id="baggageCheckIn">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} bags
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Large suitcases, duffel bags</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baggagePersonal">
                    {isDriverRide ? 'Personal Bags (Can accommodate)' : 'Personal Bags (Bringing)'}
                  </Label>
                  <Select value={baggagePersonal} onValueChange={setBaggagePersonal}>
                    <SelectTrigger id="baggagePersonal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} bags
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Backpacks, smaller bags</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing and Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing and Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    💰 {isDriverRide ? 'Total Price ($5 - $50)' : 'Price willing to pay ($5 - $50)'}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="5"
                    max="50"
                    placeholder={isDriverRide ? "Enter total price" : "Enter price"}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  {isPassengerRequest && (
                    <p className="text-xs text-muted-foreground">
                      Set the price you're willing to pay
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genderPreference">
                    👥 Gender Preference
                  </Label>
                  <Select value={genderPreference} onValueChange={setGenderPreference}>
                    <SelectTrigger id="genderPreference">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-preference">No Preference</SelectItem>
                      <SelectItem value="male-only">Male Only</SelectItem>
                      <SelectItem value="female-only">Female Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}