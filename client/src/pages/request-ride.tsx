import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth-fixed";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";

import { ArrowLeft, MapPin, Clock, DollarSign, Users } from "lucide-react";

export default function RequestRidePage() {
  const [, params] = useRoute("/request-ride/:id");
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const rideId = params?.id ? parseInt(params.id) : null;

  // Fetch ride details
  const { data: rides, isLoading: ridesLoading } = useQuery({
    queryKey: ["/api/rides"],
    enabled: !!rideId,
  });

  const ride = Array.isArray(rides) ? rides.find((r: any) => r.id === rideId) : null;
  
  // Add debugging
  console.log("Request ride page - rideId:", rideId, "type:", typeof rideId, "rides loaded:", !!rides, "ride found:", !!ride);
  if (rides && Array.isArray(rides)) {
    console.log("Available ride IDs:", rides.map(r => r.id));
    console.log("Looking for ride ID:", rideId);
  }

  // Consolidated payment and ride request mutation
  const confirmRideRequestMutation = useMutation({
    mutationFn: async ({ rideId, message }: { rideId: number; message?: string }) => {
      const response = await apiRequest("POST", "/api/confirm-ride-request", {
        rideId,
        message: message?.trim() || undefined
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ride Request Confirmed",
        description: "Your payment has been processed and request sent to the driver.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ride-requests"] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to confirm ride request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmRequest = () => {
    if (!ride || !currentUser) return;

    confirmRideRequestMutation.mutate({
      rideId: ride.id,
      message: message?.trim() || undefined
    });
  };

  if (ridesLoading) {
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
            <p>Ride not found</p>
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/find-rides")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Find Rides
          </Button>
          <h1 className="text-3xl font-bold">Request Ride</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ride Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-semibold">{ride.origin}</p>
                <p className="text-sm text-muted-foreground">{ride.originArea}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To</p>
                <p className="font-semibold">{ride.destination}</p>
                <p className="text-sm text-muted-foreground">{ride.destinationArea}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Departure</p>
                  <p className="font-semibold">
                    {new Date(ride.departureTime).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    {new Date(ride.departureTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-semibold text-lg">${ride.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Seats Available</p>
                  <p className="font-semibold">{ride.seatsLeft} of {ride.seatsTotal}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Driver</p>
              <div className="flex items-center gap-3">
                {ride.driverPhoto && (
                  <img 
                    src={ride.driverPhoto} 
                    alt={ride.driverName}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{ride.driverName}</p>
                  <p className="text-sm text-muted-foreground">{ride.driverEmail}</p>
                </div>
              </div>
            </div>

            {ride.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Driver Notes</p>
                <p className="text-sm bg-muted p-3 rounded-md">{ride.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Request</CardTitle>
            <CardDescription>
              Your payment method will be authorized but not charged until the ride is completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Payment Authorization
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your card will be authorized for ${ride.price} but not charged immediately. 
                Payment will only be processed after the ride is completed and confirmed by the driver.
              </p>
            </div>

            <Button 
              onClick={handleConfirmRequest}
              disabled={confirmRideRequestMutation.isPending || !currentUser}
              className="w-full"
              size="lg"
            >
              {confirmRideRequestMutation.isPending 
                ? "Processing payment..." 
                : `Confirm Ride Request - Pay $${ride.price}`
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}