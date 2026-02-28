import React, { useState } from 'react';
import { Search, Trash2, UserPlus, Link2, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useGetAllCustomers, useDeleteCustomer, useCreateCustomer } from '../hooks/useQueries';
import type { Customer } from '../hooks/useQueries';
import { toast } from 'sonner';

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

interface CustomerListProps {
  userRole: string;
  embedded?: boolean;
}

function getCustomerPortalUrl(customerId: string): string {
  const base = window.location.origin;
  return `${base}/customer?id=${customerId}`;
}

export default function CustomerList({ userRole, embedded = false }: CustomerListProps) {
  const { data: customers = [], isLoading } = useGetAllCustomers();
  const deleteCustomer = useDeleteCustomer();
  const createCustomer = useCreateCustomer();

  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const isAdmin = userRole === 'admin';

  const filtered = customers.filter(
    (c: Customer) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (customerId: string) => {
    try {
      await deleteCustomer.mutateAsync(customerId);
      toast.success('Customer deleted successfully');
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const handleCopyLink = async (customer: Customer) => {
    const url = getCustomerPortalUrl(customer.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(customer.id);
      toast.success(`Customer link copied for ${customer.name}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    try {
      await createCustomer.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim(),
        address: newAddress.trim(),
      });
      toast.success(`Customer "${newName.trim()}" added`);
      setAddOpen(false);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add customer';
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm" className="flex items-center gap-2" onClick={() => setAddOpen(true)}>
          <UserPlus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UsersIcon />
          <p className="mt-3 text-sm">
            {search
              ? 'No customers match your search.'
              : 'No customers yet. Add your first customer!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((customer: Customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground text-sm">{customer.name}</span>
                  <Badge
                    variant={customer.balance === 0 ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {customer.balance === 0 ? 'CLEAR' : `₹${customer.balance.toFixed(2)}`}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {customer.phone} · ID: {customer.id}
                </p>
              </div>

              <div className="flex items-center gap-1 ml-2">
                {/* Copy customer portal link */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  title="Copy customer portal link"
                  onClick={() => handleCopyLink(customer)}
                >
                  {copiedId === customer.id ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>

                {/* Delete — admin only */}
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{customer.name}</strong>? This
                          will also delete all their transactions and notifications. This action
                          cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(customer.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Name *</Label>
              <Input
                id="cust-name"
                placeholder="Customer full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                placeholder="+91 XXXXX XXXXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-address">Address</Label>
              <Input
                id="cust-address"
                placeholder="Optional address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
