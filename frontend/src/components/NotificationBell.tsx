import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import NotificationList from './NotificationList';
import { useGetUnreadNotifications } from '../hooks/useQueries';

interface NotificationBellProps {
  customerId: string;
}

export default function NotificationBell({ customerId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { data: notifications = [] } = useGetUnreadNotifications(customerId);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread in-app notification${unreadCount !== 1 ? 's' : ''}`
              : 'In-app notifications'
          }
          title="In-app notifications"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationList customerId={customerId} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
