import { Transaction, Customer, PaymentType } from '../backend';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface ReportStats {
  totalSales: number;
  totalPayments: number;
  totalBalance: number;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: '2-digit',
  });
}

function formatPaymentType(pt: PaymentType): string {
  switch (pt) {
    case PaymentType.cash: return 'Cash';
    case PaymentType.online: return 'Online Pay';
    case PaymentType.partial: return 'Partial';
    case PaymentType.fullClear: return 'Full Clear';
    default: return String(pt);
  }
}

function getPeriodLabel(period: ReportPeriod): string {
  switch (period) {
    case 'daily': return 'Daily Report (Last 24 Hours)';
    case 'weekly': return 'Weekly Report (Last 7 Days)';
    case 'monthly': return 'Monthly Report (Last 30 Days)';
  }
}

function filterTransactionsByPeriod(transactions: Transaction[], period: ReportPeriod): Transaction[] {
  const now = Date.now();
  const msMap: Record<ReportPeriod, number> = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };
  const cutoff = now - msMap[period];
  return transactions.filter(t => {
    const ms = Number(t.timestamp) / 1_000_000;
    return ms >= cutoff;
  });
}

export function downloadReportPDF(
  period: ReportPeriod,
  allTransactions: Transaction[],
  customers: Customer[],
  stats: ReportStats,
  shopName: string = 'Chicken Shop'
): void {
  const periodLabel = getPeriodLabel(period);
  const filteredTxns = filterTransactionsByPeriod(allTransactions, period);
  const generatedAt = new Date().toLocaleString('en-IN');

  // Build customer balance map
  const customerMap = new Map<string, Customer>();
  customers.forEach(c => customerMap.set(c.id, c));

  // Build transaction rows HTML
  const txnRows = filteredTxns.length > 0
    ? filteredTxns.map((t, i) => {
        const cust = customerMap.get(t.customerId);
        const custName = cust ? cust.name : t.customerId;
        const status = t.balance <= 0 ? 'CLEAR' : 'PENDING';
        const statusColor = t.balance <= 0 ? '#16a34a' : '#dc2626';
        return `
          <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
            <td>${t.id}</td>
            <td>${custName}</td>
            <td>${formatDate(t.timestamp)}</td>
            <td>${t.weight.toFixed(3)} kg</td>
            <td>${formatCurrency(t.rate)}</td>
            <td>${formatCurrency(t.totalPrice)}</td>
            <td>${formatPaymentType(t.paymentType)}</td>
            <td>${formatCurrency(t.payment)}</td>
            <td style="color:${statusColor};font-weight:bold">${status}</td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="9" style="text-align:center;color:#888;padding:16px;">No transactions in this period</td></tr>`;

  // Build customer balance rows HTML
  const custRows = customers.length > 0
    ? customers.map((c, i) => {
        const status = c.balance <= 0 ? 'CLEAR' : 'PENDING';
        const statusColor = c.balance <= 0 ? '#16a34a' : '#dc2626';
        return `
          <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${formatCurrency(c.balance)}</td>
            <td style="color:${statusColor};font-weight:bold">${status}</td>
          </tr>`;
      }).join('')
    : `<tr><td colspan="5" style="text-align:center;color:#888;padding:16px;">No customers found</td></tr>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${periodLabel} — ${shopName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; color: #111; padding: 32px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #f97316; padding-bottom: 16px; }
    .shop-name { font-size: 26px; font-weight: bold; color: #f97316; letter-spacing: 2px; }
    .report-title { font-size: 16px; font-weight: bold; margin-top: 6px; color: #333; }
    .meta { font-size: 11px; color: #666; margin-top: 4px; }
    .metrics { display: flex; gap: 16px; margin: 20px 0; }
    .metric-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; text-align: center; background: #fafafa; }
    .metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
    .metric-value { font-size: 18px; font-weight: bold; color: #f97316; margin-top: 4px; }
    .metric-sub { font-size: 10px; color: #888; margin-top: 2px; }
    .section-title { font-size: 14px; font-weight: bold; color: #333; margin: 20px 0 8px; border-left: 4px solid #f97316; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f97316; color: #fff; padding: 8px 6px; text-align: left; font-weight: bold; }
    td { padding: 6px; border-bottom: 1px solid #e5e7eb; }
    .footer { text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 10px; color: #888; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">🐔 ${shopName}</div>
    <div class="report-title">${periodLabel}</div>
    <div class="meta">Generated: ${generatedAt}</div>
  </div>

  <div class="metrics">
    <div class="metric-card">
      <div class="metric-label">Total Sales</div>
      <div class="metric-value">${formatCurrency(stats.totalSales)}</div>
      <div class="metric-sub">Revenue this period</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total Payments</div>
      <div class="metric-value">${formatCurrency(stats.totalPayments)}</div>
      <div class="metric-sub">Collected this period</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Pending Balance</div>
      <div class="metric-value">${formatCurrency(stats.totalBalance)}</div>
      <div class="metric-sub">Outstanding amount</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Transactions</div>
      <div class="metric-value">${filteredTxns.length}</div>
      <div class="metric-sub">In this period</div>
    </div>
  </div>

  <div class="section-title">Transaction Details</div>
  <table>
    <thead>
      <tr>
        <th>Invoice ID</th>
        <th>Customer</th>
        <th>Date</th>
        <th>Weight</th>
        <th>Rate/kg</th>
        <th>Total</th>
        <th>Payment Type</th>
        <th>Paid</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${txnRows}
    </tbody>
  </table>

  <div class="section-title">Customer Balance Summary</div>
  <table>
    <thead>
      <tr>
        <th>Customer ID</th>
        <th>Name</th>
        <th>Phone</th>
        <th>Balance</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${custRows}
    </tbody>
  </table>

  <div class="footer">
    <p>${shopName} &mdash; ${periodLabel}</p>
    <p style="margin-top:4px;">Generated on ${generatedAt} &copy; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow popups to download the report.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 600);
}
