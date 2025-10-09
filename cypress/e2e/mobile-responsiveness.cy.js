// mobile-responsiveness.cy.js - Tests for responsive design on mobile devices

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Login before each test
    cy.fixture('users').then((users) => {
      cy.apiLogin(users.user.email, users.user.password);
    });
  });
  
  const mobileViewports = [
    { width: 375, height: 667, device: 'iPhone SE' },
    { width: 414, height: 896, device: 'iPhone XR' },
    { width: 360, height: 740, device: 'Android (medium)' }
  ];
  
  const tabletViewports = [
    { width: 768, height: 1024, device: 'iPad' },
    { width: 820, height: 1180, device: 'iPad Air' }
  ];
  
  mobileViewports.forEach((viewport) => {
    describe(`Mobile viewport: ${viewport.device} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        // Set viewport to mobile dimensions
        cy.viewport(viewport.width, viewport.height);
      });
      
      it('should show mobile navigation menu', () => {
        // 1. Visit dashboard
        cy.visit('/dashboard');
        
        // 2. Verify desktop navigation is hidden
        cy.get('[data-testid="desktop-nav"]').should('not.be.visible');
        
        // 3. Verify mobile burger menu is visible
        cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
        
        // 4. Click burger menu
        cy.get('[data-testid="mobile-menu-button"]').click();
        
        // 5. Verify mobile navigation appears
        cy.get('[data-testid="mobile-nav"]').should('be.visible');
        
        // 6. Verify navigation links are present
        cy.get('[data-testid="mobile-nav"]').within(() => {
          cy.contains('Dashboard').should('be.visible');
          cy.contains('Pickups').should('be.visible');
          cy.contains('Rewards').should('be.visible');
        });
      });
      
      it('should have properly sized elements on pickup form', () => {
        // 1. Visit pickup scheduling page
        cy.visit('/schedule-pickup');
        
        // 2. Verify form controls are properly sized for mobile
        cy.get('[data-testid="pickup-address"]')
          .should('be.visible')
          .invoke('outerWidth')
          .should('be.lt', viewport.width);
          
        // 3. Verify date picker is usable on mobile
        cy.get('[data-testid="pickup-date"]')
          .should('be.visible')
          .click();
          
        // 4. Calendar should appear and be usable
        cy.get('.calendar-container, .datepicker-container, [data-testid="date-picker-container"]')
          .should('be.visible')
          .invoke('outerWidth')
          .should('be.lte', viewport.width);
      });
      
      it('should stack cards on dashboard in mobile view', () => {
        // 1. Visit dashboard
        cy.visit('/dashboard');
        
        // 2. Get the dashboard cards
        cy.get('[data-testid="dashboard-card"]').then($cards => {
          // 3. Get the first two cards and compare their positions
          if ($cards.length >= 2) {
            const firstCardRect = $cards[0].getBoundingClientRect();
            const secondCardRect = $cards[1].getBoundingClientRect();
            
            // In mobile view, cards should stack vertically, not side by side
            expect(Math.abs(firstCardRect.left - secondCardRect.left)).to.be.lessThan(20);
            expect(secondCardRect.top).to.be.gt(firstCardRect.bottom);
          }
        });
      });
    });
  });
  
  tabletViewports.forEach((viewport) => {
    describe(`Tablet viewport: ${viewport.device} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        // Set viewport to tablet dimensions
        cy.viewport(viewport.width, viewport.height);
      });
      
      it('should show tablet-appropriate layout', () => {
        // 1. Visit dashboard
        cy.visit('/dashboard');
        
        // 2. Verify navigation is appropriate for tablet
        // (On tablets we often show a simplified desktop nav, not the mobile burger)
        cy.get('[data-testid="tablet-nav"], [data-testid="desktop-nav"]')
          .should('be.visible');
          
        // 3. Tablet typically shows fewer items side by side than desktop
        cy.get('[data-testid="dashboard-card"]').then($cards => {
          if ($cards.length >= 3) {
            const cardsPerRow = Math.floor(viewport.width / $cards.eq(0).outerWidth());
            // Expect 2 cards per row on typical tablets
            expect(cardsPerRow).to.be.within(1, 2);
          }
        });
      });
      
      it('should have appropriate font sizes', () => {
        // 1. Visit rewards page
        cy.visit('/rewards');
        
        // 2. Check heading font size is appropriate
        cy.get('h1').invoke('css', 'font-size').then(fontSize => {
          const sizeInPx = parseInt(fontSize);
          // Expect tablet heading to be between 24-32px typically
          expect(sizeInPx).to.be.within(24, 32);
        });
      });
    });
  });
  
  it('should have appropriate meta viewport tag', () => {
    cy.visit('/');
    
    // Check for proper responsive meta tag
    cy.document().then(doc => {
      const viewport = doc.querySelector('meta[name="viewport"]');
      expect(viewport).to.exist;
      expect(viewport.getAttribute('content')).to.include('width=device-width');
      expect(viewport.getAttribute('content')).to.include('initial-scale=1');
    });
  });
  
  it('should use responsive images', () => {
    cy.visit('/rewards');
    
    // Check if images have srcset or sizes attributes for responsiveness
    cy.get('img').then($imgs => {
      // At least some images should be responsive
      let responsiveImagesFound = false;
      
      $imgs.each((i, img) => {
        if (img.hasAttribute('srcset') || 
            img.hasAttribute('sizes') || 
            img.src.includes('responsive')) {
          responsiveImagesFound = true;
        }
      });
      
      expect(responsiveImagesFound).to.be.true;
    });
  });
});