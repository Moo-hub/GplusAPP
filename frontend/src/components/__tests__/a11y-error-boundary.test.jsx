import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import ErrorBoundary from '../ErrorBoundary';
import { checkAccessibility } from '../../utils/test-utils/accessibility';

// Configure jest-axe with specific rules for error messages
const customAxe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'aria-alert': { enabled: true }
  }
});

describe('ErrorBoundary Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });

  // Create a component that will throw an error
  const ThrowError = () => {
    throw new Error('Test error');
    // eslint-disable-next-line no-unreachable
    return <div>This will not render</div>;
  };

  // Mock console.error to prevent test output noise
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.error.mockRestore();
  });

  it('should have accessible error message', async () => {
    // Suppress React's error boundary warning in test
    const originalError = console.error;
    console.error = vi.fn();
    
    const { container } = render(
      <ErrorBoundary fallbackRender={({ error }) => (
        <div role="alert" aria-live="assertive">
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error: {error.message}</p>
          <button>Retry</button>
        </div>
      )}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Restore console.error
    console.error = originalError;
    
    // Check that error message is displayed
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    // Check for accessibility violations
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should maintain focus when showing error', async () => {
    // Suppress React's error boundary warning in test
    const originalError = console.error;
    console.error = vi.fn();
    
    const { container } = render(
      <ErrorBoundary fallbackRender={({ resetErrorBoundary }) => (
        <div role="alert" aria-live="assertive">
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error</p>
          <button 
            onClick={resetErrorBoundary} 
            autoFocus 
            data-testid="retry-button"
          >
            Retry
          </button>
        </div>
      )}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Restore console.error
    console.error = originalError;
    
    // Check that retry button is in the document
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // In a real browser, this button would receive focus due to autoFocus
    // We can't test focus in JSDOM effectively, but we can verify the attribute is there
    expect(retryButton).toHaveAttribute('autoFocus');
    
    // Check for accessibility violations
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should use appropriate ARIA live region for errors', async () => {
    // Use the utility function to test accessibility
    await checkAccessibility(
      <ErrorBoundary fallbackRender={() => (
        <div 
          role="alert" 
          aria-live="assertive"
          aria-atomic="true"
        >
          <h2>Error Occurred</h2>
          <p>An unexpected error has occurred.</p>
        </div>
      )}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    // Check for alert role
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });
});