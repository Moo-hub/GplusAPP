// rewards-redemption.cy.js - Data-driven tests for rewards redemption

describe('Rewards Redemption Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.fixture('users').then((users) => {
      cy.apiLogin(users.user.email, users.user.password);
    });
    
    // Visit the rewards page
    cy.visit('/rewards');
  });

  // Load test data from fixtures
  const rewardScenarios = [
    {
      name: 'Discount Coupon',
      pointsCost: 50,
      userPoints: 100,
      expectedSuccess: true,
      type: 'coupon'
    },
    {
      name: 'Premium Gift Card',
      pointsCost: 200,
      userPoints: 150,
      expectedSuccess: false,
      type: 'gift_card'
    },
    {
      name: 'Tree Planting',
      pointsCost: 75,
      userPoints: 75,
      expectedSuccess: true,
      type: 'environmental'
    }
  ];

  // Data-driven tests for each redemption scenario
  rewardScenarios.forEach((scenario) => {
    it(`should ${scenario.expectedSuccess ? 'allow' : 'prevent'} redemption of ${scenario.name} with ${scenario.userPoints} points`, () => {
      // Intercept points balance API call and return mock data
      cy.intercept('GET', `${Cypress.env('apiUrl')}/points/balance`, {
        statusCode: 200,
        body: {
          balance: scenario.userPoints
        }
      }).as('getPointsBalance');

      // Intercept specific reward API call and return mock data
      cy.intercept('GET', `${Cypress.env('apiUrl')}/rewards/*`, {
        statusCode: 200,
        body: {
          id: `reward-${Date.now()}`,
          name: scenario.name,
          description: `Test ${scenario.name}`,
          pointsCost: scenario.pointsCost,
          type: scenario.type,
          imageUrl: '/assets/rewards/generic.jpg'
        }
      }).as('getRewardDetails');

      // Click on a reward
      cy.contains(scenario.name).click();

      // Wait for reward details to load
      cy.wait('@getRewardDetails');

      // Verify reward details
      cy.get('[data-testid="reward-name"]').should('contain', scenario.name);
      cy.get('[data-testid="reward-points"]').should('contain', scenario.pointsCost);

      // Intercept redemption API call
      cy.intercept('POST', `${Cypress.env('apiUrl')}/rewards/redeem/*`, (req) => {
        if (scenario.expectedSuccess) {
          req.reply({
            statusCode: 200,
            body: {
              success: true,
              message: 'Redemption successful',
              redemptionId: `redemption-${Date.now()}`,
              reward: {
                id: req.url.split('/').pop(),
                name: scenario.name,
                pointsCost: scenario.pointsCost,
                type: scenario.type
              },
              code: scenario.type === 'coupon' ? 'COUPON123' : null,
              redemptionDate: new Date().toISOString()
            }
          });
        } else {
          req.reply({
            statusCode: 400,
            body: {
              success: false,
              message: 'Insufficient points',
              requiredPoints: scenario.pointsCost,
              availablePoints: scenario.userPoints
            }
          });
        }
      }).as('redeemReward');

      // Click redeem button
      cy.get('[data-testid="redeem-button"]').click();

      // Confirmation step
      cy.get('[data-testid="confirm-redemption"]').click();

      // Wait for redemption API call
      cy.wait('@redeemReward');

      if (scenario.expectedSuccess) {
        // Verify success message
        cy.contains('Redemption successful').should('be.visible');
        
        // Check receipt if it's a coupon
        if (scenario.type === 'coupon') {
          cy.get('[data-testid="redemption-code"]').should('be.visible');
          cy.get('[data-testid="redemption-code"]').should('contain', 'COUPON');
        }
        
        // Should see updated points balance
        const expectedNewBalance = scenario.userPoints - scenario.pointsCost;
        cy.get('[data-testid="points-balance"]').should('contain', expectedNewBalance);
      } else {
        // Verify error message
        cy.contains('Insufficient points').should('be.visible');
        
        // Points gap should be displayed
        const pointsGap = scenario.pointsCost - scenario.userPoints;
        cy.contains(`You need ${pointsGap} more points`).should('be.visible');
      }
    });
  });

  it('should show redemption history', () => {
    // Mock redemption history API response
    cy.intercept('GET', `${Cypress.env('apiUrl')}/rewards/history`, {
      statusCode: 200,
      body: [
        {
          id: 'redemption-1',
          rewardName: 'Discount Coupon',
          pointsCost: 50,
          redemptionDate: new Date().toISOString(),
          code: 'DISCOUNT25'
        },
        {
          id: 'redemption-2',
          rewardName: 'Tree Planting',
          pointsCost: 75,
          redemptionDate: new Date(Date.now() - 86400000).toISOString(),
          code: null
        }
      ]
    }).as('getRedemptionHistory');

    // Navigate to redemption history
    cy.get('[data-testid="redemption-history-link"]').click();
    
    // Wait for history to load
    cy.wait('@getRedemptionHistory');

    // Verify history is displayed correctly
    cy.get('[data-testid="redemption-list"]').children().should('have.length', 2);
    cy.contains('Discount Coupon').should('be.visible');
    cy.contains('Tree Planting').should('be.visible');
    cy.contains('DISCOUNT25').should('be.visible');
  });

  it('should filter rewards by type', () => {
    // Mock rewards API response with different reward types
    cy.intercept('GET', `${Cypress.env('apiUrl')}/rewards`, {
      statusCode: 200,
      body: [
        {
          id: 'reward-1',
          name: 'Discount Coupon',
          description: 'Get 25% off your next purchase',
          pointsCost: 50,
          type: 'coupon',
          imageUrl: '/assets/rewards/coupon.jpg'
        },
        {
          id: 'reward-2',
          name: 'Gift Card',
          description: 'Get a $10 gift card',
          pointsCost: 100,
          type: 'gift_card',
          imageUrl: '/assets/rewards/giftcard.jpg'
        },
        {
          id: 'reward-3',
          name: 'Tree Planting',
          description: 'Plant a tree in your name',
          pointsCost: 75,
          type: 'environmental',
          imageUrl: '/assets/rewards/tree.jpg'
        }
      ]
    }).as('getRewards');

    // Refresh the page to trigger the rewards load
    cy.visit('/rewards');
    
    // Wait for rewards to load
    cy.wait('@getRewards');

    // Verify all rewards are shown initially
    cy.get('[data-testid="reward-option"]').should('have.length', 3);

    // Filter by environmental rewards
    cy.get('[data-testid="filter-environmental"]').click();
    
    // Should only see environmental rewards
    cy.get('[data-testid="reward-option"]').should('have.length', 1);
    cy.contains('Tree Planting').should('be.visible');
    cy.contains('Discount Coupon').should('not.exist');
    
    // Filter by coupon rewards
    cy.get('[data-testid="filter-coupon"]').click();
    
    // Should only see coupon rewards
    cy.get('[data-testid="reward-option"]').should('have.length', 1);
    cy.contains('Discount Coupon').should('be.visible');
    cy.contains('Tree Planting').should('not.exist');
    
    // Clear filters
    cy.get('[data-testid="filter-clear"]').click();
    
    // Should see all rewards again
    cy.get('[data-testid="reward-option"]').should('have.length', 3);
  });
});