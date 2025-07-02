import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Car, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Search, 
  Phone, 
  Mail, 
  Instagram, 
  MessageCircle,
  Database,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  MapPin,
  Shield,
  BarChart3
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalRides: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

interface AdminUser {
  id: number;
  firebaseUid: string;
  email: string;
  displayName: string;
  phone?: string;
  instagram?: string;
  snapchat?: string;
  phoneVerified: boolean;
  stripeCustomerId?: string;
  stripeConnectAccountId?: string;
  createdAt: string;
}

interface AdminRide {
  id: number;
  driverName: string;
  driverEmail: string;
  origin: string;
  destination: string;
  departureTime: string;
  price: number;
  seatsTotal: number;
  seatsLeft: number;
  status: string;
  genderPreference: string;
  carMake?: string;
  carModel?: string;
  carYear?: number;
  baggageSpace?: number;
}

interface AdminRequest {
  id: number;
  passengerName: string;
  passengerEmail: string;
  rideName: string;
  rideOrigin: string;
  rideDestination: string;
  status: string;
  requestedAt: string;
  price: number;
  paymentStatus?: string;
  baggageNeeds?: number;
}

export default function AdminDashboardEnhanced() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rides, setRides] = useState<AdminRide[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [rideFilter, setRideFilter] = useState('');
  const [requestFilter, setRequestFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected items for detailed view
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRide, setSelectedRide] = useState<AdminRide | null>(null);

  useEffect(() => {
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin-login');
      return;
    }
    fetchAllData();
  }, []);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      const [statsRes, usersRes, ridesRes, requestsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/rides', { headers }),
        fetch('/api/admin/requests', { headers })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (ridesRes.ok) setRides(await ridesRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());

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
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "All admin data has been updated"
    });
  };

  const exportData = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter functions
  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase().includes(userFilter.toLowerCase()) ||
     user.email?.toLowerCase().includes(userFilter.toLowerCase()) ||
     user.phone?.includes(userFilter))
  );

  const filteredRides = rides.filter(ride => 
    (ride.driverName?.toLowerCase().includes(rideFilter.toLowerCase()) ||
     ride.origin?.toLowerCase().includes(rideFilter.toLowerCase()) ||
     ride.destination?.toLowerCase().includes(rideFilter.toLowerCase())) &&
    (statusFilter === 'all' || ride.status === statusFilter)
  );

  const filteredRequests = requests.filter(request => 
    (request.passengerName?.toLowerCase().includes(requestFilter.toLowerCase()) ||
     request.rideName?.toLowerCase().includes(requestFilter.toLowerCase())) &&
    (statusFilter === 'all' || request.status === statusFilter)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trek Admin Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform management and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setLocation('/admin-complaints')}
            variant="outline"
            size="sm"
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Complaints
          </Button>
          <Button 
            onClick={() => setLocation('/admin-poll-data')}
            variant="outline"
            size="sm"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Poll Data
          </Button>
          <Button 
            onClick={refreshData} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
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

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRides}</div>
              <p className="text-xs text-muted-foreground">Posted rides</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Requests</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">Confirmed bookings</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="rides">Rides ({rides.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-8 w-64"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={() => exportData(filteredUsers, 'users')}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Payment Setup</TableHead>
                  <TableHead>Driver Setup</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'Not provided'}</TableCell>
                    <TableCell>
                      <Badge variant={user.phoneVerified ? "default" : "secondary"}>
                        {user.phoneVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.stripeCustomerId ? "default" : "secondary"}>
                        {user.stripeCustomerId ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.stripeConnectAccountId ? "default" : "secondary"}>
                        {user.stripeConnectAccountId ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details: {user.displayName}</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Basic Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>ID:</strong> {selectedUser.id}</div>
                                  <div><strong>Firebase UID:</strong> {selectedUser.firebaseUid}</div>
                                  <div><strong>Email:</strong> {selectedUser.email}</div>
                                  <div><strong>Display Name:</strong> {selectedUser.displayName}</div>
                                  <div><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Contact & Verification</h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</div>
                                  <div><strong>Phone Verified:</strong> {selectedUser.phoneVerified ? 'Yes' : 'No'}</div>
                                  <div><strong>Instagram:</strong> {selectedUser.instagram || 'Not provided'}</div>
                                  <div><strong>Snapchat:</strong> {selectedUser.snapchat || 'Not provided'}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Payment Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Stripe Customer:</strong> {selectedUser.stripeCustomerId || 'Not created'}</div>
                                  <div><strong>Driver Account:</strong> {selectedUser.stripeConnectAccountId || 'Not created'}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Rides Tab */}
        <TabsContent value="rides" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search rides..." 
                  className="pl-8 w-64"
                  value={rideFilter}
                  onChange={(e) => setRideFilter(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button 
              onClick={() => exportData(filteredRides, 'rides')}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gender Pref</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell className="font-medium">{ride.driverName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{ride.origin}</span>
                        <span>→</span>
                        <span>{ride.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(ride.departureTime).toLocaleString()}</TableCell>
                    <TableCell>${ride.price}</TableCell>
                    <TableCell>{ride.seatsLeft}/{ride.seatsTotal}</TableCell>
                    <TableCell>
                      <Badge variant={ride.status === 'active' ? 'default' : 'secondary'}>
                        {ride.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ride.genderPreference}</Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRide(ride)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Ride Details: {ride.origin} → {ride.destination}</DialogTitle>
                          </DialogHeader>
                          {selectedRide && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Ride Information</h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>ID:</strong> {selectedRide.id}</div>
                                  <div><strong>Driver:</strong> {selectedRide.driverName}</div>
                                  <div><strong>Email:</strong> {selectedRide.driverEmail}</div>
                                  <div><strong>Origin:</strong> {selectedRide.origin}</div>
                                  <div><strong>Destination:</strong> {selectedRide.destination}</div>
                                  <div><strong>Departure:</strong> {new Date(selectedRide.departureTime).toLocaleString()}</div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Details & Preferences</h4>
                                <div className="space-y-2 text-sm">
                                  <div><strong>Price:</strong> ${selectedRide.price}</div>
                                  <div><strong>Total Seats:</strong> {selectedRide.seatsTotal}</div>
                                  <div><strong>Available Seats:</strong> {selectedRide.seatsLeft}</div>
                                  <div><strong>Gender Preference:</strong> {selectedRide.genderPreference}</div>
                                  <div><strong>Status:</strong> {selectedRide.status}</div>
                                  {selectedRide.carMake && (
                                    <div><strong>Vehicle:</strong> {selectedRide.carYear} {selectedRide.carMake} {selectedRide.carModel}</div>
                                  )}
                                  {selectedRide.baggageSpace && (
                                    <div><strong>Baggage Space:</strong> {selectedRide.baggageSpace} bags</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search requests..." 
                  className="pl-8 w-64"
                  value={requestFilter}
                  onChange={(e) => setRequestFilter(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <Button 
              onClick={() => exportData(filteredRequests, 'requests')}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Passenger</TableHead>
                  <TableHead>Ride</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.passengerName}</TableCell>
                    <TableCell>{request.rideName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{request.rideOrigin}</span>
                        <span>→</span>
                        <span>{request.rideDestination}</span>
                      </div>
                    </TableCell>
                    <TableCell>${request.price}</TableCell>
                    <TableCell>
                      <Badge variant={
                        request.status === 'approved' ? 'default' : 
                        request.status === 'pending' ? 'secondary' : 
                        'destructive'
                      }>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.paymentStatus === 'authorized' ? 'default' : 'secondary'}>
                        {request.paymentStatus || 'Not processed'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Quick access to database tables and basic operations. Use with caution.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/api/admin/table/users', '_blank')}
                >
                  View Users Table
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/api/admin/table/rides', '_blank')}
                >
                  View Rides Table
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/api/admin/table/ride_requests', '_blank')}
                >
                  View Requests Table
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/api/admin/table/conversations', '_blank')}
                >
                  View Conversations
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/api/admin/table/messages', '_blank')}
                >
                  View Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}