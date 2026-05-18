const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(res.status === 404 ? 'API not found. Is npm run backend running?' : 'Invalid server response.');
  }
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json.data;
}

/** Multipart form (file uploads) — do not set Content-Type manually */
export async function apiFormRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error('Invalid server response.');
  }
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed (${res.status})`);
  }
  return json.data;
}
