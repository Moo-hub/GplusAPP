describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.fixture('users').then((users) => {
      // Login as admin before each test
      cy.login(users.admin.email, users.admin.password);
      cy.visit('/admin');
    });
  });

  it('should display the admin dashboard with all sections', () => {
    // Verify admin dashboard components are visible
    cy.get('[data-testid="admin-dashboard"]').should('exist');
    cy.get('[data-testid="user-management"]').should('exist');
    cy.get('[data-testid="company-management"]').should('exist');
    cy.get('[data-testid="pickup-management"]').should('exist');
    cy.get('[data-testid="system-stats"]').should('exist');
  });

  it('should allow admin to view and search users', () => {
    cy.get('[data-testid="user-management-tab"]').click();
    
    // Verify user list is displayed
    cy.get('[data-testid="users-table"]').should('exist');
    
    // Test search functionality
    cy.get('[data-testid="user-search"]').type('user@example.com');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="users-table"]').should('contain', 'user@example.com');
  });

  it('should allow admin to create a new user', () => {
    cy.get('[data-testid="user-management-tab"]').click();
    cy.get('[data-testid="create-user-button"]').click();
    
    // Fill out new user form
    const uniqueEmail = `newuser_${Date.now()}@example.com`;
    cy.get('[data-testid="new-user-name"]').type('New Test User');
    cy.get('[data-testid="new-user-email"]').type(uniqueEmail);
    cy.get('[data-testid="new-user-password"]').type('newuserpassword');
    cy.get('[data-testid="new-user-role"]').select('user');
    
    // Submit form
    cy.get('[data-testid="submit-user-button"]').click();
    
    // Verify success message
    cy.contains('User created successfully').should('exist');
    
    // Verify new user appears in the list
    cy.get('[data-testid="user-search"]').type(uniqueEmail);
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="users-table"]').should('contain', uniqueEmail);
  });

  it('should allow admin to view companies', () => {
    cy.get('[data-testid="company-management-tab"]').click();
    
    // Verify company list is displayed
    cy.get('[data-testid="companies-table"]').should('exist');
  });

  it('should allow admin to manage pickups', () => {
    cy.get('[data-testid="pickup-management-tab"]').click();
    
    // Verify pickup list is displayed
    cy.get('[data-testid="pickups-table"]').should('exist');
    
    // Test filter functionality
    cy.get('[data-testid="status-filter"]').select('SCHEDULED');
    cy.get('[data-testid="filter-button"]').click();
    
    // Verify filtered results
    cy.get('[data-testid="pickups-table"]').should('contain', 'SCHEDULED');
  });

  it('should display system statistics', () => {
    cy.get('[data-testid="system-stats-tab"]').click();
    
    // Verify stats components are displayed
    cy.get('[data-testid="users-count"]').should('exist');
    cy.get('[data-testid="companies-count"]').should('exist');
    cy.get('[data-testid="pickups-count"]').should('exist');
    cy.get('[data-testid="stats-chart"]').should('exist');
  });
});