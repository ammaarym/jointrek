import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Car, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Phone, 
  Mail, 
  Shield,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface QuickStats {
  totalUsers: number;
  totalRides: number;
  pendingRequests: number;
  approvedRequests: number;
}

interface QuickUser {
  id: number;
  email: string;
  displayName: string;
  phone?: string;
  phoneVerified: boolean;
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
}

interface QuickRide {
  id: number;
  driverName: string;
  driverEmail: string;
  origin: string;
  destination: string;
  departureTime: string;
  price: number;
  seatsLeft: number;
  seatsTotal: number;
}

interface QuickRequest {
  id: number;
  passengerName: string;
  passengerEmail: string;
  rideName: string;
  price: number;
  status: string;
  requestedAt: string;
}

export default function AdminQuick() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<QuickUser[]>([]);
  const [activeRides, setActiveRides] = useState<QuickRide[]>([]);
  const [pendingRequests, setPendingRequests] = useState<QuickRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin-login');
      return;
    }
    fetchQuickData();
  }, []);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  });

  const fetchQuickData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      const [statsRes, usersRes, ridesRes, requestsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/rides', { headers }),
        fetch('/api/admin/requests', { headers })
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      
      if (usersRes.ok) {
        const users = await usersRes.json();
        setRecentUsers(users.slice(-10)); // Last 10 users
      }
      
      if (ridesRes.ok) {
        const rides = await ridesRes.json();
        setActiveRides(rides.filter((ride: any) => ride.status === 'active').slice(0, 10));
      }
      
      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setPendingRequests(requests.filter((req: any) => req.status === 'pending').slice(0, 10));
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchQuickData();
    toast({
      title: "Refreshed",
      description: "Data updated successfully"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trek Admin Quick View</h1>
          <p className="text-gray-600">Essential platform information at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setLocation('/admin-dashboard')} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Full Dashboard
          </Button>
          <Button 
            onClick={() => {
              sessionStorage.removeItem('adminToken');
              setLocation('/admin-login');
            }}
            variant="destructive" 
            size="sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRides}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedRequests}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Users ({recentUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {user.phone && (
                        <Badge variant={user.phoneVerified ? "default" : "secondary"} className="text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          {user.phoneVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                      )}
                      {user.stripeCustomerId && (
                        <Badge variant="outline" className="text-xs">
                          Payment Setup
                        </Badge>
                      )}
                      {user.stripeConnectAccountId && (
                        <Badge variant="outline" className="text-xs">
                          Driver Setup
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-gray-500 text-center py-4">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Rides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Active Rides ({activeRides.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeRides.map((ride) => (
                <div key={ride.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{ride.driverName}</div>
                    <div className="text-sm text-gray-600">{ride.origin} → {ride.destination}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${ride.price}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {ride.seatsLeft}/{ride.seatsTotal} seats
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(ride.departureTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {activeRides.length === 0 && (
                <p className="text-gray-500 text-center py-4">No active rides</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-4 border rounded-lg">
                <div className="font-medium">{request.passengerName}</div>
                <div className="text-sm text-gray-600 mb-2">{request.passengerEmail}</div>
                <div className="text-sm mb-2">
                  <strong>Ride:</strong> {request.rideName}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">${request.price}</Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-gray-500 text-center py-8 col-span-full">No pending requests</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/admin/table/users', '_blank')}
            >
              View All Users
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/admin/table/rides', '_blank')}
            >
              View All Rides
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('/api/admin/table/ride_requests', '_blank')}
            >
              View All Requests
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin-dashboard')}
            >
              Full Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}