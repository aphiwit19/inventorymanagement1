import { create } from 'zustand';
import { getProductById } from '../services/products';
import { storage } from '../services/storage';

const CART_KEY = 'cart_items';

export const useCartStore = create((set, get) => ({
  items: storage.get(CART_KEY, []), // { productId, qty }
  add(productId, qty = 1) {
    const items = [...get().items];
    const idx = items.findIndex(i => i.productId === productId);
    if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
    else items.push({ productId, qty });
    storage.set(CART_KEY, items);
    set({ items });
  },
  remove(productId) {
    const items = get().items.filter(i => i.productId !== productId);
    storage.set(CART_KEY, items);
    set({ items });
  },
  setQty(productId, qty) {
    if (qty <= 0) return get().remove(productId);
    const items = get().items.map(i => i.productId === productId ? { ...i, qty } : i);
    storage.set(CART_KEY, items);
    set({ items });
  },
  clear() {
    storage.set(CART_KEY, []);
    set({ items: [] });
  },
  count() { return get().items.reduce((acc, i) => acc + i.qty, 0); },
  total() {
    return get().items.reduce((sum, i) => {
      const p = getProductById(i.productId);
      return sum + (p ? p.price * i.qty : 0);
    }, 0);
  }
}));
