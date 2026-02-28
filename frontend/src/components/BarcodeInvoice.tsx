import React from 'react';

interface BarcodeInvoiceProps {
  invoiceId: string;
  className?: string;
}

export default function BarcodeInvoice({ invoiceId, className = '' }: BarcodeInvoiceProps) {
  // Generate deterministic bar widths from the invoice ID
  const generateBars = (id: string) => {
    const bars: { width: number; isBar: boolean; height: number }[] = [];

    // Start guard
    bars.push({ width: 2, isBar: true, height: 48 });
    bars.push({ width: 1, isBar: false, height: 48 });
    bars.push({ width: 2, isBar: true, height: 48 });

    const chars = id.split('').slice(0, 24);
    for (let i = 0; i < chars.length; i++) {
      const code = chars[i].charCodeAt(0);
      const w1 = (code % 3) + 1;
      const w2 = ((code >> 2) % 3) + 1;
      const h = 28 + (code % 20);
      bars.push({ width: w1, isBar: true, height: h });
      bars.push({ width: w2, isBar: false, height: h });
    }

    // End guard
    bars.push({ width: 2, isBar: true, height: 48 });
    bars.push({ width: 1, isBar: false, height: 48 });
    bars.push({ width: 2, isBar: true, height: 48 });

    return bars;
  };

  const bars = generateBars(invoiceId);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-end gap-px h-12 bg-white px-2 py-1 rounded border border-border">
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              width: `${bar.width}px`,
              height: `${bar.height}px`,
              backgroundColor: bar.isBar ? '#111827' : 'transparent',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      <p className="text-xs font-mono text-muted-foreground mt-1 tracking-widest">{invoiceId}</p>
    </div>
  );
}
