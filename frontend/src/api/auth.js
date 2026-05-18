import { apiRequest } from './client';

export function registerUser(payload) {
  return apiRequest('/auth/user.php?action=register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(credentials) {
  return apiRequest('/auth/user.php?action=login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function fetchCurrentUser() {
  return apiRequest('/auth/user.php?action=me');
}

export function logoutUser() {
  return apiRequest('/auth/user.php', { method: 'DELETE' });
}

export function registerBusiness(payload) {
  return apiRequest('/auth/business.php?action=register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginBusiness(credentials) {
  return apiRequest('/auth/business.php?action=login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export function fetchCurrentBusiness() {
  return apiRequest('/auth/business.php?action=me');
}

export function logoutBusiness() {
  return apiRequest('/auth/business.php', { method: 'DELETE' });
}
