// pickup-workflow.cy.js - Test for the complete pickup scheduling workflow

describe('Recycling Pickup Workflow', () => {
  beforeEach(() => {
    // Login before each test
    cy.fixture('users').then((users) => {
      cy.apiLogin(users.user.email, users.user.password);
    });
    
    // Visit the dashboard
    cy.visit('/dashboard');
  });

  it('should complete the full pickup scheduling and tracking workflow', () => {
    // 1. Start pickup scheduling process
    cy.get('[data-testid="schedule-pickup-button"]')
      .should('be.visible')
      .click();
    
    cy.url().should('include', '/schedule-pickup');
    
    // 2. Fill in pickup form
    const pickupData = {
      address: '123 Recycling Street',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      time: '10:00 AM',
      materials: ['PAPER', 'PLASTIC', 'GLASS'],
      estimatedWeight: 5.5,
      notes: 'Leave at the front door'
    };
    
    // Fill date (using custom command to select future date)
    cy.selectFutureDate('[data-testid="pickup-date"]', 3);
    
    // Fill time
    cy.get('[data-testid="pickup-time"]')
      .select(pickupData.time);
    
    // Fill address
    cy.get('[data-testid="pickup-address"]')
      .clear()
      .type(pickupData.address);
    
    // Select materials
    pickupData.materials.forEach(material => {
      cy.get(`[data-testid="material-${material}"]`).check();
    });
    
    // Fill estimated weight
    cy.get('[data-testid="weight-estimate"]')
      .clear()
      .type(pickupData.estimatedWeight);
    
    // Add notes
    cy.get('[data-testid="pickup-notes"]')
      .type(pickupData.notes);
    
    // Verify points estimate appears
    cy.get('[data-testid="points-estimate"]')
      .should('be.visible')
      .invoke('text')
      .then(text => {
        // Extract number from text
        const pointsEstimate = parseInt(text.match(/\d+/)[0]);
        // Verify estimate is reasonable (roughly 10 points per kg)
        expect(pointsEstimate).to.be.at.least(50);
      });
    
    // 3. Submit pickup request
    cy.get('[data-testid="submit-pickup"]').click();
    
    // 4. Verify success message and redirect
    cy.contains('Pickup scheduled successfully')
      .should('be.visible');
      
    cy.url()
      .should('include', '/pickups');
    
    // 5. Verify the pickup appears in the list
    cy.get('[data-testid="pickups-list"]')
      .contains(pickupData.address)
      .should('be.visible');
    
    // 6. Open pickup details
    cy.get('[data-testid="pickup-card"]')
      .first()
      .click();
    
    // 7. Verify pickup details page
    cy.url().should('include', '/pickups/');
    
    // Verify all details are correctly displayed
    cy.get('[data-testid="pickup-status"]')
      .should('contain', 'SCHEDULED');
      
    cy.get('[data-testid="pickup-address"]')
      .should('contain', pickupData.address);
    
    cy.get('[data-testid="pickup-materials"]')
      .should('contain', 'PAPER')
      .and('contain', 'PLASTIC')
      .and('contain', 'GLASS');
    
    cy.get('[data-testid="pickup-weight"]')
      .should('contain', pickupData.estimatedWeight);
      
    cy.get('[data-testid="pickup-notes"]')
      .should('contain', pickupData.notes);
    
    // 8. Reschedule the pickup
    cy.get('[data-testid="reschedule-button"]').click();
    
    // 9. Select new date (5 days from now)
    cy.selectFutureDate('[data-testid="new-pickup-date"]', 5);
    
    // 10. Select new time
    cy.get('[data-testid="new-pickup-time"]').select('2:00 PM');
    
    // 11. Submit rescheduling
    cy.get('[data-testid="confirm-reschedule"]').click();
    
    // 12. Verify success message
    cy.contains('Pickup rescheduled successfully')
      .should('be.visible');
    
    // 13. Verify updated details
    cy.get('[data-testid="pickup-time"]')
      .should('contain', '2:00 PM');
    
    // 14. Cancel the pickup
    cy.get('[data-testid="cancel-button"]').click();
    
    // 15. Confirm cancellation
    cy.get('[data-testid="confirm-cancellation"]').click();
    
    // 16. Verify cancellation success
    cy.contains('Pickup cancelled successfully')
      .should('be.visible');
      
    // 17. Verify updated status
    cy.get('[data-testid="pickup-status"]')
      .should('contain', 'CANCELLED');
    
    // 18. Return to pickups list
    cy.get('[data-testid="back-to-list"]').click();
    
    // 19. Verify we're back at the pickups list
    cy.url().should('include', '/pickups')
      .and('not.include', '/pickups/');
  });
  
  it('should track pickup progress and points earning', () => {
    // For this test we'll use a backend API to simulate a pickup in progress
    
    // 1. Create a test pickup with the API
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/pickups`,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: {
        scheduledDate: Cypress.moment().add(1, 'days').format('YYYY-MM-DD'),
        scheduledTime: '10:00 AM',
        address: '456 Tracking Test Road',
        materials: ['PLASTIC', 'METAL'],
        estimatedWeight: 4.0,
        notes: 'Tracking test pickup'
      }
    }).then(response => {
      expect(response.status).to.eq(201);
      const pickupId = response.body.id;
      
      // 2. Go to the pickup details page
      cy.visit(`/pickups/${pickupId}`);
      
      // 3. Verify initial status
      cy.get('[data-testid="pickup-status"]')
        .should('contain', 'SCHEDULED');
      
      // 4. Simulate pickup in progress through API
      cy.request({
        method: 'PATCH',
        url: `${Cypress.env('apiUrl')}/test/update-pickup-status/${pickupId}`,
        body: {
          status: 'IN_PROGRESS'
        }
      }).then(statusResponse => {
        expect(statusResponse.status).to.eq(200);
        
        // 5. Refresh the page to see updates
        cy.reload();
        
        // 6. Verify updated status
        cy.get('[data-testid="pickup-status"]')
          .should('contain', 'IN PROGRESS');
          
        // 7. Verify tracking info is visible
        cy.get('[data-testid="pickup-tracking"]')
          .should('be.visible');
          
        // 8. Simulate pickup completion through API
        cy.request({
          method: 'PATCH',
          url: `${Cypress.env('apiUrl')}/test/complete-pickup/${pickupId}`,
          body: {
            actualWeight: 4.2,
            materialQuality: 'good',
            pointsEarned: 42
          }
        }).then(completionResponse => {
          expect(completionResponse.status).to.eq(200);
          
          // 9. Refresh page to see completion
          cy.reload();
          
          // 10. Verify completed status
          cy.get('[data-testid="pickup-status"]')
            .should('contain', 'COMPLETED');
            
          // 11. Verify actual weight
          cy.get('[data-testid="actual-weight"]')
            .should('contain', '4.2');
            
          // 12. Verify points earned
          cy.get('[data-testid="points-earned"]')
            .should('contain', '42');
            
          // 13. Go to dashboard to check total points
          cy.visit('/dashboard');
          
          // 14. Verify points are reflected in total balance
          cy.get('[data-testid="points-balance"]')
            .should('be.visible')
            .invoke('text')
            .then(text => {
              // Extract number from text
              const pointsBalance = parseInt(text.match(/\d+/)[0]);
              // Verify points increased
              expect(pointsBalance).to.be.at.least(42);
            });
        });
      });
    });
  });
});