import { api } from './api';

function toBackendRole(role) {
  if (!role) return undefined;
  const r = role.toLowerCase();
  if (r === 'customer') return 'CUSTOMER';
  if (r === 'staff') return 'STAFF';
  if (r === 'admin') return 'ADMIN';
  return undefined;
}

function toFrontendUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.fullName || '',
    phone: u.phoneNumber || '',
    role: typeof u.role === 'string' ? u.role.toLowerCase() : u.role,
    isActive: !!u.isActive,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export async function fetchUsers({ role, isActive, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  const r = toBackendRole(role);
  if (r && r !== 'ADMIN') params.set('role', r);
  if (typeof isActive === 'boolean') params.set('isActive', String(isActive));
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  const res = await api.get(`/api/users${qs ? `?${qs}` : ''}`);
  if (!res?.success || !res?.data) {
    throw new Error(res?.message || 'ไม่สามารถดึงรายชื่อผู้ใช้ได้');
  }
  const users = Array.isArray(res.data.users) ? res.data.users.map(toFrontendUser) : [];
  const pagination = res.data.pagination || { total: users.length, page: page, totalPages: 1, limit };
  return { users, pagination };
}

export async function promoteUser(userId, newRole) {
  const roleUpper = toBackendRole(newRole);
  if (!roleUpper || roleUpper === 'ADMIN') {
    throw new Error('ไม่สามารถกำหนดบทบาทเป็น ADMIN ได้');
  }
  const res = await api.patch(`/api/users/${userId}/promote`, { newRole: roleUpper });
  if (!res?.success || !res?.data) {
    throw new Error(res?.message || 'เปลี่ยนบทบาทไม่สำเร็จ');
  }
  return toFrontendUser(res.data);
}

// ดึงข้อมูลผู้ใช้ตาม id
export async function getUserById(id) {
  const res = await api.get(`/api/users/${id}`);
  if (!res?.success) {
    throw new Error(res?.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ได้');
  }
  const user = res?.data?.user || res?.data;
  return toFrontendUser(user);
}

// สถิติผู้ใช้ (เช่น counts แยกตามบทบาท/สถานะ)
export async function getUserStats() {
  const res = await api.get('/api/admin/dashboard/users-count');
  const payload = res?.data || res;
  return payload?.data || payload || {};
}
