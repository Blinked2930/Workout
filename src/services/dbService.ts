import { db } from './database';
import { Exercise, MainCategory, SubCategory } from '../types/database';

export const dbService = {
  // Exercise operations
  async getAllExercises(): Promise<Array<Exercise & { mainCategoryName?: string; subCategoryName?: string }>> {
    const exercises = await db.exercises.toArray();
    const subCategories = await db.subCategories.toArray();
    const mainCategories = await db.mainCategories.toArray();
    
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
  },
  
  // Add other database operations as needed
  async getMainCategories(): Promise<MainCategory[]> {
    return db.mainCategories.toArray();
  },
  
  async getSubCategories(mainCategoryId?: string): Promise<SubCategory[]> {
    if (mainCategoryId) {
      return db.subCategories.where('mainCategoryId').equals(mainCategoryId).toArray();
    }
    return db.subCategories.toArray();
  },
  
  async createExercise(data: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.exercises.add({
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
};

export default dbService;
