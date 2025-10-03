/**
 * Visual testing custom commands for Cypress
 * Extends Cypress with commands for visual regression testing
 */

// Import commands.js using ES2015 syntax:
import './commands';

/**
 * Take a screenshot and compare it with the baseline
 * @param {string} name - Name of the screenshot
 * @param {object} options - Screenshot options
 * @param {object} compareOptions - Comparison options like threshold
 * @example cy.visualSnapshot('homepage-header', { capture: 'viewport' }, { threshold: 0.1 });
 */
Cypress.Commands.add('visualSnapshot', (name, options = {}, compareOptions = {}) => {
  // Default options
  const defaultOptions = {
    capture: 'fullPage',
    disableTimersAndAnimations: true,
    scale: false,
    blackout: options.blackout || [],
    ...options
  };
  
  // Take screenshot with the specified name
  cy.screenshot(name, defaultOptions);
  
  // Compare with baseline if not in first-run mode
  if (Cypress.env('VISUAL_TESTING') === 'true' && Cypress.env('VISUAL_BASELINE') !== 'true') {
    cy.task('compareScreenshots', {
      name,
      ...compareOptions
    });
  }
});

/**
 * Compare specific element with baseline
 * @param {string} selector - Element selector
 * @param {string} name - Name of the screenshot
 * @param {object} options - Screenshot options
 * @param {object} compareOptions - Comparison options
 * @example cy.visualCompare('.header', 'header-component', { threshold: 0.1 });
 */
Cypress.Commands.add('visualCompare', (selector, name, options = {}, compareOptions = {}) => {
  cy.get(selector).should('be.visible').then($element => {
    // Default options
    const defaultOptions = {
      capture: 'viewport',
      disableTimersAndAnimations: true,
      ...options
    };
    
    // Take screenshot of specific element
    cy.get(selector).screenshot(name, defaultOptions);
    
    // Compare with baseline if not in first-run mode
    if (Cypress.env('VISUAL_TESTING') === 'true' && Cypress.env('VISUAL_BASELINE') !== 'true') {
      cy.task('compareScreenshots', {
        name,
        selector,
        ...compareOptions
      });
    }
  });
});

/**
 * Mask sensitive data for visual testing
 * @param {string} selector - Element selector to mask
 * @param {string} [maskColor='#333'] - Color to use for masking
 * @example cy.maskElement('.credit-card-number', '#000');
 */
Cypress.Commands.add('maskElement', (selector, maskColor = '#333') => {
  cy.get(selector).then($elements => {
    $elements.each((i, el) => {
      const $el = Cypress.$(el);
      $el.css({
        backgroundColor: maskColor,
        color: maskColor,
        textShadow: 'none',
        'box-shadow': 'none'
      });
      
      // If it has text content, replace with placeholder
      if ($el.children().length === 0) {
        $el.text('XXXXX');
      }
    });
  });
});

/**
 * Compare screenshots across different viewports
 * @param {string} name - Base name for the screenshot
 * @param {Array} viewports - Array of viewport sizes to test
 * @param {object} options - Screenshot options
 * @example cy.visualSnapMultipleViewports('homepage', [{ width: 1280, height: 720 }, { width: 375, height: 667 }]);
 */
Cypress.Commands.add('visualSnapMultipleViewports', (name, viewports, options = {}) => {
  viewports.forEach(size => {
    // Set viewport size
    cy.viewport(size.width, size.height);
    
    // Wait for any responsive adjustments
    cy.wait(500); 
    
    // Take screenshot with viewport in the name
    cy.visualSnapshot(`${name}-${size.width}x${size.height}`, options);
  });
});

/**
 * Compare page before and after an action
 * @param {string} name - Base name for the screenshots
 * @param {Function} action - Action to perform between screenshots
 * @param {object} options - Screenshot options
 * @example cy.visualDiff('modal', () => cy.get('.open-modal-button').click(), { capture: 'viewport' });
 */
Cypress.Commands.add('visualDiff', (name, action, options = {}) => {
  // Take before screenshot
  cy.visualSnapshot(`${name}-before`, options);
  
  // Perform the action
  action();
  
  // Wait for any animations to complete
  cy.wait(500);
  
  // Take after screenshot
  cy.visualSnapshot(`${name}-after`, options);
});

// Additional accessibility-related commands
if (Cypress.env('A11Y_TESTING') === 'true') {
  // Automatically inject axe on visit
  Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
    return originalFn(url, options).then(() => {
      cy.injectAxe();
    });
  });
}