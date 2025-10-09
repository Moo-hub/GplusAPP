import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { enqueueAxe } from '../../utils/test-utils/axe-serial';
import { MemoryRouter } from 'react-router-dom';
import { checkAccessibilityRoles } from '../../utils/test-utils/accessibility';
import PickupRequestForm from '../PickupRequestForm';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Setup store mock
const mockStore = {
  getState: () => ({
    auth: { isAuthenticated: true, user: { id: '123' } },
    pickup: { loading: false }
  }),
  dispatch: vi.fn(),
  subscribe: vi.fn()
};

// Add minimal methods to match Redux Store shape used by Provider
mockStore.replaceReducer = () => {};
// Support observable interop used by some libs
mockStore[Symbol.observable] = function() {
  return {
    subscribe: () => ({ unsubscribe: () => {} })
  };
};

// Setup query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

// Configure jest-axe
const customAxe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    'form-field-multiple-labels': { enabled: true }
  }
});

// Helper wrapper component for tests that need store and router context
function TestWrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={mockStore}>
        <MemoryRouter>
          {children}
        </MemoryRouter>
      </Provider>
    </QueryClientProvider>
  );
}

describe('Form Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });

  describe('PickupRequestForm Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <PickupRequestForm />
        </TestWrapper>
      );
  const results = await enqueueAxe(() => customAxe(container));
  expect(results).toHaveNoViolations();
    });

    it('should have proper form roles and labels', async () => {
      await checkAccessibilityRoles(
        <TestWrapper>
          <PickupRequestForm />
        </TestWrapper>,
        ['form', 'button']
      );
    });

    it('should have all form controls labeled correctly', async () => {
      const { container } = render(
        <TestWrapper>
          <PickupRequestForm />
        </TestWrapper>
      );
      
      // Check that all inputs have associated labels
      const inputs = container.querySelectorAll('input, select, textarea');
      
      inputs.forEach(input => {
        const hasLabel = input.hasAttribute('aria-label') || 
                        input.hasAttribute('aria-labelledby') ||
                        document.querySelector(`label[for="${input.id}"]`) ||
                        // Accept label wrapping the input (common pattern)
                        input.closest('label');
        
        expect(!!hasLabel).toBeTruthy();
      });
    });
  });
});