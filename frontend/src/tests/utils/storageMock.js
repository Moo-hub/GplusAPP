import { vi } from 'vitest';

// Utility to mock localStorage per-test and restore spies cleanly.
export function seedLocalStorage(initial = {}) {
  const store = { ...initial };

  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    store[key] = value;
  });

  const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    return store[key];
  });

  const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
    delete store[key];
  });

  function clear() {
    try {
      setItemSpy.mockRestore();
      getItemSpy.mockRestore();
      removeItemSpy.mockRestore();
    } catch (e) {}
  }

  return { store, clear };
}
