import { apiRequest } from './client';

export function fetchOrders() {
  return apiRequest('/orders.php');
}
