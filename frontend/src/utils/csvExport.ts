import type { Transaction, Customer } from '../backend';

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function formatPaymentType(pt: string): string {
  switch (pt) {
    case 'cash': return 'Cash';
    case 'online': return 'Online Pay';
    case 'partial': return 'Partial Payment';
    case 'fullClear': return 'Full Clear';
    default: return pt;
  }
}

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  customers: Customer[],
  filename: string
): void {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const headers = [
    'Customer Name',
    'Customer ID',
    'Phone',
    'Transaction Date',
    'Weight (kg)',
    'Rate per kg',
    'Total Price',
    'Payment Made',
    'Payment Type',
    'Remaining Balance',
  ];

  const rows = transactions.map((t) => {
    const customer = customerMap.get(t.customerId);
    return [
      escapeCsvField(customer?.name ?? 'Unknown'),
      escapeCsvField(t.customerId),
      escapeCsvField(customer?.phone ?? ''),
      escapeCsvField(formatDate(t.timestamp)),
      escapeCsvField(t.weight.toFixed(2)),
      escapeCsvField(t.rate.toFixed(2)),
      escapeCsvField(t.totalPrice.toFixed(2)),
      escapeCsvField(t.payment.toFixed(2)),
      escapeCsvField(formatPaymentType(t.paymentType as unknown as string)),
      escapeCsvField(t.balance.toFixed(2)),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
