import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'amber' | 'blue' | 'red';
}

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'green' }: MetricCardProps) {
  const colorMap = {
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-700',
      border: 'border-l-green-600',
      value: 'text-green-900',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-700',
      border: 'border-l-amber-500',
      value: 'text-amber-900',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-700',
      border: 'border-l-blue-500',
      value: 'text-blue-900',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-700',
      border: 'border-l-red-500',
      value: 'text-red-900',
    },
  };

  const colors = colorMap[color];

  return (
    <Card className={`border-l-4 ${colors.border} shadow-card hover:shadow-card-hover transition-shadow`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
            <p className={`text-2xl font-bold ${colors.value} truncate`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`${colors.bg} p-2.5 rounded-lg ml-3 flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
