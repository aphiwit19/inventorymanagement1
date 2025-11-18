import { storage } from './storage';

export function seedIfNeeded() {
  // หากปิดการเติมข้อมูลเดโม่ไว้ ให้ข้าม
  if (storage.get('seed_disabled', false)) {
    // แต่ยังคงสร้างผู้ใช้พื้นฐานหากยังไม่มี เพื่อให้ล็อกอินได้
    if (!storage.has('users')) {
      const now = new Date().toISOString();
      const users = [
        { id: 'u_admin', name: 'Admin', email: 'admin@gmail.com', passwordHash: 'admin', role: 'admin', phone: '0800000000', createdAt: now, addresses: [] },
        { id: 'u_staff', name: 'Staff', email: ' ', passwordHash: 'staff', role: 'staff', phone: '0811111111', createdAt: now, addresses: [] },
        { id: 'u_cust', name: 'Customer', email: 'customer@example.com', passwordHash: 'customer', role: 'customer', phone: '0822222222', createdAt: now, addresses: [] },
      ];
      storage.set('users', users);
    }
    return;
  }
  if (!storage.has('users')) {
    const now = new Date().toISOString();
    const users = [
      { id: 'u_admin', name: 'Admin', email: 'admin@example.com', passwordHash: 'admin', role: 'admin', phone: '0800000000', createdAt: now, addresses: [] },
      { id: 'u_staff', name: 'Staff', email: 'staff@example.com', passwordHash: 'staff', role: 'staff', phone: '0811111111', createdAt: now, addresses: [] },
      {id: 'u_staff2', name: 'Staff2', email: 'staff2@example.com', passwordHash: 'staff2', role: 'staff', phone: '0811111112', createdAt: now, addresses: [] },
      { id: 'u_cust', name: 'Customer', email: 'customer@example.com', passwordHash: 'customer', role: 'customer', phone: '0822222222', createdAt: now, addresses: [ { id: 'addr1', fullName: 'Customer', phone: '0822222222', line1: '123/4', district: 'บางรัก', province: 'กรุงเทพ', zipcode: '10500', isDefault: true } ] },
    ];
    storage.set('users', users);
  }

  const now = new Date().toISOString();
  const baseProducts = [
      { id: 'p1', sku: 'SKU-001', name: 'สินค้า A', description: 'คำอธิบายสินค้า A', price: 590, cost: 300, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 25, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p2', sku: 'SKU-002', name: 'สินค้า B', description: 'คำอธิบายสินค้า B', price: 990, cost: 500, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 8, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p3', sku: 'SKU-003', name: 'สินค้า C', description: 'คำอธิบายสินค้า C', price: 1290, cost: 700, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 2, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p4', sku: 'SKU-004', name: 'สินค้า D', description: 'คำอธิบายสินค้า D', price: 1590, cost: 800, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 15, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p5', sku: 'SKU-005', name: 'สินค้า E', description: 'คำอธิบายสินค้า E', price: 1990, cost: 1000, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 20, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },  
      { id: 'p6', sku: 'SKU-006', name: 'สินค้า F', description: 'คำอธิบายสินค้า F', price: 2490, cost: 1200, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 10, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p7', sku: 'SKU-007', name: 'สินค้า G', description: 'คำอธิบายสินค้า G', price: 2990, cost: 1400, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 5, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p8', sku: 'SKU-008', name: 'สินค้า H', description: 'คำอธิบายสินค้า H', price: 3490, cost: 1600, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 12, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p9', sku: 'SKU-009', name: 'สินค้า I', description: 'คำอธิบายสินค้า I', price: 3990, cost: 1800, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 18, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p10', sku: 'SKU-010', name: 'สินค้า J', description: 'คำอธิบายสินค้า J', price: 4490, cost: 2000, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 25, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p11', sku: 'SKU-011', name: 'สินค้า K', description: 'คำอธิบายสินค้า K', price: 1590, cost: 800, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 9, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p12', sku: 'SKU-012', name: 'สินค้า L', description: 'คำอธิบายสินค้า L', price: 890, cost: 450, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 30, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p13', sku: 'SKU-013', name: 'สินค้า M', description: 'คำอธิบายสินค้า M', price: 2190, cost: 1100, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 7, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p14', sku: 'SKU-014', name: 'สินค้า N', description: 'คำอธิบายสินค้า N', price: 2790, cost: 1300, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 14, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p15', sku: 'SKU-015', name: 'สินค้า O', description: 'คำอธิบายสินค้า O', price: 3290, cost: 1500, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 19, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p16', sku: 'SKU-016', name: 'สินค้า P', description: 'คำอธิบายสินค้า P', price: 499, cost: 250, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 60, reorderLevel: 10, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p17', sku: 'SKU-017', name: 'สินค้า Q', description: 'คำอธิบายสินค้า Q', price: 1299, cost: 600, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 35, reorderLevel: 8, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p18', sku: 'SKU-018', name: 'สินค้า R', description: 'คำอธิบายสินค้า R', price: 1690, cost: 900, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 22, reorderLevel: 6, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p19', sku: 'SKU-019', name: 'สินค้า S', description: 'คำอธิบายสินค้า S', price: 2590, cost: 1200, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 11, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p20', sku: 'SKU-020', name: 'สินค้า T', description: 'คำอธิบายสินค้า T', price: 3690, cost: 1700, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 16, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p21', sku: 'SKU-021', name: 'สินค้า U', description: 'คำอธิบายสินค้า U', price: 2890, cost: 1300, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 26, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p22', sku: 'SKU-022', name: 'สินค้า V', description: 'คำอธิบายสินค้า V', price: 3190, cost: 1500, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 21, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p23', sku: 'SKU-023', name: 'สินค้า W', description: 'คำอธิบายสินค้า W', price: 1790, cost: 900, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 17, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p24', sku: 'SKU-024', name: 'สินค้า X', description: 'คำอธิบายสินค้า X', price: 2290, cost: 1100, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 28, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p25', sku: 'SKU-025', name: 'สินค้า Y', description: 'คำอธิบายสินค้า Y', price: 2690, cost: 1300, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 6, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p26', sku: 'SKU-026', name: 'สินค้า Z', description: 'คำอธิบายสินค้า Z', price: 3090, cost: 1500, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 13, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p27', sku: 'SKU-027', name: 'สินค้า AA', description: 'คำอธิบายสินค้า AA', price: 990, cost: 450, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 40, reorderLevel: 8, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p28', sku: 'SKU-028', name: 'สินค้า AB', description: 'คำอธิบายสินค้า AB', price: 1390, cost: 700, images: [], category: 'ทั่วไป', brand: 'BrandZ', stock: 24, reorderLevel: 6, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p29', sku: 'SKU-029', name: 'สินค้า AC', description: 'คำอธิบายสินค้า AC', price: 1890, cost: 950, images: [], category: 'ทั่วไป', brand: 'BrandX', stock: 12, reorderLevel: 5, status: 'active', createdAt: now, updatedAt: now },
      { id: 'p30', sku: 'SKU-030', name: 'สินค้า AD', description: 'คำอธิบายสินค้า AD', price: 2390, cost: 1200, images: [], category: 'ทั่วไป', brand: 'BrandY', stock: 32, reorderLevel: 8, status: 'active', createdAt: now, updatedAt: now },
  ];

  if (!storage.has('products')) {
    storage.set('products', baseProducts);
  } else {
    const existing = storage.get('products', []);
    const existIds = new Set(existing.map(p => p.id));
    const newOnes = baseProducts.filter(p => !existIds.has(p.id));
    if (newOnes.length > 0) {
      storage.set('products', [...existing, ...newOnes]);
    }
  }

  if (!storage.has('orders')) {
    const now = new Date().toISOString();
    const orders = [
      { id: 'ORD-1001', customerId: 'u_cust', items: [ { productId: 'p1', qty: 2, price: 590 }, { productId: 'p2', qty: 1, price: 990 } ], shippingAddressId: 'addr1', status: 'pending', trackingNumber: '', assignedStaffId: null, createdAt: now, updatedAt: now, checklist: [ { productId: 'p1', checked: false }, { productId: 'p2', checked: false } ] }
    ];
    storage.set('orders', orders);
  }

  if (!storage.has('stock_movements')) {
    storage.set('stock_movements', []);
  }

  if (!storage.has('notifications')) {
    const notifications = [
      { id: 'n1', type: 'new_order', message: 'มีคำสั่งซื้อใหม่ #ORD-1001', meta: { orderId: 'ORD-1001' }, read: false, createdAt: new Date().toISOString() },
      { id: 'n2', type: 'low_stock', message: 'สินค้า C สต็อกต่ำ', meta: { productId: 'p3' }, read: false, createdAt: new Date().toISOString() },
    ];
    storage.set('notifications', notifications);
  }
}
