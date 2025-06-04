import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaUser, FaCar, FaMapMarkerAlt, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';
import { useAuth } from '@/hooks/use-auth-new';

// Component to fix the ride requests tab with both incoming and outgoing requests
export function RideRequestsTab({ 
  rideRequests, 
  pendingRequests, 
  requestsLoading, 
  handleRequestResponse,
  formatDate 
}: {
  rideRequests: any[];
  pendingRequests: any[];
  requestsLoading: boolean;
  handleRequestResponse: (id: number, status: string) => void;
  formatDate: (date: Date) => string;
}) {
  console.log('RideRequestsTab - Incoming requests:', rideRequests.length, 'Outgoing requests:', pendingRequests.length);
  console.log('RideRequestsTab - rideRequests data:', rideRequests);
  console.log('RideRequestsTab - pendingRequests data:', pendingRequests);

  if (requestsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const hasIncomingRequests = rideRequests.length > 0;
  const hasOutgoingRequests = pendingRequests.length > 0;
  const hasAnyRequests = hasIncomingRequests || hasOutgoingRequests;

  if (!hasAnyRequests) {
    return (
      <div className="text-center py-12">
        <FaUserFriends className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No ride requests yet</h3>
        <p className="text-muted-foreground">
          Your ride requests and incoming passenger requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Incoming Requests - Passengers requesting your rides */}
      {hasIncomingRequests && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaCar className="w-5 h-5 text-primary" />
            Requests for Your Rides ({rideRequests.length})
          </h3>
          <div className="space-y-4">
            {rideRequests.map((request) => (
              <Card key={`incoming-${request.id}`} className="p-6 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FaUser className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{request.passengerName}</h4>
                        <p className="text-sm text-muted-foreground">{request.passengerEmail}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {request.rideOrigin} → {request.rideDestination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {formatDate(new Date(request.rideDepartureTime))} at {new Date(request.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                      {request.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Message:</strong> {request.message}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.passengerPhone && request.status === 'approved' && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Contact Information:</p>
                        <p className="text-sm text-green-700">Phone: {request.passengerPhone}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm text-muted-foreground">
                      Received {formatDate(new Date(request.createdAt))}
                    </span>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRequestResponse(request.id, 'rejected')}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleRequestResponse(request.id, 'approved')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Requests - Your requests for other rides */}
      {hasOutgoingRequests && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FaUserFriends className="w-5 h-5 text-primary" />
            Your Requests ({pendingRequests.length})
          </h3>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <Card key={`outgoing-${request.id}`} className="p-6 border-l-4 border-l-green-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <FaCar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{request.driverName}</h4>
                        <p className="text-sm text-muted-foreground">{request.driverEmail}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {request.rideOrigin} → {request.rideDestination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {formatDate(new Date(request.rideDepartureTime))} at {new Date(request.rideDepartureTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                      {request.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Your message:</strong> {request.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm text-muted-foreground">
                      Sent {formatDate(new Date(request.createdAt))}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}