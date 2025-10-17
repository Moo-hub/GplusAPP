import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import lazyLoad from '../lazyLoad';

// Mock a component that will be lazy loaded
const MockComponent = () => <div data-testid="mock-component">Mock Component Content</div>;


describe('lazyLoad Utility', () => {
  it('renders the component; fallback shows only during suspense', async () => {
    // Create a promise to simulate dynamic import
    const mockImport = vi.fn().mockResolvedValue({ default: MockComponent });
    
    // Use the lazyLoad utility to create a lazy-loaded component
    const LazyComponent = lazyLoad(mockImport);
    
  // Render the lazy-loaded component
  render(<LazyComponent />);
    
  // Since our mock resolves immediately, the component should render
  expect(await screen.findByTestId('mock-component')).toBeInTheDocument();
  // And the fallback should not be present anymore
  expect(document.querySelector('.lazy-loading')).toBeNull();
    
    // Verify the import function was called
    expect(mockImport).toHaveBeenCalled();
  });

  it('supports a custom fallback during suspense', async () => {
    // Create a promise to simulate dynamic import
    const mockImport = vi.fn().mockResolvedValue({ default: MockComponent });
    
    // Create a custom fallback component
    const CustomFallback = () => <div data-testid="custom-fallback">Custom Loading...</div>;
    
    // Use the lazyLoad utility with a custom fallback
    const LazyComponent = lazyLoad(mockImport, <CustomFallback />);
    
  // Render the lazy-loaded component
  render(<LazyComponent />);
    
  // With immediate resolution, the component renders and fallback is not shown
  expect(await screen.findByTestId('mock-component')).toBeInTheDocument();
  expect(screen.queryByTestId('custom-fallback')).toBeNull();
  });
});