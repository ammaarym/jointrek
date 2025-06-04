import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Car, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  LogOut,
  MapPin,
  Clock,
  DollarSign,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalUsers: number;
  totalRides: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

interface User {
  id: number;
  email: string;
  displayName: string;
  phone: string;
  createdAt: string;
}

interface Ride {
  id: number;
  origin: string;
  destination: string;
  departureTime: string;
  price: string;
  driverName: string;
  driverEmail: string;
  seatsTotal: number;
  seatsLeft: number;
  isCompleted: boolean;
}

interface RideRequest {
  id: number;
  rideId: number;
  passengerName: string;
  passengerEmail: string;
  status: string;
  message: string;
  createdAt: string;
  rideOrigin: string;
  rideDestination: string;
  driverName: string;
  driverEmail: string;
  departureTime: string;
  price: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [approvedRides, setApprovedRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin-login');
      return;
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch dashboard stats
      const [statsRes, usersRes, ridesRes, requestsRes, approvedRidesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/rides', { headers }),
        fetch('/api/admin/requests', { headers }),
        fetch('/api/admin/approved-rides', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (ridesRes.ok) setRides(await ridesRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
      if (approvedRidesRes.ok) setApprovedRides(await approvedRidesRes.json());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setLocation('/admin-login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Trek Admin Dashboard</h1>
                <p className="text-xs text-slate-600">System monitoring and management</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{stats.totalUsers}</div>
                <p className="text-xs text-blue-600 mt-1">Registered students</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Total Rides</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <Car className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{stats.totalRides}</div>
                <p className="text-xs text-green-600 mt-1">Rides posted</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Ride Requests</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{stats.totalRequests}</div>
                <p className="text-xs text-orange-600 mt-1">
                  {stats.pendingRequests} pending
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Approval Rate</CardTitle>
                <div className="p-2 bg-purple-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">
                  {stats.totalRequests > 0 
                    ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  {stats.approvedRequests} approved
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/60 backdrop-blur-sm border border-slate-200 shadow-sm">
            <TabsTrigger 
              value="requests" 
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Ride Requests
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Approved Rides
            </TabsTrigger>
            <TabsTrigger 
              value="rides" 
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              All Rides
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
            >
              Users
            </TabsTrigger>
          </TabsList>

          {/* Ride Requests Tab */}
          <TabsContent value="requests">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                <CardTitle className="text-blue-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ride Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="bg-white/60 border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.toUpperCase()}
                        </Badge>
                        <div className="text-xs text-stone-500">
                          {formatDate(request.createdAt)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-stone-700 mb-1">Passenger Requesting</h4>
                          <div className="text-sm text-stone-900">{request.passengerName}</div>
                          <div className="text-xs text-stone-600">{request.passengerEmail}</div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-stone-700 mb-1">Driver Being Requested</h4>
                          <div className="text-sm text-stone-900">{request.driverName || 'N/A'}</div>
                          <div className="text-xs text-stone-600">{request.driverEmail || 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="border-t border-stone-100 pt-3">
                        <div className="flex items-center gap-4 text-sm text-stone-600 mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {request.rideOrigin} → {request.rideDestination}
                          </div>
                          {request.departureTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(request.departureTime)}
                            </div>
                          )}
                          {request.price && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${request.price}
                            </div>
                          )}
                        </div>
                        
                        {request.message && (
                          <div className="mt-2 p-2 bg-stone-50 rounded text-sm">
                            <strong>Message:</strong> {request.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {requests.length === 0 && (
                    <div className="text-center py-8 text-stone-600">
                      No ride requests found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Rides Tab */}
          <TabsContent value="approved">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
                <CardTitle className="text-green-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Approved Rides with Passengers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {approvedRides.map((ride) => (
                    <div key={ride.id} className="bg-white/60 border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-stone-700 mb-2">Driver</h4>
                          <div className="text-sm text-stone-900">{ride.driverName}</div>
                          <div className="text-xs text-stone-600">{ride.driverEmail}</div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-stone-700 mb-2">Route Details</h4>
                          <div className="flex items-center gap-4 text-sm text-stone-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ride.origin} → {ride.destination}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(ride.departureTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${ride.price}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-stone-100 pt-4">
                        <h4 className="text-sm font-medium text-stone-700 mb-3">
                          Approved Passengers ({ride.passengers?.length || 0})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {ride.passengers?.map((passenger, index) => (
                            <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <div className="text-sm font-medium text-green-900">{passenger.name}</div>
                              <div className="text-xs text-green-700">{passenger.email}</div>
                              <div className="text-xs text-green-600 mt-1">
                                Approved: {formatDate(passenger.approvedAt)}
                              </div>
                            </div>
                          )) || (
                            <div className="text-sm text-stone-500 col-span-full">No passengers approved yet</div>
                          )}
                        </div>
                        
                        <div className="mt-3 text-xs text-stone-500">
                          Seats: {ride.seatsLeft}/{ride.seatsTotal} remaining
                        </div>
                      </div>
                    </div>
                  ))}
                  {approvedRides.length === 0 && (
                    <div className="text-center py-8 text-stone-600">
                      No approved rides with passengers found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rides Tab */}
          <TabsContent value="rides">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
                <CardTitle className="text-purple-900 flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  All Rides
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {rides.map((ride) => (
                    <div key={ride.id} className="flex items-center justify-between p-4 border border-stone-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium mb-2">{ride.driverName}</div>
                        <div className="text-sm text-stone-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {ride.origin} → {ride.destination}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(ride.departureTime)}
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            ${ride.price}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {ride.seatsLeft}/{ride.seatsTotal} seats
                        </div>
                        <Badge variant={ride.isCompleted ? "default" : "secondary"}>
                          {ride.isCompleted ? "Completed" : "Active"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {rides.length === 0 && (
                    <div className="text-center py-8 text-stone-600">
                      No rides found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-lg">
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-stone-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-sm text-stone-600">{user.email}</div>
                        {user.phone && (
                          <div className="text-sm text-stone-600 flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-stone-600">
                        Joined {formatDate(user.createdAt)}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-stone-600">
                      No users found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}