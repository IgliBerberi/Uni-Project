export function digitsOnly(value) {
  return value.replace(/\D/g, '');
}

export function formatCardNumber(value) {
  const d = digitsOnly(value).slice(0, 19);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(value) {
  const d = digitsOnly(value).slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function validateCardNumber(number) {
  const d = digitsOnly(number);
  if (d.length < 13 || d.length > 19) {
    return 'Card number must be 13–19 digits.';
  }
  return null;
}

export function validateExpiry(expiry) {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return 'Use MM/YY format.';
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10) + 2000;
  if (month < 1 || month > 12) return 'Invalid expiry month.';
  const now = new Date();
  const expEnd = new Date(year, month, 0, 23, 59, 59);
  if (expEnd < now) return 'Card has expired.';
  return null;
}

export function validateCvv(cvv) {
  const d = digitsOnly(cvv);
  if (d.length < 3 || d.length > 4) return 'CVV must be 3 or 4 digits.';
  return null;
}

export function validateCardholder(name) {
  if (!name.trim()) return 'Cardholder name is required.';
  if (name.trim().length < 2) return 'Enter the full name on the card.';
  return null;
}
