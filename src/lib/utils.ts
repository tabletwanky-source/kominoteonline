export function formatPrice(price: number, currency: 'USD' | 'HTG' = 'USD'): string {
  if (price === 0) {
    return 'Gratis';
  }
  if (currency === 'HTG') {
    return `${price.toLocaleString()} HTG`;
  }
  return `$${price.toFixed(2)}`;
}

export function formatStudentCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k elèv`;
  }
  return `${count} elèv`;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
