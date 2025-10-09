/**
 * Performance metrics tests for G+ App
 * These tests measure various performance aspects of the application
 */

describe('Performance Metrics Tests', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Add performance observer
        const observer = new win.PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            cy.task('log', `Performance entry: ${entry.name} - ${entry.startTime.toFixed(2)}ms - ${entry.duration.toFixed(2)}ms`);
          });
        });
        
        observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'mark', 'measure'] });
      },
    });
  });

  it('measures page load performance metrics', () => {
    cy.window().then((win) => {
      // Get all performance metrics
      const perfData = win.performance.getEntriesByType('navigation')[0];
      
      // Record core metrics
      cy.task('recordMetric', { 
        name: 'domContentLoaded', 
        value: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 
        unit: 'ms' 
      });
      
      cy.task('recordMetric', { 
        name: 'domInteractive', 
        value: perfData.domInteractive, 
        unit: 'ms' 
      });
      
      cy.task('recordMetric', { 
        name: 'loadEvent', 
        value: perfData.loadEventEnd - perfData.loadEventStart, 
        unit: 'ms' 
      });
      
      cy.task('recordMetric', { 
        name: 'totalPageLoad', 
        value: perfData.loadEventEnd, 
        unit: 'ms' 
      });
      
      // Assert on performance expectations
      expect(perfData.loadEventEnd).to.be.lessThan(5000); // Total page load under 5 seconds
      expect(perfData.domInteractive).to.be.lessThan(2500); // DOM interactive under 2.5 seconds
    });
    
    // Additional visual metrics
    cy.window().then((win) => {
      const paintMetrics = win.performance.getEntriesByType('paint');
      
      // First paint time
      const firstPaint = paintMetrics.find(({ name }) => name === 'first-paint');
      if (firstPaint) {
        cy.task('recordMetric', { 
          name: 'firstPaint', 
          value: firstPaint.startTime, 
          unit: 'ms' 
        });
        expect(firstPaint.startTime).to.be.lessThan(1500); // First paint under 1.5 seconds
      }
      
      // First contentful paint time
      const firstContentfulPaint = paintMetrics.find(({ name }) => name === 'first-contentful-paint');
      if (firstContentfulPaint) {
        cy.task('recordMetric', { 
          name: 'firstContentfulPaint', 
          value: firstContentfulPaint.startTime, 
          unit: 'ms' 
        });
        expect(firstContentfulPaint.startTime).to.be.lessThan(2000); // FCP under 2 seconds
      }
    });
  });

  it('measures API response times', () => {
    // Visit a page that makes API calls
    cy.visit('/dashboard');
    
    // Intercept API calls to measure performance
    cy.intercept('GET', '/api/user/profile').as('profileApi');
    cy.intercept('GET', '/api/recycling/stats').as('statsApi');
    cy.intercept('GET', '/api/pickups/history').as('historyApi');
    
    // Wait for APIs to complete
    cy.wait(['@profileApi', '@statsApi', '@historyApi']).then((interceptions) => {
      // Measure API response times
      interceptions.forEach((interception) => {
        const duration = interception.response.headers['x-response-time'] || 
          (interception.response.headers['x-response-time-ms'] || 
           interception.response.headers['server-timing'] || 
           'unknown');
        
        cy.task('recordMetric', { 
          name: `api_${interception.alias}`, 
          value: typeof duration === 'string' ? parseFloat(duration) : duration, 
          unit: 'ms' 
        });
        
        // Assert reasonable API response times
        expect(interception.response.statusCode).to.be.within(200, 299);
        if (typeof duration === 'number') {
          expect(duration).to.be.lessThan(1000); // APIs should respond within 1 second
        }
      });
    });
  });

  it('measures client-side rendering performance', () => {
    // Test interactive components with performance marks
    cy.window().then((win) => {
      // Clear existing marks and measures
      win.performance.clearMarks();
      win.performance.clearMeasures();
    });
    
    // Click to open a modal and measure rendering time
    cy.window().then((win) => {
      win.performance.mark('modal-open-start');
    });
    
    cy.get('[data-test="open-modal"]').click();
    cy.get('.modal-content').should('be.visible');
    
    cy.window().then((win) => {
      win.performance.mark('modal-open-end');
      win.performance.measure('modal-open-time', 'modal-open-start', 'modal-open-end');
      
      const measure = win.performance.getEntriesByName('modal-open-time')[0];
      cy.task('recordMetric', { 
        name: 'modalRenderTime', 
        value: measure.duration, 
        unit: 'ms' 
      });
      
      // Modal should render quickly
      expect(measure.duration).to.be.lessThan(500); // Modal should render within 500ms
    });
    
    // Close the modal
    cy.get('[data-test="close-modal"]').click();
    cy.get('.modal-content').should('not.exist');
    
    // Measure tab switching performance
    cy.window().then((win) => {
      win.performance.mark('tab-switch-start');
    });
    
    cy.get('[data-test="tab-2"]').click();
    cy.get('[data-test="tab-2-content"]').should('be.visible');
    
    cy.window().then((win) => {
      win.performance.mark('tab-switch-end');
      win.performance.measure('tab-switch-time', 'tab-switch-start', 'tab-switch-end');
      
      const measure = win.performance.getEntriesByName('tab-switch-time')[0];
      cy.task('recordMetric', { 
        name: 'tabSwitchTime', 
        value: measure.duration, 
        unit: 'ms' 
      });
      
      // Tab switching should be fast
      expect(measure.duration).to.be.lessThan(300); // Tab switching within 300ms
    });
  });

  it('measures form submission performance', () => {
    cy.visit('/contact');
    
    cy.window().then((win) => {
      win.performance.mark('form-fill-start');
    });
    
    // Fill out form fields
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type('This is a performance test for form submission in the G+ App.');
    
    cy.window().then((win) => {
      win.performance.mark('form-fill-end');
      win.performance.measure('form-fill-time', 'form-fill-start', 'form-fill-end');
      
      const fillMeasure = win.performance.getEntriesByName('form-fill-time')[0];
      cy.task('recordMetric', { 
        name: 'formFillTime', 
        value: fillMeasure.duration, 
        unit: 'ms' 
      });
    });
    
    // Intercept form submission API
    cy.intercept('POST', '/api/contact').as('contactSubmit');
    
    cy.window().then((win) => {
      win.performance.mark('form-submit-start');
    });
    
    // Submit the form
    cy.get('form').submit();
    
    // Wait for submission to complete
    cy.wait('@contactSubmit');
    
    cy.window().then((win) => {
      win.performance.mark('form-submit-end');
      win.performance.measure('form-submit-time', 'form-submit-start', 'form-submit-end');
      
      const submitMeasure = win.performance.getEntriesByName('form-submit-time')[0];
      cy.task('recordMetric', { 
        name: 'formSubmitTime', 
        value: submitMeasure.duration, 
        unit: 'ms' 
      });
      
      // Form submission should be reasonably fast
      expect(submitMeasure.duration).to.be.lessThan(2000); // Form submission within 2 seconds
    });
    
    // Check success message appears
    cy.get('.form-success-message').should('be.visible');
  });
  
  it('measures resource loading performance', () => {
    cy.window().then((win) => {
      const resources = win.performance.getEntriesByType('resource');
      
      // Group resources by type
      const resourceTypes = {
        'script': [],
        'css': [],
        'image': [],
        'fetch': [],
        'other': []
      };
      
      resources.forEach(resource => {
        const url = resource.name;
        const type = resource.initiatorType;
        
        if (type === 'script') resourceTypes.script.push(resource);
        else if (type === 'link' && url.endsWith('.css')) resourceTypes.css.push(resource);
        else if (type === 'img' || url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) resourceTypes.image.push(resource);
        else if (type === 'fetch' || type === 'xmlhttprequest') resourceTypes.fetch.push(resource);
        else resourceTypes.other.push(resource);
      });
      
      // Calculate average load time for each resource type
      Object.keys(resourceTypes).forEach(type => {
        const typeResources = resourceTypes[type];
        if (typeResources.length > 0) {
          const totalDuration = typeResources.reduce((sum, resource) => sum + resource.duration, 0);
          const avgDuration = totalDuration / typeResources.length;
          const maxDuration = Math.max(...typeResources.map(resource => resource.duration));
          
          cy.task('recordMetric', { 
            name: `avg${type.charAt(0).toUpperCase() + type.slice(1)}LoadTime`, 
            value: avgDuration, 
            unit: 'ms' 
          });
          
          cy.task('recordMetric', { 
            name: `max${type.charAt(0).toUpperCase() + type.slice(1)}LoadTime`, 
            value: maxDuration, 
            unit: 'ms' 
          });
          
          // Log slowest resources of each type
          if (typeResources.length > 0) {
            const slowest = [...typeResources].sort((a, b) => b.duration - a.duration)[0];
            cy.task('log', `Slowest ${type} resource: ${slowest.name} - ${slowest.duration.toFixed(2)}ms`);
          }
        }
      });
      
      // Assert on overall resource loading performance
      if (resourceTypes.script.length > 0) {
        const avgScriptTime = resourceTypes.script.reduce((sum, r) => sum + r.duration, 0) / resourceTypes.script.length;
        expect(avgScriptTime).to.be.lessThan(1000); // Average script loading under 1 second
      }
      
      if (resourceTypes.css.length > 0) {
        const avgCssTime = resourceTypes.css.reduce((sum, r) => sum + r.duration, 0) / resourceTypes.css.length;
        expect(avgCssTime).to.be.lessThan(500); // Average CSS loading under 500ms
      }
    });
  });
});