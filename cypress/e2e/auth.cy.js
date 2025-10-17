describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should allow a user to register', () => {
    // Get a unique email for this test
    const uniqueEmail = `user_${Date.now()}@example.com`;
    
    cy.visit('/register');
    cy.get('[data-testid="name-input"]').type('Test User');
    cy.get('[data-testid="email-input"]').type(uniqueEmail);
    cy.get('[data-testid="password-input"]').type('securepassword');
    cy.get('[data-testid="confirm-password-input"]').type('securepassword');
    cy.get('[data-testid="register-button"]').click();
    
    // Should redirect to login page after successful registration
    cy.url().should('include', '/login');
    cy.contains('Registration successful').should('exist');
  });

  it('should allow a user to login', () => {
    cy.fixture('users').then((users) => {
      const testUser = users.user;

      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="login-button"]').click();
      
      // Should redirect to dashboard after login
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-greeting"]').should('exist');
    });
  });

  it('should show an error message with invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    
    // Should stay on login page and show error
    cy.url().should('include', '/login');
    cy.contains('Invalid email or password').should('exist');
  });

  it('should allow a user to logout', () => {
    // First login
    cy.fixture('users').then((users) => {
      const testUser = users.user;
      cy.login(testUser.email, testUser.password);
      
      // Then verify logout works
      cy.visit('/dashboard');
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to login page after logout
      cy.url().should('include', '/login');
      
      // Verify we're actually logged out by trying to access dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/login'); // Should redirect back to login
    });
  });
});