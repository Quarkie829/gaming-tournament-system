/**
 * Utility for formatting currency in Indian Rupees (₹)
 * Uses Indian numbering grouping (lakhs, crores) via en-IN locale.
 */
export function formatINR(amount: number | string | null | undefined, options?: { showFreeForZero?: boolean }): string {
  if (amount === null || amount === undefined) {
    return '₹0.00';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) {
    return '₹0.00';
  }
  if (options?.showFreeForZero && num === 0) {
    return 'FREE';
  }

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `₹${formatted}`;
}

export default formatINR;
