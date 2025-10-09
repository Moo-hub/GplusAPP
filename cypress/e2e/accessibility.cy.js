/**
 * Accessibility tests for G+ App
 * Tests WCAG compliance across key pages using cypress-axe
 */

describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe(); // Inject axe-core library
  });

  it('homepage should not have accessibility violations', () => {
    // Run axe on the homepage
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'best-practice']
      }
    }, (violations) => {
      // Log violations for reporting
      if (violations.length > 0) {
        cy.task('log', `${violations.length} accessibility violations found on homepage`);
        violations.forEach(violation => {
          cy.task('log', `${violation.id}: ${violation.description} (Impact: ${violation.impact})`);
        });
      }
    });
  });

  it('navigation should be keyboard accessible', () => {
    // Focus on the first nav link
    cy.get('nav a').first().focus();
    
    // Check that focus is visible
    cy.focused().should('have.css', 'outline-style').and('not.eq', 'none');
    
    // Tab through all navigation items
    cy.get('nav a').each(() => {
      // Check if focused element is visible and has focus styles
      cy.focused().should('be.visible');
      cy.focused().should('have.css', 'outline-style').and('not.eq', 'none');
      
      // Press tab to move to next item
      cy.realPress('Tab');
    });
  });

  it('signup form should be accessible', () => {
    cy.visit('/register');
    cy.injectAxe();
    
    // Check form accessibility
    cy.checkA11y('form', {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
    
    // Check that form inputs have proper labels
    cy.get('form input, form select, form textarea').each($el => {
      // Each input should have an associated label or aria-label
      const hasLabel = $el.attr('id') && 
        cy.$$(`label[for="${$el.attr('id')}"]`).length > 0;
      
      const hasAriaLabel = $el.attr('aria-label') || 
        $el.attr('aria-labelledby');
      
      expect(hasLabel || hasAriaLabel).to.be.true;
    });
  });

  it('pickup scheduling flow should be accessible', () => {
    cy.visit('/schedule-pickup');
    cy.injectAxe();
    
    // Test step 1 accessibility
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
    
    // Fill out step 1 and proceed
    cy.get('input[name="address"]').type('123 Test St');
    cy.get('select[name="material"]').select('Plastic');
    cy.get('input[name="weight"]').type('5');
    cy.get('button[data-test="next-step"]').click();
    
    // Test step 2 accessibility
    cy.get('[data-test="date-picker"]').should('be.visible');
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
    
    // Test calendar keyboard accessibility
    cy.get('[data-test="date-picker"]').focus();
    cy.focused().realPress('Enter');
    cy.get('[data-test="calendar-day"]').should('be.visible');
    
    // Test if we can navigate calendar with keyboard
    cy.focused().realPress('ArrowRight');
    cy.focused().realPress('ArrowRight');
    cy.focused().realPress('Enter');
    
    // Continue to next step
    cy.get('select[name="time-slot"]').select('Morning (8am - 12pm)');
    cy.get('button[data-test="next-step"]').click();
    
    // Test final step accessibility
    cy.contains('Review Your Pickup Request').should('be.visible');
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
  });

  it('dashboard should be accessible', () => {
    // Login first if needed
    cy.login('testuser', 'password');
    
    // Go to dashboard
    cy.visit('/dashboard');
    cy.injectAxe();
    
    // Run accessibility checks on dashboard
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      },
      // Exclude certain elements if needed
      exclude: ['.recharts-wrapper'] // Exclude charts which may have false positives
    });
    
    // Check specific dashboard components
    cy.checkA11y('.dashboard-cards', {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
    
    // Check data tables for accessibility
    cy.checkA11y('.data-table', {
      rules: {
        'table-fake-caption': { enabled: false }, // Disable specific rule if needed
        'td-has-header': { enabled: true }
      }
    });
  });

  it('color contrast meets WCAG standards', () => {
    // Check critical UI components for contrast issues
    cy.checkA11y('header, footer, .hero-section, .cta-button', {
      runOnly: {
        type: 'rule',
        values: ['color-contrast']
      }
    });
    
    // Check buttons specifically
    cy.get('button, a.button').each(($button) => {
      // Get background and text colors
      cy.wrap($button).then($el => {
        const bgColor = window.getComputedStyle($el[0]).backgroundColor;
        const textColor = window.getComputedStyle($el[0]).color;
        
        // Log colors for visual inspection
        cy.task('log', `Button colors - BG: ${bgColor}, Text: ${textColor}`);
      });
      
      // Check individual button
      cy.wrap($button).checkA11y({
        runOnly: {
          type: 'rule',
          values: ['color-contrast']
        }
      });
    });
  });

  it('images have appropriate alt text', () => {
    // Visit pages with images
    cy.visit('/');
    
    // Check all images have alt text
    cy.get('img').each($img => {
      const hasAlt = $img.attr('alt') !== undefined;
      const isDecorative = $img.attr('role') === 'presentation' || $img.attr('aria-hidden') === 'true';
      
      // Images should either have alt text or be marked as decorative
      expect(hasAlt || isDecorative).to.be.true;
      
      if (hasAlt && !isDecorative) {
        // Alt text should not contain "image of" or similar phrases
        const altText = $img.attr('alt');
        expect(altText).to.not.match(/^image of|picture of|photo of/i);
      }
    });
    
    // Check SVG images for accessibility
    cy.get('svg').each($svg => {
      const hasTitle = $svg.find('title').length > 0;
      const hasAriaLabel = $svg.attr('aria-label') !== undefined;
      const isDecorative = $svg.attr('role') === 'presentation' || $svg.attr('aria-hidden') === 'true';
      
      // SVGs should have title, aria-label, or be marked as decorative
      expect(hasTitle || hasAriaLabel || isDecorative).to.be.true;
    });
  });

  it('mobile view is accessible', () => {
    // Test in mobile viewport
    cy.viewport('iphone-x');
    cy.injectAxe();
    
    // Check mobile nav menu
    cy.get('.mobile-menu-button').should('be.visible').click();
    cy.get('.mobile-menu').should('be.visible');
    
    // Check mobile menu accessibility
    cy.checkA11y('.mobile-menu', {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
    
    // Check if mobile menu is keyboard accessible
    cy.get('.mobile-menu a').first().focus();
    cy.realPress('Tab');
    cy.focused().should('be.visible');
    
    // Close mobile menu
    cy.get('.mobile-menu-close').click();
    
    // Check general mobile accessibility
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
  });
});