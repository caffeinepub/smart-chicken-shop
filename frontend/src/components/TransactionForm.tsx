import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PaymentTypeSelector from './PaymentTypeSelector';
import BalanceStatusBadge from './BalanceStatusBadge';
import {
  useCreateTransaction,
  useGetAllCustomers,
  useGetCurrentKgRate,
} from '../hooks/useQueries';
import { PaymentType, type Customer } from '../backend';
import { calculateTotalPrice, formatCurrency } from '../utils/calculations';
import { toast } from 'sonner';
import { ShoppingCart, Calculator } from 'lucide-react';

const SHOP_NAME = 'Smart Chicken Shop';

interface TransactionFormProps {
  preselectedCustomer?: Customer | null;
  onSuccess?: (transactionId: string, customerId: string) => void;
  onCancel?: () => void;
}

export default function TransactionForm({
  preselectedCustomer,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [customerId, setCustomerId] = useState(preselectedCustomer?.id || '');
  const [weight, setWeight] = useState('');
  const [rate, setRate] = useState('');
  const [payment, setPayment] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.cash);

  const { data: customers = [] } = useGetAllCustomers();
  const { data: currentKgRate } = useGetCurrentKgRate();
  const createTransaction = useCreateTransaction();

  // Auto-populate rate from backend when it loads
  useEffect(() => {
    if (currentKgRate !== undefined && rate === '') {
      setRate(currentKgRate.toFixed(2));
    }
  }, [currentKgRate]);

  useEffect(() => {
    if (preselectedCustomer) {
      setCustomerId(preselectedCustomer.id);
    }
  }, [preselectedCustomer]);

  const selectedCustomer =
    customers.find((c) => c.id === customerId) || preselectedCustomer;
  const weightNum = parseFloat(weight) || 0;
  const rateNum = parseFloat(rate) || 0;
  const paymentNum = parseFloat(payment) || 0;
  const totalPrice = calculateTotalPrice(weightNum, rateNum);
  const prevBalance = selectedCustomer?.balance || 0;
  const newBalance = Math.max(0, prevBalance + totalPrice - paymentNum);

  const handleFullClear = () => {
    if (selectedCustomer) {
      const totalDue = selectedCustomer.balance + totalPrice;
      setPayment(totalDue.toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (weightNum <= 0) {
      toast.error('Weight must be greater than 0');
      return;
    }
    if (paymentNum < 0) {
      toast.error('Payment cannot be negative');
      return;
    }
    try {
      const result = await createTransaction.mutateAsync({
        customerId,
        weight: weightNum,
        payment: paymentNum,
        paymentType,
        shopName: SHOP_NAME,
      });

      toast.success(`Transaction saved! Balance: ${formatCurrency(result.remainingBalance)}`);

      if (onSuccess) onSuccess(result.transactionId, customerId);

      // Reset form
      setWeight('');
      setPayment('');
      setPaymentType(PaymentType.cash);
      if (!preselectedCustomer) setCustomerId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create transaction';
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingCart className="w-4 h-4 text-primary" />
          New Transaction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection */}
          {!preselectedCustomer ? (
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">— {c.id}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{preselectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{preselectedCustomer.id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p
                  className={`text-sm font-bold ${
                    preselectedCustomer.balance > 0 ? 'text-amber-700' : 'text-green-700'
                  }`}
                >
                  {formatCurrency(preselectedCustomer.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Weight & Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rate">
                Rate per kg (₹)
                <span className="text-xs text-muted-foreground ml-1">(auto-filled)</span>
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                readOnly
                className="bg-muted/50 cursor-default"
              />
            </div>
          </div>

          {/* Live Calculation Preview */}
          {(weightNum > 0 || rateNum > 0) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Calculator className="w-3.5 h-3.5 text-green-700" />
                <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Calculation Preview
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Price</span>
                  <span className="font-semibold">{formatCurrency(totalPrice)}</span>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Previous Balance</span>
                    <span className="font-semibold">{formatCurrency(prevBalance)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-green-200 pt-1 mt-1">
                  <span className="font-semibold text-green-800">New Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-800">{formatCurrency(newBalance)}</span>
                    <BalanceStatusBadge balance={newBalance} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="space-y-1.5">
            <Label htmlFor="payment">Payment Amount (₹)</Label>
            <Input
              id="payment"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            />
          </div>

          {/* Payment Type */}
          <PaymentTypeSelector
            value={paymentType}
            onChange={setPaymentType}
            onFullClear={handleFullClear}
          />

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? 'Saving...' : 'Save Transaction'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
