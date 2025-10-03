# Testing the G+ App

## Testing Tools and Frameworks

The G+ App uses a comprehensive testing approach with multiple layers:

- **Unit Testing**: Vitest for fast, isolated tests of functions and modules
- **Component Testing**: Cypress Component Testing for React components
- **End-to-End Testing**: Cypress for complete user flows
- **Specialized Tests**: Performance, accessibility, and offline functionality

## Getting Started with Testing

### Prerequisites

Ensure you have Node.js installed (v14+) and have installed dependencies:

```bash
npm install
```

### Running Tests

#### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage reports
npm run test:coverage
```

#### Component Tests

```bash
# Open Cypress component testing
npm run cypress:open:component

# Run component tests headlessly
npm run cypress:run:component
```

#### End-to-End Tests

```bash
# Open Cypress E2E testing
npm run cypress:open:e2e

# Run E2E tests headlessly
npm run cypress:run:e2e

# Run during development with app server
npm run cy:dev

# Run specific test file
npm run cypress:run:e2e -- --spec "cypress/e2e/user-journey.cy.js"
```

#### Complete Test Suite

```bash
# Run all tests
npm run test:all
```

## Test Categories

### End-to-End Tests

- **User Journey**: Complete flow from registration to redemption
- **Authentication**: Login, registration, logout flows
- **Pickup Management**: Schedule, track, and cancel pickups
- **Rewards System**: Browse and redeem rewards
- **Offline Functionality**: App behavior without network
- **Accessibility**: WCAG compliance testing

### API Tests

- **Authentication Endpoints**: Login, registration, token refresh
- **Pickup Endpoints**: CRUD operations for pickups
- **Points and Rewards**: Balance checking, redemption
- **User Profile**: Profile management

### Performance Tests

- **Page Load Time**: Time to fully load pages
- **Time to Interactive**: Time until user can interact
- **API Response Time**: Backend service response times
- **Form Submission Speed**: Time to process form submissions

## Custom Cypress Commands

We've extended Cypress with custom commands:

- `cy.login()`: Authenticate a user
- `cy.goOffline()` / `cy.goOnline()`: Toggle network state
- `cy.selectFutureDate()`: Select a date in the future
- `cy.measurePageLoad()`: Measure page load performance
- `cy.checkAccessibility()`: Run accessibility checks

## Continuous Integration

Tests run automatically on GitHub Actions for every pull request and merge to main branches.

## Further Documentation

For more detailed information, see:
- [Full Testing Documentation](./docs/TESTING_DOCUMENTATION.md)
- [Accessibility Guidelines](./docs/ACCESSIBILITY_GUIDE.md)
- [Performance Testing Guide](./docs/PERFORMANCE_TESTING.md)