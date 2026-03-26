import { v4 as uuidv4 } from 'uuid';
import Dexie, { type Table } from 'dexie';
import {
  type MainCategory,
  type SubCategory,
  type Exercise,
  type Lift,
  type CardioSession,
  type TimeGoal,
} from '../types/database';

// Define the database class with our tables
export class LiftLogDatabase extends Dexie {
  mainCategories!: Table<MainCategory, string>;
  subCategories!: Table<SubCategory, string>;
  exercises!: Table<Exercise, string>;
  lifts!: Table<Lift, string>;
  cardioSessions!: Table<CardioSession, string>;
  timeGoals!: Table<TimeGoal, string>;

  constructor(name = 'LiftLogDatabase') {
    super(name);
    this.version(1).stores({
      mainCategories: 'id, name, createdAt',
      subCategories: 'id, mainCategoryId, name, createdAt',
      exercises: 'id, subCategoryId, name, createdAt',
      lifts: 'id, exerciseId, date, [exerciseId+date]',
      cardioSessions: 'id, date, activityType',
      timeGoals: 'id',
    });
  }
}

// Create a function to create a new database instance
export function createDatabase(name = 'LiftLogDatabase'): LiftLogDatabase {
  const db = new LiftLogDatabase(name);
  
  // Initialize default data if the database is empty
  const initializeDatabase = async () => {
    await db.transaction('rw', [
      db.mainCategories, 
      db.subCategories, 
      db.exercises, 
      db.timeGoals
    ], async () => {
      // Initialize default time goals if they don't exist
      const timeGoals = await db.timeGoals.toArray();
      
      if (!timeGoals.some((g: TimeGoal) => g.id === 'zone2')) {
        await db.timeGoals.add({
          id: 'zone2',
          weeklyGoal: 150,
          currentWeekProgress: 0,
          lastUpdated: new Date()
        });
      }
      
      if (!timeGoals.some((g: TimeGoal) => g.id === 'anaerobic')) {
        await db.timeGoals.add({
          id: 'anaerobic',
          weeklyGoal: 60,
          currentWeekProgress: 0,
          lastUpdated: new Date()
        });
      }
      
      // Initialize default categories if none exist
      const mainCategories = await db.mainCategories.toArray();
      if (mainCategories.length === 0) {
        // Create default main categories
        const pushId = uuidv4();
        const pullId = uuidv4();
        const legsId = uuidv4();
        const coreId = uuidv4();
        
        await db.mainCategories.bulkAdd([
          { id: pushId, name: 'Push', createdAt: new Date(), updatedAt: new Date() },
          { id: pullId, name: 'Pull', createdAt: new Date(), updatedAt: new Date() },
          { id: legsId, name: 'Legs', createdAt: new Date(), updatedAt: new Date() },
          { id: coreId, name: 'Core', createdAt: new Date(), updatedAt: new Date() },
        ]);
        
        // Create default sub-categories
        await db.subCategories.bulkAdd([
          // Push sub-categories
          { id: uuidv4(), mainCategoryId: pushId, name: 'Chest', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: pushId, name: 'Shoulders', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: pushId, name: 'Triceps', createdAt: new Date(), updatedAt: new Date() },
          
          // Pull sub-categories
          { id: uuidv4(), mainCategoryId: pullId, name: 'Back', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: pullId, name: 'Biceps', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: pullId, name: 'Rear Delts', createdAt: new Date(), updatedAt: new Date() },
          
          // Legs sub-categories
          { id: uuidv4(), mainCategoryId: legsId, name: 'Quads', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: legsId, name: 'Hamstrings', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: legsId, name: 'Glutes', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: legsId, name: 'Calves', createdAt: new Date(), updatedAt: new Date() },
          
          // Core sub-categories
          { id: uuidv4(), mainCategoryId: coreId, name: 'Abs', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: coreId, name: 'Obliques', createdAt: new Date(), updatedAt: new Date() },
          { id: uuidv4(), mainCategoryId: coreId, name: 'Lower Back', createdAt: new Date(), updatedAt: new Date() },
        ]);
        
        // Get all sub-categories to create exercises
        const subCategories = await db.subCategories.toArray();
        const getSubCategoryId = (name: string) => 
          subCategories.find(sc => sc.name === name)?.id || '';
        
        // Create default exercises
        await db.exercises.bulkAdd([
          // Chest exercises
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Chest'), 
            name: 'Barbell Bench Press',
            exerciseType: 'barbell',
            defaultRestTime: 90,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Chest'), 
            name: 'Incline Dumbbell Press',
            exerciseType: 'dumbbell',
            defaultRestTime: 90,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Chest'), 
            name: 'Chest Fly',
            exerciseType: 'machine',
            defaultRestTime: 60,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          
          // Back exercises
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Back'), 
            name: 'Pull-Up',
            exerciseType: 'bodyweight',
            defaultRestTime: 90,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Back'), 
            name: 'Barbell Row',
            exerciseType: 'barbell',
            defaultRestTime: 90,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          
          // Shoulders
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Shoulders'), 
            name: 'Overhead Press',
            exerciseType: 'barbell',
            defaultRestTime: 90,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          
          // Legs
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Quads'), 
            name: 'Barbell Back Squat',
            exerciseType: 'barbell',
            defaultRestTime: 120,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Hamstrings'), 
            name: 'Romanian Deadlift',
            exerciseType: 'barbell',
            defaultRestTime: 120,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Calves'), 
            name: 'Standing Calf Raise',
            exerciseType: 'machine',
            defaultRestTime: 45,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          
          // Core
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Abs'), 
            name: 'Hanging Leg Raise',
            exerciseType: 'bodyweight',
            defaultRestTime: 45,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Obliques'), 
            name: 'Russian Twist',
            exerciseType: 'bodyweight',
            defaultRestTime: 30,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: uuidv4(), 
            subCategoryId: getSubCategoryId('Lower Back'), 
            name: 'Back Extension',
            exerciseType: 'machine',
            defaultRestTime: 60,
            createdAt: new Date(),
            updatedAt: new Date()
          },
        ]);
      }
    });
  };
  
  // Run initialization
  initializeDatabase().catch(console.error);
  
  return db;
}

// Default database instance for the application
const db = createDatabase();

// Type definitions for database operations
type CreateLiftData = Omit<Lift, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateLiftData = Partial<Omit<Lift, 'id' | 'exerciseId' | 'createdAt' | 'updatedAt'>>;
type CreateExerciseData = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateExerciseData = Partial<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>>;
type CreateMainCategoryData = Omit<MainCategory, 'id' | 'createdAt'>;
type UpdateMainCategoryData = Partial<Omit<MainCategory, 'id'>>;
type CreateSubCategoryData = Omit<SubCategory, 'id' | 'createdAt'>;
type UpdateSubCategoryData = Partial<Omit<SubCategory, 'id' | 'mainCategoryId'>>;

// Create a service factory that works with any database instance
export function createDbService(database: LiftLogDatabase = db) {
  return {
    // Expose the database instance for testing
    db: database,

    // Lift operations
    async createLift(liftData: CreateLiftData): Promise<string> {
      const id = uuidv4();
      const now = new Date();
      await database.lifts.add({
        ...liftData,
        id,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },

    async getLiftsForExercise(exerciseId: string): Promise<Lift[]> {
      return database.lifts
        .where('exerciseId')
        .equals(exerciseId)
        .sortBy('date');
    },

    async updateLift(id: string, updates: UpdateLiftData): Promise<void> {
      await database.lifts.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
    },

    async deleteLift(id: string): Promise<void> {
      await database.lifts.delete(id);
    },

    // Exercise operations
    async createExercise(exerciseData: CreateExerciseData): Promise<string> {
      const id = uuidv4();
      const now = new Date();
      await database.exercises.add({
        ...exerciseData,
        id,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },

    async getExercise(id: string): Promise<Exercise | undefined> {
      return database.exercises.get(id);
    },

    async getAllExercises(): Promise<Exercise[]> {
      return database.exercises.toArray();
    },

    async getExercisesBySubCategory(subCategoryId: string): Promise<Exercise[]> {
      return database.exercises
        .where('subCategoryId')
        .equals(subCategoryId)
        .toArray();
    },

    async searchExercises(query: string, subCategoryId?: string): Promise<Exercise[]> {
      let collection = database.exercises
        .orderBy('name')
        .filter(exercise => 
          exercise.name.toLowerCase().includes(query.toLowerCase())
        );
      
      if (subCategoryId) {
        collection = collection.filter(exercise => 
          exercise.subCategoryId === subCategoryId
        );
      }
      
      return collection.toArray();
    },

    async updateExercise(id: string, updates: UpdateExerciseData): Promise<void> {
      await database.exercises.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
    },

    async deleteExercise(id: string): Promise<void> {
      await database.exercises.delete(id);
    },

    // Main Category operations
    async getAllMainCategories(): Promise<MainCategory[]> {
      return database.mainCategories.toArray();
    },

    async createMainCategory(categoryData: CreateMainCategoryData): Promise<string> {
      const id = uuidv4();
      const now = new Date();
      await database.mainCategories.add({
        ...categoryData,
        id,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },

    async updateMainCategory(id: string, updates: UpdateMainCategoryData): Promise<number> {
      // Check if there are any subcategories using this main category
      const subCategoryCount = await database.subCategories
        .where('mainCategoryId')
        .equals(id)
        .count();
      
      if (subCategoryCount > 0) {
        throw new Error('Cannot update main category that has subcategories');
      }
      
      const updateWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };
      return database.mainCategories.update(id, updateWithTimestamp);
    },

    async deleteMainCategory(id: string): Promise<void> {
      // Check if there are any subcategories using this main category
      const subCategoryCount = await database.subCategories
        .where('mainCategoryId')
        .equals(id)
        .count();
      
      if (subCategoryCount > 0) {
        throw new Error('Cannot delete main category that has subcategories');
      }
      
      await database.mainCategories.delete(id);
    },

    // Sub Category operations
    async getAllSubCategories(): Promise<SubCategory[]> {
      return database.subCategories.toArray();
    },

    async getSubCategoriesByMainCategory(mainCategoryId: string): Promise<SubCategory[]> {
      return database.subCategories
        .where('mainCategoryId')
        .equals(mainCategoryId)
        .toArray();
    },

    async createSubCategory(categoryData: CreateSubCategoryData): Promise<string> {
      // Verify the main category exists
      const mainCategory = await database.mainCategories.get(categoryData.mainCategoryId);
      if (!mainCategory) {
        throw new Error('Main category not found');
      }
      
      const id = uuidv4();
      const now = new Date();
      await database.subCategories.add({
        ...categoryData,
        id,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },

    async getSubCategories(mainCategoryId?: string): Promise<SubCategory[]> {
      if (mainCategoryId) {
        return this.getSubCategoriesByMainCategory(mainCategoryId);
      }
      return this.getAllSubCategories();
    },

    async updateSubCategory(id: string, updates: UpdateSubCategoryData): Promise<number> {
      // Check if there are any exercises using this subcategory
      const exerciseCount = await database.exercises
        .where('subCategoryId')
        .equals(id)
        .count();
      
      if (exerciseCount > 0) {
        throw new Error('Cannot update subcategory that has exercises');
      }
      
      return database.subCategories.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
    },

    async deleteSubCategory(id: string): Promise<void> {
      // Check if there are any exercises using this subcategory
      const exerciseCount = await database.exercises
        .where('subCategoryId')
        .equals(id)
        .count();
      
      if (exerciseCount > 0) {
        throw new Error('Cannot delete subcategory that has exercises');
      }
      
      await database.subCategories.delete(id);
    },

    // Exercise details with related category information
    async getFullExerciseDetails(exerciseId: string) {
      const exercise = await database.exercises.get(exerciseId);
      if (!exercise) return undefined;
      
      const subCategory = await database.subCategories.get(exercise.subCategoryId);
      if (!subCategory) {
        throw new Error('Subcategory not found for exercise');
      }
      
      const mainCategory = await database.mainCategories.get(subCategory.mainCategoryId);
      if (!mainCategory) {
        throw new Error('Main category not found for subcategory');
      }
      
      return {
        exercise,
        subCategory,
        mainCategory,
      };
    },

    // Cardio Session operations
    async createCardioSession(sessionData: Omit<CardioSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
      const id = uuidv4();
      const now = new Date();
      await database.cardioSessions.add({
        ...sessionData,
        id,
        createdAt: now,
        updatedAt: now,
      });

      // Update time goal progress if applicable
      if (sessionData.activityType === 'zone2' || sessionData.activityType === 'anaerobic') {
        await this.updateTimeGoalProgress(sessionData.activityType, sessionData.time);
      }

      return id;
    },

    async getCardioSessions(startDate?: Date, endDate?: Date): Promise<CardioSession[]> {
      let collection = database.cardioSessions.toCollection();

      if (startDate && endDate) {
        return collection
          .filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startDate && sessionDate <= endDate;
          })
          .sortBy('date');
      }

      return collection.sortBy('date');
    },

    async getCardioSessionsByType(activityType: string, startDate?: Date, endDate?: Date): Promise<CardioSession[]> {
      let collection = database.cardioSessions.where('activityType').equals(activityType);

      if (startDate && endDate) {
        return collection
          .filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= startDate && sessionDate <= endDate;
          })
          .sortBy('date');
      }

      return collection.sortBy('date');
    },

    async updateCardioSession(id: string, updates: Partial<Omit<CardioSession, 'id' | 'createdAt'>>): Promise<void> {
      await database.cardioSessions.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
    },

    async deleteCardioSession(id: string): Promise<void> {
      await database.cardioSessions.delete(id);
    },

    // Time Goal operations
    async getTimeGoals(): Promise<Record<string, TimeGoal>> {
      const goals = await database.timeGoals.toArray();
      const goalsMap: Record<string, TimeGoal> = {};

      // Initialize default goals if they don't exist
      if (!goals.some(g => g.id === 'zone2')) {
        await this.initializeTimeGoal('zone2');
      }
      if (!goals.some(g => g.id === 'anaerobic')) {
        await this.initializeTimeGoal('anaerobic');
      }

      const updatedGoals = await database.timeGoals.toArray();
      updatedGoals.forEach(goal => {
        goalsMap[goal.id] = goal;
      });

      return goalsMap;
    },

    async updateTimeGoal(goalId: string, updates: Partial<Omit<TimeGoal, 'id'>>): Promise<void> {
      await database.timeGoals.update(goalId, {
        ...updates,
        lastUpdated: new Date(),
      });
    },

    async resetTimeGoalProgress(goalId: string): Promise<void> {
      await this.updateTimeGoal(goalId, {
        currentWeekProgress: 0,
        lastUpdated: new Date(),
      });
    },

    async updateTimeGoalProgress(goalId: string, minutes: number): Promise<void> {
      const goal = await database.timeGoals.get(goalId);
      const now = new Date();

      // If goal doesn't exist, create it
      if (!goal) {
        await this.initializeTimeGoal(goalId as 'zone2' | 'anaerobic');
      }

      // Reset progress if it's a new week
      const lastUpdated = goal?.lastUpdated ? new Date(goal.lastUpdated) : now;
      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);

      if (lastUpdated < lastWeek) {
        await this.resetTimeGoalProgress(goalId);
      }

      // Update progress
      await database.timeGoals.update(goalId, {
        currentWeekProgress: (goal?.currentWeekProgress || 0) + minutes,
        lastUpdated: now,
      });
    },

    async initializeTimeGoal(goalId: 'zone2' | 'anaerobic'): Promise<void> {
      const defaultWeeklyGoal = goalId === 'zone2' ? 150 : 60; // 150 mins for zone2, 60 for anaerobic

      await database.timeGoals.put({
        id: goalId,
        weeklyGoal: defaultWeeklyGoal,
        currentWeekProgress: 0,
        lastUpdated: new Date(),
      });
    },

    // Utility methods
    async clearAllData(): Promise<void> {
      await Promise.all([
        database.lifts.clear(),
        database.exercises.clear(),
        database.subCategories.clear(),
        database.mainCategories.clear(),
        database.cardioSessions.clear(),
        database.timeGoals.clear(),
      ]);
      
      // Reinitialize time goals
      await database.timeGoals.bulkAdd([
        { id: 'zone2', weeklyGoal: 150, currentWeekProgress: 0, lastUpdated: new Date() },
        { id: 'anaerobic', weeklyGoal: 60, currentWeekProgress: 0, lastUpdated: new Date() },
      ]);
    },

    // Get all exercises with their category information
    async getAllExercisesWithCategories(): Promise<Array<Exercise & { mainCategoryName?: string; subCategoryName?: string }>> {
      const exercises = await database.exercises.toArray();
      const subCategories = await database.subCategories.toArray();
      const mainCategories = await database.mainCategories.toArray();

      // Create maps for quick lookup
      const subCategoryMap = new Map(subCategories.map(sc => [sc.id, sc]));
      const mainCategoryMap = new Map(mainCategories.map(mc => [mc.id, mc]));

      // Enrich exercises with category names
      return exercises.map(exercise => {
        const subCategory = subCategoryMap.get(exercise.subCategoryId);
        const mainCategory = subCategory ? mainCategoryMap.get(subCategory.mainCategoryId) : undefined;

        return {
          ...exercise,
          subCategoryName: subCategory?.name,
          mainCategoryName: mainCategory?.name
        };
      });
    }
  };
}

// Create and export the database service
const dbService = createDbService();

export { dbService };
export default dbService;
