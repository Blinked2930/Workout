Project Blueprint: Lift Log PWA
This blueprint breaks the project into logical, iterative phases. Each phase builds upon the last, ensuring a stable foundation before adding complexity. The goal is to start with a non-networked, client-side application and then layer in PWA features and cloud synchronization.

Phase 1: Local Data Foundation & Core Logging
The absolute priority is creating a functional offline experience. We will build the entire local application first, focusing on data storage and the primary user flow of logging a lift.

Chunk 1: Setup and Data Models

Project Initialization: Set up a modern React project using Vite with TypeScript for type safety.

Data Modeling: Define all data structures as TypeScript interfaces.

Local Database: Integrate Dexie.js as a wrapper for IndexedDB to simplify database operations. Define the database schema.

Database Service: Create a centralized service (databaseService.ts) to handle all CRUD (Create, Read, Update, Delete) operations. We'll start by implementing and testing the functions for Lift and Exercise.

Chunk 2: The Simplest Viable Product

Basic UI: Create a minimal UI with a form to log a new lift and a list to display the history.

State Management: Use basic React state (useState, useEffect) to manage form inputs and the list of lifts.

End-to-End Local Flow: Wire the form to the databaseService. On submission, the new lift is saved to IndexedDB. The history list reads from IndexedDB and updates automatically.

Phase 2: Feature Expansion & UI Refinement
With the core logging flow working, we'll build out the category management, enhance the logging experience, and add data visualization.

Chunk 3: Category and Exercise Management

Database Expansion: Add CRUD functions for MainCategory and SubCategory to the databaseService.

Management UI: Create a new "Settings" area where the user can add, edit, and delete their workout categories.

Integrate Categories: Modify the lift logging form to use dropdowns for selecting an exercise's category, populating them from the database.

Chunk 4: Smart Logging & Visualization

Exercise Smart Search: Implement the autocomplete search for selecting an exercise, including the "Create new" functionality for inline exercise creation.

Exercise Detail View: Create the detailed view for a single exercise, showing PR cards (Heaviest Lift, Best Volume, e1RM).

Progress Chart: Add the line chart to the Exercise Detail View to visualize volume over time, with toggles for rep ranges.

Rest Timer: Implement the optional rest timer in the logging form.

Phase 3: Cardio, PWA, and Cloud Sync
Now we expand the scope to include cardio, turn the app into a true PWA, and connect it to a cloud backend.

Chunk 5: Cardio Tracking

Database & UI: Implement the CardioSession and TimeGoal data models, create the necessary database functions, and build the UI for logging cardio and viewing progress.

Dashboard Integration: Build the main dashboard screen, displaying the cardio goal progress bars and the list of MainCategory items.

Chunk 6: PWA and Offline Capabilities

Service Worker: Configure a service worker to cache the application shell and assets, making the app load instantly and work offline.

Web App Manifest: Create the manifest.json file to allow users to "install" the app on their home screen.

Chunk 7: Authentication and Cloud Sync

Backend Setup: Initialize a Google Firebase project, enabling Firestore and Google Authentication.

Authentication Flow: Integrate the Firebase SDK to implement a "Sign in with Google" flow. The app's core functionality will be protected behind this login.

Sync Service: Create a syncService.ts. This service will handle two-way data synchronization between the local IndexedDB and Firestore, queuing changes when offline and syncing automatically when a connection is restored.

Phase 4: Final Features & Testing
This final phase adds important data management features and ensures robustness through comprehensive testing.

Chunk 8: Data Management

Export/Import: Implement the CSV export and import functionality.

Data Clearing: Add the "danger zone" options in the settings to clear workout history or all data.

Chunk 9: Testing and Polish

Unit & Integration Tests: Ensure all business logic (calculations, database services, sync logic) has strong unit and integration test coverage.

End-to-End (E2E) Tests: Use a framework like Cypress or Playwright to script and automate tests for the most critical user flows (logging offline/online, creating an exercise, etc.).

UI/UX Review: Polish the UI for a smooth, intuitive mobile-first experience.

LLM Implementation Prompts
Here is the series of prompts designed to build the "Lift Log PWA" incrementally.

Phase 1: Local Data Foundation & Core Logging
Plaintext

Prompt 1: Project Setup

You are an expert senior software engineer specializing in frontend development.

Your task is to set up a new web application project for a "Lift Log PWA" using the best tools for a modern, robust application.

Instructions:
1.  Initialize a new project using Vite.
2.  Select the `React` framework with the `TypeScript` variant.
3.  Install `dexie` and `dexie-react-hooks` for IndexedDB management.
4.  Install a UUID library (e.g., `uuid`) and its corresponding types (`@types/uuid`).
5.  Structure the project with a clean `src` directory containing `components`, `services`, `hooks`, and `types` subdirectories.
6.  Create a placeholder `App.tsx` that simply renders "Lift Log PWA".

Provide the complete list of terminal commands to execute and show the final file structure.
Plaintext

Prompt 2: Data Models and Database Schema

You are an expert senior software engineer. Using the project structure from the previous step, your task is to define the application's data models and set up the local database schema with Dexie.js.

Instructions:
1.  In `src/types/database.ts`, create and export TypeScript interfaces for all the data models specified in the project plan: `MainCategory`, `SubCategory`, `Exercise`, `Lift`, `CardioSession`, and `TimeGoal`. Ensure all properties, types, and foreign key relationships are correctly defined. Use string UUIDs for all `id` fields.
2.  In `src/services/database.ts`, create a new class `LiftLogDatabase` that extends `Dexie`.
3.  Inside this class, define the database schema. Create tables for each of the data models (`mainCategories`, `subCategories`, `exercises`, `lifts`, `cardioSessions`, `timeGoals`).
4.  Define the schema version and specify the indexes for each table. At a minimum, index all `id` fields. For the `Lift` table, also create a compound index for `[exerciseId+date]`. For the `SubCategory` table, index `mainCategoryId`. For the `Exercise` table, index `subCategoryId`.
5.  Instantiate and export a single instance of this database class for use throughout the application.
Plaintext

Prompt 3: Core Database Service and Unit Tests

You are an expert senior software engineer with a focus on Test-Driven Development (TDD). Your task is to implement and test the core CRUD operations for the `Exercise` and `Lift` models.

Instructions:
1.  Continue in the `src/services/database.ts` file. Create and export a new plain object named `dbService`.
2.  This service object should contain asynchronous functions for performing CRUD operations on the `lifts` and `exercises` tables using the Dexie instance you created.
    * `createLift(liftData)`: Adds a new lift.
    * `getLiftsForExercise(exerciseId)`: Gets all lifts for a specific exercise, sorted by date descending.
    * `updateLift(id, updates)`: Updates a specific lift.
    * `deleteLift(id)`: Deletes a specific lift.
    * `createExercise(exerciseData)`: Adds a new exercise.
    * `getAllExercises()`: Gets all exercises.
3.  Set up a testing environment using Vitest. Configure it in `vite.config.ts`.
4.  Create a new test file `src/services/database.test.ts`.
5.  Write unit tests for every function in `dbService`. Use an in-memory or mock version of Dexie for testing to ensure tests are fast and isolated. For example, test that `createLift` correctly adds a record and that `getLiftsForExercise` retrieves it.
Plaintext

Prompt 4: Basic Lift Logging UI

You are an expert senior React developer. Your task is to create the simplest possible UI to log a lift and see the history, connecting it to the database service.

Instructions:
1.  Create a new component `src/components/LogLiftForm.tsx`.
    * It should contain a form with uncontrolled inputs for `exerciseId` (for now, this will be a simple text input), `weight`, and `reps`.
    * On submit, it should gather the form data, generate a `uuid`, create a new `Lift` object, and call the `dbService.createLift` function.
2.  Create a new component `src/components/LiftHistory.tsx`.
    * It should accept an `exerciseId` as a prop.
    * Use the `useLiveQuery` hook from `dexie-react-hooks` to fetch and display a list of all lifts for that `exerciseId` by calling `dbService.getLiftsForExercise`. The list should update automatically when a new lift is added.
3.  In `src/App.tsx`, integrate these two components. For now, hardcode a sample `exerciseId` (e.g., 'bench-press-uuid') and pass it to both the form (for saving) and the history list (for displaying). This proves the end-to-end local data flow.
Phase 2: Feature Expansion & UI Refinement
Plaintext

Prompt 5: Category & Exercise Management Backend Logic

You are an expert senior software engineer. Your task is to extend the `dbService` to provide full CRUD functionality for `MainCategory`, `SubCategory`, and to improve the `Exercise` functions.

Instructions:
1.  In `src/services/database.ts`, add the following functions to the `dbService` object:
    * `getAllMainCategories()`
    * `createMainCategory(categoryData)`
    * `updateMainCategory(id, updates)`
    * `deleteMainCategory(id)`
    * `getAllSubCategories()`
    * `createSubCategory(categoryData)`
    * `updateSubCategory(id, updates)`
    * `deleteSubCategory(id)`
    * `getFullExerciseDetails(exerciseId)`: This function should return not just the exercise, but also its parent `SubCategory` and `MainCategory`. You will need to perform lookups on the related tables.
2.  In `src/services/database.test.ts`, write comprehensive unit tests for all the new functions you just created. Ensure you test the `delete` functionality, including how it might affect related data (or how it shouldn't). For example, deleting a `MainCategory` should ideally be prevented if it has linked `SubCategories`. Add this validation logic to the service.
Plaintext

Prompt 6: Category Management UI

You are an expert senior React developer. Your task is to build the UI for managing workout categories.

Instructions:
1.  Install `react-router-dom` to handle navigation.
2.  In `App.tsx`, set up a basic router with two routes: `/` for the main logging page and `/settings/categories` for the new management page. Add a navigation link to the settings page.
3.  Create a new page component `src/pages/CategoryManager.tsx`.
4.  This component should fetch and display all `MainCategory` and `SubCategory` items from the `dbService`.
5.  The UI should allow the user to:
    * View all Main Categories.
    * View the Sub-Categories nested under each Main Category.
    * Add a new Main Category.
    * Add a new Sub-Category to an existing Main Category.
    * Edit the name of any category.
    * Delete any category (include a confirmation dialog).
6.  Use modals or inline forms for a clean user experience when adding/editing. All operations must call the appropriate `dbService` functions.
Plaintext

Prompt 7: Smart Exercise Search with Inline Creation

You are an expert senior React developer. Your task is to replace the simple text input for "exercise" with a smart autocomplete component that allows for inline creation of new exercises.

Instructions:
1.  Create a reusable component `src/components/ExerciseAutocomplete.tsx`.
2.  This component will render a text input. As the user types, it should query the `dbService.getAllExercises` function and display a filtered list of matching exercise names below the input.
3.  If the user's input does not match any existing exercise, the dropdown list should show a single option: `Create "{user's input}"`.
4.  The component should take `onSelectExercise(exercise)` and `onCreateNewExercise(exerciseName)` callbacks as props.
5.  Refactor `LogLiftForm.tsx`:
    * Replace the old `exerciseId` text input with this new `ExerciseAutocomplete` component.
    * When `onCreateNewExercise` is triggered, conditionally render a small, inline form below the autocomplete input to select a `MainCategory` and `SubCategory` (use dropdowns populated from the `dbService`).
    * Upon submission of this small form, call `dbService.createExercise` and then proceed with logging the lift for that new exercise.
Plaintext

Prompt 8: Exercise Detail View with PRs and Chart

You are an expert senior React developer. Your task is to build the detailed view for a single exercise, complete with performance statistics and a progress chart.

Instructions:
1.  Create two helper functions for calculations in a `src/utils/calculations.ts` file:
    * `calculateVolume(lift)`: Returns `weight * reps`.
    * `calculatee1RM(weight, reps)`: Implements the Brzycki formula: `Weight / (1.0278 - 0.0278 * Reps)`.
    * Write unit tests for these calculation functions in a corresponding test file.
2.  Create a new page component `src/pages/ExerciseDetail.tsx`. It should accept an `exerciseId` from the URL parameter (e.g., `/exercise/:id`).
3.  On this page:
    * Fetch all lifts for the exercise using `dbService.getLiftsForExercise`.
    * From the lift data, calculate and display the three "PR Cards": Heaviest Lift, Best Volume, and highest Estimated 1-Rep Max.
    * Install `chart.js` and `react-chartjs-2`.
    * Add a `Line` chart to visualize progress. The Y-axis should be `Volume` and the X-axis should be `Date`.
    * Add filter buttons above the chart: [Strength (4-7 reps)], [Hypertrophy (8-12 reps)], [Both]. Clicking these should filter the data displayed on the chart accordingly. When "Both" is selected, plot two distinct lines.
    * Below the chart, display the full history of lifts for that exercise, grouped by date. Make each lift editable and deletable (e.g., via swipe actions or buttons).
Phase 3: Cardio, PWA, and Cloud Sync
Plaintext

Prompt 9: Cardio Tracking Feature

You are an expert senior software engineer. Your task is to implement the entire cardio tracking feature, including the data layer, logging UI, and progress visualization.

Instructions:
1.  In `src/services/database.ts`, implement and test full CRUD functions for `CardioSession` and CRUD for `TimeGoal` (which will primarily be `get` and `update`).
2.  Create a `src/pages/CardioLog.tsx` page.
    * Display the two `TimeGoal` progress bars ("Zone 2", "Anaerobic") at the top. This will require fetching the goals and their `currentWeekProgress`.
    * Include a form to log a new `CardioSession` (Activity Type, Time, Distance, RPE, Notes).
    * On submission, save the `CardioSession` and update the corresponding `TimeGoal`'s `currentWeekProgress`. You'll need logic to check if the session's date falls within the current week.
    * Display a history of all `CardioSession` entries below the form.
3.  Add this new page to your `react-router-dom` setup.
Plaintext

Prompt 10: PWA Configuration

You are an expert senior software engineer. Your task is to convert the existing React application into a fully functional Progressive Web App (PWA) that works offline.

Instructions:
1.  Use the `vite-plugin-pwa` package to simplify this process. Install and configure it in `vite.config.ts`.
2.  Configure the plugin to:
    * Use a `generateSW` strategy.
    * Cache all static assets (JS, CSS, images, fonts).
    * Cache the main `index.html` (the app shell).
    * Set up a `manifest.json` file with appropriate values: `name`, `short_name`, `start_url`, `display`, `background_color`, `theme_color`, and icons. Create placeholder icons (e.g., 192x192 and 512x512) and add them to the `public` directory.
3.  Provide instructions on how to test the offline capabilities using browser developer tools.
Plaintext

Prompt 11: Firebase Setup and Google Authentication

You are an expert senior software engineer. Your task is to integrate Firebase for backend services, starting with user authentication.

Instructions:
1.  Provide clear, step-by-step instructions for the user to create a new Firebase project, enable Firestore, and enable "Google" as a Sign-In method in the Authentication service.
2.  Install the `firebase` SDK. Create a `src/services/firebase.ts` file to initialize the Firebase app using environment variables (`VITE_FIREBASE_...`). Add a `.env.local` file to the `.gitignore`.
3.  Create an `src/hooks/useAuth.tsx` file. This hook will use a React Context to provide the current user's authentication state (`User | null`) and loading status throughout the app. It should expose `signInWithGoogle` and `signOut` functions.
4.  In `App.tsx`, wrap the entire application in the Auth provider.
5.  Create a `src/pages/Login.tsx` page. If the user is not authenticated, render this page. It should contain a single "Sign in with Google" button that calls the `signInWithGoogle` function.
6.  Modify the router to protect all other routes, redirecting to `/login` if no user is signed in.
Plaintext

Prompt 12: Two-Way Data Synchronization Service

You are an expert senior software engineer specializing in complex data synchronization. This is the most critical logic. Your task is to create a service that synchronizes the local IndexedDB (Dexie) with the cloud Firestore database.

Instructions:
Create a new file `src/services/syncService.ts`. The service should be designed to be initialized once the user logs in.

1.  **Push to Cloud:**
    * Use Dexie's `db.on('changes')` hook. This hook fires whenever data is created, updated, or deleted locally.
    * Write a handler function that takes these changes, formats them, and writes them to the user's Firestore database.
    * Structure the Firestore data logically, e.g., `/users/{userId}/lifts/{liftId}`.
    * The service must handle offline scenarios. If a write to Firestore fails due to a lack of connection, it should not fail. Dexie is the source of truth, so the change is already saved locally. The sync will naturally catch up when the connection is restored.

2.  **Pull from Cloud:**
    * On service initialization (after login), perform a one-time fetch from all of the user's collections in Firestore.
    * Compare the fetched data with the local Dexie data. A simple "last-write-wins" strategy is fine, but a more robust approach would be to use a `lastUpdated` timestamp on every record. Use Dexie's `bulkPut()` for efficient updates.
    * After the initial sync, set up Firestore real-time listeners (`onSnapshot`) for each collection.
    * When the listener fires with changes from the cloud, update the local Dexie database accordingly. Be careful to prevent sync loops (i.e., a change from Firestore updating Dexie, which then triggers the 'push' hook to re-upload the same change). You can do this by passing a flag or context during updates that originate from Firestore.

3.  **Integration:**
    * In your `useAuth` hook or `App.tsx`, call an `initializeSync()` function from this service as soon as the user's state becomes authenticated.
Phase 4: Final Features & Testing
Plaintext

Prompt 13: Data Export and Import

You are an expert senior software engineer. Your task is to implement CSV data export and import functionality.

Instructions:
1.  Install a CSV parsing/writing library like `papaparse`.
2.  Create a new `src/pages/DataManagement.tsx` page and add it to the router in the settings area.
3.  **Export Functionality:**
    * Add an "Export All Lifts" button.
    * When clicked, it should call a `dbService` function that fetches all `Lift` records, along with their parent `Exercise`, `SubCategory`, and `MainCategory` names.
    * Use the CSV library to convert this JSON data into a CSV string.
    * Trigger a browser download of the generated data as a `lifts_export.csv` file.
4.  **Import Functionality:**
    * Add a file input element that accepts `.csv` files.
    * When a file is uploaded, parse it using the CSV library.
    * For each row in the CSV, your logic must be robust:
        * Check if the `Exercise`, `SubCategory`, and `MainCategory` already exist.
        * If they don't, create them in the database.
        * Create the `Lift` record and associate it with the correct exercise.
    * Provide feedback to the user on the success or failure of the import (e.g., "Imported 150 lifts, created 3 new exercises.").
Plaintext

Prompt 14: End-to-End (E2E) Testing

You are an expert QA engineer specializing in test automation. Your task is to set up E2E tests for the most critical user flows using Cypress.

Instructions:
1.  Install and configure Cypress for the project.
2.  Write the following E2E test scripts:
    * **`auth.cy.ts`**: Tests the "Sign in with Google" flow. You will need to mock the Firebase authentication call to avoid needing real credentials in your test runner.
    * **`full_workout_log.cy.ts`**:
        * Logs in.
        * Navigates to the logging page.
        * Uses the autocomplete to find an existing exercise.
        * Logs 3 sets for that exercise.
        * Navigates to the exercise detail page and asserts that the PR cards and history are updated correctly.
    * **`offline_sync.cy.ts`**:
        * Logs in.
        * Simulates going offline using Cypress's `cy.intercept` to block calls to Firestore.
        * Logs a new lift. Asserts it appears in the UI (confirming it's saved to IndexedDB).
        * Simulates going back online by removing the intercept.
        * Asserts that the sync to your mock Firestore eventually happens.
    * **`inline_exercise_creation.cy.ts`**:
        * Logs in.
        * Types a brand new exercise name into the autocomplete.
        * Selects the "Create" option.
        * Fills out the inline category form and creates the exercise.
        * Immediately logs a lift for this new exercise and asserts that it was saved correctly.