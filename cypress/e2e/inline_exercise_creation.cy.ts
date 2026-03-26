/// <reference types="cypress" />

describe('Inline Exercise Creation', () => {
  const newExerciseName = 'Incline Dumbbell Press';
  
  beforeEach(() => {
    // Clear any existing data and log in
    cy.clearLocalStorage();
    
    // Mock Firebase auth state
    cy.login();
    
    // Mock Firestore responses
    cy.fixture('exercises.json').then((exercises) => {
      cy.intercept('GET', '**/exercises**', { body: exercises }).as('getExercises');
    });
    
    cy.fixture('categories.json').then((categories) => {
      cy.intercept('GET', '**/categories**', { body: categories }).as('getCategories');
    });
    
    // Mock successful exercise creation
    cy.intercept('POST', '**/exercises**', (req) => {
      const newExercise = {
        id: 'new-exercise-id',
        name: newExerciseName,
        subCategoryId: 'sub1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      req.reply({ statusCode: 200, body: newExercise });
    }).as('createExercise');
    
    // Mock successful lift creation
    cy.intercept('POST', '**/lifts**', {
      statusCode: 200,
      body: { id: 'new-lift-id' }
    }).as('saveLift');
    
    // Start the app
    cy.visit('/');
  });

  it('should allow creating a new exercise inline while logging a lift', () => {
    // Navigate to the lift logging page
    cy.findByRole('button', { name: /add lift/i }).click();
    
    // Type a new exercise name that doesn't exist
    const exerciseInput = cy.findByLabelText(/exercise/i);
    exerciseInput.type(newExerciseName);
    
    // Verify the "Create new" option appears
    cy.findByRole('option', { name: `Create "${newExerciseName}"` }).should('be.visible').click();
    
    // The category selection form should be visible
    cy.findByText(/select categories/i).should('be.visible');
    
    // Select main category
    cy.findByLabelText(/main category/i).click();
    cy.findByRole('option', { name: /weight training/i }).click();
    
    // Select sub-category
    cy.findByLabelText(/sub-category/i).click();
    cy.findByRole('option', { name: /chest/i }).click();
    
    // Submit the exercise creation form
    cy.findByRole('button', { name: /create exercise/i }).click();
    
    // Verify the exercise was created
    cy.wait('@createExercise').then((interception) => {
      expect(interception.request.body).to.include({
        name: newExerciseName,
        subCategoryId: 'sub1'
      });
    });
    
    // The exercise name should now be in the input
    cy.findByDisplayValue(newExerciseName).should('exist');
    
    // Fill in the rest of the lift details
    cy.findByLabelText(/weight/i).clear().type('65');
    cy.findByLabelText(/reps/i).clear().type('10');
    cy.findByLabelText(/sets/i).clear().type('3');
    
    // Save the lift
    cy.findByRole('button', { name: /save/i }).click();
    
    // Verify the lift was saved with the new exercise
    cy.wait('@saveLift').then((interception) => {
      expect(interception.request.body).to.include({
        exerciseId: 'new-exercise-id',
        weight: 65,
        reps: 10,
        sets: 3
      });
    });
    
    // Should show success message
    cy.findByRole('alert').should('contain', 'Lift saved successfully');
    
    // The new lift should appear in the history
    cy.findByText(newExerciseName).should('be.visible');
    cy.findByText(/65 lbs/i).should('be.visible');
    cy.findByText(/3x10/i).should('be.visible');
  });

  it('should show validation errors for missing category selections', () => {
    // Navigate to the lift logging page
    cy.findByRole('button', { name: /add lift/i }).click();
    
    // Type a new exercise name
    const exerciseInput = cy.findByLabelText(/exercise/i);
    exerciseInput.type(newExerciseName);
    
    // Select the create option
    cy.findByRole('option', { name: `Create "${newExerciseName}"` }).click();
    
    // Try to submit without selecting categories
    cy.findByRole('button', { name: /create exercise/i }).click();
    
    // Should show validation errors
    cy.findAllByText(/required/i).should('have.length.at.least', 1);
    
    // Select main category but not sub-category
    cy.findByLabelText(/main category/i).click();
    cy.findByRole('option', { name: /weight training/i }).click();
    
    // Should still show validation error for sub-category
    cy.findByRole('button', { name: /create exercise/i }).click();
    cy.findByText(/sub-category is required/i).should('be.visible');
  });

  it('should allow canceling exercise creation', () => {
    // Navigate to the lift logging page
    cy.findByRole('button', { name: /add lift/i }).click();
    
    // Type a new exercise name
    const exerciseInput = cy.findByLabelText(/exercise/i);
    exerciseInput.type(newExerciseName);
    
    // Select the create option
    cy.findByRole('option', { name: `Create "${newExerciseName}"` }).click();
    
    // Click cancel
    cy.findByRole('button', { name: /cancel/i }).click();
    
    // The exercise creation form should be hidden
    cy.findByText(/select categories/i).should('not.exist');
    
    // The input should be cleared
    cy.findByDisplayValue(newExerciseName).should('not.exist');
  });
});
