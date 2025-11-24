import { storage } from './storage';
import { getProductById } from './products';
import { api } from './api';

function genId() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${Date.now()}-${n}`;
}

export function updateOrderStatus(id, status) {
  const orders = listOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  orders[idx] = { ...orders[idx], status, updatedAt: now };
  storage.set('orders', orders);
  return orders[idx];
}

export function listOrders() {
  return storage.get('orders', []);
}

export function getOrderById(id) {
  return listOrders().find(o => o.id === id) || null;
}

export function updateOrderShipping(orderId, { shippingCarrier, trackingNumber, status }) {
  const orders = listOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const next = { ...orders[idx], shippingCarrier: shippingCarrier ?? orders[idx].shippingCarrier, trackingNumber: trackingNumber ?? orders[idx].trackingNumber, updatedAt: now };
  if (status) next.status = status; // e.g., 'in_progress' or 'shipped'
  orders[idx] = next;
  storage.set('orders', orders);
  return orders[idx];
}

// Staff helpers
export function listUnassignedOrders() {
  return listOrders().filter(o => !o.assignedStaffId && o.status === 'pending');
}

export function listOrdersByStaff(staffId) {
  return listOrders().filter(o => o.assignedStaffId === staffId);
}

export function assignOrderToStaff(orderId, staffId) {
  const orders = listOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  orders[idx] = { ...orders[idx], assignedStaffId: staffId, updatedAt: now };
  storage.set('orders', orders);
  return orders[idx];
}

export function updateOrderChecklist(orderId, productId, checked) {
  const orders = listOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;
  const checklist = (orders[idx].checklist || []).map(c => c.productId === productId ? { ...c, checked } : c);
  orders[idx] = { ...orders[idx], checklist };
  storage.set('orders', orders);
  return orders[idx];
}

export function markOrderPrepared(orderId) {
  const orders = listOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;
  const allChecked = (orders[idx].checklist || []).every(c => c.checked);
  if (!allChecked) return null;
  const now = new Date().toISOString();
  // เมื่อพนักงานจัดเสร็จ ให้คงสถานะเป็น 'pending' ฝั่งลูกค้าเห็นรอดำเนินการ จนกว่าแอดมินจะอัปเดต
  // เพิ่มธง staffPrepared เพื่อให้ฝั่งพนักงานทราบว่าเตรียมเสร็จแล้ว
  orders[idx] = { ...orders[idx], staffPrepared: true, updatedAt: now };
  storage.set('orders', orders);
  return orders[idx];
}

export function createOrderFromCart({ customerId, items, shippingAddress }) {
  const now = new Date().toISOString();
  const id = genId();
  const orderItems = items.map(i => ({ productId: i.productId, qty: i.qty, price: (getProductById(i.productId)?.price || 0) }));
  const order = {
    id,
    customerId,
    items: orderItems,
    shippingAddressId: shippingAddress?.id || null,
    shippingAddress: shippingAddress || null,
    status: 'pending',
    trackingNumber: '',
    shippingCarrier: '',
    assignedStaffId: null,
    staffPrepared: false,
    createdAt: now,
    updatedAt: now,
    checklist: orderItems.map(it => ({ productId: it.productId, checked: false })),
  };
  const orders = listOrders();
  storage.set('orders', [order, ...orders]);
  return order;
}

// API-based helpers

export async function createOrder({ shippingAddressId, items }) {
  const body = {
    shippingAddressId,
    items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
  };
  const res = await api.post('/api/orders', body);
  const root = res?.data || res;
  const container = root?.data || root;
  return container.order || container;
}

export async function fetchMyOrders({ status, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));
  const query = params.toString();
  const path = query ? `/api/orders?${query}` : '/api/orders';
  const res = await api.get(path);
  const root = res?.data || res;
  const container = root?.data || root;
  return {
    orders: container.orders || [],
    pagination: container.pagination || null,
  };
}

export async function fetchOrderById(id) {
  const res = await api.get(`/api/orders/${id}`);
  const root = res?.data || res;
  const container = root?.data || root;
  return container.order || container;
}

export async function acceptOrder(id) {
  const res = await api.post(`/api/orders/${id}/accept`, {});
  const root = res?.data || res;
  const container = root?.data || root;
  return container.order || container;
}

export async function completeOrder(id) {
  const res = await api.post(`/api/orders/${id}/complete`, {});
  const root = res?.data || res;
  const container = root?.data || root;
  return container.order || container;
}

export async function addTracking(id, trackingNumber) {
  const res = await api.post(`/api/orders/${id}/tracking`, { trackingNumber });
  const root = res?.data || res;
  const container = root?.data || root;
  return container.order || container;
}

export async function confirmDelivery(id) {
  const res = await api.post(`/api/orders/${id}/confirm-delivery`, {});
  const root = res?.data || res;
  const container = root?.data || root;
  return container.order || container;
}

export async function cancelOrder(id, reason) {
  const res = await api.post(`/api/orders/${id}/cancel`, { reason });
  const root = res?.data || res;
  const container = root?.data || root;
  return container.order || container;
}
