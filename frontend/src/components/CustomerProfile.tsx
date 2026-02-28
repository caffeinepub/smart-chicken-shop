import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import BalanceStatusBadge from './BalanceStatusBadge';
import { useGetCustomer, useGetCustomerTransactions } from '../hooks/useQueries';
import { formatCurrency, formatWeight, formatDate } from '../utils/calculations';
import { Phone, MapPin, Hash, ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Customer } from '../backend';

interface CustomerProfileProps {
  customerId: string;
  onBack?: () => void;
  onViewReceipt?: (transactionId: string) => void;
}

const paymentTypeLabel: Record<string, string> = {
  cash: 'Cash',
  online: 'Online',
  partial: 'Partial',
  fullClear: 'Full Clear',
};

export default function CustomerProfile({ customerId, onBack, onViewReceipt }: CustomerProfileProps) {
  const { data: customer, isLoading: customerLoading } = useGetCustomer(customerId);
  const { data: transactions = [], isLoading: txLoading } = useGetCustomerTransactions(customerId);

  if (customerLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Customer not found</p>
        {onBack && <Button variant="outline" onClick={onBack} className="mt-4">Go Back</Button>}
      </div>
    );
  }

  const sortedTx = [...transactions].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back button */}
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to customers
        </button>
      )}

      {/* Customer Info Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">{customer.name}</h2>
                <BalanceStatusBadge balance={customer.balance} size="md" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Hash className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">{customer.id}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {customer.phone && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {customer.address}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className={`text-xl font-bold ${customer.balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                {formatCurrency(customer.balance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Transaction History
            <Badge variant="secondary" className="ml-auto">{transactions.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : sortedTx.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedTx.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{tx.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {paymentTypeLabel[tx.paymentType as unknown as string] || tx.paymentType}
                        </Badge>
                        <BalanceStatusBadge balance={tx.balance} size="sm" />
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span>{formatWeight(tx.weight)} × {formatCurrency(tx.rate)}/kg</span>
                        <span>Paid: {formatCurrency(tx.payment)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.timestamp)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-foreground">{formatCurrency(tx.totalPrice)}</p>
                      {onViewReceipt && (
                        <button
                          onClick={() => onViewReceipt(tx.id)}
                          className="text-xs text-primary hover:underline mt-1 flex items-center gap-1 ml-auto"
                        >
                          <Receipt className="w-3 h-3" />
                          Receipt
                        </button>
                      )}
                    </div>
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
