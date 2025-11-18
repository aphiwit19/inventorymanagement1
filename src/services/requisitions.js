import { storage } from './storage';
import { addNotification } from './notifications';
import { addStockMovement } from './stock';

function genId() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `REQ-${Date.now()}-${n}`;
}

export function listRequisitions() {
  return storage.get('requisitions', []);
}

export function listRequisitionsByRequester(userId) {
  return listRequisitions().filter(r => r.requesterId === userId);
}

export function getRequisitionById(id) {
  return listRequisitions().find(r => r.id === id) || null;
}

export function createRequisition({ orderId, requesterId, requesterName, recipientName, purpose, receiveMethod, address, items }) {
  const now = new Date().toISOString();
  const id = genId();
  const total = (items||[]).reduce((s,i)=> s + Number(i.price||0) * Number(i.qty||0), 0);
  const status = receiveMethod === 'pickup' ? 'shipped' : 'pending'; // pickup = สำเร็จทันทีในมุมผลลัพธ์, ใช้ shipped แทน "ส่งสำเร็จ"
  const rec = {
    id,
    orderId: orderId || null,
    requesterId,
    requesterName,
    recipientName,
    purpose: purpose || '',
    receiveMethod, // 'pickup' | 'delivery'
    address: receiveMethod === 'delivery' ? (address || null) : null,
    items: items || [],
    total,
    status, // 'pending' | 'in_progress' | 'shipped'
    shippingCarrier: '',
    trackingNumber: '',
    createdAt: now,
    updatedAt: now,
  };
  const list = listRequisitions();
  storage.set('requisitions', [rec, ...list]);
  // notification: new requisition (append purpose if provided)
  const note = purpose ? ` (${purpose})` : '';
  addNotification({ type: 'new_requisition', title: 'รายการเบิกใหม่', message: `${rec.id} โดย ${requesterName||'-'} → ${recipientName||'-'}${note}`, entity: 'requisition', entityId: rec.id });
  // If pickup => shipped immediately, deduct stock now
  if (rec.status === 'shipped' && !rec.stockDeducted) {
    (rec.items || []).forEach(it => {
      const q = Number(it.qty || 0);
      if (it.productId && q > 0) {
        addStockMovement({ productId: it.productId, type: 'out', qty: q, note: `เบิก (รับเอง) ${rec.id}` });
      }
    });
    rec.stockDeducted = true;
    const latest = storage.get('requisitions', []).map(r=> r.id===rec.id? rec:r);
    storage.set('requisitions', latest);
  }
  return rec;
}

export function updateRequisition(id, partial) {
  const list = listRequisitions();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const before = list[idx];
  const next = { ...before, ...partial, id: before.id, updatedAt: now };
  // เมื่อสถานะเข้าสู่ขั้นตอนจ่ายของ (in_progress) หรือสำเร็จ (shipped)
  // ให้ตัดสต็อกครั้งเดียวโดยอิงธง stockDeducted
  const goingOut = (partial.status === 'in_progress' || partial.status === 'shipped');
  if (goingOut && !next.stockDeducted) {
    (next.items || []).forEach(it => {
      const q = Number(it.qty || 0);
      if (it.productId && q > 0) {
        addStockMovement({ productId: it.productId, type: 'out', qty: q, note: `เบิก ${next.id}` });
      }
    });
    next.stockDeducted = true;
  }
  list[idx] = next;
  storage.set('requisitions', list);
  return list[idx];
}

export function setRequisitionShipping(id, { shippingCarrier, trackingNumber, status }) {
  return updateRequisition(id, { shippingCarrier, trackingNumber, status });
}
