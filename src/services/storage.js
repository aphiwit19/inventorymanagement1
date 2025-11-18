const NS = 'inv_';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
  },
  has(key) {
    return localStorage.getItem(NS + key) != null;
  },
  remove(key) {
    localStorage.removeItem(NS + key);
  },
  clearAll() {
    const keys = Object.keys(localStorage);
    keys.forEach(k => { if (k.startsWith(NS)) localStorage.removeItem(k); });
  }
};
