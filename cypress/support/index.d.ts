/// <reference types="cypress" />
/// <reference types="@testing-library/cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to log in a test user
     * @example cy.login()
     */
    login(): Chainable<void>;

    /**
     * Custom command to log out the current user
     * @example cy.logout()
     */
    logout(): Chainable<void>;

    /**
     * Custom command to simulate going offline
     * @example cy.goOffline()
     */
    goOffline(): Chainable<void>;

    /**
     * Custom command to simulate coming back online
     * @example cy.goOnline()
     */
    goOnline(): Chainable<void>;
  }
}
