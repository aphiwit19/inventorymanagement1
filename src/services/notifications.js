import { storage } from './storage';
import { api } from './api';

export function listNotifications() {
  return storage.get('notifications', []);
}

export function addNotification({ type, title, message, entity, entityId }) {
  const list = listNotifications();
  const now = new Date().toISOString();
  const noti = {
    id: 'noti_' + Date.now(),
    type,
    title,
    message,
    createdAt: now,
    read: false,
    entity: entity || null,
    entityId: entityId || null,
  };
  storage.set('notifications', [noti, ...list]);
  return noti;
}

export function markNotificationRead(id) {
  const list = listNotifications();
  const idx = list.findIndex(n => n.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], read: true };
  storage.set('notifications', list);
  return list[idx];
}

export function markAllNotificationsRead() {
  const list = listNotifications().map(n => ({ ...n, read: true }));
  storage.set('notifications', list);
  return list;
}

// --- Backend notification services ---
// หมายเหตุ: คงฟังก์ชัน local ไว้เพื่อความเข้ากันได้ย้อนหลัง

export async function getNotifications() {
  const res = await api.get('/api/notifications');
  if (!res?.success) return [];
  const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.notifications) ? res.data.notifications : []);
  return list;
}

export async function getUnreadCount() {
  const res = await api.get('/api/notifications/unread-count');
  if (!res?.success) return 0;
  const val = res.data?.count ?? res.data ?? 0;
  return Number(val) || 0;
}

export async function markNotificationReadApi(id) {
  const res = await api.patch(`/api/notifications/${id}/read`, {});
  return res?.data || true;
}

export async function markAllNotificationsReadApi() {
  const res = await api.patch('/api/notifications/read-all', {});
  return res?.data || true;
}

export async function deleteNotificationApi(id) {
  const res = await api.del(`/api/notifications/${id}`);
  return res?.data || true;
}
