import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Users,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Globe
} from 'lucide-react';

interface PollVote {
  id: number;
  question: string;
  answer: string;
  userIp: string;
  userAgent: string;
  createdAt: string;
}

interface PollStats {
  question: string;
  yesCount: number;
  noCount: number;
  totalVotes: number;
}

export default function AdminPollData() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pollData, setPollData] = useState<PollVote[]>([]);
  const [pollStats, setPollStats] = useState<PollStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin authentication
    const adminToken = sessionStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin-login');
      return;
    }

    fetchPollData();
    fetchPollStats();
  }, []);

  const fetchPollData = async () => {
    try {
      const adminToken = sessionStorage.getItem('adminToken');
      const response = await fetch('/api/admin/poll-data', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Poll data loaded:', data.length);
        setPollData(data);
      } else {
        console.error('Failed to fetch poll data:', response.status);
        toast({
          title: "Error",
          description: "Failed to load poll data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching poll data:', error);
      toast({
        title: "Error",
        description: "Failed to load poll data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPollStats = async () => {
    try {
      const response = await fetch('/api/poll-stats/would-use-trek');
      if (response.ok) {
        const stats = await response.json();
        setPollStats(stats);
      }
    } catch (error) {
      console.error('Error fetching poll stats:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchPollData(), fetchPollStats()]);
    setLoading(false);
    toast({
      title: "Data Refreshed",
      description: "Poll data has been updated"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getYesPercentage = () => {
    if (!pollStats || pollStats.totalVotes === 0) return 0;
    return Math.round((pollStats.yesCount / pollStats.totalVotes) * 100);
  };

  const getNoPercentage = () => {
    if (!pollStats || pollStats.totalVotes === 0) return 0;
    return Math.round((pollStats.noCount / pollStats.totalVotes) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll data...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Poll Data & Analytics</h1>
              <p className="text-gray-600">View and analyze user poll responses</p>
            </div>
          </div>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Poll Statistics Cards */}
        {pollStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  Total Votes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{pollStats.totalVotes}</div>
                <p className="text-sm text-gray-600">Responses received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  Yes Votes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{pollStats.yesCount}</div>
                <p className="text-sm text-gray-600">{getYesPercentage()}% of responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  No Votes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{pollStats.noCount}</div>
                <p className="text-sm text-gray-600">{getNoPercentage()}% of responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Interest Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{getYesPercentage()}%</div>
                <p className="text-sm text-gray-600">Would use Trek</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Visual Progress Bar */}
        {pollStats && pollStats.totalVotes > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Poll Results: "Would you use Trek for ridesharing at UF?"</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Yes</span>
                  </div>
                  <span className="text-sm text-gray-600">{pollStats.yesCount} votes ({getYesPercentage()}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${getYesPercentage()}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">No</span>
                  </div>
                  <span className="text-sm text-gray-600">{pollStats.noCount} votes ({getNoPercentage()}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${getNoPercentage()}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Poll Responses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Individual Poll Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pollData.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No poll responses yet</h3>
                <p className="text-gray-600">Poll responses will appear here once users start voting.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pollData.map((vote) => (
                    <TableRow key={vote.id}>
                      <TableCell className="font-mono text-sm">{vote.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {vote.question}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={vote.answer === 'yes' ? 'default' : 'secondary'}
                          className={vote.answer === 'yes' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {vote.answer.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{vote.userIp}</TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                        {vote.userAgent}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(vote.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}