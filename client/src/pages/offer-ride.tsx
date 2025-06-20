import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth-new";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Clock, DollarSign, Users, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OfferRidePage() {
  const [, params] = useRoute("/offer-ride/:id");
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [isOnboarding, setIsOnboarding] = useState(false);

  const rideId = params?.id ? parseInt(params.id) : null;

  // Fetch ride details (passenger post)
  const { data: rides, isLoading: ridesLoading } = useQuery({
    queryKey: ["/api/rides"],
    enabled: !!rideId,
  });

  const ride = Array.isArray(rides) ? rides.find((r: any) => r.id === rideId) : null;

  // Check driver status
  const { data: driverStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/driver/status"],
    enabled: !!currentUser,
  });

  const isDriverOnboarded = driverStatus?.isOnboarded === true;

  // Driver onboarding mutation
  const startOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/driver/onboard");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        toast({
          title: "Already Setup",
          description: "Your driver account is already set up",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/driver/status"] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Setup Error",
        description: error.message || "Failed to start driver setup",
        variant: "destructive",
      });
    },
  });

  // Create driver offer mutation
  const createOfferMutation = useMutation({
    mutationFn: async ({ rideId, price, message }: { rideId: number; price: number; message?: string }) => {
      const response = await apiRequest("POST", "/api/driver-offers", {
        passengerRideId: rideId,
        price,
        message: message?.trim() || undefined
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Offer Sent",
        description: "Your ride offer has been sent to the passenger.",
      });
      setLocation("/my-rides");
    },
    onError: (error: any) => {
      toast({
        title: "Offer Failed",
        description: error.message || "Failed to send offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartOnboarding = () => {
    setIsOnboarding(true);
    startOnboardingMutation.mutate();
  };

  const handleConfirmOffer = () => {
    if (!ride || !currentUser || !price) {
      toast({
        title: "Missing Information",
        description: "Please enter a price for your ride offer.",
        variant: "destructive",
      });
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than $0.",
        variant: "destructive",
      });
      return;
    }

    createOfferMutation.mutate({
      rideId: ride.id,
      price: priceValue,
      message: message?.trim() || undefined
    });
  };

  if (ridesLoading || statusLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Passenger request not found</p>
            <Button 
              onClick={() => setLocation("/find-rides")} 
              className="mt-4"
            >
              Back to Find Rides
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/find-rides")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Find Rides
        </Button>
        <h1 className="text-3xl font-bold">Offer a Trek</h1>
        <p className="text-gray-600 mt-2">Review the passenger's request and offer your driving services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Passenger Request Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Passenger Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">From</Label>
                  <p className="font-semibold">{ride.origin.city}</p>
                  <p className="text-sm text-gray-500">{ride.origin.area}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">To</Label>
                  <p className="font-semibold">{ride.destination.city}</p>
                  <p className="text-sm text-gray-500">{ride.destination.area}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Departure</Label>
                  <p className="font-semibold">
                    {new Date(ride.departureTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(ride.departureTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Passengers</Label>
                  <p className="font-semibold">{ride.seatsTotal} passengers needed</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Suggested Price</Label>
                  <p className="font-semibold">${ride.price}</p>
                </div>
              </div>

              {/* Baggage Requirements */}
              {((ride.baggageCheckIn || 0) > 0 || (ride.baggagePersonal || 0) > 0) && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Baggage Requirements</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {(ride.baggageCheckIn || 0) > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                        {ride.baggageCheckIn} check-in bags
                      </span>
                    )}
                    {(ride.baggagePersonal || 0) > 0 && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                        {ride.baggagePersonal} personal bags
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Gender Preference */}
              {ride.genderPreference && ride.genderPreference !== 'no preference' && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Passenger Preference</Label>
                  <p className="text-sm capitalize">{ride.genderPreference} drivers only</p>
                </div>
              )}

              {/* Passenger Notes */}
              {ride.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Additional Notes</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded">{ride.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Driver Offer Form */}
        <div>
          {!isDriverOnboarded ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                  Driver Setup Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to complete driver setup and add your bank account information before offering rides.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handleStartOnboarding}
                  disabled={isOnboarding}
                  className="w-full"
                >
                  {isOnboarding ? "Setting up..." : "Complete Driver Setup"}
                </Button>
                
                <p className="text-xs text-gray-500">
                  This will set up your Stripe account for receiving payments from passengers.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  Confirm Your Offer
                </CardTitle>
                <CardDescription>
                  Set your price and send your offer to the passenger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="price">Your Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={ride.price.toString()}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Passenger suggested: ${ride.price}
                  </p>
                </div>

                <div>
                  <Label htmlFor="message">Message to Passenger (Optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => {
                      const newMessage = e.target.value;
                      if (newMessage.length <= 300) {
                        setMessage(newMessage);
                      }
                    }}
                    placeholder="Hi! I can take you on this trip. Looking forward to driving you safely!"
                    className="mt-1"
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length}/300 characters
                  </p>
                </div>

                <Button 
                  onClick={handleConfirmOffer}
                  disabled={createOfferMutation.isPending || !price}
                  className="w-full"
                >
                  {createOfferMutation.isPending ? "Sending Offer..." : "Send Offer"}
                </Button>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Your offer will be sent to the passenger</p>
                  <p>• Payment will be processed when the ride is completed</p>
                  <p>• You can manage offers in your rides dashboard</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}