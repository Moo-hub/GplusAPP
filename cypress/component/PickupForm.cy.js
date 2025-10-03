// PickupForm.cy.js - Component test for the pickup scheduling form

import PickupForm from '../../src/components/PickupForm';

describe('PickupForm Component', () => {
  beforeEach(() => {
    // Mock the API response for successful form submission
    cy.intercept('POST', '/api/pickups', {
      statusCode: 201,
      body: {
        id: 'test-pickup-id',
        status: 'SCHEDULED',
        scheduledDate: '2023-12-25',
        scheduledTime: '10:00 AM',
        address: '123 Test Street',
        materials: ['PAPER', 'PLASTIC'],
        estimatedWeight: 3,
        createdAt: new Date().toISOString()
      }
    }).as('createPickup');

    // Mount the component
    cy.mount(<PickupForm />);
  });

  it('renders with all required fields', () => {
    cy.get('[data-testid="pickup-date"]').should('exist');
    cy.get('[data-testid="pickup-time"]').should('exist');
    cy.get('[data-testid="pickup-address"]').should('exist');
    cy.get('[data-testid="material-PAPER"]').should('exist');
    cy.get('[data-testid="material-PLASTIC"]').should('exist');
    cy.get('[data-testid="material-GLASS"]').should('exist');
    cy.get('[data-testid="weight-estimate"]').should('exist');
    cy.get('[data-testid="submit-pickup"]').should('exist');
  });

  it('should validate required fields', () => {
    // Try to submit without filling any fields
    cy.get('[data-testid="submit-pickup"]').click();
    
    // Check for validation messages
    cy.contains('Please select a date').should('be.visible');
    cy.contains('Please select a time').should('be.visible');
    cy.contains('Address is required').should('be.visible');
    cy.contains('Please select at least one material').should('be.visible');
    cy.contains('Please provide an estimated weight').should('be.visible');
  });

  it('should submit the form with valid data', () => {
    // Fill the form with valid data
    cy.get('[data-testid="pickup-date"]').type('2023-12-25');
    cy.get('[data-testid="pickup-time"]').select('10:00 AM');
    cy.get('[data-testid="pickup-address"]').type('123 Test Street');
    cy.get('[data-testid="material-PAPER"]').check();
    cy.get('[data-testid="material-PLASTIC"]').check();
    cy.get('[data-testid="weight-estimate"]').type('3');
    
    // Submit the form
    cy.get('[data-testid="submit-pickup"]').click();
    
    // Wait for API call to complete
    cy.wait('@createPickup');
    
    // Verify success message
    cy.contains('Pickup scheduled successfully').should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Override the API intercept to return an error
    cy.intercept('POST', '/api/pickups', {
      statusCode: 500,
      body: {
        error: 'Server error'
      }
    }).as('createPickupError');
    
    // Fill the form with valid data
    cy.get('[data-testid="pickup-date"]').type('2023-12-25');
    cy.get('[data-testid="pickup-time"]').select('10:00 AM');
    cy.get('[data-testid="pickup-address"]').type('123 Test Street');
    cy.get('[data-testid="material-PAPER"]').check();
    cy.get('[data-testid="weight-estimate"]').type('3');
    
    // Submit the form
    cy.get('[data-testid="submit-pickup"]').click();
    
    // Wait for API call to complete
    cy.wait('@createPickupError');
    
    // Verify error message
    cy.contains('Failed to schedule pickup').should('be.visible');
  });

  it('should calculate point estimates based on materials and weight', () => {
    // Fill weight and select materials
    cy.get('[data-testid="weight-estimate"]').type('5');
    cy.get('[data-testid="material-PAPER"]').check();
    cy.get('[data-testid="material-PLASTIC"]').check();
    
    // Check that the point estimate appears and has a reasonable value
    cy.get('[data-testid="points-estimate"]').should('exist');
    cy.get('[data-testid="points-estimate"]').should('contain', '50');
    
    // Add another material
    cy.get('[data-testid="material-GLASS"]').check();
    
    // Point estimate should increase
    cy.get('[data-testid="points-estimate"]').should('contain', '75');
    
    // Increase weight
    cy.get('[data-testid="weight-estimate"]').clear().type('10');
    
    // Point estimate should increase proportionally
    cy.get('[data-testid="points-estimate"]').should('contain', '150');
  });

  it('should allow adding notes to the pickup', () => {
    // Notes field should exist
    cy.get('[data-testid="pickup-notes"]').should('exist');
    
    // Add notes
    cy.get('[data-testid="pickup-notes"]').type('Please ring the doorbell');
    
    // Fill other required fields
    cy.get('[data-testid="pickup-date"]').type('2023-12-25');
    cy.get('[data-testid="pickup-time"]').select('10:00 AM');
    cy.get('[data-testid="pickup-address"]').type('123 Test Street');
    cy.get('[data-testid="material-PAPER"]').check();
    cy.get('[data-testid="weight-estimate"]').type('3');
    
    // Submit the form
    cy.get('[data-testid="submit-pickup"]').click();
    
    // Verify the API was called with the notes included
    cy.wait('@createPickup').its('request.body').should('include', {
      notes: 'Please ring the doorbell'
    });
  });
});