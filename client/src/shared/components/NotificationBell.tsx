import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/shared/lib/queryClient';
import { useToast } from '@/shared/hooks/use-toast';
import { type Notification } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';

export default function NotificationBell() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return await apiRequest('PATCH', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const acceptBattleMutation = useMutation({
    mutationFn: async (battleId: string) => {
      return await apiRequest('PATCH', `/api/battles/${battleId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Battle Accepted!',
        description: 'You can now compete in this battle.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to accept battle invitation.',
        variant: 'destructive',
      });
    },
  });

  const declineBattleMutation = useMutation({
    mutationFn: async (battleId: string) => {
      return await apiRequest('PATCH', `/api/battles/${battleId}/decline`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/battles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Battle Declined',
        description: 'You declined the battle invitation.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to decline battle invitation.',
        variant: 'destructive',
      });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setIsOpen(false);
    }
  };

  const handleAcceptBattle = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.relatedId) {
      acceptBattleMutation.mutate(notification.relatedId);
    }
  };

  const handleDeclineBattle = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.relatedId) {
      declineBattleMutation.mutate(notification.relatedId);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground"
          aria-label="Notifications"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center text-xs p-1"
              data-testid="badge-notification-count"
            >
              {unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto" data-testid="dropdown-notifications">
        <div className="px-3 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground" data-testid="text-no-notifications">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id}>
              <DropdownMenuItem
                className="p-4 cursor-pointer focus:bg-muted"
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{notification.title}</p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary" data-testid={`unread-indicator-${notification.id}`} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  {notification.type === 'battle_invite' && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={(e) => handleAcceptBattle(notification, e)}
                        disabled={acceptBattleMutation.isPending}
                        className="flex-1"
                        data-testid={`button-accept-${notification.id}`}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleDeclineBattle(notification, e)}
                        disabled={declineBattleMutation.isPending}
                        className="flex-1"
                        data-testid={`button-decline-${notification.id}`}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
