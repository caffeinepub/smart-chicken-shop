import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Users,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { useDashboardStats, useGetAllCustomers, useGetAllTransactions } from '../hooks/useQueries';
import { StatsPeriod } from '../hooks/useQueries';
import PeriodSelector from './PeriodSelector';
import CustomerList from './CustomerList';
import { exportTransactionsToCSV } from '../utils/csvExport';
import { downloadReportPDF } from '../utils/reportPdfExport';

function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  loading?: boolean;
}

function MetricCard({ title, value, icon, description, loading }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

const SHOP_NAME = 'Chicken Shop';

interface AdminDashboardProps {
  userRole?: string;
}

export default function AdminDashboard({ userRole }: AdminDashboardProps) {
  const [period, setPeriod] = useState<StatsPeriod>('daily');

  const { data: stats, isLoading: statsLoading } = useDashboardStats(period, SHOP_NAME);
  const { data: customers } = useGetAllCustomers();
  const { data: transactions } = useGetAllTransactions();

  const pendingCustomers = customers?.filter((c) => c.balance > 0) ?? [];
  const totalCustomers = customers?.length ?? 0;

  const handleExportCSV = () => {
    if (!transactions || !customers) return;
    const today = new Date().toISOString().split('T')[0];
    exportTransactionsToCSV(transactions, customers, `chicken-shop-report-${today}.csv`);
  };

  const handleExportPDF = () => {
    if (!transactions || !customers || !stats) return;
    downloadReportPDF(
      period,
      transactions,
      customers,
      {
        totalSales: stats.totalSales,
        totalPayments: stats.totalPayments,
        totalBalance: stats.totalBalance,
      },
      SHOP_NAME
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Overview of sales, payments, and balances</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelector value={period} onChange={setPeriod} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={!transactions || !customers}
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!transactions || !customers || !stats}
            title="Export PDF Report"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sales"
          value={stats ? formatCurrency(stats.totalSales) : '—'}
          icon={<TrendingUp className="w-5 h-5" />}
          description={
            period === 'daily'
              ? 'Last 24 hours'
              : period === 'weekly'
              ? 'Last 7 days'
              : 'Last 30 days'
          }
          loading={statsLoading}
        />
        <MetricCard
          title="Total Payments"
          value={stats ? formatCurrency(stats.totalPayments) : '—'}
          icon={<CreditCard className="w-5 h-5" />}
          description="Collected this period"
          loading={statsLoading}
        />
        <MetricCard
          title="Pending Balance"
          value={stats ? formatCurrency(stats.totalBalance) : '—'}
          icon={<DollarSign className="w-5 h-5" />}
          description="Outstanding amount"
          loading={statsLoading}
        />
        <MetricCard
          title="Customers"
          value={String(totalCustomers)}
          icon={<Users className="w-5 h-5" />}
          description={`${pendingCustomers.length} with pending balance`}
          loading={false}
        />
      </div>

      {/* Pending Balances Summary */}
      {pendingCustomers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-destructive" />
              Pending Balances
              <Badge variant="destructive">{pendingCustomers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendingCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-sm py-1 border-b last:border-0"
                >
                  <div>
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {formatCurrency(c.balance)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer List */}
      <div>
        <h2 className="text-lg font-semibold mb-3">All Customers</h2>
        <CustomerList userRole={userRole ?? 'admin'} />
      </div>
    </div>
  );
}
