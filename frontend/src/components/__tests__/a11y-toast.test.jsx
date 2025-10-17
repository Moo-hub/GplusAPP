import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import Toast from '../Toast';
import { checkAccessibility } from '../../utils/test-utils/accessibility';

// Configure jest-axe with specific rules for notifications
const customAxe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-hidden-focus': { enabled: true }
  }
});

describe('Toast Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });

  it('should have proper ARIA attributes for success toast', async () => {
    const { container } = render(
      <Toast
        type="success"
        message="Operation completed successfully"
        visible={true}
      />
    );
    
    const toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveAttribute('aria-live', 'polite');
    
    // Check for accessibility violations
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper ARIA attributes for error toast', async () => {
    const { container } = render(
      <Toast
        type="error"
        message="An error occurred"
        visible={true}
      />
    );
    
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveAttribute('aria-live', 'assertive');
    
    // Check for accessibility violations
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have accessible dismiss button', async () => {
    const onDismiss = jest.fn();
    const { container } = render(
      <Toast
        type="info"
        message="This is an informational message"
        visible={true}
        onDismiss={onDismiss}
      />
    );
    
    const dismissButton = screen.getByRole('button');
    expect(dismissButton).toBeInTheDocument();
    expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss notification');
    
    // Check for accessibility violations
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should not be focusable or perceivable when hidden', async () => {
    // First render visible
    const { rerender, container } = render(
      <Toast
        type="info"
        message="This is an informational message"
        visible={true}
      />
    );
    
    // Make sure it's in the document
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Now rerender as not visible
    rerender(
      <Toast
        type="info"
        message="This is an informational message"
        visible={false}
      />
    );
    
    // Check that we can't find it by role when hidden
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    
    // Check for accessibility violations
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should use appropriate colors for different toast types', async () => {
    // Test all toast types with checkAccessibility utility
    await checkAccessibility(
      <div>
        <Toast
          type="success"
          message="Success message"
          visible={true}
        />
        <Toast
          type="error"
          message="Error message"
          visible={true}
        />
        <Toast
          type="warning"
          message="Warning message"
          visible={true}
        />
        <Toast
          type="info"
          message="Info message"
          visible={true}
        />
      </div>
    );
  });
  
  it('should handle long messages properly', async () => {
    const longMessage = "This is a very long notification message that should still be readable and accessible even when it wraps to multiple lines or needs to be truncated in some way. The component should handle this gracefully.";
    
    const { container } = render(
      <Toast
        type="info"
        message={longMessage}
        visible={true}
      />
    );
    
    // Check that the message is in the document
    expect(screen.getByText(longMessage)).toBeInTheDocument();
    
    // Check for accessibility violations
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
});