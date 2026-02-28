import React from 'react';
import { Bell, CheckCheck, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetUnreadNotifications, useMarkNotificationsRead } from '../hooks/useQueries';
import { formatDate } from '../utils/calculations';
import { toast } from 'sonner';

interface NotificationListProps {
  customerId: string;
  onClose?: () => void;
}

export default function NotificationList({ customerId, onClose }: NotificationListProps) {
  const { data: notifications = [], isLoading } = useGetUnreadNotifications(customerId);
  const markRead = useMarkNotificationsRead();

  const unread = notifications.filter((n) => !n.isRead);

  const handleMarkAllRead = async () => {
    try {
      await markRead.mutateAsync(customerId);
      toast.success('All in-app notifications marked as read');
      if (onClose) onClose();
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">In-App Notifications</span>
          {unread.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unread.length}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleMarkAllRead}
            disabled={markRead.isPending}
            title="Mark all in-app notifications as read"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="max-h-80">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No in-app notifications</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Notifications from the shop will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {[...notifications]
              .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
              .map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 ${!notif.isRead ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!notif.isRead ? 'bg-primary/15' : 'bg-muted'}`}>
                      <Package className={`w-3.5 h-3.5 ${!notif.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{formatDate(notif.timestamp)}</span>
                      </div>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
