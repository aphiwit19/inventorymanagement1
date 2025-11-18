import { create } from 'zustand';
import { getProductById } from '../services/products';

export const useCartStore = create((set, get) => ({
  items: [], // { productId, qty }
  add(productId, qty = 1) {
    const items = [...get().items];
    const idx = items.findIndex(i => i.productId === productId);
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    else items.push({ productId, qty });
    set({ items });
  },
  remove(productId) {
    set({ items: get().items.filter(i => i.productId !== productId) });
  },
  setQty(productId, qty) {
    if (qty <= 0) return get().remove(productId);
    set({ items: get().items.map(i => i.productId === productId ? { ...i, qty } : i) });
  },
  clear() { set({ items: [] }); },
  count() { return get().items.reduce((acc, i) => acc + i.qty, 0); },
  total() {
    return get().items.reduce((sum, i) => {
      const p = getProductById(i.productId);
      return sum + (p ? p.price * i.qty : 0);
    }, 0);
  }
}));
