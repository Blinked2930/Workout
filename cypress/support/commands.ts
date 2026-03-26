// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

// Add testing library commands
import '@testing-library/cypress/add-commands';

// Custom command to log in with test user
Cypress.Commands.add('login', () => {
  // Mock Firebase auth state
  const user = {
    uid: 'test-uid',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    photoURL: null,
  };
  
  // Set auth state in localStorage to simulate login
  window.localStorage.setItem('firebase:authUser:AIzaSyDz0lHhfhx8WXc5Z6X1X8XzX8XzX8XzX8', JSON.stringify(user));
  
  // Set auth state in Redux store if you're using it
  // cy.window().its('store').invoke('dispatch', { type: 'LOGIN_SUCCESS', payload: { user } });
  
  // Set auth state in context if you're using React Context
  // cy.window().then((win) => {
  //   win.__setAuthState(user);
  // });
});

// Custom command to log out
Cypress.Commands.add('logout', () => {
  // Clear auth state from localStorage
  window.localStorage.removeItem('firebase:authUser:AIzaSyDz0lHhfhx8WXc5Z6X1X8XzX8XzX8XzX8');
  
  // Clear auth state in Redux store if you're using it
  // cy.window().its('store').invoke('dispatch', { type: 'LOGOUT' });
  
  // Clear auth state in context if you're using React Context
  // cy.window().then((win) => {
  //   win.__setAuthState(null);
  // });
});

// Custom command to go offline
Cypress.Commands.add('goOffline', () => {
  cy.log('**go offline**')
    .then(() => {
      return Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.enable',
        });
    })
    .then(() => {
      return Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.emulateNetworkConditions',
          params: {
            offline: true,
            latency: -1,
            downloadThroughput: -1,
            uploadThroughput: -1,
          },
        });
    });
});

// Custom command to go online
Cypress.Commands.add('goOnline', () => {
  cy.log('**go online**')
    .then(() => {
      return Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.enable',
        });
    })
    .then(() => {
      return Cypress.automation('remote:debugger:protocol',
        {
          command: 'Network.emulateNetworkConditions',
          params: {
            offline: false,
            latency: -1,
            downloadThroughput: -1,
            uploadThroughput: -1,
          },
        });
    });
});
