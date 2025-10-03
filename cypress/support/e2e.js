// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands using ES2015 syntax:
import './commands';
import './enhanced-commands';
import './visual-commands';
import './performance-commands'; // Import performance testing commands
import './performance-advanced-commands'; // Import advanced performance testing commands

// Import Testing Library commands
import '@testing-library/cypress/add-commands';

// Configure global behavior
import '@cypress/code-coverage/support';
import 'cypress-axe';
import 'cypress-network-idle';

// Log failed tests with screenshots in CI environment
Cypress.on('test:after:run', (test, runnable) => {
  if (test.state === 'failed') {
    const screenshotFileName = `${runnable.parent.title} -- ${test.title} (failed).png`;
    console.log(`Test failed: ${test.title}`);
    console.log(`Screenshot: ${screenshotFileName}`);
  }
});

// Performance monitoring
Cypress.on('window:before:load', (win) => {
  win.performance.mark('start-loading');
});

Cypress.on('window:load', (win) => {
  win.performance.mark('end-loading');
  win.performance.measure('page-loading', 'start-loading', 'end-loading');
  const measure = win.performance.getEntriesByName('page-loading')[0];
  cy.task('log', `Page loaded in ${measure.duration}ms`);
  
  // Record this metric using our enhanced performance monitoring
  cy.task('recordMetric', {
    name: 'page_total_load',
    value: measure.duration,
    unit: 'ms',
    metadata: { page: win.location.pathname }
  });
});

// Hide fetch/XHR requests from command log
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Ignore uncaught exceptions from the application
Cypress.on('uncaught:exception', (err) => {
  // returning false here prevents Cypress from failing the test
  // Only do this if you're sure the error is from the app and not a test issue
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  // Unexpected errors should still fail the test
  return true;
});

// Global before each
beforeEach(() => {
  // Reset any mocks or preserve cookies/localStorage between tests if needed
});

// Global after each
afterEach(() => {
  // Clean up actions after each test
});