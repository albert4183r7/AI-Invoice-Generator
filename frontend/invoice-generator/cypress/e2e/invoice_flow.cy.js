describe('Invoice Lifecycle Flow', () => {
  const uniqueEmail = `e2e_user_${Date.now()}@example.com`;
  const clientName = `Client ${Date.now()}`;
  const expectedAmount = '550.00'; 
  const EXTENDED_TIMEOUT = 20000;
  const UI_DELAY = 1000;

  const login = () => {
    cy.session(uniqueEmail, () => {
      cy.visit('http://localhost:5173/signup');
      cy.get('input[name="name"]').type('Invoice Tester');
      cy.get('input[name="email"]').type(uniqueEmail);
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('input[type="checkbox"]').check();
      cy.get('button').contains('Create Account').click();
      cy.url({ timeout: EXTENDED_TIMEOUT }).should('include', '/dashboard');
    }, {
      validate: () => {
        cy.window().then((win) => {
            const token = win.localStorage.getItem('token');
            expect(token).to.be.a('string');
        });
      }
    });
  };

  beforeEach(() => {
    login();
  });

  it('should verify dashboard stats update correctly throughout the invoice lifecycle', () => {
    cy.intercept('POST', '**/api/invoices').as('createInvoice');
    cy.intercept('GET', '**/api/invoices').as('getInvoices');
    cy.intercept('PUT', '**/api/invoices/*').as('updateInvoice');
    cy.intercept('DELETE', '**/api/invoices/*').as('deleteInvoice');
    
    // Mock AI Response for Reminder
    cy.intercept('POST', '**/api/ai/generate-reminder', {
        statusCode: 200,
        body: { 
            reminderText: "Dear Client, please pay your invoice.", 
            clientEmail: "client@test.com" 
        }
    }).as('generateReminder');

    // --- 1. Initial Dashboard Check ---
    cy.visit('http://localhost:5173/dashboard');
    cy.contains('h2', 'Dashboard').should('be.visible');
    cy.contains('No invoices yet').scrollIntoView({ offset: { top: -100, left: 0 } }).should('be.visible');
    cy.contains('div', 'Total Invoices').parent().contains('0').should('exist'); 
    
    // --- 2. Create Invoice ---
    cy.visit('http://localhost:5173/invoices/new');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    cy.get('input[name="dueDate"]').type(dateString);

    cy.contains('h3', 'Bill To').parent().within(() => {
        cy.get('input[name="clientName"]').type(clientName);
        cy.get('input[name="email"]').type('client@test.com');
    });
    
    cy.get('input[name="name"]').type('Web Design');
    cy.get('input[name="quantity"]').clear().type('10');
    cy.get('input[name="unitPrice"]').clear().type('50'); 
    cy.get('input[name="taxPercent"]').clear().type('10'); 
    
    cy.get('button').contains('Save Invoice').click();
    cy.wait('@createInvoice', { timeout: EXTENDED_TIMEOUT }).its('response.statusCode').should('eq', 201);
    
    cy.wait(UI_DELAY);

    // --- 3. Verify Dashboard AFTER Creation ---
    cy.visit('http://localhost:5173/dashboard');
    cy.wait('@getInvoices', { timeout: EXTENDED_TIMEOUT });

    cy.contains('div', 'Total Invoices').scrollIntoView().parent().contains('1').should('exist');
    cy.contains('div', 'Total Unpaid').parent().contains(expectedAmount).should('exist');

    cy.contains('h3', 'Recent Invoices').scrollIntoView().should('be.visible');
    cy.contains('h3', 'Recent Invoices').parents('.bg-white').first().within(() => {
        cy.get('.overflow-x-auto').scrollIntoView(); 
        cy.contains(clientName, { timeout: EXTENDED_TIMEOUT }).should('exist');
        cy.contains('$' + expectedAmount).should('exist');
    });
    
    cy.wait(UI_DELAY);

    // --- 4. Test Reminder Email Modal (NEW STEP) ---
    // Navigate to All Invoices where the actions are
    cy.visit('http://localhost:5173/invoices');
    cy.wait('@getInvoices', { timeout: EXTENDED_TIMEOUT });

    // Find our client row
    cy.contains('tr', clientName).within(() => {
        // Click the "Generate Reminder" button (Mail icon)
        // We use [title="Generate Reminder"] as a specific selector
        cy.get('button[title="Generate Reminder"]').click();
    });

    // Verify Modal Opens
    cy.contains('AI-Generated Reminder').should('be.visible');
    
    // Wait for Mocked AI Response
    cy.wait('@generateReminder');

    // Verify Content
    cy.get('textarea[name="reminderText"]').should('have.value', "Dear Client, please pay your invoice.");
    
    // Verify Actions
    cy.get('button').contains('Send via Email').should('not.be.disabled');
    cy.get('button').contains('Copy').should('not.be.disabled');

    // Close Modal
    cy.get('button').contains('Close').click();
    cy.contains('AI-Generated Reminder').should('not.exist');

    cy.wait(UI_DELAY);

    // --- 5. Update Status to Paid ---
    cy.contains('tr', clientName).within(() => {
        cy.get('button').contains('Mark Paid').click();
    });
    cy.wait('@updateInvoice', { timeout: EXTENDED_TIMEOUT }).its('response.statusCode').should('eq', 200);
    
    cy.wait(UI_DELAY);

    // --- 6. Verify Dashboard AFTER Payment ---
    cy.visit('http://localhost:5173/dashboard');
    cy.wait('@getInvoices', { timeout: EXTENDED_TIMEOUT });

    cy.contains('div', 'Total Invoices').scrollIntoView().parent().contains('1').should('exist');
    cy.contains('div', 'Total Paid').parent().contains(expectedAmount).should('exist'); 

    // Verify List Status Updated
    cy.contains('h3', 'Recent Invoices').parents('.bg-white').first().within(() => {
        cy.contains(clientName, { timeout: EXTENDED_TIMEOUT }).should('exist');
        cy.contains('Paid').should('exist');
    });
    
    cy.wait(UI_DELAY);

    // --- 7. Cleanup ---
    cy.visit('http://localhost:5173/invoices');
    cy.wait('@getInvoices', { timeout: EXTENDED_TIMEOUT });

    cy.contains('tr', clientName).within(() => {
        cy.get('button:has(svg.text-red-500)').click({ force: true });
    });
    cy.on('window:confirm', () => true);
    cy.wait('@deleteInvoice', { timeout: EXTENDED_TIMEOUT }).its('response.statusCode').should('eq', 200);
    
    cy.wait(UI_DELAY);

    // --- 8. Final Dashboard Verification ---
    cy.visit('http://localhost:5173/dashboard');
    cy.wait('@getInvoices', { timeout: EXTENDED_TIMEOUT });
    
    cy.contains('div', 'Total Invoices', { timeout: EXTENDED_TIMEOUT }).parent().contains('0').should('exist');
    cy.contains('No invoices yet').should('exist');
  });
});