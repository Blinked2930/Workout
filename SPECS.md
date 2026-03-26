Project Specification: Lift Log PWA
1. Project Overview & Goal

Name: Lift Log

Format: Progressive Web App (PWA)

Core Mission: A workout tracker for a single user to log strength and cardio workouts, visualize progress over time, and provide quick access to recent performance data. The application must be mobile-first but also functional on a desktop for viewing stats and exporting data.

User: A health-conscious individual who works out frequently, often while traveling or in locations with poor internet connectivity.

2. Core Technical Architecture

Offline-First: The application must be fully functional without an internet connection. All features, including data logging and history viewing, must work seamlessly offline.

Cloud Sync: All user data will be automatically synced to a free-tier cloud backend (e.g., Google Firebase/Firestore) whenever an internet connection is available.

User Authentication: The app will require users to log in via a simple authentication provider (e.g., "Sign in with Google") to enable cloud sync and data safety.

3. Feature Breakdown

3.1. Main Screen & Navigation

The main screen will feature a hybrid dashboard/list layout.

Top: Display two progress bars showing the user's current weekly progress against their set goals for "Zone 2" and "Anaerobic" cardio.

Bottom: A list of the user's main lifting categories (e.g., "Push," "Pull," "Legs").

Navigation will follow a standard drill-down pattern (tapping a category takes the user to a new screen).

3.2. Strength Training Flow

Exercise List View:

Displays a list of exercises within a selected sub-category.

Each exercise will feature a preview summary using a modern "tag/chip" UI to show the last used weight for two rep ranges.

Example: [ 4-7 Reps: 135 lbs ] [ 8-12 Reps: 110 lbs ]

Exercise Detail View:

Personal Record (PR) Cards: At the top, display prominent stat cards for: "Heaviest Lift," "Best Volume Set" (weight×reps), and "Estimated 1-Rep Max (e1RM)".

Progress Chart: A single, combined line chart plotting volume over time. The chart will have toggle buttons ([ Strength ] [ Hypertrophy ] [ Both ]) to filter the data shown.

History List: Below the chart, a full history of all logged sets for that exercise, grouped by date to create clear workout sessions. Each individual set entry will be tappable to edit and swipable to delete.

Logging a New Lift:

The form will capture: Exercise, Date, Weight, Reps.

New Fields: It will also include optional fields for Notes and Reps in Reserve (RIR).

Rest Timer: An automatic rest timer feature will be included. On the logging form, the user will have a toggle to enable/disable the timer for the next rest and an input field to set the duration (defaulting to 90 seconds).

Adding a New Exercise:

This will be handled via a "Smart" search field. When logging a lift, the user can type the name of a new exercise and select a Create "..." option directly from the search results.

This will trigger an inline form (no new page) to capture the exercise's Main Category and Sub-Category.

The "Add Exercise" definition will also include two new optional metadata fields to make future logging smarter: Exercise Type (e.g., Barbell, Dumbbell) and Default Rest Time.

3.3. Cardio Training Flow

The app will track two types of cardio: "Zone 2" and "Anaerobic."

Logging a Cardio Session:

Each logged session will be saved as a distinct CardioSession.

The form will capture a required Activity Type (e.g., "Treadmill," "Cycling") and a required Time (duration).

It will also include optional fields for Distance, Notes, and Rate of Perceived Exertion (RPE) on a 1-10 scale.

Cardio Detail Page:

Weekly Goal: The weekly progress bar will be displayed at the top.

Long-Term Chart: A chart will show total cardio time per week or month to visualize long-term trends.

History List: A full history of all logged CardioSessions, grouped by date, showing all captured details.

3.4. Settings

Category Management: Full CRUD (Create, Read, Update, Delete) functionality for main and sub-categories.

Data Management: Functionality to Import and Export all user data via a CSV file.

Data Clearing: "Danger zone" buttons to clear the lift/cardio logs or wipe all data completely.

Goal Setting: Inputs to set the weekly minute goals for each cardio type.

This specification provides a comprehensive blueprint for the application. You can now pass this to a developer to get a clear scope of work. It has been a pleasure working with you on this!







Now that we’ve wrapped up the brainstorming process, can you compile our findings into a comprehensive, developer-ready specification? Include relevant requirements, architecture choices, data handling details, error handling strategies, and a testing plan so a developer can immediately begin implementation.




Show thinking
Of course. Here is the comprehensive, developer-ready specification for the Lift Log PWA, compiling all of our decisions.

Project Specification: Lift Log PWA
Version: 1.0
Date: July 17, 2025

1. Introduction
1.1. Project Goal
To create a mobile-first Progressive Web App (PWA) that allows a single user to efficiently log, track, and visualize their strength and cardio training. The app must be fast, reliable (especially in offline conditions), and provide clear, motivating feedback on the user's progress.

1.2. Target User
A health-conscious individual who trains frequently, often while traveling or in locations with poor or no internet connectivity (e.g., in a forest or a budget gym). The user needs a robust tool to log workouts on their phone and occasionally review their long-term progress or export their data from a desktop computer.

2. Core Architecture
2.1. Application Format
Progressive Web App (PWA): The application will be a PWA to ensure cross-platform compatibility (iOS, Android, Desktop) and to enable core offline and native-like features.

2.2. Data Handling & Storage
Offline-First: The app must be fully functional without an internet connection. This will be achieved using a Service Worker to cache the application shell and assets, and a client-side database to store all user data.

Client-Side Database: IndexedDB is the recommended browser database for storing the data models locally.

Cloud Sync: All user data must be automatically and securely synced to a cloud backend whenever a connection is available. This ensures data is backed up and accessible across multiple devices.

Cloud Backend: Google Firebase (Firestore) is the recommended backend service. Its free tier is sufficient for this application's needs, and it provides robust real-time data synchronization and authentication.

2.3. User Authentication
To facilitate secure cloud sync, the app will require user authentication.

Implementation will be through a simple, trusted provider, with "Sign in with Google" being the primary method. The user's account will be the central point for syncing data across their devices.

3. Data Models
The following data models will be used both for local IndexedDB storage and for the Firestore database structure.

MainCategory:

id: String (UUID)

name: String (e.g., "Push", "Pull")

SubCategory:

id: String (UUID)

name: String (e.g., "Chest", "Lats")

mainCategoryId: String (Foreign Key to MainCategory)

Exercise:

id: String (UUID)

name: String (e.g., "Bench Press")

subCategoryId: String (Foreign Key to SubCategory)

exerciseType: String (Optional: "Barbell", "Dumbbell", "Machine", "Bodyweight", etc.)

defaultRestTime: Number (Optional: in seconds, e.g., 90)

Lift (A single set):

id: String (UUID)

exerciseId: String (Foreign Key to Exercise)

date: Timestamp

weight: Number

reps: Number

rir: Number (Optional: Reps in Reserve)

notes: String (Optional)

isEachSide: Boolean

CardioSession:

id: String (UUID)

date: Timestamp

activityType: String (Required: e.g., "Treadmill", "Cycling")

time: Number (Required: duration in minutes)

distance: Number (Optional: in user's preferred unit)

rpe: Number (Optional: Rate of Perceived Exertion, 1-10)

notes: String (Optional)

TimeGoal:

id: String ("Zone2" or "Anaerobic")

weeklyGoal: Number (in minutes)

currentWeekProgress: Number (in minutes)

lastUpdated: Timestamp

4. Feature Specification
4.1. Main Screen (Dashboard)
Layout: A single-view dashboard.

Cardio Goals: At the top, display two progress bars showing current weekly progress vs. the goal for "Zone 2" and "Anaerobic" cardio.

Lift Categories: Below the cardio goals, display a list of all MainCategory items. Tapping a category navigates to the SubCategory list view.

4.2. Strength Training Flow
SubCategory -> Exercise List: The navigation follows a clean drill-down pattern. The Exercise list view must display a summary for each exercise.

Exercise Preview UI: Each item in the Exercise list will show the exercise name and, below it, two "tag" or "chip" style UI elements displaying the most recent weight lifted in specific rep ranges:

[ 4-7 Reps: {weight} lbs ]

[ 8-12 Reps: {weight} lbs ]

Exercise Detail View:

PR Cards: At the top, display three prominent, easy-to-read "stat cards":

Heaviest Lift: Max weight lifted for this exercise.

Best Volume: Max volume (weight×reps) achieved in a single set.

Estimated 1-Rep Max (e1RM): Calculate and display the e1RM based on the user's best set. Use a standard formula like the Brzycki formula: Weight / (1.0278 - 0.0278 * Reps).

Progress Chart: A single, interactive line chart will visualize progress.

Y-Axis: Total Volume (weight×reps)

X-Axis: Date

Toggles: Above the chart, provide buttons to filter the data: [ Strength (4-7 reps) ], [ Hypertrophy (8-12 reps) ], [ Both ]. When "Both" is selected, the two data series should be plotted in different colors.

History List: Below the chart, list all Lift entries for this exercise, grouped by date. Each set must be tappable to edit and swipable to delete.

Logging a Lift:

Smart Search: The "Select Exercise" field must function as a smart search. As the user types, it should filter the existing Exercise list. If no match is found, an option to Create "{new exercise name}" must appear in the results.

Inline Creation: Selecting the "Create" option must expand an inline form (without navigating away) to capture the new exercise's Main Category and Sub-Category.

Rest Timer: The logging form must include a toggle to enable/disable an automatic rest timer and a number input for the rest duration, defaulting to 90 seconds (or the exercise's defaultRestTime if set).

Data Fields: The form will capture all fields in the Lift data model.

4.3. Cardio Training Flow
Cardio Detail Page:

Display the weekly progress bar at the top.

Long-Term Chart: Below the goal, display a bar chart showing total cardio time per week or month.

History List: List all CardioSession entries, grouped by date.

Logging a Cardio Session: The form must capture all fields from the CardioSession data model. Activity Type and Time are required fields.

4.4. Settings
Category Management: Provide a UI for users to perform full CRUD (Create, Read, Update, Delete) operations on their MainCategory and SubCategory entries.

Data Management:

Export: Generate and allow the user to download a CSV file of their entire lift history.

Import: Allow the user to upload a CSV file to import lift data. The import logic must be robust enough to handle new exercises and categories found in the file.

Data Clearing: Provide two "danger zone" options with confirmation dialogs:

Clear all Lift and CardioSession history.

Clear all data entirely (logs, exercises, categories).

Goal Setting: Allow the user to set their weekly minute goals for "Zone 2" and "Anaerobic" cardio.

5. Error Handling
Connection Loss: The app must gracefully handle the transition between online and offline states. When a sync with Firebase fails due to connection loss, it should be queued and retried automatically when the connection is restored. The UI should not block or show disruptive errors.

Invalid Input: Forms must include client-side validation to prevent the submission of invalid data (e.g., non-numeric weight/reps, empty required fields). Provide clear, user-friendly error messages.

Data Conflicts: In the rare case of a data conflict during sync (e.g., editing the same lift on two devices while both are offline), a "last-write-wins" strategy is acceptable for simplicity.

6. Testing Plan
6.1. Unit Testing
Write unit tests for all data model helper functions (e.g., e1RM calculation, volume calculation).

Test data transformation logic, such as grouping lifts by date.

Test form validation logic.

6.2. Integration Testing
Test the interaction between the UI components and the client-side database (IndexedDB).

Test the data synchronization logic with a mock Firebase backend to ensure correct data flow and conflict resolution.

6.3. End-to-End (E2E) Testing
Core User Flows:

User logs in, logs a full workout (multiple exercises and sets), and verifies the data is saved locally and appears in the history.

User logs a cardio session and verifies the weekly goal and history are updated.

User goes offline, logs another full workout, goes back online, and verifies the data syncs correctly to the cloud.

User edits and deletes a past lift and confirms the changes are reflected.

User creates a new exercise from the logging flow and immediately logs a lift with it.

User successfully exports and imports a CSV data file.