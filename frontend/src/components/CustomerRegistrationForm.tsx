import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateCustomer } from '../hooks/useQueries';
import { toast } from 'sonner';
import { UserPlus, Copy, CheckCircle } from 'lucide-react';

interface CustomerRegistrationFormProps {
  onSuccess?: (customerId: string) => void;
  onCancel?: () => void;
}

export default function CustomerRegistrationForm({ onSuccess, onCancel }: CustomerRegistrationFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createCustomer = useCreateCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    try {
      const id = await createCustomer.mutateAsync({ name: name.trim(), phone: phone.trim(), address: address.trim() });
      setCreatedId(id);
      toast.success('Customer registered successfully!');
      if (onSuccess) onSuccess(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register customer';
      toast.error(msg);
    }
  };

  const handleCopy = () => {
    if (createdId) {
      navigator.clipboard.writeText(createdId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setAddress('');
    setCreatedId(null);
  };

  if (createdId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Customer Registered!</h3>
          <p className="text-sm text-muted-foreground mb-4">Share this Customer ID with the customer.</p>
          <div className="bg-muted rounded-lg p-3 flex items-center justify-between mb-4">
            <span className="font-mono text-sm font-semibold text-foreground">{createdId}</span>
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Add Another
            </Button>
            {onCancel && (
              <Button className="flex-1" onClick={onCancel}>
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="w-4 h-4 text-primary" />
          Register New Customer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cust-name">Full Name *</Label>
            <Input
              id="cust-name"
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">Phone Number</Label>
            <Input
              id="cust-phone"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-address">Address</Label>
            <Input
              id="cust-address"
              placeholder="Enter address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            {onCancel && (
              <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Registering...' : 'Register Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
