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

  // Fetch specific ride details with optimized caching
  const { data: ride, isLoading: ridesLoading, error: ridesError } = useQuery({
    queryKey: ["/api/rides", rideId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/rides/${rideId}`);
      return response.json();
    },
    enabled: !!rideId && !!currentUser?.uid, // Only fetch when user is authenticated and ride ID exists
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  // Fetch user's payment methods with optimized caching
  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/payment-methods"],
    enabled: !!currentUser?.uid, // Only fetch when user is fully authenticated
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
  });

  const hasPaymentMethod = (paymentData as any)?.paymentMethods?.length > 0;
  const defaultPaymentMethod = (paymentData as any)?.paymentMethods?.find((pm: any) => pm.id === (paymentData as any)?.defaultPaymentMethodId) || (paymentData as any)?.paymentMethods?.[0];
  
  // Show loading state for payment methods separately
  const isPaymentMethodsReady = !paymentLoading;

  // Consolidated payment and ride request mutation
  const confirmRideRequestMutation = useMutation({
    mutationFn: async ({ rideId, message }: { rideId: number; message?: string }) => {
      if (!hasPaymentMethod || !defaultPaymentMethod) {
        throw new Error('Please add a payment method to your profile first');
      }
      
      const response = await apiRequest("POST", "/api/confirm-ride-request", {
        rideId,
        paymentMethodId: defaultPaymentMethod.id,
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
    if (!ride || !currentUser || !hasPaymentMethod) return;

    confirmRideRequestMutation.mutate({
      rideId: ride.id,
      message: message?.trim() || undefined
    });
  };

  // Show immediate loading for better UX
  if (ridesLoading) {
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
          
          {/* Skeleton loading */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Loading ride details...
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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

            {paymentLoading && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    Loading Payment Methods...
                  </h4>
                </div>
              </div>
            )}

            {!paymentLoading && !hasPaymentMethod && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Payment Method Required
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Please add a payment method to your profile before requesting rides.
                </p>
                <Button 
                  onClick={() => setLocation("/profile")}
                  variant="outline"
                  className="mt-3"
                  size="sm"
                >
                  Add Payment Method
                </Button>
              </div>
            )}

            <Button 
              onClick={handleConfirmRequest}
              disabled={confirmRideRequestMutation.isPending || !currentUser || !hasPaymentMethod}
              className="w-full"
              size="lg"
            >
              {confirmRideRequestMutation.isPending 
                ? "Processing payment..." 
                : !hasPaymentMethod 
                ? "Add Payment Method Required"
                : `Confirm Ride Request - Pay $${ride.price}`
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}