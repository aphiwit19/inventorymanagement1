import { storage } from './storage';
import { addNotification } from './notifications';

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
