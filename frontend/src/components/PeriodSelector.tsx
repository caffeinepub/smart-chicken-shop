import React from 'react';
import type { StatsPeriod } from '../hooks/useQueries';

interface PeriodSelectorProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

const periods: { value: StatsPeriod; label: string }[] = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
];

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="inline-flex bg-muted rounded-lg p-1 gap-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            value === period.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
