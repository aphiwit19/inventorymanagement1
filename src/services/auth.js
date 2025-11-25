import { storage } from './storage';
import { api } from './api';

// Keys for auth data in namespaced storage
const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

function mapApiUser(user, prevUser = null) {
  if (!user) return null;
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : user.role;
  const sameUser = prevUser && prevUser.id && user.id && prevUser.id === user.id;
  const mergedAddresses = sameUser && Array.isArray(prevUser.addresses)
    ? prevUser.addresses
    : Array.isArray(user.addresses)
    ? user.addresses
    : [];
  return {
    ...user,
    role,
    name: user.fullName || user.name || '',
    phone: user.phoneNumber || user.phone || '',
    addresses: mergedAddresses,
  };
}

function setAuth({ token, user }) {
  if (token) {
    storage.set(AUTH_TOKEN_KEY, token);
  }
  if (user) {
    storage.set(AUTH_USER_KEY, user);
  }
}

function clearAuth() {
  storage.remove(AUTH_TOKEN_KEY);
  storage.remove(AUTH_USER_KEY);
}

export async function login(email, password) {
  const res = await api.post('/api/auth/login', { email, password });
  if (!res?.success || !res?.data) {
    throw new Error(res?.message || 'เข้าสู่ระบบไม่สำเร็จ');
  }
  const { user, token } = res.data;
  if (!token) {
    throw new Error('ไม่พบโทเค็นสำหรับการเข้าสู่ระบบ');
  }
  const prev = storage.get(AUTH_USER_KEY, null);
  const mapped = mapApiUser(user, prev && prev.id === user.id ? prev : null);
  setAuth({ token, user: mapped });
  return mapped;
}

export async function logout() {
  try {
    await api.post('/api/auth/logout', {});
  } catch (e) {
    // ignore logout API errors and clear local auth anyway
  }
  clearAuth();
}

export function getSession() {
  const token = storage.get(AUTH_TOKEN_KEY, null);
  const user = storage.get(AUTH_USER_KEY, null);
  if (!token || !user) return null;
  return { token, user };
}

export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return session.user || null;
}

export async function refreshCurrentUser() {
  const session = getSession();
  if (!session?.token) return null;
  try {
    const res = await api.get('/api/auth/me');
    if (!res?.success || !res?.data) return null;
    const prev = storage.get(AUTH_USER_KEY, null);
    const user = mapApiUser(res.data, prev && prev.id === res.data.id ? prev : null);
    setAuth({ token: session.token, user });
    return user;
  } catch {
    clearAuth();
    return null;
  }
}

export async function registerCustomer({ name, email, password, phone = '' }) {
  // Backend expects fullName + phoneNumber
  const payload = { fullName: name, email, password, phoneNumber: phone };
  const res = await api.post('/api/auth/register', payload);
  if (!res?.success || !res?.data) {
    throw new Error(res?.message || 'สมัครสมาชิกไม่สำเร็จ');
  }
  // Backend ยังไม่คืน token: ให้ผู้ใช้ไปล็อกอินเอง
  return res.data;
}

// เปลี่ยนรหัสผ่านของผู้ใช้ปัจจุบัน
export async function changePassword({ currentPassword, newPassword }) {
  const body = { currentPassword, newPassword };
  const res = await api.put('/api/auth/change-password', body);
  if (!res?.success) {
    throw new Error(res?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
  }
  return res.data; // updatedUser ตามสเปค
}

// Profile & Addresses
export function updateProfile(partial) {
  const session = getSession();
  if (!session?.user) return null;
  const updated = { ...session.user, ...partial, id: session.user.id, role: session.user.role };
  storage.set(AUTH_USER_KEY, updated);
  return updated;
}

export function addAddress(address) {
  const user = getCurrentUser();
  if (!user) return null;
  const id = address.id || ('addr_' + Date.now());
  const nextAddr = { ...address, id, isDefault: !!address.isDefault };
  const list = Array.isArray(user.addresses) ? [...user.addresses] : [];
  if (nextAddr.isDefault) {
    for (const a of list) a.isDefault = false;
  }
  list.push(nextAddr);
  const updatedUser = { ...user, addresses: list };
  storage.set(AUTH_USER_KEY, updatedUser);
  return nextAddr;
}

export function updateAddress(address) {
  const user = getCurrentUser();
  if (!user) return null;
  const list = Array.isArray(user.addresses) ? [...user.addresses] : [];
  const aIdx = list.findIndex(a => a.id === address.id);
  if (aIdx === -1) return null;
  const next = { ...list[aIdx], ...address };
  if (next.isDefault) {
    for (const a of list) a.isDefault = false;
  }
  list[aIdx] = next;
  const updatedUser = { ...user, addresses: list };
  storage.set(AUTH_USER_KEY, updatedUser);
  return next;
}

export function removeAddress(addressId) {
  const user = getCurrentUser();
  if (!user) return null;
  const list = Array.isArray(user.addresses) ? [...user.addresses] : [];
  const filtered = list.filter(a => a.id !== addressId);
  const updatedUser = { ...user, addresses: filtered };
  storage.set(AUTH_USER_KEY, updatedUser);
  return true;
}

export function setDefaultAddress(addressId) {
  const user = getCurrentUser();
  if (!user) return null;
  const list = Array.isArray(user.addresses) ? [...user.addresses] : [];
  for (const a of list) a.isDefault = (a.id === addressId);
  const updatedUser = { ...user, addresses: list };
  storage.set(AUTH_USER_KEY, updatedUser);
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
