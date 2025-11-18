import { storage } from './storage';

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
