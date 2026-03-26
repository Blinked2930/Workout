# Lift Log PWA: Project Todo List

This checklist breaks down the entire project into actionable steps, mirroring the incremental build process.

---

## Phase 1: Local Data Foundation & Core Logging

### ✅ Prompt 1: Project Setup
- [x] Initialize project with Vite (`React` + `TypeScript`).
- [x] Install `dexie` and `dexie-react-hooks`.
- [x] Install `uuid` and `@types/uuid`.
- [x] Create `src` directory structure (`components`, `services`, `hooks`, `types`).
- [x] Create placeholder `App.tsx`.

### ✅ Prompt 2: Data Models and Database Schema
- [x] Define all data model interfaces in `src/types/database.ts`.
- [x] Create `LiftLogDatabase` class extending `Dexie` in `src/services/database.ts`.
- [x] Define database schema with tables and version.
- [x] Add indexes for `id`, `exerciseId+date`, `mainCategoryId`, and `subCategoryId`.
- [x] Export a singleton instance of the database.

### ✅ Prompt 3: Core Database Service and Unit Tests
- [x] Create `dbService` object in `src/services/database.ts`.
- [x] Implement CRUD functions for `Lift` and `Exercise`.
- [x] Set up Vitest for unit testing.
- [x] Write unit tests for all `dbService` functions in `database.test.ts`.

### ✅ Prompt 4: Basic Lift Logging UI
- [x] Create `src/components/LogLiftForm.tsx` component.
- [x] Create `src/components/LiftHistory.tsx` component using `useLiveQuery`.
- [x] Integrate both components into `App.tsx` with a hardcoded `exerciseId` to test the local data flow.

---

## Phase 2: Feature Expansion & UI Refinement

### ✅ Prompt 5: Category & Exercise Management Backend Logic
- [x] Extend `dbService` with full CRUD functions for `MainCategory` and `SubCategory`.
- [x] Add `getFullExerciseDetails(exerciseId)` function to `dbService`.
- [x] Write comprehensive unit tests for all new category and exercise functions.
- [x] Add validation to prevent deletion of categories that are in use.

### ✅ Prompt 6: Category Management UI
- [x] Install and configure `react-router-dom`.
- [x] Set up routes for `/` and `/settings/categories`.
- [x] Create `src/pages/CategoryManager.tsx` page.
- [x] Build UI to list, create, edit, and delete `MainCategory` and `SubCategory` items.
- [x] Include confirmation dialogs for delete operations.

### ✅ Prompt 7: Smart Exercise Search with Inline Creation
- [x] Create reusable `src/components/ExerciseAutocomplete.tsx` component.
- [x] Implement search logic to filter exercises or show a "Create new" option.
- [x] Refactor `LogLiftForm.tsx` to use the new autocomplete component.
- [x] Implement the inline form for creating a new exercise when the "Create" option is selected.

### ✅ Prompt 8: Exercise Detail View with PRs and Chart
- [x] Create `src/utils/calculations.ts` for `calculateVolume` and `calculatee1RM`.
- [x] Write unit tests for calculation helpers.
- [x] Create `src/pages/ExerciseDetail.tsx` page that accepts an `exerciseId` URL parameter.
- [x] Calculate and display PR cards (Heaviest Lift, Best Volume, e1RM).
- [x] Install `chart.js` and `react-chartjs-2`.
- [x] Implement a line chart for Volume vs. Date.
- [x] Add chart filter buttons for rep ranges ([Strength], [Hypertrophy], [Both]).
- [x] Display a full, editable history of lifts below the chart.

---

## Phase 3: Cardio, PWA, and Cloud Sync

### ✅ Prompt 9: Cardio Tracking Feature
- [x] Implement and test `dbService` functions for `CardioSession` and `TimeGoal`.
- [x] Create `src/pages/CardioLog.tsx` page.
- [x] Display `TimeGoal` progress bars.
- [x] Build and connect the `CardioSession` logging form.
- [x] Implement logic to update `TimeGoal` progress on new session submission.
- [x] Display cardio history on the page.
- [x] Add page to the router.

### ✅ Prompt 10: PWA Configuration
- [x] Install and configure `vite-plugin-pwa`.
- [x] Set up service worker strategy to cache app shell and assets.
- [x] Create and configure `manifest.json` with app details and icons.
- [x] Add placeholder icons to the `/public` directory.
- [x] Test offline functionality in the browser.

### ✅ Prompt 11: Firebase Setup and Google Authentication
- [x] Create Firebase project, enable Firestore and Google Auth.
- [x] Install `firebase` SDK and initialize in `src/services/firebase.ts` with environment variables.
- [x] Create `src/contexts/AuthContext.tsx` with a React Context for auth state.
- [x] Implement `signInWithGoogle` and `signOut` functions in the auth hook.
- [x] Create a `src/pages/Login.tsx` page with a sign-in button.
- [x] Protect routes with authentication
- [x] Update navigation to show/hide based on auth state
- [x] Protect all application routes, redirecting unauthenticated users to `/login`

### ✅ Prompt 12: Two-Way Data Synchronization Service
- [x] Create `src/services/syncService.ts`.
- [x] Implement "Push to Cloud" logic using Dexie's `db.on('changes')` hook.
- [x] Implement "Pull from Cloud" logic for both initial fetch and real-time `onSnapshot` listeners.
- [x] Ensure sync logic is robust against offline scenarios.
- [x] Implement a mechanism to prevent sync loops.
- [x] Integrate `syncService` initialization into the auth flow (e.g., in `useAuth` hook after login).

---

## Phase 4: Final Features & Testing

### ✅ Prompt 13: Data Export and Import
- [x] Install `papaparse` or a similar CSV library.
- [x] Create `src/pages/DataManagement.tsx` page.
- [x] Implement "Export All Lifts" to a CSV file.
- [x] Implement CSV import functionality with a file input.
- [x] Ensure import logic can handle and create new exercises/categories found in the file.
- [x] Provide user feedback on import status.

### ✅ Prompt 14: End-to-End (E2E) Testing
- [x] Install and configure Cypress.
- [x] Write `auth.cy.ts` test (mocking Firebase auth).
- [x] Write `full_workout_log.cy.ts` test for the core logging flow.
- [x] Write `offline_sync.cy.ts` test using `cy.intercept`.
- [x] Write `inline_exercise_creation.cy.ts` test.