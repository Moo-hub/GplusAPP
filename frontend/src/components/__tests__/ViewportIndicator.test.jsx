import React from "react";
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Avoid mocking Vite plugin; tests will set process.env.NODE_ENV before importing
describe('ViewportIndicator Component', () => {
  const originalEnv = process['env'].NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process['env'].NODE_ENV = originalEnv;
  });

  it('renders in development mode', async () => {
    // Force development environment before importing the module
    process['env'].NODE_ENV = 'development';
    const { default: ViewportIndicator } = await import('../dev/ViewportIndicator');

    render(<ViewportIndicator />);

    // Check that viewport indicator is rendered
    expect(screen.getByText('XS')).toBeInTheDocument();
  });

  it('does not render in production mode', async () => {
    // Force production environment before importing the module
    process['env'].NODE_ENV = 'production';
    const { default: ViewportIndicator } = await import('../dev/ViewportIndicator');

    const { container } = render(<ViewportIndicator />);

    // Check that the component returns null
    expect(container.firstChild).toBeNull();
  });

  it('renders the component with all breakpoint indicators', async () => {
    // Force development environment before importing the module
    process['env'].NODE_ENV = 'development';
    const { default: ViewportIndicator } = await import('../dev/ViewportIndicator');

    render(<ViewportIndicator />);

    // Check that all breakpoint indicators are present in the DOM
    expect(screen.getByText('XS')).toBeInTheDocument();
    expect(screen.getByText('SM')).toBeInTheDocument();
    expect(screen.getByText('MD')).toBeInTheDocument();
    expect(screen.getByText('LG')).toBeInTheDocument();
    expect(screen.getByText('XL')).toBeInTheDocument();
    expect(screen.getByText('2XL')).toBeInTheDocument();
  });
});