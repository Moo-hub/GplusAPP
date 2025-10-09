/**
 * User Flow Performance Tests
 * 
 * This test suite focuses on measuring performance of common user flows
 * in the G+ recycling application.
 */

describe('User Flow Performance Tests', () => {
  beforeEach(() => {
    // Record test start metrics
    cy.task('recordMetric', {
      name: 'test_start',
      value: 0,
      unit: 'ms',
      metadata: { testName: Cypress.currentTest.title }
    });
  });

  it('should measure recycling scheduling flow performance', () => {
    // Start measuring the full user flow
    const flowTimer = cy.measureCustomMetric('complete_scheduling_flow');
    
    // Visit homepage and measure performance
    cy.visit('/');
    cy.measurePageLoad('homepage');
    cy.contains('Schedule Pickup').should('be.visible');
    
    // Navigate to scheduling page
    const navigationTimer = cy.measureInteraction('navigation', 'Navigate to scheduling page');
    cy.contains('Schedule Pickup').click();
    cy.url().should('include', '/schedule');
    navigationTimer.end();
    
    // Measure scheduling form render time
    cy.measureComponentRender('[data-cy=scheduling-form]', 'SchedulingForm');
    
    // Intercept API calls for location validation
    cy.intercept('GET', '/api/locations/validate*').as('validateLocation');
    
    // Fill out form with performance measurements
    const formFillTimer = cy.measureInteraction('form-fill', 'Complete pickup form');
    
    cy.get('[data-cy=address-input]').type('123 Test Street');
    cy.wait('@validateLocation');
    cy.measureApiCall('@validateLocation', 'Location Validation API');
    
    cy.get('[data-cy=date-picker]').click();
    cy.get('.calendar-day:not(.disabled)').first().click();
    
    cy.get('[data-cy=time-slot]').select('10:00 AM - 12:00 PM');
    
    cy.get('[data-cy=material-type]').select('Glass');
    cy.get('[data-cy=material-weight]').type('5');
    cy.get('[data-cy=additional-notes]').type('This is a performance test submission');
    
    formFillTimer.end();
    
    // Intercept form submission API call
    cy.intercept('POST', '/api/schedule-pickup').as('submitPickup');
    
    // Submit form and measure performance
    const submitTimer = cy.measureInteraction('form-submit', 'Submit pickup form');
    cy.get('[data-cy=submit-button]').click();
    submitTimer.end();
    
    // Measure API response time
    cy.measureApiCall('@submitPickup', 'Schedule Pickup API');
    
    // Wait for success message and measure confirmation page render
    cy.contains('Pickup Scheduled Successfully', { timeout: 10000 }).should('be.visible');
    cy.measureComponentRender('[data-cy=confirmation-details]', 'ConfirmationDetails');
    
    // Take performance snapshot of the completed flow
    cy.performanceSnapshot('pickup-scheduling-completed');
    
    // End the full flow timer
    flowTimer.end({
      category: 'user-flow',
      critical: true
    });
    
    // Verify expected elements on confirmation screen
    cy.get('[data-cy=confirmation-number]').should('be.visible');
    cy.get('[data-cy=estimated-points]').should('be.visible');
    
    // Generate performance report
    cy.generatePerformanceReport();
  });
  
  it('should measure recycling history browsing performance', () => {
    // Start measuring the full user flow
    const flowTimer = cy.measureCustomMetric('history_browsing_flow');
    
    // Visit the history page
    cy.visit('/history');
    cy.measurePageLoad('history-page');
    
    // Intercept history data API call
    cy.intercept('GET', '/api/recycling/history*').as('historyData');
    
    // Measure component render time
    cy.measureComponentRender('[data-cy=history-table]', 'HistoryTable');
    
    // Measure API response time
    cy.measureApiCall('@historyData', 'History Data API');
    
    // Measure filter interaction performance
    const filterTimer = cy.measureInteraction('filter-interaction', 'Apply history filters');
    
    cy.get('[data-cy=date-range-filter]').click();
    cy.get('[data-cy=last-month-option]').click();
    cy.get('[data-cy=material-filter]').select('All Materials');
    cy.get('[data-cy=status-filter]').select('Completed');
    cy.get('[data-cy=apply-filters]').click();
    
    filterTimer.end();
    
    // Intercept filtered results API call
    cy.intercept('GET', '/api/recycling/history*').as('filteredResults');
    cy.measureApiCall('@filteredResults', 'Filtered History API');
    
    // Measure sorting performance
    const sortTimer = cy.measureInteraction('sort-interaction', 'Sort history by date');
    cy.get('[data-cy=sort-by-date]').click();
    sortTimer.end();
    
    // Measure details view performance
    const detailsTimer = cy.measureInteraction('view-details', 'View pickup details');
    cy.get('[data-cy=view-details]').first().click();
    cy.get('[data-cy=pickup-details-modal]').should('be.visible');
    detailsTimer.end();
    
    // Measure modal render time
    cy.measureComponentRender('[data-cy=pickup-details-modal]', 'PickupDetailsModal');
    
    // Close modal
    cy.get('[data-cy=close-modal]').click();
    cy.get('[data-cy=pickup-details-modal]').should('not.exist');
    
    // End the full flow timer
    flowTimer.end({
      category: 'user-flow',
      critical: true
    });
    
    // Take performance snapshot
    cy.performanceSnapshot('history-browsing-completed');
    
    // Generate performance report
    cy.generatePerformanceReport();
  });
  
  it('should measure rewards redemption flow performance', () => {
    // Start measuring the full user flow
    const flowTimer = cy.measureCustomMetric('rewards_redemption_flow');
    
    // Visit rewards page
    cy.visit('/rewards');
    cy.measurePageLoad('rewards-page');
    
    // Intercept rewards data API call
    cy.intercept('GET', '/api/rewards/available*').as('rewardsData');
    cy.intercept('GET', '/api/user/points-balance').as('pointsBalance');
    
    // Measure component render times
    cy.measureComponentRender('[data-cy=rewards-catalog]', 'RewardsCatalog');
    cy.measureComponentRender('[data-cy=points-summary]', 'PointsSummary');
    
    // Measure API response times
    cy.measureApiCall('@rewardsData', 'Rewards Data API');
    cy.measureApiCall('@pointsBalance', 'Points Balance API');
    
    // Filter rewards (measure interaction)
    const filterTimer = cy.measureInteraction('filter-rewards', 'Filter rewards by category');
    cy.get('[data-cy=category-filter]').select('Restaurant Vouchers');
    filterTimer.end();
    
    // Measure filtered results render
    cy.measureComponentRender('[data-cy=filtered-rewards]', 'FilteredRewards');
    
    // Select a reward (measure interaction)
    const selectTimer = cy.measureInteraction('select-reward', 'Select reward');
    cy.get('[data-cy=reward-card]').first().click();
    selectTimer.end();
    
    // Measure reward details render
    cy.measureComponentRender('[data-cy=reward-details]', 'RewardDetails');
    
    // Intercept redemption API call
    cy.intercept('POST', '/api/rewards/redeem').as('redeemReward');
    
    // Redeem reward (measure interaction)
    const redeemTimer = cy.measureInteraction('redeem-reward', 'Redeem reward');
    cy.get('[data-cy=redeem-button]').click();
    cy.get('[data-cy=confirm-redemption]').click();
    redeemTimer.end();
    
    // Measure API response time
    cy.measureApiCall('@redeemReward', 'Redeem Reward API');
    
    // Measure confirmation screen render
    cy.contains('Reward Redeemed Successfully', { timeout: 10000 }).should('be.visible');
    cy.measureComponentRender('[data-cy=redemption-confirmation]', 'RedemptionConfirmation');
    
    // End the full flow timer
    flowTimer.end({
      category: 'user-flow',
      critical: true
    });
    
    // Take performance snapshot
    cy.performanceSnapshot('rewards-redemption-completed');
    
    // Generate performance report
    cy.generatePerformanceReport();
  });
  
  afterEach(() => {
    // Record test end metrics and calculate test duration
    cy.task('recordMetric', {
      name: 'test_end',
      value: 0,
      unit: 'ms',
      metadata: { testName: Cypress.currentTest.title }
    });
  });
});