export function formatPrice(price: number | string): string {
  const parsed = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(parsed)) return '$0';
  const formatted = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(parsed);
  return `$${formatted}`;
}
