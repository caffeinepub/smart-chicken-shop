import React from 'react';
import { PaymentType } from '../backend';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PaymentTypeSelectorProps {
  value: PaymentType;
  onChange: (value: PaymentType) => void;
  onFullClear?: () => void;
  label?: string;
}

const paymentTypeOptions: { value: PaymentType; label: string; description: string }[] = [
  { value: PaymentType.cash, label: 'Cash', description: 'Full cash payment' },
  { value: PaymentType.online, label: 'Online Payment', description: 'UPI / Bank transfer' },
  { value: PaymentType.partial, label: 'Partial Payment', description: 'Pay part of the amount' },
  { value: PaymentType.fullClear, label: 'Full Clear', description: 'Clear entire balance' },
];

export default function PaymentTypeSelector({ value, onChange, onFullClear, label = 'Payment Type' }: PaymentTypeSelectorProps) {
  const handleChange = (val: string) => {
    const pt = val as PaymentType;
    onChange(pt);
    if (pt === PaymentType.fullClear && onFullClear) {
      onFullClear();
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select payment type" />
        </SelectTrigger>
        <SelectContent>
          {paymentTypeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <div>
                <span className="font-medium">{opt.label}</span>
                <span className="text-muted-foreground text-xs ml-2">— {opt.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
