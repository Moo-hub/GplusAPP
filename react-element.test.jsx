// react-element.test.jsx
import React from 'react';
import { describe, it, expect } from 'vitest';

describe('React Element Creation', () => {
  it('creates a div element correctly', () => {
    const element = React.createElement('div', { className: 'test-class' }, 'Test Content');
    
    expect(element).toBeDefined();
    expect(element.type).toBe('div');
    expect(element.props.className).toBe('test-class');
    expect(element.props.children).toBe('Test Content');
  });
});