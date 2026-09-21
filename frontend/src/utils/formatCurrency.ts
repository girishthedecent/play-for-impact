export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(number: number | undefined | null): string {
  if (number == null || isNaN(number)) return '—';
  return new Intl.NumberFormat('en-IN').format(number);
}
