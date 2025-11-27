import { api } from './api';

export async function fetchStockMovements({ 
  type, 
  productId, 
  startDate, 
  endDate, 
  performedBy,
  page = 1, 
  limit = 10 
} = {}) {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.append('movementType', type);
  if (productId) params.append('productId', productId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (performedBy) params.append('performedBy', performedBy);
  params.append('page', String(page));
  params.append('limit', String(limit));
  
  const response = await api.get(`/api/admin/stock-movements?${params}`);
  return response.data;
}

export async function fetchStockProducts() {
  const response = await api.get('/api/admin/stock-movements/products');
  return response.data;
}

export async function fetchStockSummary({ startDate, endDate } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await api.get(`/api/admin/stock-movements/summary?${params}`);
  return response.data;
}

export async function createStockMovement(data) {
  const response = await api.post('/api/admin/stock-movements', data);
  return response.data;
}

// แปลงข้อมูลสำหรับแสดงผลใน Frontend
export function formatMovementForDisplay(movement) {
  return {
    id: movement.id,
    type: movement.movementType,
    quantity: movement.quantity,
    before: movement.stockBefore,
    after: movement.stockAfter,
    reason: movement.reason,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    date: new Date(movement.createdAt),
    performer: movement.performedByName,
    product: {
      id: movement.productId,
      sku: movement.product?.sku,
      name: movement.product?.name,
      currentStock: movement.product?.currentStock
    },
    note: movement.note
  };
}

// แปลงหมายเหตุสำหรับแสดงผล
export function formatReasonForDisplay(movement) {
  if (movement.referenceType === 'ORDER' && movement.referenceId) {
    return `เบิกออก #${movement.referenceId}`;
  }
  
  switch (movement.reason) {
    case 'เพิ่มสินค้าใหม่':
      return 'เพิ่มสินค้าใหม่';
    case 'เพิ่มสินค้าเดิม':
      return 'เพิ่มสินค้าเดิม';
    case 'เบิกสินค้า':
      return 'เบิกสินค้า';
    case 'ปรับปรุง':
      return 'ปรับปรุง';
    default:
      return movement.reason || 'ไม่ระบุ';
  }
}
