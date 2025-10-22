import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import lazyLoad from '../lazyLoad';

// Mock a component that will be lazy loaded
const MockComponent = () => <div data-testid="mock-component">Mock Component Content</div>;

// Instead of mocking React.lazy globally, provide a synchronous importer in
// the test and use the lazyLoad helper directly. This avoids replacing the
// React module and duplicating hook state.

describe('lazyLoad Utility', () => {
  it('renders a loading fallback initially and then the component', async () => {
    // Create a controllable promise to simulate a delayed dynamic import
  let resolveImport = (v) => {};
  const importPromise = new Promise((res) => { resolveImport = res; });
    const mockImport = vi.fn().mockImplementation(() => importPromise);

    // Use the lazyLoad utility to create a lazy-loaded component
    const LazyComponent = lazyLoad(mockImport);

    // Render the lazy-loaded component
    render(<LazyComponent />);

    // Expect the loading fallback to be shown initially (before we resolve)
    expect(document.querySelector('.lazy-loading')).toBeInTheDocument();
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();

    // Resolve the import and then expect the actual component to be rendered
    resolveImport({ default: MockComponent });
    expect(await screen.findByTestId('mock-component')).toBeInTheDocument();

    // Verify the import function was called
    expect(mockImport).toHaveBeenCalled();
  });

  it('renders a custom fallback if provided', async () => {
    // Create a controllable promise to simulate a delayed dynamic import
  let resolveImport = (v) => {};
  const importPromise = new Promise((res) => { resolveImport = res; });
    const mockImport = vi.fn().mockImplementation(() => importPromise);

    // Create a custom fallback component
    const CustomFallback = () => <div data-testid="custom-fallback">Custom Loading...</div>;

    // Use the lazyLoad utility with a custom fallback
    const LazyComponent = lazyLoad(mockImport, <CustomFallback />);

    // Render the lazy-loaded component
    render(<LazyComponent />);

    // Expect the custom fallback to be shown initially
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();

    // Resolve the import and then expect the actual component to be rendered
    resolveImport({ default: MockComponent });
    expect(await screen.findByTestId('mock-component')).toBeInTheDocument();
  });
});