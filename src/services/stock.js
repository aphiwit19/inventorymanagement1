import { storage } from './storage';
import { getProductById, updateProduct } from './products';

export function listStockMovements() {
  return storage.get('stock_movements', []);
}

export function addStockMovement({ productId, type, qty, note = '' }) {
  const product = getProductById(productId);
  if (!product) throw new Error('ไม่พบสินค้า');
  const q = Number(qty || 0);
  const nextStock = type === 'in' ? product.stock + q : product.stock - q;
  // ปรับสต็อกโดยไม่สร้าง movement ซ้ำ (เพราะเรากำลังบันทึก movement อยู่แล้ว)
  updateProduct(productId, { stock: Math.max(0, nextStock), __skipMovement: true });

  const rec = {
    id: 'sm_' + Date.now(),
    productId,
    type, // 'in' | 'out'
    qty: q,
    note,
    createdAt: new Date().toISOString(),
  };
  const list = listStockMovements();
  storage.set('stock_movements', [rec, ...list]);

  // หมายเหตุ: การแจ้งเตือนสต็อกต่ำจะจัดการใน updateProduct() เพื่อป้องกันการแจ้งซ้ำ
  return rec;
}
