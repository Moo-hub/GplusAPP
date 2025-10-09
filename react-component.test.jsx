// react-component.test.jsx
import React from 'react';
import { describe, it, expect } from 'vitest';

// Simple React component
function SimpleComponent({ name }) {
  return React.createElement('div', { className: 'greeting' },
    React.createElement('h1', null, `Hello, ${name}!`)
  );
}

describe('React Component Tests', () => {
  it('creates a component with props', () => {
    const element = React.createElement(SimpleComponent, { name: 'World' });
    
    expect(element).toBeDefined();
    expect(element.type).toBe(SimpleComponent);
    expect(element.props.name).toBe('World');
  });
  
  it('has the correct component structure', () => {
    // Create component instance (without rendering)
    const component = SimpleComponent({ name: 'World' });
    
    // Verify the structure
    expect(component).toBeDefined();
    expect(component.type).toBe('div');
    expect(component.props.className).toBe('greeting');
    
    // Check the child element
    const h1Element = component.props.children;
    expect(h1Element.type).toBe('h1');
    expect(h1Element.props.children).toBe('Hello, World!');
  });
});