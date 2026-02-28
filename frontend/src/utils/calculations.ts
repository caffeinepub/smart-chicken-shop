export function calculateTotalPrice(weight: number, rate: number): number {
  return weight * rate;
}

export function calculateNewBalance(previousBalance: number, totalPrice: number, payment: number): number {
  const result = previousBalance + totalPrice - payment;
  return result < 0 ? 0 : result;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} kg`;
}

export function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
