import { Transaction, Customer, PaymentType } from '../backend';

function formatPaymentType(pt: PaymentType): string {
  switch (pt) {
    case PaymentType.cash: return 'Cash';
    case PaymentType.online: return 'Online Pay';
    case PaymentType.partial: return 'Partial Payment';
    case PaymentType.fullClear: return 'Full Clear';
    default: return String(pt);
  }
}

function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function generateBarcode(text: string): string {
  // Simple barcode-style visual using CSS bars
  let bars = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const width = (code % 3) + 1;
    const height = (code % 2 === 0) ? 40 : 30;
    bars += `<div style="display:inline-block;width:${width}px;height:${height}px;background:#000;margin:0 0.5px;vertical-align:bottom;"></div>`;
  }
  return bars;
}

export function downloadReceiptPDF(transaction: Transaction, customer: Customer): void {
  const statusLabel = transaction.balance <= 0 ? 'CLEAR' : 'PENDING';
  const statusColor = transaction.balance <= 0 ? '#16a34a' : '#dc2626';
  const shopName = transaction.shopName || 'Chicken Shop';
  const dateStr = formatDate(transaction.timestamp);
  const barcodeHtml = generateBarcode(transaction.id);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt - ${transaction.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; background: #fff; color: #111; padding: 24px; max-width: 420px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
    .shop-name { font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
    .shop-sub { font-size: 11px; color: #555; margin-top: 2px; }
    .invoice-label { font-size: 11px; color: #555; margin-top: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-id { font-size: 14px; font-weight: bold; margin-top: 2px; }
    .barcode-container { margin: 8px auto; text-align: center; }
    .barcode-text { font-size: 9px; letter-spacing: 2px; margin-top: 3px; color: #333; }
    .section { margin: 10px 0; }
    .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 6px; }
    .row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
    .row .label { color: #555; }
    .row .value { font-weight: bold; text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #333; padding-top: 6px; margin-top: 6px; }
    .status-badge { display: inline-block; padding: 4px 16px; border-radius: 4px; font-size: 13px; font-weight: bold; color: #fff; background: ${statusColor}; margin-top: 8px; }
    .footer { text-align: center; margin-top: 16px; border-top: 2px dashed #333; padding-top: 12px; font-size: 10px; color: #777; }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">🐔 ${shopName}</div>
    <div class="shop-sub">Fresh Chicken — Quality Guaranteed</div>
    <div class="invoice-label">Invoice / Receipt</div>
    <div class="invoice-id">${transaction.id}</div>
    <div class="barcode-container">
      ${barcodeHtml}
      <div class="barcode-text">${transaction.id}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <div class="row"><span class="label">Name</span><span class="value">${customer.name}</span></div>
    <div class="row"><span class="label">Customer ID</span><span class="value">${customer.id}</span></div>
    <div class="row"><span class="label">Phone</span><span class="value">${customer.phone}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Order Details</div>
    <div class="row"><span class="label">Weight</span><span class="value">${transaction.weight.toFixed(3)} kg</span></div>
    <div class="row"><span class="label">Rate per kg</span><span class="value">${formatCurrency(transaction.rate)}</span></div>
    <div class="total-row"><span>Total Price</span><span>${formatCurrency(transaction.totalPrice)}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="row"><span class="label">Payment Type</span><span class="value">${formatPaymentType(transaction.paymentType)}</span></div>
    <div class="row"><span class="label">Amount Paid</span><span class="value">${formatCurrency(transaction.payment)}</span></div>
    <div class="row"><span class="label">Remaining Balance</span><span class="value" style="color:${statusColor}">${formatCurrency(Math.max(0, transaction.balance))}</span></div>
    <div style="text-align:center;margin-top:8px;">
      <span class="status-badge">${statusLabel}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Transaction Info</div>
    <div class="row"><span class="label">Date &amp; Time</span><span class="value">${dateStr}</span></div>
    <div class="row"><span class="label">Shop</span><span class="value">${shopName}</span></div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p style="margin-top:4px;">This is a computer-generated receipt.</p>
    <p style="margin-top:4px;">${shopName} &copy; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=500,height=700');
  if (!printWindow) {
    alert('Please allow popups to download the receipt.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
