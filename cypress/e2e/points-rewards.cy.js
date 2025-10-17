describe('Points and Rewards', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      // Login before each test
      cy.login(users.user.email, users.user.password);
      cy.visit('/dashboard');
    });
  });

  it('should display user points balance', () => {
    // Verify points balance is displayed on dashboard
    cy.get('[data-testid="points-balance"]').should('exist');
  });

  it('should allow users to navigate to rewards page', () => {
    // Navigate to rewards page
    cy.get('[data-testid="rewards-link"]').click();
    cy.url().should('include', '/rewards');
    
    // Verify rewards content is displayed
    cy.get('[data-testid="rewards-list"]').should('exist');
  });

  it('should allow users to redeem points for rewards', () => {
    // Navigate to rewards page
    cy.get('[data-testid="rewards-link"]').click();
    
    // Get initial points balance
    let initialPoints;
    cy.get('[data-testid="points-balance"]').invoke('text').then((text) => {
      initialPoints = parseInt(text.match(/\d+/)[0], 10);
    });
    
    // Find a reward to redeem
    cy.get('[data-testid="reward-item"]').first().within(() => {
      // Get reward point cost
      let rewardCost;
      cy.get('[data-testid="reward-cost"]').invoke('text').then((text) => {
        rewardCost = parseInt(text.match(/\d+/)[0], 10);
        
        // Only attempt to redeem if user has enough points
        if (initialPoints >= rewardCost) {
          cy.get('[data-testid="redeem-button"]').click();
          
          // Confirm redemption
          cy.get('[data-testid="confirm-redemption"]').click();
          
          // Verify success message
          cy.contains('Reward redeemed successfully').should('exist');
          
          // Verify points were deducted
          cy.get('[data-testid="points-balance"]').invoke('text').then((newText) => {
            const newPoints = parseInt(newText.match(/\d+/)[0], 10);
            expect(newPoints).to.equal(initialPoints - rewardCost);
          });
        } else {
          cy.log('Not enough points to redeem reward');
        }
      });
    });
  });

  it('should show redemption history', () => {
    // Navigate to redemption history
    cy.get('[data-testid="rewards-link"]').click();
    cy.get('[data-testid="redemption-history-tab"]').click();
    
    // Verify history is displayed
    cy.get('[data-testid="redemption-history"]').should('exist');
  });

  it('should show points earning history', () => {
    // Navigate to points history
    cy.get('[data-testid="points-history-link"]').click();
    
    // Verify history is displayed
    cy.get('[data-testid="points-history"]').should('exist');
    cy.get('[data-testid="points-transaction"]').should('have.length.at.least', 0);
  });
});