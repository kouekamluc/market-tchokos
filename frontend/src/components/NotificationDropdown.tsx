import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, Package, CreditCard, Truck, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useApi';
import { toast } from 'sonner';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { data: notificationsData, isLoading } = useNotifications({ unread_only: false });
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = notificationsData?.results || [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.is_read) {
      try {
        await markAsRead.mutateAsync(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate based on notification type and data
    if (notification.action_url) {
      navigate(notification.action_url);
    } else if (notification.data?.action === 'view_cart') {
      navigate('/cart');
    } else if (notification.notification_type === 'order_status') {
      navigate(`/order/${notification.data?.order_id || ''}`);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_status':
        return <Package className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      case 'system':
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10 transition-all duration-200 relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 bg-gray-800 border-gray-700 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="font-normal text-gray-200">
          <div className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-gray-700" />
        
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-gray-400 text-sm mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center">
            <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 cursor-pointer transition-colors ${
                notification.is_read 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' 
                  : 'text-white hover:bg-gray-700/50 bg-gray-700/30'
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`mt-0.5 ${notification.is_read ? 'text-gray-500' : 'text-blue-400'}`}>
                  {getNotificationIcon(notification.notification_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium line-clamp-2 ${
                      notification.is_read ? 'text-gray-400' : 'text-white'
                    }`}>
                      {notification.title}
                    </p>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-600">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                    
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead.mutate(notification.id);
                        }}
                        disabled={markAsRead.isPending}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-400"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
              className="text-center text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown; 