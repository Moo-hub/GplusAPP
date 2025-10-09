# Testing Guide for G+ App

This document provides an overview of the testing approach used in the G+ App project.

## Testing Setup

Our testing infrastructure is built on the following libraries:

- **Vitest**: Main testing framework
- **React Testing Library**: For rendering and interacting with React components in tests
- **Mock Service Worker (MSW)**: For mocking API requests
- **Jest DOM**: For additional DOM-related assertions

## Key Files

- `src/setupTests.js`: Main test setup file that configures the testing environment
- `src/test-utils.js`: Helper utilities for common testing patterns
- `src/mocks/server.js`: MSW server setup for API mocking

## Test Organization

Tests are organized alongside the components they test:

```plaintext
src/
  components/
    ComponentName.jsx
    __tests__/
      ComponentName.test.jsx
```

We follow a consistent approach with unit tests for all component types, including:
- UI components (e.g., `Button`, `Card`)
- Layout components (e.g., `Layout`, `Footer`)
- Utility components (e.g., `ScreenReaderOnly`, `ServiceWorkerWrapper`)
- Integration components (e.g., `RouteTracker`, `Notifications`)

## Common Testing Patterns

### Component Testing

For typical component tests:

```jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByTestId('your-element')).toBeInTheDocument();
  });
});
```

### Testing with Router

For components that use React Router:

```jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import YourComponent from '../YourComponent';

describe('YourComponent with Router', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <YourComponent />
      </BrowserRouter>
    );
    // Your assertions here
  });
});
```

### Mocking Internationalization (i18n)

For components that use i18next:

```jsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import YourComponent from '../YourComponent';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'your.translation.key': 'Translated text'
      };
      return translations[key] || key;
    }
  })
}));

describe('YourComponent with i18n', () => {
  it('renders translated content correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Translated text')).toBeInTheDocument();
  });
});
```

### Testing Utility Components

For simple utility components that wrap or enhance content:

```jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ScreenReaderOnly from '../ScreenReaderOnly';

describe('ScreenReaderOnly Component', () => {
  it('renders children with sr-only class', () => {
    render(<ScreenReaderOnly>Screen reader text</ScreenReaderOnly>);
    
    const srElement = screen.getByText('Screen reader text');
    expect(srElement).toHaveClass('sr-only');
  });
});
```

### Testing Components with React Router

For components that use React Router hooks like `useLocation`:

```jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RouteTracker from '../RouteTracker';
import { Analytics } from '../../services/analyticsService';

// Mock dependencies
vi.mock('../../services/analyticsService', () => ({
  Analytics: { pageView: vi.fn() }
}));

describe('RouteTracker Component', () => {
  it('tracks page view for specific route', () => {
    render(
      <MemoryRouter initialEntries={['/companies']}>
        <RouteTracker>
          <div>Content</div>
        </RouteTracker>
      </MemoryRouter>
    );
    
    expect(Analytics.pageView).toHaveBeenCalledWith('Companies', '/companies');
  });
});
```

### Testing Authentication

```jsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import YourComponent from '../YourComponent';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    currentUser: { name: 'Test User', email: 'test@example.com' },
    logout: vi.fn()
  }))
}));

describe('YourComponent with auth', () => {
  it('renders authenticated content correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
  });
});
```

## Test Utilities

### setupI18nMock

Helper for setting up i18n mocking with predefined translations:

```jsx
import { setupI18nMock } from '../../test-utils';

vi.mock('react-i18next', () => setupI18nMock({
  // Additional translations if needed
  'custom.key': 'Custom Value'
}));
```

### mockAuthContext

Helper for mocking the authentication context:

```jsx
import { mockAuthContext } from '../../test-utils';

vi.mock('../../contexts/AuthContext', () => 
  mockAuthContext({ name: 'Test User', points: 100 })
);
```

### mockDate

Helper for mocking the Date object for consistent date-related tests:

```jsx
import { mockDate, restoreDate } from '../../test-utils';

describe('Component with dates', () => {
  let originalDate;
  
  beforeEach(() => {
    originalDate = mockDate('2025-09-28');
  });
  
  afterEach(() => {
    restoreDate(originalDate);
  });
  
  it('shows the correct year', () => {
    render(<YourComponent />);
    expect(screen.getByText('© 2025')).toBeInTheDocument();
  });
});
```

## Best Practices

1. Use `data-testid` attributes for selecting elements in tests
2. Test component behavior rather than implementation details
3. Isolate component tests by mocking dependencies
4. Write integration tests for critical user flows
5. Keep test maintenance low by focusing on stable assertions

## Running Tests

```bash
# Run all tests
npm test

# Run a specific test file
npm test -- src/components/__tests__/YourComponent.test.jsx

# Run tests in watch mode
npm test -- --watch
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Mock Service Worker Documentation](https://mswjs.io/docs/)
- [Jest Axe Documentation](https://github.com/nickcolley/jest-axe)

## Accessibility Testing

We use jest-axe to test components for accessibility violations according to WCAG guidelines.

### Basic Accessibility Testing

```jsx
import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import YourComponent from '../YourComponent';

// Configure jest-axe with specific rules if needed
const customAxe = configureAxe({
  rules: {
    'color-contrast': { enabled: true },
    'button-name': { enabled: true }
  }
});

describe('Accessibility Tests', () => {
  // Add jest-axe matcher
  beforeAll(() => {
    expect.extend(toHaveNoViolations);
  });

  it('should have no accessibility violations', async () => {
    const { container } = render(<YourComponent />);
    const results = await customAxe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Using Accessibility Utilities

We provide utility functions in `src/utils/test-utils/accessibility.js` to simplify accessibility testing:

```jsx
import { checkAccessibility, checkAccessibilityRoles } from '../../utils/test-utils/accessibility';

it('should have no accessibility violations', async () => {
  await checkAccessibility(<YourComponent />);
});

it('should have proper ARIA roles', async () => {
  await checkAccessibilityRoles(<YourComponent />, ['button', 'heading']);
});
```

### Testing Form Accessibility

For form components, pay special attention to these accessibility aspects:

1. Labels are properly associated with form controls
2. Error messages are connected to inputs via `aria-describedby`
3. Required fields are marked with `required` attribute and visually indicated
4. Focus states are visible and have sufficient contrast
5. Form controls can be operated with keyboard only

Example test:

```jsx
it('should have properly labeled form controls', async () => {
  const { container } = render(<FormComponent />);
  
  // Check that all inputs have associated labels
  const inputs = container.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    const hasLabel = input.hasAttribute('aria-label') || 
                     input.hasAttribute('aria-labelledby') ||
                     document.querySelector(`label[for="${input.id}"]`);
    
    expect(hasLabel).toBeTruthy();
  });
});