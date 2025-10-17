# End-to-End Testing Documentation

## Overview

This document provides a comprehensive guide to the end-to-end (E2E) testing strategy implemented for the G+ App. Our testing approach ensures that all critical user flows work correctly from start to finish and that the application functions properly in real-world scenarios.

## Testing Framework

We use Cypress as our primary E2E testing framework because it provides:

- Real browser testing
- Automatic waiting for elements
- Time travel and debugging capabilities
- Network traffic control
- Easy API mocking
- Visual testing features

## Test Coverage

Our E2E tests cover the following critical user flows:

### Authentication Flows
- User registration
- Login
- Password reset
- Logout
- Session persistence

### Pickup Management
- Complete pickup scheduling workflow
- Pickup rescheduling
- Pickup cancellation
- Pickup tracking
- Points earning from completed pickups

### Rewards System
- Browsing available rewards
- Redeeming points for rewards
- Viewing redemption history
- Filtering rewards by category

### Responsive Design
- Mobile responsiveness across different devices
- Tablet layout testing
- Appropriate element sizing and positioning
- Touch interaction testing

### API Functionality
- Direct testing of API endpoints
- Authentication token handling
- Error responses
- Data validation

### Performance
- Page load times
- Time to interactive
- Form submission speed
- API response times

### Accessibility
- WCAG 2.1 A and AA compliance
- Screen reader compatibility
- Keyboard navigation
- Color contrast

## Test Structure

Our tests follow this structure:

- `cypress/e2e/` - Main test files
  - `authentication.cy.js` - Authentication flow tests
  - `user-journey.cy.js` - Complete user journey tests
  - `pickup-workflow.cy.js` - Pickup scheduling and tracking
  - `rewards-redemption.cy.js` - Points redemption flow
  - `accessibility.cy.js` - Accessibility compliance tests
  - `api-tests.cy.js` - Backend API testing
  - `performance-tests.cy.js` - Performance monitoring
  - `mobile-responsiveness.cy.js` - Responsive design tests
  - `offline-functionality.cy.js` - Offline capabilities

- `cypress/component/` - Component test files
  - `PickupForm.cy.js` - Pickup form component tests

- `cypress/support/` - Support files
  - `commands.js` - Basic Cypress commands
  - `enhanced-commands.js` - Custom commands for our app
  - `e2e.js` - E2E test configuration

- `cypress/fixtures/` - Test data
  - `users.json` - Test user data
  - `rewards.json` - Rewards data
  - `pickups.json` - Pickup data

## Custom Commands

We've extended Cypress with custom commands to simplify test writing:

```javascript
// Authentication shortcut
cy.login(email, password);

// Network state testing
cy.goOffline();
cy.goOnline();

// Date helpers
cy.selectFutureDate(selector, daysInFuture);

// Performance monitoring
cy.measurePageLoad(pageName);

// Accessibility testing
cy.checkAccessibility(options);

// API shortcuts
cy.createTestUser(userData);
cy.completePickup(pickupId, pickupData);
```

## Test Data Management

We use Cypress fixtures to manage test data consistently across tests:

- **Static fixtures**: For reusable test data
- **Dynamic generation**: For unique data in each test run
- **API seeding**: Creating test data via API before tests

## Continuous Integration

Our E2E tests run automatically in our CI pipeline:

1. On every pull request to `main` or `develop` branches
2. On every push to `main` or `develop` branches
3. Nightly runs on the `main` branch

### CI Configuration

Tests are run in GitHub Actions with:

- Parallel test execution across 5 groups
- Separate workflows for E2E and component tests
- Automatic screenshot and video capture
- Combined coverage reporting
- Performance budget enforcement with Lighthouse

## Best Practices

When writing E2E tests:

1. **Isolate tests**: Each test should be independent and not rely on state from previous tests
2. **Use data-testid attributes**: For reliable element selection
3. **Minimize waits**: Let Cypress handle waiting automatically
4. **Clean up test data**: Either before or after tests
5. **Keep tests focused**: Test one specific flow per test file
6. **Use custom commands**: For repeated patterns
7. **Handle async operations properly**: Use Cypress's built-in retry-ability

## Running Tests Locally

```bash
# Open Cypress test runner for E2E tests
npm run cypress:open:e2e

# Run E2E tests headlessly
npm run cypress:run:e2e

# Run specific test file
npm run cypress:run:e2e -- --spec "cypress/e2e/user-journey.cy.js"

# Run E2E tests with UI server started
npm run cy:dev

# Open Cypress test runner for component tests
npm run cypress:open:component

# Run component tests headlessly
npm run cypress:run:component

# Run all tests (unit, component, E2E)
npm run test:all
```

## Writing New Tests

When adding new features, follow these steps to create E2E tests:

1. Identify the critical user flow or feature to test
2. Create a new test file in `cypress/e2e/`
3. Use existing fixtures or create new ones for test data
4. Write tests that verify the feature works end-to-end
5. Add assertions for error states and edge cases
6. Run tests locally to verify they pass
7. Submit PR with feature and tests

## Troubleshooting

Common issues when running tests:

1. **Tests timing out**: Increase timeouts or check if elements exist
2. **Element not found**: Use more reliable selectors like data-testid
3. **API errors**: Check if backend is running or mock the responses
4. **Random failures**: Add retry logic or improve test reliability

## Future Improvements

- Visual regression testing
- Cross-browser testing with BrowserStack
- Performance trend monitoring
- Test data generation with Faker.js
- Integration with QA dashboards