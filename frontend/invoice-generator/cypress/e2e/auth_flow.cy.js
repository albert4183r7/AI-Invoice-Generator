describe('Authentication Flow', () => {
  
  // Helper to generate unique emails for signup tests
  // This prevents "User already exists" errors when running tests multiple times
  const uniqueEmail = `testuser_${Date.now()}@example.com`;

  it('should allow a new user to sign up', () => {
    // 1. Visit the Signup page
    cy.visit('http://localhost:5173/signup');

    // 2. Fill out the registration form
    cy.get('input[name="name"]').type('Cypress Test User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');

    // 3. Check the terms and conditions (it's required)
    cy.get('input[type="checkbox"]').check();

    // 4. Submit the form
    cy.get('button').contains('Create Account').click();

    // 5. Assertion: Should redirect to Dashboard
    // We increase timeout because the backend might take a second to create the user
    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    // 6. Assertion: Verify the user's name is displayed on the dashboard
    cy.contains('Hello, Cypress Test User').should('be.visible');
    
    // 7. Logout to clean up state for next test
    cy.get('button').contains('Logout').click();
  });

  it('should allow an existing user to login', () => {
    // 1. Visit the login page
    cy.visit('http://localhost:5173/login');

    // 2. Find inputs and type data (using the user we just created or a seed user)
    // Note: In a real CI environment, you would seed the DB with this user before testing.
    // For now, we use the one we just created in the previous step if running sequentially,
    // but to be safe/independent, we'll use the one created above.
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('password123');

    // 3. Click the login button
    cy.get('button').contains('Sign in').click();

    // 4. Assertion: Check if URL changed to dashboard
    cy.url().should('include', '/dashboard');

    // 5. Assertion: Check if "Hello" text is visible
    cy.contains('Hello').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('http://localhost:5173/login');
    
    cy.get('input[name="email"]').type('wrong@email.com');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button').contains('Sign in').click();

    // Assertion: Error message should appear
    // Matches the error message from your Login.jsx component
    cy.contains(/Invalid email or password|User not found/i).should('be.visible');
  });
});