import { storage } from './storage';
import { addNotification } from './notifications';
import { api } from './api';

export function listProducts() {
  return storage.get('products', []);
}

export function getProductById(id) {
  const items = storage.get('products', []);
  return items.find(p => p.id === id) || null;
}

export function createProduct(partial) {
  const items = storage.get('products', []);
  const id = 'p' + (Date.now());
  const now = new Date().toISOString();
  const product = {
    id,
    sku: partial.sku || ('SKU-' + Math.floor(Math.random()*100000).toString().padStart(5,'0')),
    name: partial.name || 'สินค้าใหม่',
    description: partial.description || '',
    price: Number(partial.price || 0),
    cost: Number(partial.cost || 0),
    images: partial.images || [],
    category: partial.category || 'ทั่วไป',
    brand: partial.brand || '',
    stock: Number(partial.stock || 0),
    initialStock: Number(partial.initialStock ?? partial.stock ?? 0),
    reorderLevel: Number(partial.reorderLevel || 0),
    status: partial.status || 'active',
    lowStockNotified: false,
    dateAdded: partial.dateAdded || now,
    createdAt: now,
    updatedAt: now,
  };
  storage.set('products', [product, ...items]);
  // บันทึกประวัติรับเข้าเริ่มต้น ถ้ามีสต็อกตั้งต้น
  const initQty = Number(product.stock || 0);
  if (initQty > 0) {
    const rec = {
      id: 'sm_' + Date.now(),
      productId: product.id,
      type: 'in',
      qty: initQty,
      note: 'ตั้งต้นสินค้าใหม่',
      createdAt: now,
    };
    const mv = storage.get('stock_movements', []);
    storage.set('stock_movements', [rec, ...mv]);
  }
  return product;
}

export function updateProduct(id, partial) {
  const items = storage.get('products', []);
  const idx = items.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  // เก็บ initialStock เดิมไว้หากไม่ได้ส่งมาแก้ไข
  const current = items[idx];
  const nextInitial = (partial.hasOwnProperty('initialStock')) ? Number(partial.initialStock) : (current.initialStock ?? current.stock ?? 0);
  const next = { ...current, ...partial, initialStock: nextInitial, id: current.id, updatedAt: now };
  // ถ้าปรับสต็อกโดยตรง และไม่ได้เป็นกรณีที่ถูกเรียกจาก addStockMovement ให้สร้างประวัติ movement
  if (partial.hasOwnProperty('stock') && !partial.__skipMovement) {
    const prev = Number(current.stock || 0);
    const curr = Number(partial.stock || 0);
    const diff = curr - prev;
    if (diff !== 0) {
      const rec = {
        id: 'sm_' + Date.now(),
        productId: current.id,
        type: diff > 0 ? 'in' : 'out',
        qty: Math.abs(diff),
        note: diff > 0 ? 'ปรับเพิ่มสต็อก (แก้ไขสินค้า)' : 'ปรับลดสต็อก (แก้ไขสินค้า)',
        createdAt: now,
      };
      const mv = storage.get('stock_movements', []);
      storage.set('stock_movements', [rec, ...mv]);
    }
  }
  // ตรวจแจ้งเตือนสต็อกต่ำกว่า 20% ของ initialStock
  const threshold = Number(next.initialStock || 0) * 0.2;
  if (Number(next.initialStock || 0) > 0 && Number(next.stock || 0) <= threshold) {
    if (!next.lowStockNotified) {
      addNotification({ type: 'low_stock', title: 'สต็อกต่ำกว่า 20%', message: `${next.sku || next.id} เหลือ ${next.stock}` , entity: 'product', entityId: next.id });
      next.lowStockNotified = true;
    }
  } else {
    // รีเซ็ตสถานะแจ้งเตือนเมื่อกลับมาสูงกว่า threshold
    next.lowStockNotified = false;
  }
  items[idx] = next;
  storage.set('products', items);
  return items[idx];
}

export function deleteProduct(id) {
  const items = storage.get('products', []);
  const next = items.filter(p => p.id !== id);
  storage.set('products', next);
  return true;
}

// --- Admin backend integration helpers ---

function mapApiProduct(p) {
  if (!p) return null;
  return {
    id: p.id,
    sku: p.productCode,
    name: p.productName,
    description: p.description || '',
    price: Number(p.price || 0),
    stock: Number(p.stockQuantity || 0),
    initialStock: Number(p.initialStock ?? p.stockQuantity ?? 0),
    reorderLevel: Number(p.lowStockThreshold || 0),
    category: p.category || '',
    images: p.imageUrl ? [p.imageUrl] : [],
    status: p.isActive ? 'active' : 'inactive',
    dateAdded: p.createdAt || null,
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
    raw: p,
  };
}

export async function fetchAdminProducts() {
  const res = await api.get('/api/products');
  const payload = res?.data || res;
  // Backend shape: { success, data: { products: [...], pagination: {...} } }
  const products = Array.isArray(payload?.data?.products)
    ? payload.data.products
    : Array.isArray(payload?.products)
    ? payload.products
    : Array.isArray(payload)
    ? payload
    : [];
  return products.map(mapApiProduct);
}

export async function fetchAdminProductById(id) {
  const res = await api.get(`/api/products/${id}`);
  const payload = res?.data || res;
  // Possible shapes:
  // { success, data: { product } }
  // { success, data: product }
  // or just product
  const p = payload?.data?.product
    || payload?.data
    || payload;
  return mapApiProduct(p);
}

export async function createAdminProduct(partial) {
  const body = {
    productCode: partial.productCode,
    productName: partial.name,
    description: partial.description || '',
    price: Number(partial.price || 0),
    initialStock: Number(partial.initialStock ?? partial.stock ?? 0),
    lowStockThreshold: Number(partial.lowStockThreshold || 0),
    category: partial.category || undefined,
    imageUrl: (partial.images && partial.images[0]) || partial.imageUrl || undefined,
  };
  const res = await api.post('/api/products', body);
  const p = res?.data || res;
  return mapApiProduct(p);
}

export async function updateAdminProduct(id, partial) {
  const body = {
    productCode: partial.productCode,
    productName: partial.name,
    description: partial.description,
    price: partial.price != null ? Number(partial.price) : undefined,
    lowStockThreshold: partial.lowStockThreshold != null ? Number(partial.lowStockThreshold) : undefined,
    category: partial.category,
    imageUrl: (partial.images && partial.images[0]) || partial.imageUrl,
  };
  const res = await api.put(`/api/products/${id}`, body);
  const p = res?.data || res;
  return mapApiProduct(p);
}

export async function deleteAdminProduct(id) {
  await api.del(`/api/products/${id}`);
  return true;
}

export async function increaseAdminProductStock(id, quantity, reason) {
  const body = { quantity: Number(quantity || 0), reason: reason || undefined };
  return api.post(`/api/products/${id}/stock/increase`, body);
}
