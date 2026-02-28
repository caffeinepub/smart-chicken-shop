import React, { useState, useEffect } from 'react';
import { Settings, Save, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetCurrentKgRate, useSetKgRate } from '../hooks/useQueries';

export default function AdminSettings() {
  const { data: currentRate, isLoading } = useGetCurrentKgRate();
  const setKgRate = useSetKgRate();

  const [rateInput, setRateInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentRate !== undefined) {
      setRateInput(currentRate.toFixed(2));
    }
  }, [currentRate]);

  const handleSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg('Please enter a valid rate greater than 0.');
      return;
    }
    try {
      await setKgRate.mutateAsync(parsed);
      setSuccessMsg(`Rate updated to ₹${parsed.toFixed(2)} per kg successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update rate.';
      setErrorMsg(msg);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shop Settings</h1>
          <p className="text-sm text-muted-foreground">Configure pricing and shop preferences</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Price Per Kilogram
          </CardTitle>
          <CardDescription>
            Set the default rate per kg for chicken. This rate will be auto-filled in all new transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="kgRate">Rate per kg (₹)</Label>
              <div className="flex gap-3">
                <Input
                  id="kgRate"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={rateInput}
                  onChange={(e) => {
                    setRateInput(e.target.value);
                    setSuccessMsg('');
                    setErrorMsg('');
                  }}
                  placeholder="e.g. 140.00"
                  className="max-w-xs"
                />
                <Button
                  onClick={handleSave}
                  disabled={setKgRate.isPending}
                  className="flex items-center gap-2"
                >
                  {setKgRate.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Rate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMsg}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Current saved rate: <span className="font-semibold text-foreground">
              {isLoading ? '...' : `₹${currentRate?.toFixed(2) ?? '140.00'} / kg`}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
