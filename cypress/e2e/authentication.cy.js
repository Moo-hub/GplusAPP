// authentication.cy.js - Tests for authentication flows

describe('Authentication Flows', () => {
  beforeEach(() => {
    // Clear local storage before each test
    cy.clearLocalStorage();
  });
  
  const testUser = {
    name: `Test User ${Date.now()}`,
    email: `test_user_${Date.now()}@example.com`,
    password: 'SecurePass123!'
  };
  
  it('should register a new user successfully', () => {
    // 1. Visit registration page
    cy.visit('/register');
    
    // 2. Fill registration form
    cy.get('[data-testid="name-input"]').type(testUser.name);
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="confirm-password-input"]').type(testUser.password);
    
    // 3. Accept terms
    cy.get('[data-testid="terms-checkbox"]').check();
    
    // 4. Submit form
    cy.get('[data-testid="register-button"]').click();
    
    // 5. Verify success and redirect to login
    cy.contains('Registration successful').should('be.visible');
    cy.url().should('include', '/login');
  });
  
  it('should login with newly registered user', () => {
    // 1. Visit login page
    cy.visit('/login');
    
    // 2. Fill login form
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    
    // 3. Submit form
    cy.get('[data-testid="login-button"]').click();
    
    // 4. Verify successful login and redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // 5. Verify user greeting shows correct name
    cy.get('[data-testid="user-greeting"]')
      .should('be.visible')
      .and('contain', testUser.name);
  });
  
  it('should handle invalid login attempts', () => {
    // 1. Visit login page
    cy.visit('/login');
    
    // 2. Try invalid email
    cy.get('[data-testid="email-input"]').type('invalid@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    
    // 3. Verify error message
    cy.contains('Invalid email or password').should('be.visible');
    
    // 4. Try valid email with wrong password
    cy.get('[data-testid="email-input"]').clear().type(testUser.email);
    cy.get('[data-testid="password-input"]').clear().type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();
    
    // 5. Verify error message
    cy.contains('Invalid email or password').should('be.visible');
  });
  
  it('should enforce password requirements on registration', () => {
    cy.visit('/register');
    
    const weakUser = {
      name: 'Weak Password User',
      email: `weak_user_${Date.now()}@example.com`,
      password: 'weak'
    };
    
    // Fill form with weak password
    cy.get('[data-testid="name-input"]').type(weakUser.name);
    cy.get('[data-testid="email-input"]').type(weakUser.email);
    cy.get('[data-testid="password-input"]').type(weakUser.password);
    cy.get('[data-testid="confirm-password-input"]').type(weakUser.password);
    cy.get('[data-testid="terms-checkbox"]').check();
    
    // Try to submit
    cy.get('[data-testid="register-button"]').click();
    
    // Verify password requirements error
    cy.contains('Password must be at least 8 characters').should('be.visible');
    
    // Try slightly better password but still missing requirements
    cy.get('[data-testid="password-input"]').clear().type('password123');
    cy.get('[data-testid="confirm-password-input"]').clear().type('password123');
    cy.get('[data-testid="register-button"]').click();
    
    // Check for capital letter requirement
    cy.contains('Password must contain at least one uppercase letter').should('be.visible');
  });
  
  it('should handle password reset flow', () => {
    // 1. Visit login page
    cy.visit('/login');
    
    // 2. Click forgot password link
    cy.contains('Forgot password').click();
    
    // 3. Verify redirect to password reset page
    cy.url().should('include', '/reset-password');
    
    // 4. Enter email for password reset
    cy.get('[data-testid="email-input"]').type(testUser.email);
    
    // 5. Submit form
    cy.get('[data-testid="reset-password-button"]').click();
    
    // 6. Verify success message
    cy.contains('Password reset email sent').should('be.visible');
    
    // Note: We can't actually test the email link clicking since that would require
    // accessing an actual email. In a real test environment, we would use a test
    // email service with API access.
  });
  
  it('should logout successfully', () => {
    // 1. Login first
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="login-button"]').click();
    
    // 2. Verify successful login
    cy.url().should('include', '/dashboard');
    
    // 3. Click user menu
    cy.get('[data-testid="user-menu"]').click();
    
    // 4. Click logout
    cy.get('[data-testid="logout-button"]').click();
    
    // 5. Verify redirect to login page
    cy.url().should('include', '/login');
    
    // 6. Verify we are actually logged out by trying to access a protected route
    cy.visit('/dashboard');
    
    // 7. Should redirect back to login
    cy.url().should('include', '/login');
  });
  
  it('should maintain authentication across page reloads', () => {
    // 1. Login
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="login-button"]').click();
    
    // 2. Verify login success
    cy.url().should('include', '/dashboard');
    
    // 3. Reload page
    cy.reload();
    
    // 4. Verify still logged in (not redirected to login)
    cy.url().should('include', '/dashboard');
    
    // 5. Check if user info is still displayed
    cy.get('[data-testid="user-greeting"]').should('be.visible');
  });
});