import { useState, useEffect } from 'react';

const KEY = 'maquetapp-img-lib';
const EV  = 'maquetapp-lib-change';
const MAX = 20;

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

export function useImageLibrary() {
  const [images, setImages] = useState(read);

  useEffect(() => {
    const h = () => setImages(read());
    window.addEventListener(EV, h);
    return () => window.removeEventListener(EV, h);
  }, []);

  const save = (dataUrl, name = 'Image', meta = {}) => {
    const list = read();
    if (list.length >= MAX) return null; // caller handles message
    const item = { id: `img_${Date.now()}`, dataUrl, name: (name || 'Image').trim(), createdAt: Date.now(), ...meta };
    try {
      const updated = [item, ...list];
      localStorage.setItem(KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(EV));
      return item.id;
    } catch {
      return null; // quota exceeded
    }
  };

  const remove = (id) => {
    const updated = read().filter(img => img.id !== id);
    localStorage.setItem(KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EV));
  };

  return { images, save, remove, isFull: images.length >= MAX };
}
