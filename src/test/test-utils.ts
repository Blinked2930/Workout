import { createDatabase } from '../services/database';

export async function createTestDatabase() {
  const testDbName = `test-db-${Date.now()}`;
  const db = createDatabase(testDbName);
  
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
  
  return db;
}

export async function cleanupTestDatabase(db: any) {
  if (db && typeof db.close === 'function') {
    try {
      await db.close();
      await db.delete();
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  }
}
