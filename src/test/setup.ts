// Test setup file
import { createDatabase } from '../services/database';
import { beforeEach, afterEach } from 'vitest';
import { setupTestEnvironment } from './test-environment';

// Set up the test environment
setupTestEnvironment();

// Create a fresh database for each test
export let db: ReturnType<typeof createDatabase>;

beforeEach(async () => {
  // Create a new database instance with a unique name
  const testDbName = `test-db-${Date.now()}`;
  db = createDatabase(testDbName);
  
  try {
    // Initialize with default data
    await db.timeGoals.bulkPut([
      { 
        id: 'zone2', 
        weeklyGoal: 150, 
        currentWeekProgress: 0, 
        lastUpdated: new Date() 
      },
      { 
        id: 'anaerobic', 
        weeklyGoal: 75, 
        currentWeekProgress: 0, 
        lastUpdated: new Date() 
      },
    ]);
  } catch (error) {
    console.error('Error initializing test database:', error);
    throw error;
  }
}, 30000); // Increase timeout to 30 seconds

afterEach(async () => {
  // Clean up after each test
  if (db && typeof db.close === 'function') {
    try {
      await db.close();
      await db.delete();
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  }
});
