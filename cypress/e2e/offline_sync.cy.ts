/// <reference types="cypress" />

describe('Offline Sync', () => {
  const testLift = {
    id: 'offline-lift-1',
    exerciseId: 'exercise-1',
    exerciseName: 'Bench Press',
    weight: 135,
    reps: 10,
    sets: 3,
    date: new Date().toISOString(),
    notes: 'Offline test lift',
  };

  beforeEach(() => {
    // Clear any existing data and log in
    cy.clearLocalStorage();
    cy.login();
    
    // Start with a clean state
    cy.window().then((win) => {
      if (win.indexedDB) {
        // Clear IndexedDB
        const req = win.indexedDB.deleteDatabase('LiftLogDB');
        req.onsuccess = () => {
          cy.log('IndexedDB cleared');
        };
        req.onerror = () => {
          cy.log('Error clearing IndexedDB');
        };
      }
    });
    
    // Mock Firestore responses
    cy.fixture('exercises.json').then((exercises) => {
      cy.intercept('GET', '**/exercises**', { body: exercises }).as('getExercises');
    });
    
    cy.fixture('categories.json').then((categories) => {
      cy.intercept('GET', '**/categories**', { body: categories }).as('getCategories');
    });
    
    // Mock successful save (but don't respond yet)
    cy.intercept('POST', '**/lifts**', {
      statusCode: 200,
      body: { id: 'new-offline-lift' },
      delay: 1000, // Add delay to simulate network latency
    }).as('saveLift');
    
    // Start the app
    cy.visit('/');
  });

  it('should queue operations when offline and sync when back online', () => {
    // Go offline before adding a lift
    cy.goOffline();
    
    // Add a new lift while offline
    cy.findByRole('button', { name: /add lift/i }).click();
    
    // Fill in the form
    cy.findByLabelText(/exercise/i).click();
    cy.findByRole('option', { name: /bench press/i }).click();
    cy.findByLabelText(/weight/i).clear().type(testLift.weight.toString());
    cy.findByLabelText(/reps/i).clear().type(testLift.reps.toString());
    cy.findByLabelText(/sets/i).clear().type(testLift.sets.toString());
    cy.findByLabelText(/notes/i).type(testLift.notes);
    
    // Save the lift (should be queued)
    cy.findByRole('button', { name: /save/i }).click();
    
    // Should show offline indicator
    cy.findByText(/offline/i).should('be.visible');
    
    // Should show queued status or similar
    cy.findByText(/queued/i).should('be.visible');
    
    // The lift should appear in the UI even though it's not synced yet
    cy.findByText(testLift.exerciseName).should('be.visible');
    
    // Go back online
    cy.goOnline();
    
    // Wait for the sync to complete
    cy.wait('@saveLift').then((interception) => {
      expect(interception.request.body).to.include({
        weight: testLift.weight,
        reps: testLift.reps,
        sets: testLift.sets,
        notes: testLift.notes,
      });
    });
    
    // Should show sync complete status
    cy.findByText(/synced/i).should('be.visible');
    
    // The lift should still be visible in the list
    cy.findByText(testLift.exerciseName).should('be.visible');
  });

  it('should handle conflicts when syncing', () => {
    // First, create a lift while online
    cy.findByRole('button', { name: /add lift/i }).click();
    
    // Fill in the form
    cy.findByLabelText(/exercise/i).click();
    cy.findByRole('option', { name: /squat/i }).click();
    cy.findByLabelText(/weight/i).clear().type('185');
    cy.findByLabelText(/reps/i).clear().type('5');
    cy.findByLabelText(/sets/i).clear().type('3');
    
    // Save the lift
    cy.findByRole('button', { name: /save/i }).click();
    
    // Wait for the save to complete
    cy.wait('@saveLift');
    
    // Go offline
    cy.goOffline();
    
    // Edit the lift while offline
    cy.findByText(/squat/i).click();
    cy.findByRole('button', { name: /edit/i }).click();
    
    // Update the weight
    cy.findByLabelText(/weight/i).clear().type('205');
    
    // Save the changes (will be queued)
    cy.findByRole('button', { name: /save/i }).click();
    
    // Mock a conflict - server has a newer version
    cy.intercept('PATCH', '**/lifts/**', {
      statusCode: 409, // Conflict
      body: {
        error: 'Document was updated by another user',
        serverVersion: {
          ...testLift,
          weight: 195, // Server has a different weight
          updatedAt: new Date().toISOString(),
        },
      },
    }).as('updateLift');
    
    // Go back online
    cy.goOnline();
    
    // Wait for the sync to attempt
    cy.wait('@updateLift');
    
    // Should show a conflict resolution dialog
    cy.findByRole('dialog').should('be.visible');
    cy.findByText(/conflict detected/i).should('be.visible');
    
    // Choose to keep local changes
    cy.findByRole('button', { name: /keep my changes/i }).click();
    
    // Should show that the sync is retrying
    cy.findByText(/retrying/i).should('be.visible');
    
    // Mock a successful update
    cy.intercept('PATCH', '**/lifts/**', {
      statusCode: 200,
      body: { id: testLift.id },
    }).as('retryUpdate');
    
    // Wait for the retry to complete
    cy.wait('@retryUpdate');
    
    // Should show sync complete status
    cy.findByText(/synced/i).should('be.visible');
  });

  it('should load data from cache when offline', () => {
    // First, load some data while online
    cy.visit('/');
    
    // Wait for initial data to load
    cy.wait(['@getExercises', '@getCategories']);
    
    // Go offline
    cy.goOffline();
    
    // Refresh the page
    cy.reload();
    
    // Should still be able to see the data from cache
    cy.findByText(/bench press/i).should('be.visible');
    cy.findByText(/squat/i).should('be.visible');
    
    // Should show offline indicator
    cy.findByText(/offline/i).should('be.visible');
  });
});
