import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth-new";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Clock, DollarSign, Users, CreditCard, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function RequestRideSimplePage() {
  const [, params] = useRoute("/request-ride/:id");
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [baggageCheckIn, setBaggageCheckIn] = useState('0');
  const [baggagePersonal, setBaggagePersonal] = useState('0');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const rideId = params?.id ? parseInt(params.id) : null;

  // Fetch ride details
  const { data: rides, isLoading: ridesLoading } = useQuery({
    queryKey: ["/api/rides"],
    enabled: !!rideId,
  });

  // Fetch user's payment methods
  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["/api/payment-methods"],
    enabled: !!currentUser,
  });

  const ride = rides?.find((r: any) => r.id === rideId);

  // Confirm ride request mutation (new simplified flow)
  const confirmRequestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/confirm-ride-request", {
        rideId,
        baggageCheckIn: parseInt(baggageCheckIn) || 0,
        baggagePersonal: parseInt(baggagePersonal) || 0,
        paymentMethodId: selectedPaymentMethod
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ride Request Confirmed",
        description: "Your request has been sent to the driver with payment authorization.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ride-requests"] });
      setLocation("/my-rides");
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
    confirmRequestMutation.mutate();
  };

  if (ridesLoading || paymentLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ride Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested ride could not be found.</p>
          <Button onClick={() => setLocation("/find-rides")}>
            Back to Find Rides
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-4">Please log in to request rides.</p>
          <Button onClick={() => setLocation("/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const paymentMethods = paymentData?.paymentMethods || [];
  const hasPaymentMethod = paymentMethods.length > 0;

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
        <h1 className="text-3xl font-bold">Confirm Ride Request</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ride Details */}
        <Card>
          <CardHeader>
            <CardTitle>Ride Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-semibold">{ride.origin}</p>
                  <p className="text-sm text-muted-foreground">{ride.originArea}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-semibold">{ride.destination}</p>
                  <p className="text-sm text-muted-foreground">{ride.destinationArea}</p>
                </div>
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

        {/* Baggage Options */}
        <Card>
          <CardHeader>
            <CardTitle>Baggage Requirements</CardTitle>
            <CardDescription>
              Let the driver know how much baggage you'll be bringing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="baggageCheckIn" className="text-sm font-medium">Check-in Bags (Heavy luggage)</label>
                <select 
                  id="baggageCheckIn"
                  value={baggageCheckIn} 
                  onChange={(e) => setBaggageCheckIn(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num.toString()}>
                      {num} {num === 1 ? 'bag' : 'bags'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Large suitcases, duffel bags</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="baggagePersonal" className="text-sm font-medium">Personal Bags</label>
                <select 
                  id="baggagePersonal"
                  value={baggagePersonal} 
                  onChange={(e) => setBaggagePersonal(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num.toString()}>
                      {num} {num === 1 ? 'bag' : 'bags'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Backpacks, smaller bags</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Section */}
        <Card>
          <CardHeader>
            <CardTitle>Confirm Request</CardTitle>
            <CardDescription>
              Review your payment method and confirm your ride request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method Selection */}
            {hasPaymentMethod ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payment-method">Select Payment Method</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method: any) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span>**** **** **** {method.card.last4}</span>
                            <span className="text-sm text-muted-foreground">
                              {method.card.brand.toUpperCase()} • {method.card.exp_month}/{method.card.exp_year}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedPaymentMethod && (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Payment Method Selected
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Your selected card will be charged ${ride.price} after ride completion
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Payment Method Required
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                    You need to add a payment method to your profile before requesting rides
                  </p>
                  <Link href="/profile/payment">
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">
                      Add Payment Method
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {hasPaymentMethod && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  How it Works
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Your payment method will be authorized for ${ride.price}</li>
                  <li>• You won't be charged until the ride is completed</li>
                  <li>• The driver will be notified of your request</li>
                  <li>• You'll receive confirmation once approved</li>
                </ul>
              </div>
            )}

            <Button 
              onClick={handleConfirmRequest}
              disabled={confirmRequestMutation.isPending || !currentUser || !hasPaymentMethod || !selectedPaymentMethod}
              className="w-full"
              size="lg"
            >
              {confirmRequestMutation.isPending 
                ? "Confirming Request..." 
                : !selectedPaymentMethod && hasPaymentMethod
                ? "Select Payment Method"
                : `Confirm Ride Request - $${ride.price}`
              }
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}