import { apiRequest } from './client';

export function fetchSavedCards() {
  return apiRequest('/saved-cards.php');
}

export function deleteSavedCard(id) {
  return apiRequest(`/saved-cards.php?id=${id}`, { method: 'DELETE' });
}
