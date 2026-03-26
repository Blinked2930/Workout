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

  // Dexie's methods are already properly typed
}

// Create a function to create a new database instance
export function createDatabase(name = 'LiftLogDatabase'): LiftLogDatabase {
  // Add type assertion to handle Dexie's complex types
  type DatabaseWithTables = LiftLogDatabase & {
    mainCategories: Table<MainCategory, string>;
    subCategories: Table<SubCategory, string>;
    exercises: Table<Exercise, string>;
    lifts: Table<Lift, string>;
    cardioSessions: Table<CardioSession, string>;
    timeGoals: Table<TimeGoal, string>;
  };
  
  const db = new LiftLogDatabase(name) as DatabaseWithTables;
  // Initialize default time goals if they don't exist
  const initializeDatabase = async () => {
    const defaultTimeGoals: TimeGoal[] = [
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
    ];

    try {
      await Promise.all(
        defaultTimeGoals.map(async (goal) => {
          const exists = await db.timeGoals.get(goal.id);
          if (!exists) {
            await db.timeGoals.add(goal);
          }
        })
      );
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  };

  // Initialize the database
  initializeDatabase().catch(console.error);
  
  return db;
}

// Default database instance for the application
export const db = createDatabase();

export default db;

type CreateLiftData = Omit<Lift, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateLiftData = Partial<Omit<Lift, 'id' | 'exerciseId' | 'createdAt' | 'updatedAt'>>;
type CreateExerciseData = Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateExerciseData = Partial<Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>>;
type CreateMainCategoryData = Omit<MainCategory, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateMainCategoryData = Partial<Omit<MainCategory, 'id' | 'createdAt' | 'updatedAt'>>;
type CreateSubCategoryData = Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateSubCategoryData = Partial<Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt'>>;

// Create a service factory that can work with any database instance
export function createDbService(database: LiftLogDatabase = db) {
  return {
    // Expose the database instance for testing
    db: database,
    // Lift operations
    async createLift(liftData: CreateLiftData): Promise<string> {
      try {
        const id = uuidv4();
        const now = new Date();
        const liftToAdd = {
          ...liftData,
          id,
          date: liftData.date || now, // Ensure date is set
          weight: liftData.weight || 0, // Default weight
          reps: liftData.reps || 0, // Default reps
          isEachSide: liftData.isEachSide || false, // Default isEachSide
          createdAt: now,
          updatedAt: now,
        };
        
        console.log('Adding lift to database:', liftToAdd);
        await database.lifts.add(liftToAdd);
        console.log('Successfully added lift with ID:', id);
        return id;
      } catch (error) {
        console.error('Error in createLift:', error);
        throw error; // Re-throw the error to be caught by the caller
      }
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
      let collection = database.exercises.toCollection();
      
      if (subCategoryId) {
        collection = database.exercises.where('subCategoryId').equals(subCategoryId);
      }
      
      const exercises = await collection.toArray();
      const queryLower = query.toLowerCase();
      
      return exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(queryLower)
      );
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
      const count = await database.subCategories.where('mainCategoryId').equals(id).count();
      if (count > 0) {
        throw new Error('Cannot update category that has subcategories');
      }
      return database.mainCategories.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
    },

    async deleteMainCategory(id: string): Promise<void> {
      const subCategoryCount = await database.subCategories.where('mainCategoryId').equals(id).count();
      if (subCategoryCount > 0) {
        throw new Error('Cannot delete category that has subcategories');
      }
      await database.mainCategories.delete(id);
    },

    // Sub Category operations
    async getAllSubCategories(): Promise<SubCategory[]> {
      return database.subCategories.toArray();
    },

    async getSubCategoriesByMainCategory(mainCategoryId: string): Promise<SubCategory[]> {
      return database.subCategories.where('mainCategoryId').equals(mainCategoryId).toArray();
    },

    async createSubCategory(categoryData: CreateSubCategoryData): Promise<string> {
      // Verify main category exists
      const mainCategory = await database.mainCategories.get(categoryData.mainCategoryId);
      if (!mainCategory) {
        throw new Error('Main category does not exist');
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
        return database.subCategories
          .where('mainCategoryId')
          .equals(mainCategoryId)
          .toArray();
      }
      return database.subCategories.toArray();
    },

    async updateSubCategory(id: string, updates: UpdateSubCategoryData): Promise<number> {
      if (updates.mainCategoryId) {
        // Verify the new main category exists
        const mainCategory = await database.mainCategories.get(updates.mainCategoryId);
        if (!mainCategory) {
          throw new Error('Main category does not exist');
        }
      }

      const exerciseCount = await database.exercises.where('subCategoryId').equals(id).count();
      if (exerciseCount > 0) {
        throw new Error('Cannot update subcategory that has exercises');
      }

      return database.subCategories.update(id, {
        ...updates,
        updatedAt: new Date(),
      });
    },

    async deleteSubCategory(id: string): Promise<void> {
      const exerciseCount = await database.exercises.where('subCategoryId').equals(id).count();
      if (exerciseCount > 0) {
        throw new Error('Cannot delete subcategory that has exercises');
      }
      await database.subCategories.delete(id);
    },

    // Exercise details
    async getFullExerciseDetails(exerciseId: string): Promise<{
      exercise: Exercise;
      subCategory: SubCategory;
      mainCategory: MainCategory;
    } | undefined> {
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
    async getAllExercisesWithDetails(): Promise<Array<Exercise & { mainCategoryName?: string; subCategoryName?: string }>> {
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

// Default service instance using the default database
export const dbService = createDbService();
