import React from 'react';
import { Bell, CheckCheck, Package, CreditCard, Calendar, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCustomerPortalView, useMarkNotificationsRead } from '../hooks/useQueries';
import type { Transaction, Notification } from '../backend';

interface CustomerPortalViewProps {
  customerId: string;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function formatPaymentType(pt: string): string {
  switch (pt) {
    case 'cash': return 'Cash';
    case 'online': return 'Online Pay';
    case 'partial': return 'Partial';
    case 'fullClear': return 'Full Clear';
    default: return pt;
  }
}

function TransactionRow({ txn }: { txn: Transaction }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-2 bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Hash className="w-3 h-3" />
          <span className="font-mono">{txn.id}</span>
        </div>
        <Badge variant={txn.balance === 0 ? 'default' : 'destructive'} className="text-xs">
          {txn.balance === 0 ? 'CLEAR' : 'PENDING'}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Weight:</span>{' '}
          <span className="font-medium">{txn.weight.toFixed(2)} kg</span>
        </div>
        <div>
          <span className="text-muted-foreground">Rate:</span>{' '}
          <span className="font-medium">₹{txn.rate.toFixed(2)}/kg</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total:</span>{' '}
          <span className="font-medium text-primary">₹{txn.totalPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Paid:</span>{' '}
          <span className="font-medium text-green-600">₹{txn.payment.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Balance:</span>{' '}
          <span className={`font-semibold ${txn.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
            ₹{txn.balance.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Type:</span>{' '}
          <span className="font-medium">{formatPaymentType(txn.paymentType as unknown as string)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        {formatDate(txn.timestamp)}
      </div>
    </div>
  );
}

function NotificationItem({ notif }: { notif: Notification }) {
  return (
    <div className="border border-border rounded-lg p-3 bg-primary/5 space-y-1">
      <p className="text-sm text-foreground">{notif.message}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {formatDate(notif.timestamp)}
      </p>
    </div>
  );
}

export default function CustomerPortalView({ customerId }: CustomerPortalViewProps) {
  const { data: portalData, isLoading, isError } = useGetCustomerPortalView(customerId);
  const markRead = useMarkNotificationsRead();

  const handleMarkAllRead = () => {
    markRead.mutate(customerId);
  };

  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 p-8">
          <Package className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">No Customer ID Provided</h2>
          <p className="text-muted-foreground">Please use the link provided by the shop.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !portalData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 p-8">
          <Package className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">Customer Not Found</h2>
          <p className="text-muted-foreground">
            The customer link may be invalid or expired. Please contact the shop.
          </p>
        </div>
      </div>
    );
  }

  const { customer, pendingBalance, oldestToNewest, unreadNotifications } = portalData;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <img src="/assets/generated/chicken-shop-logo.dim_256x256.png" alt="Shop Logo" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h1 className="text-lg font-bold">Smart Chicken Shop</h1>
            <p className="text-xs opacity-80">Customer Account Portal</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4 pb-12">
        {/* Customer Info Card */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{customer.name}</h2>
                <p className="text-sm text-muted-foreground">{customer.phone}</p>
                {customer.address && (
                  <p className="text-sm text-muted-foreground">{customer.address}</p>
                )}
              </div>
              <div className="text-right">
                <Badge
                  variant={pendingBalance === 0 ? 'default' : 'destructive'}
                  className="text-sm px-3 py-1"
                >
                  {pendingBalance === 0 ? '✓ CLEAR' : 'PENDING'}
                </Badge>
                {pendingBalance > 0 && (
                  <p className="text-lg font-bold text-destructive mt-1">
                    ₹{pendingBalance.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-mono">{customer.id}</p>
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        {unreadNotifications.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-800">In-App Notifications</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                    {unreadNotifications.length} new
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
                  onClick={handleMarkAllRead}
                  disabled={markRead.isPending}
                  title="Mark all in-app notifications as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {unreadNotifications.map((notif) => (
                <NotificationItem key={notif.id} notif={notif} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-primary" />
              Transaction History
              <Badge variant="secondary" className="ml-auto text-xs">
                {oldestToNewest.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {oldestToNewest.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3 pr-2">
                  {[...oldestToNewest].reverse().map((txn) => (
                    <TransactionRow key={txn.id} txn={txn} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* No login required note */}
        <div className="text-center text-xs text-muted-foreground pb-2">
          <p>
            You are viewing this page as a customer — no login required.
          </p>
          <p className="mt-0.5">
            Your account is identified by your phone number on file with the shop.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        <p>
          © {new Date().getFullYear()} Smart Chicken Shop &nbsp;·&nbsp; Built with{' '}
          <span className="text-red-500">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'smart-chicken-shop')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
