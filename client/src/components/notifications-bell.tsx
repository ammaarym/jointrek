import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  rideId?: number;
  requestId?: number;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count || 0;

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest('PATCH', `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'driver_offer') {
      // Navigate to My Rides page with requests tab
      window.location.href = '/my-rides?tab=requests';
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride_request':
        return '🚗';
      case 'ride_approved':
        return '✅';
      case 'ride_rejected':
        return '❌';
      case 'ride_cancelled':
        return '🚫';
      case 'ride_completed':
        return '🏁';
      default:
        return '📧';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ride_request':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      case 'ride_approved':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'ride_rejected':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'ride_cancelled':
        return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
      case 'ride_completed':
        return 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-950' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}