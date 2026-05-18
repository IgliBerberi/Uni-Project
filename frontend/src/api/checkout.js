import { apiRequest } from './client';

export function placeOrder(payload) {
  return apiRequest('/checkout.php', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
