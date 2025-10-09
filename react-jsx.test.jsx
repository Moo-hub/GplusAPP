// react-jsx.test.jsx
import React from 'react';
import { describe, it, expect } from 'vitest';

// Component to test (not rendered)
function TestComponent({ message }) {
  return React.createElement('div', null, message);
}

describe('React JSX Component', () => {
  it('creates a valid React element', () => {
    const element = React.createElement(TestComponent, { message: 'Hello World' });
    
    expect(element).toBeDefined();
    expect(element.type).toBe(TestComponent);
    expect(element.props.message).toBe('Hello World');
  });
});