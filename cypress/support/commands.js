// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// تمديد Cypress بأوامر مخصصة للعمل مع LocalStorage
import 'cypress-localstorage-commands';

// تمديد Cypress بأوامر لمحاكاة أحداث المستخدم الحقيقية
import 'cypress-real-events';

// -- This is a parent command --
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

// Create a test user with admin privileges
Cypress.Commands.add('createTestAdmin', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/test-admin`,
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

// Create a test user with regular privileges
Cypress.Commands.add('createTestUser', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/test-user`,
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 201 || response.status === 200) {
      return response.body;
    } else {
      cy.log('Failed to create test regular user');
      return null;
    }
  });
});

// Clear the database between tests
Cypress.Commands.add('resetDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/testing/reset-db`,
    failOnStatusCode: false,
  });
});

// Schedule a pickup for testing
Cypress.Commands.add('scheduleTestPickup', (userId, options = {}) => {
  const defaultOptions = {
    scheduled_date: '2025-10-01T10:00:00',
    address: '123 Test Street',
    materials: ['PAPER', 'PLASTIC'],
    recurrence_type: 'ONCE',
    special_instructions: 'Test pickup',
  };

  const pickupData = { ...defaultOptions, ...options };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/pickups`,
    body: pickupData,
    headers: {
      'Authorization': `Bearer ${userId}`,
    },
    failOnStatusCode: false,
  });
});

/**
 * أمر مخصص لتغيير اللغة مباشرة
 * 
 * @example cy.changeLanguage('ar')
 */
Cypress.Commands.add('changeLanguage', (language) => {
  // تعيين اللغة في localStorage
  cy.setLocalStorage('language', language);
  
  // إعادة تحميل الصفحة لتطبيق التغييرات
  cy.reload();
  
  // انتظار حتى يتم تحميل الصفحة والترجمات
  cy.wait(500);
});

/**
 * أمر مخصص للتحقق من اتجاه الصفحة
 * 
 * @example cy.checkDirection('rtl')
 */
Cypress.Commands.add('checkDirection', (direction) => {
  cy.document().should('have.prop', 'documentElement')
    .should('have.attr', 'dir', direction);
});

/**
 * أمر مخصص للتحقق من لغة الصفحة
 * 
 * @example cy.checkLanguage('ar')
 */
Cypress.Commands.add('checkLanguage', (language) => {
  cy.document().should('have.prop', 'documentElement')
    .should('have.attr', 'lang', language);
});

/**
 * أمر مخصص للتحقق من المسار المترجم
 * 
 * @example cy.checkLocalizedPath('/products', 'ar', '/المنتجات')
 */
Cypress.Commands.add('checkLocalizedPath', (internalPath, language, expectedPath) => {
  cy.changeLanguage(language);
  cy.visit(internalPath);
  cy.url().should('include', `/${language}${expectedPath}`);
});