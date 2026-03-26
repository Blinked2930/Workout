/// <reference types="cypress" />

describe('Authentication', () => {
  beforeEach(() => {
    // Clear any existing session data
    cy.clearLocalStorage();
    cy.visit('/');
  });

  it('should redirect unauthenticated user to login page', () => {
    // When not logged in, should be redirected to /login
    cy.url().should('include', '/login');
    
    // Login page should be visible
    cy.findByRole('heading', { name: /sign in/i }).should('be.visible');
    cy.findByRole('button', { name: /sign in with google/i }).should('be.visible');
  });

  it('should allow user to log in', () => {
    // Mock successful Google sign-in
    cy.window().then((win) => {
      win.firebase = {
        auth: () => ({
          signInWithPopup: () => Promise.resolve({
            user: {
              uid: 'test-uid',
              email: 'test@example.com',
              displayName: 'Test User',
              emailVerified: true,
              photoURL: null,
            },
          }),
          currentUser: {
            getIdToken: () => Promise.resolve('test-token'),
          },
          onAuthStateChanged: (callback: (user: any) => void) => {
            callback({
              uid: 'test-uid',
              email: 'test@example.com',
              displayName: 'Test User',
              emailVerified: true,
              photoURL: null,
            });
            return () => {}; // Return unsubscribe function
          },
        }),
      };
    });

    // Intercept Firebase auth requests
    cy.intercept('POST', '**/identitytoolkit.googleapis.com/**', {
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        idToken: 'test-token',
        registered: true,
        refreshToken: 'test-refresh-token',
        expiresIn: '3600',
      },
    }).as('signInWithGoogle');

    // Click the sign-in button
    cy.findByRole('button', { name: /sign in with google/i }).click();

    // Should be redirected to home page after successful login
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    
    // User menu should be visible
    cy.findByRole('button', { name: /account of current user/i }).should('be.visible');
  });

  it('should allow user to log out', () => {
    // First log in
    cy.login();
    cy.visit('/');
    
    // Open user menu
    cy.findByRole('button', { name: /account of current user/i }).click();
    
    // Click sign out
    cy.findByRole('menuitem', { name: /sign out/i }).click();
    
    // Should be redirected to login page
    cy.url().should('include', '/login');
    
    // Login button should be visible
    cy.findByRole('button', { name: /sign in with google/i }).should('be.visible');
  });

  it('should protect authenticated routes', () => {
    // Try to access a protected route
    cy.visit('/settings');
    
    // Should be redirected to login page
    cy.url().should('include', '/login');
    
    // Login
    cy.login();
    
    // Try again after login
    cy.visit('/settings');
    
    // Should be able to access the route
    cy.url().should('include', '/settings');
    cy.findByRole('heading', { name: /settings/i }).should('be.visible');
  });
});
