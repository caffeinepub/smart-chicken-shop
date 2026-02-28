import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Trash2, Edit, Receipt, Download } from 'lucide-react';
import { useGetAllTransactions, useGetAllCustomers, useDeleteTransaction } from '../hooks/useQueries';
import { Transaction, Customer, PaymentType } from '../backend';
import EditTransactionModal from './EditTransactionModal';
import { downloadReceiptPDF } from '../utils/pdfExport';

interface TransactionListProps {
  userRole: string;
}

function formatPaymentType(pt: PaymentType): string {
  switch (pt) {
    case PaymentType.cash:
      return 'Cash';
    case PaymentType.online:
      return 'Online Pay';
    case PaymentType.partial:
      return 'Partial';
    case PaymentType.fullClear:
      return 'Full Clear';
    default:
      return String(pt);
  }
}

function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TransactionList({ userRole }: TransactionListProps) {
  const [search, setSearch] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data: transactions, isLoading: txnLoading } = useGetAllTransactions();
  const { data: customers, isLoading: custLoading } = useGetAllCustomers();
  const deleteTransaction = useDeleteTransaction();

  const isAdmin = userRole === 'admin';
  const isLoading = txnLoading || custLoading;

  const customerMap = React.useMemo(() => {
    const map = new Map<string, Customer>();
    customers?.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const filtered = React.useMemo(() => {
    if (!transactions) return [];
    const q = search.toLowerCase();
    return transactions
      .filter((t) => {
        const cust = customerMap.get(t.customerId);
        return (
          t.id.toLowerCase().includes(q) ||
          t.customerId.toLowerCase().includes(q) ||
          (cust?.name.toLowerCase().includes(q) ?? false) ||
          (cust?.phone.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [transactions, customerMap, search]);

  const handleDownloadReceipt = (transaction: Transaction) => {
    const customer = customerMap.get(transaction.customerId);
    if (customer) {
      downloadReceiptPDF(transaction, customer);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, phone, or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline" className="whitespace-nowrap">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Rate/kg</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((txn) => {
                  const cust = customerMap.get(txn.customerId);
                  const isClear = txn.balance <= 0;
                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{cust?.name ?? txn.customerId}</div>
                        <div className="text-xs text-muted-foreground">{cust?.phone}</div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDate(txn.timestamp)}
                      </TableCell>
                      <TableCell>{txn.weight.toFixed(3)} kg</TableCell>
                      <TableCell>{formatCurrency(txn.rate)}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(txn.totalPrice)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(txn.payment)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {formatPaymentType(txn.paymentType)}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={isClear ? 'text-green-600' : 'text-destructive'}
                      >
                        {formatCurrency(Math.max(0, txn.balance))}
                      </TableCell>
                      <TableCell>
                        {isClear ? (
                          <Badge className="bg-green-600 text-white text-xs">CLEAR</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            PENDING
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Receipt download — visible to both Admin and Staff */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download Receipt"
                            onClick={() => handleDownloadReceipt(txn)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>

                          {/* Edit — Admin only */}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Transaction"
                              onClick={() => setEditingTransaction(txn)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Delete — Admin only */}
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete transaction{' '}
                                    <strong>{txn.id}</strong> and adjust the customer's
                                    balance. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => deleteTransaction.mutate(txn.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit modal — open prop controlled by editingTransaction state */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          open={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}
