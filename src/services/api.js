const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';

export function getAuthToken() {
  try {
    const ns = 'inv_';
    const raw = localStorage.getItem(ns + 'auth_token');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getAuthToken();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(API_BASE_URL + path, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  // HTTP error
  if (!res.ok) {
    const message = (data && (data.message || data.error)) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  // Backend semantic error
  if (data && data.success === false) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
