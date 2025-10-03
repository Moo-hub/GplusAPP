// performance-tests.cy.js - Testing performance metrics

describe('Performance Tests', () => {
  beforeEach(() => {
    // Login before each test
    cy.fixture('users').then((users) => {
      cy.apiLogin(users.user.email, users.user.password);
    });
  });
  
  it('should load the dashboard within performance budget', () => {
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.performance.mark('dashboard-visit-start');
      },
      onLoad(win) {
        win.performance.mark('dashboard-dom-load');
      }
    });
    
    // Wait for network idle to ensure all resources are loaded
    cy.waitForNetworkIdle(500, {
      timeout: 15000
    }).then(() => {
      cy.window().then(win => {
        win.performance.mark('dashboard-complete');
        
        // Measure time from visit to DOM load
        win.performance.measure('visit-to-dom-load', 'dashboard-visit-start', 'dashboard-dom-load');
        
        // Measure time from visit to complete load
        win.performance.measure('visit-to-complete', 'dashboard-visit-start', 'dashboard-complete');
        
        // Get the measurements
        const domLoadMeasure = win.performance.getEntriesByName('visit-to-dom-load')[0];
        const completeLoadMeasure = win.performance.getEntriesByName('visit-to-complete')[0];
        
        // Log the measurements
        cy.task('log', `Dashboard DOM load time: ${domLoadMeasure.duration.toFixed(2)}ms`);
        cy.task('log', `Dashboard complete load time: ${completeLoadMeasure.duration.toFixed(2)}ms`);
        
        // Assert on performance budgets
        expect(domLoadMeasure.duration).to.be.lessThan(2000, 'DOM load should be under 2 seconds');
        expect(completeLoadMeasure.duration).to.be.lessThan(4000, 'Complete load should be under 4 seconds');
      });
    });
  });
  
  it('should have fast pickup form submission', () => {
    cy.visit('/schedule-pickup');
    
    // Fill the form
    cy.get('[data-testid="pickup-date"]').type('2023-12-25');
    cy.get('[data-testid="pickup-time"]').select('10:00 AM');
    cy.get('[data-testid="pickup-address"]').clear().type('123 Performance Test Street');
    cy.get('[data-testid="material-PAPER"]').check();
    cy.get('[data-testid="material-PLASTIC"]').check();
    cy.get('[data-testid="weight-estimate"]').clear().type('3');
    
    // Measure form submission time
    cy.window().then(win => {
      win.performance.mark('form-submit-start');
    });
    
    cy.get('[data-testid="submit-pickup"]').click();
    
    // Wait for submission to complete
    cy.contains('Pickup scheduled successfully', { timeout: 10000 }).should('be.visible');
    
    cy.window().then(win => {
      win.performance.mark('form-submit-end');
      win.performance.measure('form-submission', 'form-submit-start', 'form-submit-end');
      
      const submissionMeasure = win.performance.getEntriesByName('form-submission')[0];
      cy.task('log', `Form submission time: ${submissionMeasure.duration.toFixed(2)}ms`);
      
      // Assert on performance budget
      expect(submissionMeasure.duration).to.be.lessThan(3000, 'Form submission should be under 3 seconds');
    });
  });
  
  it('should have good Time to Interactive on rewards page', () => {
    cy.visit('/rewards', {
      onBeforeLoad(win) {
        win.performance.mark('rewards-visit-start');
      }
    });
    
    // Check for interactive elements to be available
    cy.get('[data-testid="reward-option"]', { timeout: 10000 }).should('be.visible');
    
    cy.window().then(win => {
      win.performance.mark('rewards-interactive');
      win.performance.measure('time-to-interactive', 'rewards-visit-start', 'rewards-interactive');
      
      const ttiMeasure = win.performance.getEntriesByName('time-to-interactive')[0];
      cy.task('log', `Rewards Time to Interactive: ${ttiMeasure.duration.toFixed(2)}ms`);
      
      // Assert on TTI performance budget
      expect(ttiMeasure.duration).to.be.lessThan(2500, 'Time to Interactive should be under 2.5 seconds');
    });
    
    // Test interaction responsiveness
    cy.window().then(win => {
      win.performance.mark('interaction-start');
    });
    
    cy.get('[data-testid="reward-option"]').first().click();
    
    // Verify interaction completed
    cy.url().should('include', '/rewards/');
    
    cy.window().then(win => {
      win.performance.mark('interaction-end');
      win.performance.measure('interaction-time', 'interaction-start', 'interaction-end');
      
      const interactionMeasure = win.performance.getEntriesByName('interaction-time')[0];
      cy.task('log', `Interaction response time: ${interactionMeasure.duration.toFixed(2)}ms`);
      
      // Assert on interaction response time
      expect(interactionMeasure.duration).to.be.lessThan(1000, 'Interaction response should be under 1 second');
    });
  });
  
  it('should have acceptable API response times', () => {
    cy.window().then(win => {
      win.performance.mark('api-call-start');
    });
    
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/points/balance`,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      cy.window().then(win => {
        win.performance.mark('api-call-end');
        win.performance.measure('api-response-time', 'api-call-start', 'api-call-end');
        
        const apiMeasure = win.performance.getEntriesByName('api-response-time')[0];
        cy.task('log', `API response time: ${apiMeasure.duration.toFixed(2)}ms`);
        
        // Assert on API response time
        expect(apiMeasure.duration).to.be.lessThan(500, 'API response should be under 500ms');
        
        // Also check response status
        expect(response.status).to.eq(200);
      });
    });
  });
  
  it('should have fast initial load time for first contentful paint', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Clear performance entries from previous tests
        win.performance.clearMarks();
        win.performance.clearMeasures();
        
        // Create observer for First Contentful Paint
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              win.fcpTime = entry.startTime;
              win.performance.mark('fcp-observed');
            }
          });
        });
        
        observer.observe({ type: 'paint', buffered: true });
      }
    });
    
    // Wait for FCP to be observed or a reasonable timeout
    cy.window().then({ timeout: 10000 }, (win) => {
      return new Cypress.Promise(resolve => {
        const checkFcp = () => {
          if (win.fcpTime) {
            resolve(win.fcpTime);
          } else {
            setTimeout(checkFcp, 100);
          }
        };
        checkFcp();
      });
    }).then(fcpTime => {
      cy.task('log', `First Contentful Paint: ${fcpTime.toFixed(2)}ms`);
      
      // Assert on FCP time
      expect(fcpTime).to.be.lessThan(1800, 'First Contentful Paint should be under 1.8 seconds');
    });
  });
});