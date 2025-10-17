// ***********************************************
// Enhanced custom commands for E2E testing
// ***********************************************

import 'cypress-file-upload';
import 'cypress-localstorage-commands';

// Authentication Commands
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for login to complete and verify we're logged in
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="user-greeting"]').should('exist');
  });
});

// API-based login that's faster than UI login
Cypress.Commands.add('apiLogin', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email,
      password
    }
  }).then(response => {
    // Store the token in localStorage to simulate being logged in
    window.localStorage.setItem('token', response.body.access_token);
    
    // Also store user data
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
    
    // Return the response body for chaining
    return response.body;
  });
});

Cypress.Commands.add('logout', () => {
  cy.visit('/dashboard');
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  
  // Verify we're logged out
  cy.url().should('include', '/login');
});

// Test Data Generation Commands
Cypress.Commands.add('createTestUser', (userData) => {
  const defaultUser = {
    name: `Test User ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'securepassword',
  };
  
  const user = { ...defaultUser, ...userData };
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/test-user`,
    body: user,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 201 || response.status === 200) {
      return response.body;
    } else {
      cy.log('Failed to create test user');
      return null;
    }
  });
});

Cypress.Commands.add('createTestAdmin', (userData) => {
  const defaultAdmin = {
    name: `Admin User ${Date.now()}`,
    email: `admin-${Date.now()}@example.com`,
    password: 'secureadminpass',
  };
  
  const admin = { ...defaultAdmin, ...userData };
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/test-admin`,
    body: admin,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 201 || response.status === 200) {
      return response.body;
    } else {
      cy.log('Failed to create test admin user');
      return null;
    }
  });
});

// Data Management Commands
Cypress.Commands.add('schedulePickup', (pickupData) => {
  const defaultPickup = {
    scheduled_date: '2025-10-15',
    time_slot: '10:00-12:00',
    address: '123 Test Street',
    materials: ['PAPER', 'PLASTIC'],
    weight_estimate: 10,
    special_instructions: 'Test pickup via Cypress'
  };
  
  const pickup = { ...defaultPickup, ...pickupData };
  
  // Get the auth token from localStorage
  const token = window.localStorage.getItem('token');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/pickup`,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: pickup,
  }).then(response => {
    // Return the created pickup data for chaining
    return response.body;
  });
});

Cypress.Commands.add('redeemPoints', (redemptionData) => {
  const defaultRedemption = {
    option_id: 1,
    quantity: 1,
  };
  
  const redemption = { ...defaultRedemption, ...redemptionData };
  
  // Get the auth token from localStorage
  const token = window.localStorage.getItem('token');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/redemptions`,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: redemption,
  }).then(response => {
    // Return the created redemption data for chaining
    return response.body;
  });
});

// UI Testing Helper Commands
Cypress.Commands.add('selectDate', (selector, date) => {
  // Split the date string into parts
  const [year, month, day] = date.split('-');
  
  // Click to open the date picker
  cy.get(selector).click();
  
  // Select the month and year if the date picker has these controls
  // This would need to be adjusted based on the actual date picker component
  cy.get('.calendar-header .month-selector').select(parseInt(month) - 1);
  cy.get('.calendar-header .year-selector').select(year);
  
  // Click on the day
  cy.get('.calendar-day').contains(parseInt(day)).click();
});

Cypress.Commands.add('fillForm', (formSelector, formData) => {
  // Get all form inputs and fill them based on their type
  cy.get(`${formSelector} input, ${formSelector} select, ${formSelector} textarea`).each($el => {
    const name = $el.attr('name');
    const type = $el.attr('type');
    
    if (!name || !formData[name]) return;
    
    if (type === 'checkbox' || type === 'radio') {
      if (formData[name] === true) {
        cy.wrap($el).check();
      }
    } else if (type === 'file') {
      cy.wrap($el).attachFile(formData[name]);
    } else if ($el.prop('tagName') === 'SELECT') {
      cy.wrap($el).select(formData[name]);
    } else {
      cy.wrap($el).clear().type(formData[name]);
    }
  });
});

// Accessibility Testing Commands
Cypress.Commands.add('checkA11y', (context = null, options = null) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// Network Mocking Commands
Cypress.Commands.add('mockApi', (url, method = 'GET', status = 200, response = {}) => {
  cy.intercept(
    {
      method,
      url: `${Cypress.env('apiUrl')}${url}`
    },
    {
      statusCode: status,
      body: response
    }
  ).as(`mock-${method}-${url}`);
});