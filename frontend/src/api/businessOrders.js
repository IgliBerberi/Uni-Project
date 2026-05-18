import { apiRequest } from './client';

export function fetchBusinessOrders() {
  return apiRequest('/business-orders.php');
}
