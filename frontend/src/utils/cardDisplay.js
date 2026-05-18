const BRAND_LABELS = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  card: 'Card',
};

export function cardBrandLabel(brand) {
  return BRAND_LABELS[brand] || 'Card';
}

export function formatExpiry(month, year) {
  return `${month}/${year}`;
}
