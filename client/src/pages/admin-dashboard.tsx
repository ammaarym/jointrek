import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  AlertCircle,
  Database,
  Edit,
  Trash2,
  Plus,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalUsers: number;
  totalRides: number;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalPayments: number;
  totalRevenue: number;
  platformFees: number;
}

interface User {
  id: number;
  email: string;
  displayName: string;
  phone: string;
  instagram: string;
  snapchat: string;
  createdAt: string;
  firebaseUid: string;
  photoUrl: string;
  stripeCustomerId: string;
}

interface Ride {
  id: number;
  origin: string;
  destination: string;
  departureTime: string;
  price: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  driverInstagram: string;
  driverSnapchat: string;
  seatsTotal: number;
  seatsLeft: number;
  isCompleted: boolean;
  carMake: string;
  carModel: string;
  carYear: string;
  baggageSpace: number;
  notes: string;
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

// Database Management Component
function DatabaseManagement() {
  const [selectedTable, setSelectedTable] = useState('users');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  const tables = [
    { value: 'users', label: 'Users' },
    { value: 'rides', label: 'Rides' },
    { value: 'ride_requests', label: 'Ride Requests' },
    { value: 'conversations', label: 'Conversations' },
    { value: 'messages', label: 'Messages' }
  ];

  const fetchTableData = async (table: string) => {
    setLoading(true);
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/table/${table}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTableData(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load table data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/table/${selectedTable}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (response.ok) {
        toast({ title: "Success", description: "Record deleted successfully" });
        fetchTableData(selectedTable);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const executeSQL = async () => {
    if (!query.trim()) return;
    
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch('/api/admin/sql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      if (response.ok) {
        const result = await response.json();
        setTableData(result);
        toast({ title: "SQL Executed", description: "Query completed successfully" });
      }
    } catch (error) {
      toast({
        title: "SQL Error",
        description: "Failed to execute query",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTableData(selectedTable);
  }, [selectedTable]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 items-center">
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables.map(table => (
                <SelectItem key={table.value} value={table.value}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => fetchTableData(selectedTable)}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  {tableData.length > 0 && Object.keys(tableData[0]).map(key => (
                    <th key={key} className="border border-gray-300 px-4 py-2 text-left">
                      {key}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value: any, cellIndex) => (
                      <td key={cellIndex} className="border border-gray-300 px-4 py-2 max-w-xs truncate">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-4 py-2">
                      <Button size="sm" variant="destructive" onClick={() => deleteRecord(row.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Raw SQL Query</h3>
          <div className="space-y-2">
            <Textarea
              placeholder="Enter SQL query here..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-mono"
              rows={4}
            />
            <Button onClick={executeSQL} disabled={!query.trim()}>
              Execute Query
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Excel Sheets Component
function ExcelSheets({ users, rides, requests }: { users: User[], rides: Ride[], requests: any[] }) {
  const { toast } = useToast();

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: `${filename}.csv has been downloaded`,
    });
  };

  const driversData = users.filter(user => 
    rides.some(ride => ride.driverEmail === user.email)
  ).map(driver => {
    const driverRides = rides.filter(ride => ride.driverEmail === driver.email);
    return {
      id: driver.id,
      name: driver.displayName,
      email: driver.email,
      phone: driver.phone || 'N/A',
      joinDate: driver.createdAt,
      totalRides: driverRides.length,
      completedRides: driverRides.filter(ride => ride.isCompleted).length,
      totalEarnings: driverRides.reduce((sum, ride) => sum + parseFloat(ride.price || '0'), 0),
    };
  });

  const passengersData = users.filter(user => 
    requests.some(req => req.passengerEmail === user.email)
  ).map(passenger => {
    const passengerRequests = requests.filter(req => req.passengerEmail === passenger.email);
    return {
      id: passenger.id,
      name: passenger.displayName,
      email: passenger.email,
      phone: passenger.phone || 'N/A',
      joinDate: passenger.createdAt,
      totalRequests: passengerRequests.length,
      approvedRequests: passengerRequests.filter(req => req.status === 'approved').length,
      rejectedRequests: passengerRequests.filter(req => req.status === 'rejected').length,
      pendingRequests: passengerRequests.filter(req => req.status === 'pending').length,
      totalSpent: passengerRequests
        .filter(req => req.status === 'approved')
        .reduce((sum, req) => sum + parseFloat(req.price || '0'), 0)
    };
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Excel Data Sheets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drivers Sheet */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Drivers Data ({driversData.length} drivers)</h3>
              <Button onClick={() => downloadCSV(driversData, 'drivers_data')}>
                <Download className="w-4 h-4 mr-2" />
                Download Drivers CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border border-gray-300 px-3 py-2">ID</th>
                    <th className="border border-gray-300 px-3 py-2">Name</th>
                    <th className="border border-gray-300 px-3 py-2">Email</th>
                    <th className="border border-gray-300 px-3 py-2">Phone</th>
                    <th className="border border-gray-300 px-3 py-2">Join Date</th>
                    <th className="border border-gray-300 px-3 py-2">Total Rides</th>
                    <th className="border border-gray-300 px-3 py-2">Completed</th>
                    <th className="border border-gray-300 px-3 py-2">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {driversData.map(driver => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{driver.id}</td>
                      <td className="border border-gray-300 px-3 py-2">{driver.name}</td>
                      <td className="border border-gray-300 px-3 py-2">{driver.email}</td>
                      <td className="border border-gray-300 px-3 py-2">{driver.phone}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        {new Date(driver.joinDate).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">{driver.totalRides}</td>
                      <td className="border border-gray-300 px-3 py-2">{driver.completedRides}</td>
                      <td className="border border-gray-300 px-3 py-2">${driver.totalEarnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Passengers Sheet */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Passengers Data ({passengersData.length} passengers)</h3>
              <Button onClick={() => downloadCSV(passengersData, 'passengers_data')}>
                <Download className="w-4 h-4 mr-2" />
                Download Passengers CSV
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-300 px-3 py-2">ID</th>
                    <th className="border border-gray-300 px-3 py-2">Name</th>
                    <th className="border border-gray-300 px-3 py-2">Email</th>
                    <th className="border border-gray-300 px-3 py-2">Phone</th>
                    <th className="border border-gray-300 px-3 py-2">Join Date</th>
                    <th className="border border-gray-300 px-3 py-2">Total Requests</th>
                    <th className="border border-gray-300 px-3 py-2">Approved</th>
                    <th className="border border-gray-300 px-3 py-2">Rejected</th>
                    <th className="border border-gray-300 px-3 py-2">Pending</th>
                    <th className="border border-gray-300 px-3 py-2">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {passengersData.map(passenger => (
                    <tr key={passenger.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{passenger.id}</td>
                      <td className="border border-gray-300 px-3 py-2">{passenger.name}</td>
                      <td className="border border-gray-300 px-3 py-2">{passenger.email}</td>
                      <td className="border border-gray-300 px-3 py-2">{passenger.phone}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        {new Date(passenger.joinDate).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">{passenger.totalRequests}</td>
                      <td className="border border-gray-300 px-3 py-2">{passenger.approvedRequests}</td>
                      <td className="border border-gray-300 px-3 py-2">{passenger.rejectedRequests}</td>
                      <td className="border border-gray-300 px-3 py-2">{passenger.pendingRequests}</td>
                      <td className="border border-gray-300 px-3 py-2">${passenger.totalSpent.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Data Export */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Export All Data</h3>
              <div className="flex gap-2">
                <Button onClick={() => downloadCSV(users, 'all_users')}>
                  <Download className="w-4 h-4 mr-2" />
                  Users CSV
                </Button>
                <Button onClick={() => downloadCSV(rides, 'all_rides')}>
                  <Download className="w-4 h-4 mr-2" />
                  Rides CSV
                </Button>
                <Button onClick={() => downloadCSV(requests, 'all_requests')}>
                  <Download className="w-4 h-4 mr-2" />
                  Requests CSV
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// User Edit Form Component
function UserEditForm({ user, onSuccess }: { user: User, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    phone: user.phone || '',
    instagram: user.instagram || '',
    snapchat: user.snapchat || ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({ title: "Success", description: "User updated successfully" });
        onSuccess();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Display Name</label>
        <Input
          value={formData.displayName}
          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          placeholder="Enter display name"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Phone Number</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Enter phone number"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Instagram</label>
        <Input
          value={formData.instagram}
          onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
          placeholder="Enter Instagram username"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Snapchat</label>
        <Input
          value={formData.snapchat}
          onChange={(e) => setFormData(prev => ({ ...prev, snapchat: e.target.value }))}
          placeholder="Enter Snapchat username"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
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

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "User deleted successfully" });
        fetchDashboardData();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-stone-900 mr-3" />
              <h1 className="text-xl font-bold text-stone-900">Trek Admin Dashboard</h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-stone-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                <Car className="h-4 w-4 text-stone-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRides}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ride Requests</CardTitle>
                <MessageSquare className="h-4 w-4 text-stone-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRequests}</div>
                <p className="text-xs text-stone-600">
                  {stats.pendingRequests} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-stone-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalRequests > 0 
                    ? Math.round((stats.approvedRequests / stats.totalRequests) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-stone-600">
                  {stats.approvedRequests} approved
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="requests">Ride Requests</TabsTrigger>
            <TabsTrigger value="approved">Approved Rides</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="rides">All Rides</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="sheets">Excel Sheets</TabsTrigger>
          </TabsList>

          {/* Ride Requests Tab */}
          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Ride Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border border-stone-200 rounded-lg p-4">
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
                              {request.price}
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
            <Card>
              <CardHeader>
                <CardTitle>Approved Rides with Passengers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {approvedRides.map((ride) => (
                    <div key={ride.id} className="border border-stone-200 rounded-lg p-4">
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
                              {ride.price}
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

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ${requests.filter(r => r.status === 'approved' && r.paymentStatus === 'captured')
                          .reduce((sum, r) => sum + parseFloat(r.paymentAmount || '0'), 0).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">From completed rides</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Platform Fees</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        ${(requests.filter(r => r.status === 'approved' && r.paymentStatus === 'captured')
                          .reduce((sum, r) => sum + parseFloat(r.paymentAmount || '0'), 0) * 0.10).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">10% of total revenue</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Driver Payouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        ${(requests.filter(r => r.status === 'approved' && r.paymentStatus === 'captured')
                          .reduce((sum, r) => sum + parseFloat(r.paymentAmount || '0'), 0) * 0.90).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">90% to drivers</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Transactions</h3>
                  {requests.filter(r => r.paymentAmount && parseFloat(r.paymentAmount) > 0).map((payment) => {
                    const amount = parseFloat(payment.paymentAmount || '0');
                    const platformFee = amount * 0.10;
                    const driverAmount = amount * 0.90;
                    
                    return (
                      <div key={payment.id} className="border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge className={payment.paymentStatus === 'captured' ? 'bg-green-100 text-green-800' : 
                                             payment.paymentStatus === 'authorized' ? 'bg-yellow-100 text-yellow-800' : 
                                             'bg-gray-100 text-gray-800'}>
                              {payment.paymentStatus?.toUpperCase() || 'PENDING'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Transaction #{payment.id}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(payment.createdAt)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-stone-700 mb-1">Passenger</h4>
                            <div className="text-sm">{payment.passengerName}</div>
                            <div className="text-xs text-muted-foreground">{payment.passengerEmail}</div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-stone-700 mb-1">Driver</h4>
                            <div className="text-sm">{payment.driverName || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{payment.driverEmail || 'N/A'}</div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-stone-700 mb-1">Route</h4>
                            <div className="text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {payment.rideOrigin} → {payment.rideDestination}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-stone-100 pt-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-medium text-lg">${amount.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Total Charged</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-lg text-blue-600">${platformFee.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Platform Fee (10%)</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-lg text-green-600">${driverAmount.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">Driver Payout (90%)</div>
                            </div>
                          </div>
                        </div>
                        
                        {payment.stripePaymentIntentId && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Stripe Payment Intent: {payment.stripePaymentIntentId}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {requests.filter(r => r.paymentAmount && parseFloat(r.paymentAmount) > 0).length === 0 && (
                    <div className="text-center py-8 text-stone-600">
                      No payment transactions found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rides Tab */}
          <TabsContent value="rides">
            <Card>
              <CardHeader>
                <CardTitle>All Rides</CardTitle>
              </CardHeader>
              <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  All Users
                  <Button onClick={() => fetchDashboardData()} size="sm" variant="outline">
                    Refresh Users
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border border-stone-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-stone-900">{user.displayName}</h3>
                            <Badge variant="outline" className="text-xs">ID: {user.id}</Badge>
                          </div>
                          <p className="text-stone-600 font-medium">{user.email}</p>
                          <p className="text-sm text-stone-500">Joined: {formatDate(user.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit User: {user.displayName}</DialogTitle>
                              </DialogHeader>
                              <UserEditForm user={user} onSuccess={() => fetchDashboardData()} />
                            </DialogContent>
                          </Dialog>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-stone-50 rounded-lg p-4">
                        <div>
                          <h4 className="text-sm font-medium text-stone-700 mb-2">Contact Information</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-stone-500" />
                              <span className="text-stone-600">{user.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MessageSquare className="w-3 h-3 text-stone-500" />
                              <span className="text-stone-600">{user.instagram || 'No Instagram'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MessageSquare className="w-3 h-3 text-stone-500" />
                              <span className="text-stone-600">{user.snapchat || 'No Snapchat'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-stone-700 mb-2">Account Details</h4>
                          <div className="space-y-1">
                            <div className="text-xs text-stone-500">
                              Firebase UID: <span className="font-mono">{user.firebaseUid?.substring(0, 16)}...</span>
                            </div>
                            {user.stripeCustomerId && (
                              <div className="text-xs text-stone-500">
                                Stripe Customer: <span className="font-mono">{user.stripeCustomerId.substring(0, 16)}...</span>
                              </div>
                            )}
                            {user.photoUrl && (
                              <div className="text-xs text-stone-500">
                                Has Profile Photo: Yes
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-stone-700 mb-2">Quick Actions</h4>
                          <div className="space-y-1">
                            <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-6">
                              View User Rides
                            </Button>
                            <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-6">
                              View Requests
                            </Button>
                            <Button size="sm" variant="ghost" className="w-full justify-start text-xs h-6">
                              Contact User
                            </Button>
                          </div>
                        </div>
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

          {/* Database Management Tab */}
          <TabsContent value="database">
            <DatabaseManagement />
          </TabsContent>

          {/* Excel Sheets Tab */}
          <TabsContent value="sheets">
            <ExcelSheets users={users} rides={rides} requests={requests} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}