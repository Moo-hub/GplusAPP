// basic-test.js - Basic Vitest test file
import { describe, expect, it } from 'vitest';

// Simple pure function to test
function add(a, b) {
  return a + b;
}

describe('Basic Math Functions', () => {
  it('adds two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('handles negative numbers', () => {
    expect(add(-5, 3)).toBe(-2);
  });
});