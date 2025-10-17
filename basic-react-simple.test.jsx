// basic-react-simple.test.jsx
import React from 'react';
import { describe, it, expect } from 'vitest';

// Simple test that doesn't rely on @testing-library
describe('Basic React Import', () => {
  it('imports React successfully', () => {
    expect(React).toBeDefined();
    expect(React.createElement).toBeDefined();
  });
});