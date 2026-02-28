import React from 'react';
import { AlertCircle, Bell, BellRing, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BalanceStatusBadge from './BalanceStatusBadge';
import {
  useGetPendingCustomers,
  useSendPendingReminder,
  useSendBulkPendingReminders,
} from '../hooks/useQueries';
import { type Customer } from '../backend';
import { formatCurrency } from '../utils/calculations';
import { toast } from 'sonner';

const SHOP_NAME = 'Smart Chicken Shop';

export default function PendingCustomersList() {
  const { data: pendingCustomers = [], isLoading, refetch } = useGetPendingCustomers();
  const sendReminder = useSendPendingReminder();
  const sendBulkReminders = useSendBulkPendingReminders();

  const handleSendReminder = async (customer: Customer) => {
    try {
      await sendReminder.mutateAsync({ customerId: customer.id, shopName: SHOP_NAME });
      toast.success(`In-app reminder sent to ${customer.name}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reminder';
      toast.error(msg);
    }
  };

  const handleRemindAll = async () => {
    try {
      const count = await sendBulkReminders.mutateAsync(SHOP_NAME);
      toast.success(`In-app reminders sent to ${count} customer${Number(count) !== 1 ? 's' : ''}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send bulk reminders';
      toast.error(msg);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pending Balances</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCustomers.length} customer{pendingCustomers.length !== 1 ? 's' : ''} with
            outstanding balance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          {pendingCustomers.length > 0 && (
            <Button
              onClick={handleRemindAll}
              disabled={sendBulkReminders.isPending}
              className="gap-2"
              title="Send in-app reminders to all customers with pending balances"
            >
              {sendBulkReminders.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BellRing className="w-4 h-4" />
              )}
              Send Bulk In-App Reminders ({pendingCustomers.length})
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Customers with Pending Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : pendingCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-medium text-foreground">All Clear!</p>
              <p className="text-sm text-muted-foreground mt-1">
                No customers have pending balances.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pendingCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-sm flex-shrink-0">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{customer.name}</span>
                      <BalanceStatusBadge balance={customer.balance} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-mono text-muted-foreground">{customer.id}</span>
                      {customer.phone && (
                        <span className="text-xs text-muted-foreground">{customer.phone}</span>
                      )}
                    </div>
                  </div>

                  {/* Balance & Action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-sm font-bold text-amber-700">
                        {formatCurrency(customer.balance)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => handleSendReminder(customer)}
                      disabled={sendReminder.isPending}
                      title="Send in-app reminder notification"
                    >
                      {sendReminder.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Send In-App Reminder</span>
                      <span className="sm:hidden">Remind</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
