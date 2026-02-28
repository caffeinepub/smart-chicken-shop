import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaymentTypeSelector from './PaymentTypeSelector';
import { useEditTransaction, useGetCurrentKgRate } from '../hooks/useQueries';
import { type Transaction, PaymentType } from '../backend';
import { formatCurrency, calculateTotalPrice } from '../utils/calculations';
import { toast } from 'sonner';

const SHOP_NAME = 'Smart Chicken Shop';

interface EditTransactionModalProps {
  transaction: Transaction;
  open: boolean;
  onClose: () => void;
}

export default function EditTransactionModal({
  transaction,
  open,
  onClose,
}: EditTransactionModalProps) {
  const [weight, setWeight] = useState(transaction.weight.toString());
  const [payment, setPayment] = useState(transaction.payment.toString());
  const [paymentType, setPaymentType] = useState<PaymentType>(
    transaction.paymentType as unknown as PaymentType
  );

  const editTransaction = useEditTransaction();
  const { data: currentKgRate } = useGetCurrentKgRate();

  const weightNum = parseFloat(weight) || 0;
  // Use the current kg rate for preview (backend uses currentKgRate internally)
  const rateForPreview = currentKgRate ?? transaction.rate;
  const totalPreview = calculateTotalPrice(weightNum, rateForPreview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await editTransaction.mutateAsync({
        transactionId: transaction.id,
        weight: weightNum,
        payment: parseFloat(payment) || 0,
        paymentType,
        shopName: SHOP_NAME,
      });
      toast.success('Transaction updated successfully');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update transaction';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono text-muted-foreground">
            {transaction.id}
          </div>

          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-2.5 text-sm">
            <span className="text-muted-foreground">Rate per kg: </span>
            <span className="font-semibold">₹{rateForPreview.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground ml-2">(current shop rate)</span>
          </div>

          {weightNum > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-sm">
              <span className="text-muted-foreground">New Total: </span>
              <span className="font-bold text-green-800">{formatCurrency(totalPreview)}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Payment Amount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
            />
          </div>

          <PaymentTypeSelector value={paymentType} onChange={setPaymentType} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={editTransaction.isPending}>
              {editTransaction.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
