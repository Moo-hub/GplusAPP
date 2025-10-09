// basic-react.test.jsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple React component to test
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}

describe('Greeting Component', () => {
  it('renders with the provided name', () => {
    render(<Greeting name="World" />);
    const headingElement = screen.getByText('Hello, World!');
    expect(headingElement).toBeDefined();
    expect(headingElement.textContent).toBe('Hello, World!');
  });
});