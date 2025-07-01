import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, RefreshCw, User, Mail, Phone, MapPin, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Complaint {
  id: number;
  reporterId: string;
  rideId: number;
  subject: string;
  description: string;
  contactEmail: string;
  status: string;
  priority: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  reporterInstagram: string;
  reporterSnapchat: string;
  rideOrigin: string;
  rideOriginArea: string;
  rideDestination: string;
  rideDestinationArea: string;
  rideDepartureTime: string;
  rideArrivalTime: string;
  ridePrice: string;
  rideSeatsTotal: number;
  rideSeatsLeft: number;
  rideGenderPreference: string;
  rideCarMake: string;
  rideCarModel: string;
  rideCarYear: number;
  rideNotes: string | null;
  rideBaggageCheckIn: number;
  rideBaggagePersonal: number;
  rideIsStarted: boolean;
  rideStartedAt: string | null;
  rideIsCompleted: boolean;
  rideIsCancelled: boolean;
  rideCancelledBy: string | null;
  rideCancelledAt: string | null;
  rideCancellationReason: string | null;
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  driverInstagram: string;
  driverSnapchat: string;
}

export default function AdminComplaints() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin-login');
      return;
    }

    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch('/api/admin/complaints', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Complaints loaded:', data.length);
        setComplaints(data);
      } else {
        console.error('Failed to fetch complaints:', response.status);
        toast({
          title: "Error",
          description: "Failed to load complaints",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId: number, status: string, adminNotes?: string) => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/complaints/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNotes })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Complaint status updated successfully"
        });
        fetchComplaints();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint status",
        variant: "destructive",
      });
    }
  };

  const updateComplaintPriority = async (complaintId: number, priority: string) => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/complaints/${complaintId}/priority`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Complaint priority updated successfully"
        });
        fetchComplaints();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint priority",
        variant: "destructive",
      });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading complaints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/admin-dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complaints Management</h1>
              <p className="text-gray-600">Manage customer complaints and issues</p>
            </div>
          </div>
          <Button onClick={fetchComplaints} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Complaints</p>
                  <p className="text-2xl font-bold">{complaints.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-600">Open</p>
                  <p className="text-2xl font-bold">{complaints.filter(c => c.status === 'open').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{complaints.filter(c => c.status === 'in_progress').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold">{complaints.filter(c => c.status === 'resolved').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Complaints List */}
        <div className="space-y-6">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{complaint.subject}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(complaint.priority)}>
                      {complaint.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Reported on {formatDate(complaint.createdAt)} • ID: {complaint.id}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{complaint.description}</p>
                </div>

                {/* Reporter and Ride Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Reporter Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {complaint.reporterName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {complaint.reporterEmail}
                      </div>
                      {complaint.reporterPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {complaint.reporterPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Ride Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {complaint.rideOrigin} → {complaint.rideDestination}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {formatDate(complaint.rideDepartureTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        ${complaint.ridePrice}
                      </div>
                      <div className="text-xs text-gray-600">
                        Driver: {complaint.driverName} ({complaint.driverEmail})
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                {complaint.adminNotes && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-1">Admin Notes</h5>
                    <p className="text-sm text-blue-800">{complaint.adminNotes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <StatusUpdateDialog
                    complaint={complaint}
                    onStatusUpdated={(status, notes) => updateComplaintStatus(complaint.id, status, notes)}
                  />
                  <PriorityUpdateDialog
                    complaint={complaint}
                    onPriorityUpdated={(priority) => updateComplaintPriority(complaint.id, priority)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {complaints.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-600">All customer issues have been resolved or no complaints have been submitted yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Status Update Dialog Component
function StatusUpdateDialog({ complaint, onStatusUpdated }: { complaint: Complaint; onStatusUpdated: (status: string, notes?: string) => void }) {
  const [status, setStatus] = useState(complaint.status);
  const [adminNotes, setAdminNotes] = useState(complaint.adminNotes || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    onStatusUpdated(status, adminNotes);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Update Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Complaint Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Admin Notes</label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about the resolution..."
              rows={3}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Update Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Priority Update Dialog Component
function PriorityUpdateDialog({ complaint, onPriorityUpdated }: { complaint: Complaint; onPriorityUpdated: (priority: string) => void }) {
  const [priority, setPriority] = useState(complaint.priority);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    onPriorityUpdated(priority);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Update Priority
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Complaint Priority</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Priority Level</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            Update Priority
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}