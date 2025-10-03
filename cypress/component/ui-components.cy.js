/**
 * Component tests for G+ App
 * This file tests React components using Cypress Component Testing
 */

import React from 'react';
import { mount } from 'cypress/react';
import LoadingButton from '../../src/components/common/LoadingButton';
import PickupForm from '../../src/components/pickup/PickupForm';
import NotificationBadge from '../../src/components/notifications/NotificationBadge';

describe('LoadingButton Component', () => {
  it('renders correctly in default state', () => {
    // Mount the component
    cy.mount(
      <LoadingButton>
        Submit
      </LoadingButton>
    );
    
    // Check that it renders correctly
    cy.get('button')
      .should('be.visible')
      .and('not.be.disabled')
      .and('contain.text', 'Submit')
      .and('not.have.class', 'loading');
  });
  
  it('shows loading state when isLoading is true', () => {
    // Mount with loading prop
    cy.mount(
      <LoadingButton isLoading={true}>
        Submit
      </LoadingButton>
    );
    
    // Check loading state
    cy.get('button')
      .should('be.visible')
      .and('be.disabled')
      .and('have.class', 'loading');
    
    // Check for loading indicator
    cy.get('button .spinner').should('be.visible');
  });
  
  it('calls onClick when clicked', () => {
    // Create a spy
    const onClickSpy = cy.spy().as('clickSpy');
    
    // Mount with click handler
    cy.mount(
      <LoadingButton onClick={onClickSpy}>
        Click Me
      </LoadingButton>
    );
    
    // Click the button
    cy.get('button').click();
    
    // Verify the click handler was called
    cy.get('@clickSpy').should('have.been.calledOnce');
  });
  
  it('does not call onClick when disabled', () => {
    // Create a spy
    const onClickSpy = cy.spy().as('clickSpy');
    
    // Mount with disabled prop
    cy.mount(
      <LoadingButton onClick={onClickSpy} disabled>
        Click Me
      </LoadingButton>
    );
    
    // Attempt to click the button
    cy.get('button').click({ force: true });
    
    // Verify the click handler was not called
    cy.get('@clickSpy').should('not.have.been.called');
  });
  
  it('applies custom className', () => {
    // Mount with custom class
    cy.mount(
      <LoadingButton className="custom-button">
        Custom Button
      </LoadingButton>
    );
    
    // Check that class is applied
    cy.get('button')
      .should('have.class', 'custom-button');
  });
});

describe('PickupForm Component', () => {
  beforeEach(() => {
    // Mock API call that the form might make
    cy.intercept('POST', '/api/pickup-requests', {
      statusCode: 200,
      body: { id: '123', status: 'scheduled' }
    }).as('createPickup');
    
    // Mock data for the form
    const mockMaterials = [
      { id: '1', name: 'Plastic', pointsPerKg: 5 },
      { id: '2', name: 'Paper', pointsPerKg: 3 },
      { id: '3', name: 'Glass', pointsPerKg: 4 }
    ];
    
    // Mount the component with props
    cy.mount(
      <PickupForm 
        materials={mockMaterials}
        onSubmitSuccess={cy.spy().as('successSpy')}
        onCancel={cy.spy().as('cancelSpy')}
      />
    );
  });
  
  it('renders the form with all fields', () => {
    // Check form is rendered
    cy.get('form').should('be.visible');
    
    // Check for all expected fields
    cy.get('input[name="address"]').should('be.visible');
    cy.get('select[name="materialId"]').should('be.visible');
    cy.get('input[name="weight"]').should('be.visible');
    cy.get('input[name="pickupDate"]').should('be.visible');
    
    // Check for submit button
    cy.get('button[type="submit"]').should('be.visible');
  });
  
  it('shows validation errors for empty fields', () => {
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Check for validation messages
    cy.get('form .error-message').should('have.length.at.least', 1);
  });
  
  it('calculates points based on material and weight', () => {
    // Select material
    cy.get('select[name="materialId"]').select('1'); // Plastic (5 points/kg)
    
    // Enter weight
    cy.get('input[name="weight"]').type('10');
    
    // Check points calculation (5 * 10 = 50)
    cy.get('[data-testid="points-preview"]').should('contain.text', '50');
  });
  
  it('submits the form with valid data', () => {
    // Fill form with valid data
    cy.get('input[name="address"]').type('123 Test Street');
    cy.get('select[name="materialId"]').select('1');
    cy.get('input[name="weight"]').type('10');
    cy.get('input[name="pickupDate"]').type('2025-10-15');
    cy.get('select[name="pickupTimeSlot"]').select('morning');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for API call
    cy.wait('@createPickup').then((interception) => {
      // Verify request body
      expect(interception.request.body).to.include({
        address: '123 Test Street',
        materialId: '1',
        weight: 10
      });
    });
    
    // Check success callback was called
    cy.get('@successSpy').should('have.been.calledOnce');
  });
  
  it('shows loading state during submission', () => {
    // Delay the API response
    cy.intercept('POST', '/api/pickup-requests', (req) => {
      req.reply({ delay: 500, body: { id: '123', status: 'scheduled' }});
    }).as('delayedRequest');
    
    // Fill form with valid data
    cy.get('input[name="address"]').type('123 Test Street');
    cy.get('select[name="materialId"]').select('1');
    cy.get('input[name="weight"]').type('10');
    cy.get('input[name="pickupDate"]').type('2025-10-15');
    cy.get('select[name="pickupTimeSlot"]').select('morning');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Check that submit button shows loading state
    cy.get('button[type="submit"]').should('have.class', 'loading');
    cy.get('button[type="submit"] .spinner').should('be.visible');
    
    // Wait for request to complete
    cy.wait('@delayedRequest');
    
    // Check loading state is removed
    cy.get('button[type="submit"]').should('not.have.class', 'loading');
  });
  
  it('handles API errors gracefully', () => {
    // Mock error response
    cy.intercept('POST', '/api/pickup-requests', {
      statusCode: 500,
      body: { error: 'Server error' }
    }).as('failedRequest');
    
    // Fill form with valid data
    cy.get('input[name="address"]').type('123 Test Street');
    cy.get('select[name="materialId"]').select('1');
    cy.get('input[name="weight"]').type('10');
    cy.get('input[name="pickupDate"]').type('2025-10-15');
    cy.get('select[name="pickupTimeSlot"]').select('morning');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for request to complete
    cy.wait('@failedRequest');
    
    // Check error message is displayed
    cy.get('.form-error-message').should('be.visible');
    
    // Check success callback was not called
    cy.get('@successSpy').should('not.have.been.called');
  });
  
  it('calls cancel handler when cancel button is clicked', () => {
    // Click cancel button
    cy.get('button[type="button"]').contains('Cancel').click();
    
    // Check cancel callback was called
    cy.get('@cancelSpy').should('have.been.calledOnce');
  });
});

describe('NotificationBadge Component', () => {
  it('renders with correct count', () => {
    // Mount with count prop
    cy.mount(
      <NotificationBadge count={5} />
    );
    
    // Check badge is visible with correct count
    cy.get('.notification-badge')
      .should('be.visible')
      .and('contain.text', '5');
  });
  
  it('does not display when count is zero', () => {
    // Mount with zero count
    cy.mount(
      <NotificationBadge count={0} />
    );
    
    // Badge should not be visible or should be empty
    cy.get('.notification-badge').should('not.exist');
  });
  
  it('caps at maxCount and shows + symbol', () => {
    // Mount with high count and maxCount
    cy.mount(
      <NotificationBadge count={25} maxCount={9} />
    );
    
    // Should show maxCount+ format
    cy.get('.notification-badge')
      .should('contain.text', '9+');
  });
  
  it('applies custom color class', () => {
    // Mount with custom color
    cy.mount(
      <NotificationBadge count={3} color="warning" />
    );
    
    // Check for custom color class
    cy.get('.notification-badge')
      .should('have.class', 'badge-warning');
  });
  
  it('pulses when animate prop is true', () => {
    // Mount with animate prop
    cy.mount(
      <NotificationBadge count={1} animate={true} />
    );
    
    // Check for animation class
    cy.get('.notification-badge')
      .should('have.class', 'animate-pulse');
  });
});