import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

interface BalanceStatusBadgeProps {
  balance: number;
  showAmount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function BalanceStatusBadge({ balance, showAmount = false, size = 'md' }: BalanceStatusBadgeProps) {
  const isClear = balance === 0;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  if (isClear) {
    return (
      <span className={`inline-flex items-center rounded-full font-semibold bg-green-100 text-green-800 border border-green-200 ${sizeClasses[size]}`}>
        <CheckCircle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        CLEAR
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}>
      <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {showAmount
        ? `PENDING ₹${balance.toFixed(2)}`
        : 'PENDING'}
    </span>
  );
}
