# G+ App Testing Documentation

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Unit Testing](#unit-testing)
4. [Component Testing](#component-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [API Testing](#api-testing)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Continuous Integration](#continuous-integration)
10. [Test Reports and Coverage](#test-reports-and-coverage)
11. [Writing Tests](#writing-tests)

## Overview

This document outlines the comprehensive testing strategy for the G+ App, designed to ensure robust quality assurance through multiple levels of testing.

## Testing Strategy

Our testing approach follows the testing pyramid model with:

- **Unit Tests**: Fast, focused tests for individual functions and modules
- **Component Tests**: Testing React components in isolation
- **End-to-End Tests**: Complete user journeys and workflows
- **Specialized Tests**: Performance, accessibility, and offline functionality

## Unit Testing

Unit tests verify the correctness of individual functions, methods, and modules in isolation.

### Technology Stack

- **Test Runner**: Vitest
- **Assertion Library**: Vitest built-in assertions
- **Mocking**: Vitest mocking capabilities

### Running Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage reporting
npm run test:coverage
```

### Key Unit Test Areas

- Service modules
- Utility functions
- State management logic
- API client functions
- Data transformations

## Component Testing

Component tests verify the behavior and rendering of React components in isolation.

### Technology Stack

- **Test Runner**: Vitest for logic + Cypress for component tests
- **Component Testing**: Cypress Component Testing
- **Assertion Library**: Cypress built-in assertions

### Running Component Tests

```bash
# Run all component tests
npm run test:components
npm run cypress:run:component

# Run component tests in watch mode
npm run test:components:watch

# Run component tests with coverage
npm run test:components:coverage
```

### Key Component Test Areas

- Form components
- UI elements
- Layout components
- Interactive features
- State management within components

## End-to-End Testing

E2E tests verify complete user workflows and journeys from start to finish.

### Technology Stack

- **Test Framework**: Cypress
- **Assertion Library**: Cypress built-in assertions
- **Test Runners**: Cypress Test Runner

### Running E2E Tests

```bash
# Open Cypress test runner
npm run cypress:open:e2e

# Run E2E tests headlessly
npm run cypress:run:e2e

# Run during development with app server
npm run cy:dev
```

### Key E2E Test Scenarios

1. **User Journey**: Complete flow from registration to points redemption
2. **Authentication**: Login, registration, password reset
3. **Pickup Management**: Scheduling, tracking, and cancellation
4. **Rewards System**: Browsing and redeeming rewards
5. **Accessibility**: WCAG compliance testing
6. **Offline Functionality**: App behavior without network
7. **Performance**: Load times and responsiveness

## API Testing

API tests verify the functionality and reliability of backend services.

### Technology Stack

- **Test Framework**: Cypress for API tests
- **Assertion Library**: Cypress built-in assertions

### Running API Tests

```bash
# Run API tests specifically
npm run cypress:run:e2e -- --spec "cypress/e2e/api-tests.cy.js"
```

### Key API Test Areas

1. **Authentication Endpoints**: Login, registration, token refresh
2. **Pickup Endpoints**: CRUD operations for pickups
3. **Points and Rewards**: Balance checking, redemption
4. **User Profile**: Profile management

## Performance Testing

Performance tests verify the application meets speed and responsiveness requirements.

### Technology Stack

- **Test Framework**: Cypress with custom performance measuring
- **Metrics**: Load time, Time to Interactive, API response times

### Running Performance Tests

```bash
# Run performance tests
npm run cypress:run:e2e -- --spec "cypress/e2e/performance-tests.cy.js"
```

### Key Performance Metrics

1. **Page Load Time**: Time to fully load pages
2. **Time to Interactive**: Time until user can interact
3. **API Response Time**: Backend service response times
4. **Form Submission Speed**: Time to process form submissions

## Accessibility Testing

Accessibility tests verify the application meets WCAG guidelines.

### Technology Stack

- **Test Framework**: Cypress with cypress-axe
- **Standards**: WCAG 2.1 A and AA

### Running Accessibility Tests

```bash
# Run accessibility tests
npm run cypress:run:e2e -- --spec "cypress/e2e/accessibility.cy.js"
```

## Continuous Integration

Our CI pipeline runs all tests automatically on pull requests and merges.

### CI Configuration

CI is set up using GitHub Actions with:

- Parallel test execution
- Automatic deployment to staging on success
- Detailed test reporting
- Coverage reporting

### CI Workflow

1. Build the application
2. Run unit tests
3. Run component tests
4. Run E2E tests in parallel
5. Generate and publish reports

## Test Reports and Coverage

Test reports and coverage metrics are automatically generated.

### Coverage Reports

- Unit test coverage
- Component test coverage
- E2E test coverage
- Combined coverage report

### Viewing Reports

- CI pipeline publishes reports as artifacts
- Reports are available in the `coverage` directory locally
- Coverage metrics are tracked over time

## Writing Tests

Guidelines for writing effective tests for the G+ App.

### Unit Test Guidelines

- Focus on pure functions and business logic
- Mock external dependencies
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Component Test Guidelines

- Test component rendering
- Test user interactions
- Test state changes
- Use data-testid attributes for selectors

### E2E Test Guidelines

- Focus on critical user flows
- Use custom Cypress commands for common operations
- Use fixtures for test data
- Structure tests to be independent and idempotent

### Custom Cypress Commands

We've extended Cypress with custom commands to improve test readability:

- `cy.login()`: Authenticate a user
- `cy.goOffline()` / `cy.goOnline()`: Toggle network state
- `cy.selectFutureDate()`: Select a date in the future
- `cy.measurePageLoad()`: Measure page load performance
- `cy.checkAccessibility()`: Run accessibility checks