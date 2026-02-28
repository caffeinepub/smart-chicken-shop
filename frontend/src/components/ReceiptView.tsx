import React from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Printer, Download, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGetAllTransactions, useGetAllCustomers } from '../hooks/useQueries';
import { PaymentType, Transaction, Customer } from '../backend';
import { downloadReceiptPDF } from '../utils/pdfExport';

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

function BarcodeDisplay({ value }: { value: string }) {
  const bars = value.split('').map((char, i) => {
    const code = char.charCodeAt(0);
    const width = (code % 3) + 1;
    const height = (code % 2 === 0) ? 40 : 28;
    return (
      <div
        key={i}
        style={{ width: `${width}px`, height: `${height}px` }}
        className="inline-block bg-foreground mx-px align-bottom"
      />
    );
  });
  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <div className="flex items-end gap-px">{bars}</div>
      <span className="text-xs font-mono tracking-widest text-muted-foreground">{value}</span>
    </div>
  );
}

interface ReceiptViewProps {
  transactionId?: string;
}

export default function ReceiptView({ transactionId: propTransactionId }: ReceiptViewProps) {
  const navigate = useNavigate();

  // Try to get transactionId from route params or props
  let txnId: string | undefined = propTransactionId;
  try {
    const params = useParams({ strict: false }) as { transactionId?: string };
    if (params.transactionId) txnId = params.transactionId;
  } catch {
    // no route params
  }

  const { data: transactions, isLoading: txnLoading } = useGetAllTransactions();
  const { data: customers, isLoading: custLoading } = useGetAllCustomers();

  const transaction: Transaction | undefined = transactions?.find(t => t.id === txnId);
  const customer: Customer | undefined = customers?.find(c => c.id === transaction?.customerId);

  const isLoading = txnLoading || custLoading;

  const handleDownload = () => {
    if (transaction && customer) {
      downloadReceiptPDF(transaction, customer);
    }
  };

  const handlePrint = () => {
    if (transaction && customer) {
      downloadReceiptPDF(transaction, customer);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!transaction || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Receipt not found.</p>
        <Button variant="outline" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const isClear = transaction.balance <= 0;

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/' })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </div>
      </div>

      {/* Receipt Card */}
      <Card className="border-2 border-dashed border-border">
        <CardHeader className="text-center pb-2">
          <div className="text-2xl font-bold tracking-widest uppercase">
            🐔 {transaction.shopName}
          </div>
          <p className="text-xs text-muted-foreground">Fresh Chicken — Quality Guaranteed</p>
          <Separator className="my-2" />
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Invoice / Receipt</div>
          <CardTitle className="text-base font-mono">{transaction.id}</CardTitle>
          <BarcodeDisplay value={transaction.id} />
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Details */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 border-b pb-1">Customer Details</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold">{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID</span>
                <span className="font-mono text-xs">{customer.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 border-b pb-1">Order Details</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight</span>
                <span className="font-semibold">{transaction.weight.toFixed(3)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate per kg</span>
                <span>{formatCurrency(transaction.rate)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total Price</span>
                <span>{formatCurrency(transaction.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 border-b pb-1">Payment Details</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Type</span>
                <Badge variant="outline">{formatPaymentType(transaction.paymentType)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-green-600">{formatCurrency(transaction.payment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className={`font-bold ${isClear ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(Math.max(0, transaction.balance))}
                </span>
              </div>
              <div className="flex justify-center pt-2">
                {isClear ? (
                  <Badge className="bg-green-600 text-white gap-1 px-4 py-1 text-sm">
                    <CheckCircle className="w-4 h-4" /> CLEAR
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 px-4 py-1 text-sm">
                    <Clock className="w-4 h-4" /> PENDING
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Info */}
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 border-b pb-1">Transaction Info</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date &amp; Time</span>
                <span className="text-xs">{formatDate(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shop</span>
                <span>{transaction.shopName}</span>
              </div>
            </div>
          </div>

          <Separator />
          <p className="text-center text-xs text-muted-foreground">
            Thank you for your business!<br />
            This is a computer-generated receipt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
