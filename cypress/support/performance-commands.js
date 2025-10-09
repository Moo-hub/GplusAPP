/**
 * Custom Cypress commands for performance testing
 * These commands allow measuring and reporting various performance metrics
 */

// Command to measure page load performance
Cypress.Commands.add('measurePageLoad', (pageName) => {
  // Start performance measurement
  const startTime = performance.now();
  
  // Set up listener for window load event to get basic metrics
  cy.window().then((win) => {
    // Get the navigation timing API data
    const perfData = win.performance.timing;
    
    // Calculate key metrics
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
    const firstPaint = perfData.responseEnd - perfData.navigationStart;
    const networkLatency = perfData.responseEnd - perfData.requestStart;
    const processingTime = perfData.loadEventEnd - perfData.responseEnd;
    
    // Record metrics using our performance task
    cy.task('recordMetric', {
      name: `page_load_total`,
      value: pageLoadTime,
      unit: 'ms',
      metadata: { page: pageName, critical: true }
    });
    
    cy.task('recordMetric', {
      name: `page_dom_content_loaded`,
      value: domContentLoaded,
      unit: 'ms',
      metadata: { page: pageName }
    });
    
    cy.task('recordMetric', {
      name: `page_first_paint`,
      value: firstPaint,
      unit: 'ms',
      metadata: { page: pageName }
    });
    
    cy.task('recordMetric', {
      name: `page_network_latency`,
      value: networkLatency,
      unit: 'ms',
      metadata: { page: pageName }
    });
    
    cy.task('recordMetric', {
      name: `page_processing_time`,
      value: processingTime,
      unit: 'ms',
      metadata: { page: pageName }
    });
    
    // Log the results for debugging
    cy.log(`Page load performance for ${pageName}:
      Total load time: ${pageLoadTime}ms
      DOM Content Loaded: ${domContentLoaded}ms
      First Paint: ${firstPaint}ms
      Network Latency: ${networkLatency}ms
      Processing Time: ${processingTime}ms
    `);
  });
});

// Command to measure API performance
Cypress.Commands.add('measureApiCall', (alias, apiName) => {
  cy.wait(alias).then((interception) => {
    const duration = interception.response.duration;
    const statusCode = interception.response.statusCode;
    const responseSize = JSON.stringify(interception.response.body).length;
    
    // Record metrics
    cy.task('recordMetric', {
      name: `api_response_time`,
      value: duration,
      unit: 'ms',
      metadata: { 
        api: apiName,
        endpoint: interception.request.url,
        status: statusCode
      }
    });
    
    cy.task('recordMetric', {
      name: `api_response_size`,
      value: responseSize,
      unit: 'bytes',
      metadata: { 
        api: apiName,
        endpoint: interception.request.url
      }
    });
    
    // Log the results
    cy.log(`API performance for ${apiName}:
      Response time: ${duration}ms
      Status code: ${statusCode}
      Response size: ${responseSize} bytes
    `);
  });
});

// Command to measure component render time
Cypress.Commands.add('measureComponentRender', (selector, componentName) => {
  const startTime = performance.now();
  
  // Wait for the element to be visible
  cy.get(selector, { timeout: 10000 }).should('be.visible').then(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Record metrics
    cy.task('recordMetric', {
      name: `component_render_time`,
      value: renderTime,
      unit: 'ms',
      metadata: { component: componentName }
    });
    
    // Log the results
    cy.log(`Component render time for ${componentName}: ${renderTime.toFixed(2)}ms`);
  });
});

// Command to measure user interaction performance
Cypress.Commands.add('measureInteraction', (action, description) => {
  const startTime = performance.now();
  
  // Return a function to be called after the interaction completes
  return {
    end: () => {
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      // Record metrics
      cy.task('recordMetric', {
        name: `interaction_time`,
        value: interactionTime,
        unit: 'ms',
        metadata: { 
          action: action,
          description: description
        }
      });
      
      // Log the results
      cy.log(`Interaction time for ${description}: ${interactionTime.toFixed(2)}ms`);
      
      // Return the time for chaining
      return interactionTime;
    }
  };
});

// Command to take a performance snapshot for user-defined metrics
Cypress.Commands.add('performanceSnapshot', (name, metadata = {}) => {
  cy.window().then((win) => {
    // Use Performance API if available
    if (win.performance && win.performance.memory) {
      cy.task('recordMetric', {
        name: `memory_usage`,
        value: win.performance.memory.usedJSHeapSize / (1024 * 1024),
        unit: 'MB',
        metadata: { 
          snapshot: name,
          ...metadata
        }
      });
    }
    
    // Count DOM elements as a measure of page complexity
    const domElementCount = win.document.getElementsByTagName('*').length;
    cy.task('recordMetric', {
      name: `dom_element_count`,
      value: domElementCount,
      unit: 'elements',
      metadata: { 
        snapshot: name,
        ...metadata
      }
    });
    
    cy.log(`Performance snapshot taken for ${name}`);
  });
});

// Command to generate performance report
Cypress.Commands.add('generatePerformanceReport', () => {
  cy.task('generatePerformanceReport').then((report) => {
    cy.log('Performance report generated');
    return report;
  });
});

// Command to measure resource loading times
Cypress.Commands.add('measureResourceLoad', (resourceType) => {
  cy.window().then((win) => {
    // Get all resources using Resource Timing API
    const resources = win.performance.getEntriesByType('resource');
    
    // Filter by resource type if provided
    const filteredResources = resourceType 
      ? resources.filter(r => r.initiatorType === resourceType)
      : resources;
      
    // Calculate statistics
    if (filteredResources.length > 0) {
      const totalDuration = filteredResources.reduce((sum, r) => sum + r.duration, 0);
      const avgDuration = totalDuration / filteredResources.length;
      const maxDuration = Math.max(...filteredResources.map(r => r.duration));
      
      // Record metrics
      cy.task('recordMetric', {
        name: `resource_load_avg`,
        value: avgDuration,
        unit: 'ms',
        metadata: { 
          resourceType: resourceType || 'all',
          count: filteredResources.length
        }
      });
      
      cy.task('recordMetric', {
        name: `resource_load_max`,
        value: maxDuration,
        unit: 'ms',
        metadata: { 
          resourceType: resourceType || 'all'
        }
      });
      
      cy.task('recordMetric', {
        name: `resource_count`,
        value: filteredResources.length,
        unit: 'resources',
        metadata: { 
          resourceType: resourceType || 'all'
        }
      });
      
      // Log the results
      cy.log(`Resource loading metrics for ${resourceType || 'all resources'}:
        Count: ${filteredResources.length}
        Average Duration: ${avgDuration.toFixed(2)}ms
        Max Duration: ${maxDuration.toFixed(2)}ms
      `);
    }
  });
});

// Command to measure custom metric with timing start/end
Cypress.Commands.add('measureCustomMetric', (metricName) => {
  const startTime = performance.now();
  
  return {
    end: (metadata = {}) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Record metrics
      cy.task('recordMetric', {
        name: metricName,
        value: duration,
        unit: 'ms',
        metadata
      });
      
      // Log the results
      cy.log(`Custom metric ${metricName}: ${duration.toFixed(2)}ms`);
      
      // Return the time for chaining
      return duration;
    }
  };
});