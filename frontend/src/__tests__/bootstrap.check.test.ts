import { describe, it, expect } from 'vitest';

describe('bootstrap smoke-check', () => {
  it('injects CSRF meta and localStorage is available', () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    expect(meta).not.toBeNull();
    expect(typeof window.localStorage.getItem).toBe('function');
    window.localStorage.setItem('x', 'y');
    expect(window.localStorage.getItem('x')).toBe('y');
  });
});
