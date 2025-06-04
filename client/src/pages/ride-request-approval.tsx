import React, { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, User, Phone, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-new";

interface RideRequestDetails {
  id: number;
  rideId: number;
  passengerId: string;
  status: string;
  message: string;
  createdAt: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  rideOrigin: string;
  rideDestination: string;
  rideDepartureTime: string;
  ridePrice: string;
}

export default function RideRequestApproval() {
  const [, params] = useRoute("/requests/:requestId");
  const { currentUser } = useAuth();
  const [request, setRequest] = useState<RideRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = params?.requestId;

  useEffect(() => {
    if (requestId && currentUser) {
      fetchRequestDetails();
    }
  }, [requestId, currentUser]);

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch('/api/ride-requests/driver', {
        headers: {
          'x-user-id': currentUser!.uid,
          'x-user-email': currentUser!.email || '',
          'x-user-name': currentUser!.displayName || ''
        }
      });
      
      if (response.ok) {
        const requests = await response.json();
        const targetRequest = requests.find((r: RideRequestDetails) => r.id === parseInt(requestId!));
        
        if (targetRequest) {
          setRequest(targetRequest);
        } else {
          setError("Request not found or you don't have permission to view it.");
        }
      } else {
        setError("Failed to load request details.");
      }
    } catch (err) {
      setError("An error occurred while loading the request.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResponse = async (status: 'approved' | 'rejected') => {
    if (!currentUser || !request) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/ride-requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid,
          'x-user-email': currentUser.email || '',
          'x-user-name': currentUser.displayName || ''
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setRequest(prev => prev ? { ...prev, status } : null);
      } else {
        setError(`Failed to ${status === 'approved' ? 'approve' : 'reject'} request.`);
      }
    } catch (err) {
      setError("An error occurred while updating the request.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600">Please sign in to view this request.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-stone-600">Loading request details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const departureDate = new Date(request.rideDepartureTime);
  const formattedTime = departureDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-stone-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-stone-900">Ride Request</CardTitle>
            <Badge className={`w-fit mx-auto ${getStatusColor(request.status)}`}>
              {request.status.toUpperCase()}
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Passenger Info */}
            <div className="bg-stone-50 p-4 rounded-lg">
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Passenger Information
              </h3>
              <div className="space-y-2">
                <p className="text-stone-700">
                  <span className="font-medium">Name:</span> {request.passengerName}
                </p>
                <p className="text-stone-700">
                  <span className="font-medium">Email:</span> {request.passengerEmail}
                </p>
                {request.passengerPhone && (
                  <p className="text-stone-700">
                    <span className="font-medium">Phone:</span> {request.passengerPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Trip Details */}
            <div className="bg-stone-50 p-4 rounded-lg">
              <h3 className="font-semibold text-stone-900 mb-3">Trip Details</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-stone-600" />
                  <span className="text-stone-700">
                    <span className="font-medium">{request.rideOrigin}</span> → <span className="font-medium">{request.rideDestination}</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-3 text-stone-600" />
                  <span className="text-stone-700">{formattedTime}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-3 text-stone-600" />
                  <span className="text-stone-700">${request.ridePrice}</span>
                </div>
              </div>
            </div>

            {/* Message */}
            {request.message && (
              <div className="bg-stone-50 p-4 rounded-lg">
                <h3 className="font-semibold text-stone-900 mb-2 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Message from Passenger
                </h3>
                <p className="text-stone-700">{request.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            {request.status === 'pending' && (
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => handleRequestResponse('approved')}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? 'Processing...' : 'Approve Request'}
                </Button>
                <Button
                  onClick={() => handleRequestResponse('rejected')}
                  disabled={actionLoading}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                >
                  {actionLoading ? 'Processing...' : 'Decline Request'}
                </Button>
              </div>
            )}

            {request.status === 'approved' && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">
                  Request approved! The passenger has been notified with your contact information.
                </p>
              </div>
            )}

            {request.status === 'rejected' && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-red-800 font-medium">
                  Request declined. The passenger has been notified.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}