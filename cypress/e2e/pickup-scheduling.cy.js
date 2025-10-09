describe('Pickup Scheduling Flow', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      // Login before each test
      cy.login(users.user.email, users.user.password);
      cy.visit('/dashboard');
    });
  });

  it('should allow a user to schedule a pickup', () => {
    cy.get('[data-testid="schedule-pickup-button"]').click();
    cy.url().should('include', '/schedule-pickup');
    
    // Fill out the pickup form
    cy.get('[data-testid="pickup-date"]').type('2025-10-15');
    cy.get('[data-testid="pickup-time"]').select('10:00 AM');
    cy.get('[data-testid="pickup-address"]').type('123 Test Street');
    
    // Select materials
    cy.get('[data-testid="material-PAPER"]').check();
    cy.get('[data-testid="material-PLASTIC"]').check();
    
    // Add special instructions
    cy.get('[data-testid="special-instructions"]').type('Please pick up from the front porch');
    
    // Submit the form
    cy.get('[data-testid="submit-pickup"]').click();
    
    // Verify success
    cy.contains('Pickup scheduled successfully').should('exist');
    cy.url().should('include', '/dashboard');
    
    // Verify the pickup appears in the list
    cy.get('[data-testid="pickups-list"]')
      .should('contain', '123 Test Street')
      .and('contain', 'Oct 15, 2025');
  });

  it('should allow a user to view pickup details', () => {
    // Create a test pickup first
    cy.createTestAdmin().then(adminData => {
      if (adminData) {
        cy.scheduleTestPickup(adminData.id);
      }
    });
    
    // Navigate to pickups list
    cy.get('[data-testid="pickups-link"]').click();
    cy.url().should('include', '/pickups');
    
    // Click on the first pickup in the list
    cy.get('[data-testid="pickup-item"]').first().click();
    
    // Verify pickup details are displayed
    cy.get('[data-testid="pickup-details"]')
      .should('contain', '123 Test Street')
      .and('contain', 'Oct 1, 2025')
      .and('contain', 'PAPER, PLASTIC');
  });
  
  it('should allow a user to cancel a pickup', () => {
    // Create a test pickup first
    cy.createTestAdmin().then(adminData => {
      if (adminData) {
        cy.scheduleTestPickup(adminData.id);
      }
    });
    
    // Navigate to pickups list
    cy.get('[data-testid="pickups-link"]').click();
    cy.url().should('include', '/pickups');
    
    // Find the pickup and click cancel
    cy.get('[data-testid="pickup-item"]').first().within(() => {
      cy.get('[data-testid="cancel-pickup-button"]').click();
    });
    
    // Confirm cancellation
    cy.get('[data-testid="confirm-cancel"]').click();
    
    // Verify success message
    cy.contains('Pickup cancelled successfully').should('exist');
    
    // Verify the pickup is now marked as cancelled
    cy.get('[data-testid="pickup-item"]').first()
      .should('contain', 'Cancelled');
  });
});