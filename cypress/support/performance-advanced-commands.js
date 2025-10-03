/**
 * Advanced Performance Commands for G+ App
 * These commands focus on complex user interaction patterns and advanced metrics
 */

// Command to measure a multi-step interaction flow
Cypress.Commands.add('measureInteractionFlow', (flowName, steps) => {
  const startTime = performance.now();
  const stepTimes = [];
  
  // Return an object with methods to mark steps and end the flow
  return {
    // Mark a step in the interaction flow
    step: (stepName) => {
      const stepTime = performance.now();
      stepTimes.push({
        name: stepName,
        time: stepTime - startTime,
        delta: stepTimes.length > 0 ? stepTime - (startTime + stepTimes[stepTimes.length - 1].time) : stepTime - startTime
      });
      
      cy.log(`Step '${stepName}' completed at ${(stepTime - startTime).toFixed(2)}ms`);
    },
    
    // End the flow measurement and record metrics
    end: (metadata = {}) => {
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Record overall flow time
      cy.task('recordMetric', {
        name: `flow_total_time`,
        value: totalTime,
        unit: 'ms',
        metadata: { 
          flow: flowName,
          steps: steps || stepTimes.length,
          ...metadata
        }
      });
      
      // Record individual step metrics
      stepTimes.forEach((step, index) => {
        cy.task('recordMetric', {
          name: `flow_step_time`,
          value: step.delta,
          unit: 'ms',
          metadata: { 
            flow: flowName,
            step: step.name,
            stepNumber: index + 1,
            ...metadata
          }
        });
      });
      
      // Calculate and record flow efficiency (ideal time / actual time)
      // A higher ratio means more efficient flow
      const idealStepCount = steps || stepTimes.length;
      const idealTimePerStep = 300; // 300ms as a baseline for an efficient step
      const idealTotalTime = idealStepCount * idealTimePerStep;
      const efficiencyRatio = (idealTotalTime / totalTime) * 100;
      
      cy.task('recordMetric', {
        name: `flow_efficiency`,
        value: efficiencyRatio,
        unit: '%',
        metadata: { 
          flow: flowName,
          ...metadata
        }
      });
      
      // Log the results
      cy.log(`Interaction flow '${flowName}' completed:
        Total time: ${totalTime.toFixed(2)}ms
        Steps: ${stepTimes.length}
        Efficiency: ${efficiencyRatio.toFixed(2)}%
      `);
      
      // Return data for chaining
      return {
        totalTime,
        stepTimes,
        efficiencyRatio
      };
    }
  };
});

// Command to measure perceived performance using web vitals
Cypress.Commands.add('measurePerceivedPerformance', (pageName) => {
  cy.window().then((win) => {
    // Use the browser's Performance API
    if (!win.performance) {
      cy.log('Performance API not available');
      return;
    }
    
    // Calculate First Paint and First Contentful Paint if available
    const paintMetrics = win.performance.getEntriesByType('paint');
    
    // Find paint metrics
    const firstPaint = paintMetrics.find(({ name }) => name === 'first-paint');
    const firstContentfulPaint = paintMetrics.find(({ name }) => name === 'first-contentful-paint');
    
    // Record metrics if available
    if (firstPaint) {
      cy.task('recordMetric', {
        name: 'first_paint',
        value: firstPaint.startTime,
        unit: 'ms',
        metadata: { page: pageName }
      });
    }
    
    if (firstContentfulPaint) {
      cy.task('recordMetric', {
        name: 'first_contentful_paint',
        value: firstContentfulPaint.startTime,
        unit: 'ms',
        metadata: { page: pageName }
      });
    }
    
    // Approximate Largest Contentful Paint using mutation observer
    // This is a simplified approximation since we can't directly access LCP in Cypress
    const approximateLCP = (win) => {
      cy.get('body').then(($body) => {
        // Find the largest element by area
        const allElements = $body[0].getElementsByTagName('*');
        let largestElement = null;
        let largestArea = 0;
        
        Array.from(allElements).forEach(el => {
          const rect = el.getBoundingClientRect();
          const area = rect.width * rect.height;
          
          // Check if element is visible and in viewport
          const isVisible = window.getComputedStyle(el).visibility !== 'hidden' && 
                            window.getComputedStyle(el).display !== 'none';
          const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                              rect.bottom <= win.innerHeight && rect.right <= win.innerWidth;
          
          if (isVisible && isInViewport && area > largestArea) {
            largestArea = area;
            largestElement = el;
          }
        });
        
        // Record the approximate LCP if we found a largest element
        if (largestElement) {
          const lcpTime = win.performance.now();
          cy.task('recordMetric', {
            name: 'approx_largest_contentful_paint',
            value: lcpTime,
            unit: 'ms',
            metadata: { 
              page: pageName,
              elementType: largestElement.tagName,
              elementArea: largestArea
            }
          });
        }
      });
    };
    
    // Wait for the page to stabilize before approximating LCP
    cy.wait(1000); // Wait for 1 second to let the page render
    approximateLCP(win);
  });
});

// Command to measure layout stability (similar to Cumulative Layout Shift)
Cypress.Commands.add('measureLayoutStability', (pageName, durationMs = 5000) => {
  const startTime = performance.now();
  let shiftScore = 0;
  let observations = 0;
  
  // Create a function to sample layout positions
  const sampleLayout = () => {
    cy.document().then((doc) => {
      // Get positions of visible elements
      const elements = doc.querySelectorAll('body *');
      const positions = new Map();
      
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          positions.set(el, {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      });
      
      return positions;
    });
  };
  
  // Take initial sample
  const initialPositions = sampleLayout();
  
  // Function to calculate shift between two layout samples
  const calculateShift = (before, after) => {
    let totalShiftArea = 0;
    let totalVisibleArea = 0;
    
    // Compare positions
    after.forEach((currentPos, el) => {
      const previousPos = before.get(el);
      if (previousPos) {
        // Calculate movement
        const dx = Math.abs(currentPos.left - previousPos.left);
        const dy = Math.abs(currentPos.top - previousPos.top);
        
        if (dx > 0 || dy > 0) {
          // Element shifted
          const impactArea = currentPos.width * currentPos.height;
          const distance = Math.sqrt(dx * dx + dy * dy);
          totalShiftArea += impactArea * Math.min(distance / 100, 1);
        }
        
        totalVisibleArea += currentPos.width * currentPos.height;
      }
    });
    
    // Return shift score (normalized between 0 and 1)
    return totalVisibleArea > 0 ? Math.min(totalShiftArea / totalVisibleArea, 1) : 0;
  };
  
  // Sample multiple times
  const interval = setInterval(() => {
    if (performance.now() - startTime >= durationMs) {
      clearInterval(interval);
      
      // Calculate average shift score
      const avgShiftScore = observations > 0 ? shiftScore / observations : 0;
      
      // Record the metric
      cy.task('recordMetric', {
        name: 'layout_stability_score',
        value: avgShiftScore,
        unit: 'score',
        metadata: { 
          page: pageName,
          durationMs: durationMs,
          samples: observations
        }
      });
      
      cy.log(`Layout stability for ${pageName}: ${avgShiftScore.toFixed(4)} (${observations} samples)`);
    } else {
      // Take a new sample and compare
      const currentPositions = sampleLayout();
      const currentShift = calculateShift(initialPositions, currentPositions);
      
      shiftScore += currentShift;
      observations++;
    }
  }, 500);
});

// Command to measure memory consumption over time
Cypress.Commands.add('measureMemoryConsumption', (componentName, operationFn, durationMs = 5000) => {
  const samples = [];
  const startTime = performance.now();
  
  const sampleMemory = () => {
    cy.window().then((win) => {
      if (win.performance && win.performance.memory) {
        const memoryInfo = win.performance.memory;
        samples.push({
          timestamp: performance.now() - startTime,
          usedJSHeapSize: memoryInfo.usedJSHeapSize / (1024 * 1024), // Convert to MB
          totalJSHeapSize: memoryInfo.totalJSHeapSize / (1024 * 1024),
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit / (1024 * 1024)
        });
      }
    });
  };
  
  // Take initial sample
  sampleMemory();
  
  // Execute the operation
  if (operationFn && typeof operationFn === 'function') {
    operationFn();
  }
  
  // Sample at regular intervals
  const interval = setInterval(() => {
    if (performance.now() - startTime >= durationMs) {
      clearInterval(interval);
      
      // Calculate metrics
      if (samples.length > 1) {
        const initialMemory = samples[0].usedJSHeapSize;
        const peakMemory = Math.max(...samples.map(s => s.usedJSHeapSize));
        const finalMemory = samples[samples.length - 1].usedJSHeapSize;
        const memoryGrowth = finalMemory - initialMemory;
        
        // Record metrics
        cy.task('recordMetric', {
          name: 'memory_peak',
          value: peakMemory,
          unit: 'MB',
          metadata: { component: componentName }
        });
        
        cy.task('recordMetric', {
          name: 'memory_growth',
          value: memoryGrowth,
          unit: 'MB',
          metadata: { component: componentName }
        });
        
        // Check for memory leaks
        const potentialLeak = memoryGrowth > 5; // More than 5MB growth might indicate a leak
        
        cy.log(`Memory consumption for ${componentName}:
          Initial: ${initialMemory.toFixed(2)}MB
          Peak: ${peakMemory.toFixed(2)}MB
          Final: ${finalMemory.toFixed(2)}MB
          Growth: ${memoryGrowth.toFixed(2)}MB
          Potential memory leak: ${potentialLeak ? 'Yes' : 'No'}
        `);
        
        // Record all samples for time-series analysis
        cy.task('recordMetric', {
          name: 'memory_samples',
          value: samples,
          unit: 'samples',
          metadata: { component: componentName }
        });
      }
    } else {
      sampleMemory();
    }
  }, 500);
});

// Command to simulate network conditions and measure performance under constraints
Cypress.Commands.add('withNetworkCondition', (condition, testFn) => {
  // Define network conditions
  const conditions = {
    '3g': { download: 750 * 1024, upload: 250 * 1024, latency: 100 },
    '2g': { download: 250 * 1024, upload: 100 * 1024, latency: 300 },
    'slow': { download: 1 * 1024 * 1024, upload: 500 * 1024, latency: 70 },
    'offline': { offline: true }
  };
  
  const selectedCondition = conditions[condition] || conditions['3g'];
  
  // Apply network throttling
  cy.log(`Applying network condition: ${condition}`);
  cy.window().then((win) => {
    // Store original navigator.connection for later restoration
    const originalConnection = win.navigator.connection;
    
    // Mock the connection API
    win.navigator.connection = {
      ...originalConnection,
      effectiveType: condition,
      downlink: selectedCondition.download / (1024 * 1024),
      rtt: selectedCondition.latency
    };
    
    // Execute the test function with the throttled network
    testFn();
    
    // Restore original connection
    win.navigator.connection = originalConnection;
  });
});

// Command to benchmark a function and compare implementations
Cypress.Commands.add('benchmarkFunction', (name, implementations) => {
  const results = {};
  
  // Run each implementation multiple times
  Object.keys(implementations).forEach(implName => {
    const fn = implementations[implName];
    const iterations = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    
    const endTime = performance.now();
    const avgExecutionTime = (endTime - startTime) / iterations;
    
    results[implName] = avgExecutionTime;
    
    // Record metric
    cy.task('recordMetric', {
      name: `benchmark_${name}`,
      value: avgExecutionTime,
      unit: 'ms',
      metadata: { implementation: implName }
    });
  });
  
  // Determine the fastest implementation
  const fastest = Object.keys(results).reduce((a, b) => results[a] < results[b] ? a : b);
  
  // Log results
  cy.log(`Benchmark results for "${name}":
    ${Object.keys(results).map(impl => `${impl}: ${results[impl].toFixed(3)}ms${impl === fastest ? ' (fastest)' : ''}`).join('\n    ')}
  `);
  
  return results;
});