/// <reference types="cypress" />

describe('Full Workout Log', () => {
  beforeEach(() => {
    // Clear any existing data and log in
    cy.clearLocalStorage();
    cy.login();
    cy.visit('/');
    
    // Mock Firestore responses
    cy.fixture('exercises.json').then((exercises) => {
      cy.intercept('GET', '**/exercises**', { body: exercises }).as('getExercises');
    });
    
    cy.fixture('categories.json').then((categories) => {
      cy.intercept('GET', '**/categories**', { body: categories }).as('getCategories');
    });
    
    // Mock successful save
    cy.intercept('POST', '**/lifts**', { statusCode: 200, body: { id: 'new-lift-id' } }).as('saveLift');
  });

  it('should allow a user to log a complete workout', () => {
    // Start a new workout
    cy.findByRole('button', { name: /add lift/i }).click();
    
    // Fill in exercise details
    cy.findByLabelText(/exercise/i).click();
    cy.findByRole('option', { name: /bench press/i }).click();
    
    // Fill in set details
    cy.findByLabelText(/weight/i).clear().type('135');
    cy.findByLabelText(/reps/i).clear().type('10');
    cy.findByLabelText(/sets/i).clear().type('3');
    
    // Add notes
    const notes = 'Felt strong today';
    cy.findByLabelText(/notes/i).type(notes);
    
    // Save the lift
    cy.findByRole('button', { name: /save/i }).click();
    
    // Verify the lift was saved
    cy.wait('@saveLift').then((interception) => {
      expect(interception.request.body).to.include({
        weight: 135,
        reps: 10,
        sets: 3,
        notes,
      });
    });
    
    // Should show success message
    cy.findByRole('alert').should('contain', 'Lift saved successfully');
    
    // Should be redirected to home or lift list
    cy.url().should('match', /\/|\/lifts/);
    
    // The new lift should be visible in the list
    cy.findByText(/bench press/i).should('be.visible');
    cy.findByText(/135 lbs/i).should('be.visible');
    cy.findByText(/3x10/i).should('be.visible');
  });

  it('should show validation errors for incomplete forms', () => {
    cy.findByRole('button', { name: /add lift/i }).click();
    
    // Try to save without filling in required fields
    cy.findByRole('button', { name: /save/i }).click();
    
    // Should show validation errors
    cy.findAllByText(/required/i).should('have.length.at.least', 1);
    
    // Fill in just the exercise
    cy.findByLabelText(/exercise/i).click();
    cy.findByRole('option', { name: /squat/i }).click();
    
    // Should still show validation errors for other required fields
    cy.findByRole('button', { name: /save/i }).click();
    cy.findAllByText(/required/i).should('have.length.at.least', 1);
  });

  it('should allow editing an existing lift', () => {
    // First create a lift to edit
    const initialWeight = '135';
    const updatedWeight = '155';
    
    // Mock the GET request for the lift details
    cy.fixture('lift.json').then((lift) => {
      lift.weight = parseInt(initialWeight);
      cy.intercept('GET', '**/lifts/**', { body: lift }).as('getLift');
    });
    
    // Mock the update request
    cy.intercept('PATCH', '**/lifts/**', { statusCode: 200 }).as('updateLift');
    
    // Go to the lift detail page (assuming we have a lift with ID 'test-lift')
    cy.visit('/lifts/test-lift');
    
    // Wait for the lift data to load
    cy.wait('@getLift');
    
    // Click edit button
    cy.findByRole('button', { name: /edit/i }).click();
    
    // Update the weight
    cy.findByLabelText(/weight/i).clear().type(updatedWeight);
    
    // Save the changes
    cy.findByRole('button', { name: /save/i }).click();
    
    // Verify the update request was made with the correct data
    cy.wait('@updateLift').then((interception) => {
      expect(interception.request.body).to.include({
        weight: parseInt(updatedWeight),
      });
    });
    
    // Should show success message
    cy.findByRole('alert').should('contain', 'Lift updated successfully');
  });
});
