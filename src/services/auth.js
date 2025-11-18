import { storage } from './storage';

export function login(email, password) {
  const users = storage.get('users', []);
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase() && u.passwordHash === password);
  if (!user) {
    throw new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }
  storage.set('session', { userId: user.id, role: user.role });
  return user;
}

export function logout() {
  storage.remove('session');
}

export function getSession() {
  return storage.get('session', null);
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const users = storage.get('users', []);
  return users.find(u => u.id === session.userId) || null;
}

export function registerCustomer({ name, email, password, phone = '' }) {
  const users = storage.get('users', []);
  const exists = users.some(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) {
    throw new Error('อีเมลนี้มีอยู่ในระบบแล้ว');
    }
  const id = 'u_' + Date.now();
  const now = new Date().toISOString();
  const user = { id, name, email, passwordHash: password, role: 'customer', phone, createdAt: now, addresses: [] };
  const next = [...users, user];
  storage.set('users', next);
  storage.set('session', { userId: id, role: 'customer' });
  return user;
}

// Profile & Addresses
export function updateProfile(partial) {
  const session = getSession();
  if (!session) return null;
  const users = storage.get('users', []);
  const idx = users.findIndex(u => u.id === session.userId);
  if (idx === -1) return null;
  const updated = { ...users[idx], ...partial, id: users[idx].id, role: users[idx].role };
  users[idx] = updated;
  storage.set('users', users);
  return updated;
}

export function addAddress(address) {
  const user = getCurrentUser();
  if (!user) return null;
  const users = storage.get('users', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) return null;
  const id = address.id || ('addr_' + Date.now());
  const nextAddr = { ...address, id, isDefault: !!address.isDefault };
  const list = Array.isArray(users[idx].addresses) ? [...users[idx].addresses] : [];
  if (nextAddr.isDefault) {
    for (const a of list) a.isDefault = false;
  }
  list.push(nextAddr);
  users[idx] = { ...users[idx], addresses: list };
  storage.set('users', users);
  return nextAddr;
}

export function updateAddress(address) {
  const user = getCurrentUser();
  if (!user) return null;
  const users = storage.get('users', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) return null;
  const list = Array.isArray(users[idx].addresses) ? [...users[idx].addresses] : [];
  const aIdx = list.findIndex(a => a.id === address.id);
  if (aIdx === -1) return null;
  const next = { ...list[aIdx], ...address };
  if (next.isDefault) {
    for (const a of list) a.isDefault = false;
  }
  list[aIdx] = next;
  users[idx] = { ...users[idx], addresses: list };
  storage.set('users', users);
  return next;
}

export function removeAddress(addressId) {
  const user = getCurrentUser();
  if (!user) return null;
  const users = storage.get('users', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) return null;
  const list = Array.isArray(users[idx].addresses) ? [...users[idx].addresses] : [];
  const filtered = list.filter(a => a.id !== addressId);
  users[idx] = { ...users[idx], addresses: filtered };
  storage.set('users', users);
  return true;
}

export function setDefaultAddress(addressId) {
  const user = getCurrentUser();
  if (!user) return null;
  const users = storage.get('users', []);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx === -1) return null;
  const list = Array.isArray(users[idx].addresses) ? [...users[idx].addresses] : [];
  for (const a of list) a.isDefault = (a.id === addressId);
  users[idx] = { ...users[idx], addresses: list };
  storage.set('users', users);
  return list.find(a => a.id === addressId) || null;
}

export function getDefaultAddress(user) {
  const u = user || getCurrentUser();
  if (!u) return null;
  return (u.addresses || []).find(a => a.isDefault) || null;
}

// Admin: users management
export function listUsers() {
  return storage.get('users', []);
}

export function updateUserRole(userId, role) {
  const users = storage.get('users', []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], role };
  storage.set('users', users);
  const session = getSession();
  if (session && session.userId === userId) {
    storage.set('session', { ...session, role });
  }
  return users[idx];
}
