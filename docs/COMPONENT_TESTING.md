# Component Testing with Cypress

This guide explains how to use Cypress Component Testing for testing React components in the G+ App.

## Overview

Component testing allows you to test individual React components in isolation, making it easier to:

1. Test component behavior without setting up an entire application
2. Focus on specific component functionality
3. Achieve faster test execution than end-to-end tests
4. Get comprehensive coverage of component states and edge cases

## Setup

Cypress Component Testing is already configured in the project. The key configuration files are:

- `cypress.config.js` - Contains component testing settings
- `cypress/support/component.js` - Support file for component tests
- `cypress/support/component-index.html` - HTML template for mounting components

## Writing Component Tests

### Basic Structure

Component tests are located in the `cypress/component` directory and follow this basic structure:

```javascript
import React from 'react';
import { mount } from 'cypress/react';
import YourComponent from '../../src/components/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    // Mount the component
    cy.mount(<YourComponent />);
    
    // Make assertions
    cy.get('.your-component').should('be.visible');
  });
});
```

### Mounting Components

Use the `mount` function to render a component for testing:

```javascript
cy.mount(<Button>Click Me</Button>);
```

You can pass props to components:

```javascript
cy.mount(
  <UserProfile 
    user={{id: '123', name: 'Test User'}}
    isAdmin={true}
  />
);
```

### Testing Component States

Test different component states by passing different props:

```javascript
// Test loading state
cy.mount(<DataTable isLoading={true} data={[]} />);
cy.get('.loading-spinner').should('be.visible');

// Test with data
cy.mount(<DataTable isLoading={false} data={mockData} />);
cy.get('table tr').should('have.length', mockData.length + 1); // +1 for header row
```

### Testing User Interactions

Use Cypress commands to interact with your components:

```javascript
// Test button click
cy.mount(<Button onClick={cy.spy().as('clickSpy')}>Click Me</Button>);
cy.get('button').click();
cy.get('@clickSpy').should('have.been.calledOnce');

// Test form input
cy.mount(<TextInput onChange={cy.spy().as('changeSpy')} />);
cy.get('input').type('Hello');
cy.get('@changeSpy').should('have.been.called');
```

### Mocking API Calls

Use Cypress intercept to mock API calls your components might make:

```javascript
// Mock API response
cy.intercept('GET', '/api/users/123', {
  statusCode: 200,
  body: { id: '123', name: 'Test User' }
}).as('getUser');

// Mount component
cy.mount(<UserProfile userId="123" />);

// Wait for API call
cy.wait('@getUser');

// Assert component displays data correctly
cy.get('.user-name').should('contain.text', 'Test User');
```

### Testing Component Lifecycle

Test component behavior during mounting, updating, and unmounting:

```javascript
// Test effect hook
cy.intercept('GET', '/api/notifications', []).as('getNotifications');
cy.mount(<NotificationCenter />);
cy.wait('@getNotifications');

// Test cleanup
const cleanup = cy.spy().as('cleanupSpy');
cy.mount(<SubscriptionComponent onUnmount={cleanup} />);
cy.get('#root').then(() => {
  // Force unmount by changing the root content
  cy.get('#root').invoke('html', '');
  cy.get('@cleanupSpy').should('have.been.calledOnce');
});
```

## Testing Patterns

### Component With Context

To test components that use React Context:

```javascript
import { ThemeProvider } from '../../src/context/ThemeContext';

cy.mount(
  <ThemeProvider initialTheme="dark">
    <ThemedButton>Dark Button</ThemedButton>
  </ThemeProvider>
);
```

### Components With Redux

For components that use Redux:

```javascript
import { Provider } from 'react-redux';
import { store } from '../../src/store';

cy.mount(
  <Provider store={store}>
    <ConnectedComponent />
  </Provider>
);
```

### Testing React Router Components

For components that use React Router:

```javascript
import { MemoryRouter, Route, Routes } from 'react-router-dom';

cy.mount(
  <MemoryRouter initialEntries={['/users/123']}>
    <Routes>
      <Route path="/users/:id" element={<UserProfile />} />
    </Routes>
  </MemoryRouter>
);
```

## Running Component Tests

### Running All Component Tests

```bash
npm run test:components
```

### Running Specific Component Tests

```bash
npx cypress run-ct --spec "cypress/component/button.cy.js"
```

### Opening Component Test Runner

```bash
npx cypress open-ct
```

## Best Practices

1. **Test in Isolation**: Test one component at a time, mocking any dependencies.

2. **Focus on Behavior**: Test what the component does, not its implementation details.

3. **Test All States**: Make sure to test loading, error, empty, and populated states.

4. **Use Data Attributes**: Add `data-testid` attributes to elements you want to select in tests.

5. **Mock External Dependencies**: Use `cy.intercept()` to mock API calls and other external dependencies.

6. **Test Accessibility**: Include tests for keyboard navigation and screen reader compatibility.

7. **Visual Testing**: Consider combining with visual regression testing for UI components.

## Example: Testing a Form Component

```javascript
describe('RegistrationForm', () => {
  beforeEach(() => {
    cy.mount(<RegistrationForm onSubmit={cy.spy().as('submitSpy')} />);
  });

  it('shows validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.get('.error-message').should('be.visible');
    cy.get('@submitSpy').should('not.have.been.called');
  });

  it('submits with valid data', () => {
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    cy.get('@submitSpy').should('have.been.calledWith', {
      email: 'test@example.com',
      password: 'Password123!'
    });
  });
});
```

## Troubleshooting

### Component Not Rendering

If your component isn't rendering:

1. Check browser console for errors
2. Verify all required props are provided
3. Check if component depends on context providers

### Test Failing Due to Async Operations

For components with async operations:

1. Use `cy.wait()` to wait for network requests
2. Use `cy.get().should()` for retrying assertions until they pass

### Styling Issues

If component styling doesn't match production:

1. Check if your component depends on global styles
2. Add necessary CSS imports to `cypress/support/component.js`
3. Consider setting up CSS variables or theme providers

## Resources

- [Cypress Component Testing Documentation](https://docs.cypress.io/guides/component-testing/introduction)
- [React Testing Best Practices](https://reactjs.org/docs/testing.html)
- [Component Testing vs E2E Testing](https://www.cypress.io/blog/2022/01/04/diving-into-cypress-component-testing/)
- [G+ App Test Guidelines](./TESTING_INFRASTRUCTURE.md)