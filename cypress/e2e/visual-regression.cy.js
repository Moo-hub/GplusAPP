/**
 * Visual regression test example for G+ App
 * This test captures screenshots of key UI components for visual comparison
 */

describe('Visual Regression Tests', () => {
  beforeEach(() => {
    cy.viewport(1280, 720);
    cy.visit('/');
    // Optionally add authentication or other setup if needed
    // cy.login('testuser', 'password');
  });

  it('captures the homepage for visual comparison', () => {
    // Wait for all elements to be fully loaded
    cy.get('.hero-section').should('be.visible');
    
    // Take a screenshot of the entire page
    cy.screenshot('homepage-full');
    
    // Take screenshots of specific components
    cy.get('.hero-section').screenshot('homepage-hero');
    cy.get('.features-section').screenshot('homepage-features');
    cy.get('footer').screenshot('homepage-footer');
  });

  it('captures the navigation and responsive menu', () => {
    // Desktop navigation
    cy.get('nav').screenshot('navigation-desktop');
    
    // Mobile navigation
    cy.viewport('iphone-x');
    cy.get('nav').screenshot('navigation-mobile');
    
    // Open mobile menu if applicable
    cy.get('.mobile-menu-button').click();
    cy.get('.mobile-menu').should('be.visible');
    cy.screenshot('mobile-menu-open');
  });

  it('captures form elements and interactive components', () => {
    // Navigate to a page with forms or interactive elements
    cy.visit('/contact');
    
    // Capture form fields
    cy.get('form').screenshot('contact-form-empty');
    
    // Fill out form and capture
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type('This is a test message for visual regression testing.');
    cy.get('form').screenshot('contact-form-filled');
    
    // Capture form validation states
    cy.get('input[name="email"]').clear().type('invalid-email');
    cy.get('form').find('button[type="submit"]').click();
    cy.get('form').screenshot('contact-form-validation');
  });

  it('captures theme variations if applicable', () => {
    // If your app has a theme toggle or different themes
    cy.visit('/settings');
    
    // Default theme
    cy.screenshot('app-default-theme');
    
    // Toggle dark mode
    cy.get('.theme-toggle').click();
    cy.get('body').should('have.class', 'dark-theme');
    cy.screenshot('app-dark-theme');
    
    // Toggle back to light mode
    cy.get('.theme-toggle').click();
    cy.get('body').should('not.have.class', 'dark-theme');
    cy.screenshot('app-light-theme');
  });

  it('captures the pickup scheduling flow', () => {
    // Navigate to pickup scheduling
    cy.visit('/schedule-pickup');
    
    // Step 1: Initial form
    cy.screenshot('pickup-step1');
    
    // Fill out step 1
    cy.get('input[name="address"]').type('123 Test St');
    cy.get('select[name="material"]').select('Plastic');
    cy.get('input[name="weight"]').type('5');
    cy.get('button[data-test="next-step"]').click();
    
    // Step 2: Date selection
    cy.get('[data-test="date-picker"]').should('be.visible');
    cy.screenshot('pickup-step2');
    
    // Select date and time
    cy.get('[data-test="date-picker"]').click();
    cy.contains('[data-test="calendar-day"]', '15').click();
    cy.get('select[name="time-slot"]').select('Morning (8am - 12pm)');
    cy.get('button[data-test="next-step"]').click();
    
    // Step 3: Confirmation
    cy.contains('Review Your Pickup Request').should('be.visible');
    cy.screenshot('pickup-step3');
    
    // Submit request
    cy.get('button[data-test="confirm-pickup"]').click();
    
    // Success page
    cy.contains('Pickup Scheduled Successfully').should('be.visible');
    cy.screenshot('pickup-success');
  });
  
  it('captures error states and notifications', () => {
    // Capture error page
    cy.visit('/page-does-not-exist');
    cy.screenshot('error-404');
    
    // Capture notification/alert examples
    cy.visit('/demo/notifications');
    
    // Success notification
    cy.get('[data-test="show-success"]').click();
    cy.get('.notification.success').should('be.visible');
    cy.screenshot('notification-success');
    
    // Error notification
    cy.get('[data-test="show-error"]').click();
    cy.get('.notification.error').should('be.visible');
    cy.screenshot('notification-error');
    
    // Warning notification
    cy.get('[data-test="show-warning"]').click();
    cy.get('.notification.warning').should('be.visible');
    cy.screenshot('notification-warning');
  });
});