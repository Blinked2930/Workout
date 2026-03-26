import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { dbService } from '../database';

describe('Category Management', () => {
  // Clear the database before each test
  beforeEach(async () => {
    try {
      // Clear all tables
      await Promise.all([
        dbService.db.mainCategories.clear(),
        dbService.db.subCategories.clear(),
        dbService.db.exercises.clear(),
      ]);
    } catch (error) {
      console.error('Error clearing test database:', error);
      throw error;
    }
  });

  describe('Main Categories', () => {
    it('should create a main category', async () => {
      const categoryName = 'Upper Body';
      const id = await dbService.createMainCategory({
        name: categoryName,
      });

      expect(id).toBeDefined();
      
      const category = await dbService.db.mainCategories.get(id);
      expect(category).toBeDefined();
      expect(category?.name).toBe(categoryName);
      expect(category?.createdAt).toBeInstanceOf(Date);
      expect(category?.updatedAt).toBeInstanceOf(Date);
    });

    it('should get all main categories', async () => {
      // Create test categories
      await dbService.createMainCategory({ name: 'Upper Body' });
      await dbService.createMainCategory({ name: 'Lower Body' });

      const categories = await dbService.getAllMainCategories();
      expect(categories).toHaveLength(2);
      
      // Sort categories by name to ensure consistent order
      const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
      expect(sortedCategories[0].name).toBe('Lower Body');
      expect(sortedCategories[1].name).toBe('Upper Body');
    });

    it('should update a main category', async () => {
      const id = await dbService.createMainCategory({
        name: 'Upper Body',
      });

      const updated = await dbService.updateMainCategory(id, { name: 'Upper Body 2' });
      expect(updated).toBe(1);

      const category = await dbService.db.mainCategories.get(id);
      expect(category?.name).toBe('Upper Body 2');
    });

    it('should not update a main category with subcategories', async () => {
      const mainCategoryId = await dbService.createMainCategory({
        name: 'Upper Body',
      });

      // Add a subcategory
      await dbService.db.subCategories.add({
        id: uuidv4(),
        name: 'Push',
        mainCategoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        dbService.updateMainCategory(mainCategoryId, { name: 'New Name' })
      ).rejects.toThrow('Cannot update category that has subcategories');
    });

    it('should delete a main category', async () => {
      const id = await dbService.createMainCategory({
        name: 'Upper Body',
      });

      await dbService.deleteMainCategory(id);
      
      const category = await dbService.db.mainCategories.get(id);
      expect(category).toBeUndefined();
    });

    it('should not delete a main category with subcategories', async () => {
      const mainCategoryId = await dbService.createMainCategory({
        name: 'Upper Body',
      });

      // Add a subcategory
      await dbService.db.subCategories.add({
        id: uuidv4(),
        name: 'Push',
        mainCategoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        dbService.deleteMainCategory(mainCategoryId)
      ).rejects.toThrow('Cannot delete category that has subcategories');
    });
  });

  describe('Sub Categories', () => {
    let mainCategoryId: string;

    beforeEach(async () => {
      mainCategoryId = await dbService.createMainCategory({
        name: 'Upper Body',
      });
    });

    it('should create a subcategory', async () => {
      const subCategoryName = 'Push';
      const id = await dbService.createSubCategory({
        name: subCategoryName,
        mainCategoryId,
      });

      expect(id).toBeDefined();
      
      const subCategory = await dbService.db.subCategories.get(id);
      expect(subCategory).toBeDefined();
      expect(subCategory?.name).toBe(subCategoryName);
      expect(subCategory?.mainCategoryId).toBe(mainCategoryId);
    });

    it('should not create a subcategory with invalid main category', async () => {
      await expect(
        dbService.createSubCategory({
          name: 'Push',
          mainCategoryId: 'nonexistent-id',
        })
      ).rejects.toThrow('Main category does not exist');
    });

    it('should get subcategories by main category', async () => {
      // Create some subcategories
      await dbService.createSubCategory({ name: 'Push', mainCategoryId });
      await dbService.createSubCategory({ name: 'Pull', mainCategoryId });
      
      // Create another main category and subcategory
      const otherMainCategoryId = await dbService.createMainCategory({
        name: 'Lower Body',
      });
      await dbService.createSubCategory({ 
        name: 'Legs', 
        mainCategoryId: otherMainCategoryId 
      });

      const subCategories = await dbService.getSubCategoriesByMainCategory(mainCategoryId);
      expect(subCategories).toHaveLength(2);
      expect(subCategories.some(sc => sc.name === 'Push')).toBe(true);
      expect(subCategories.some(sc => sc.name === 'Pull')).toBe(true);
    });

    it('should update a subcategory', async () => {
      const subCategoryId = await dbService.createSubCategory({
        name: 'Push',
        mainCategoryId,
      });

      const updated = await dbService.updateSubCategory(subCategoryId, { 
        name: 'Push Exercises' 
      });
      expect(updated).toBe(1);

      const subCategory = await dbService.db.subCategories.get(subCategoryId);
      expect(subCategory?.name).toBe('Push Exercises');
    });

    it('should not update a subcategory with exercises', async () => {
      const subCategoryId = await dbService.createSubCategory({
        name: 'Push',
        mainCategoryId,
      });

      // Add an exercise
      await dbService.db.exercises.add({
        id: uuidv4(),
        name: 'Bench Press',
        subCategoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        dbService.updateSubCategory(subCategoryId, { name: 'New Name' })
      ).rejects.toThrow('Cannot update subcategory that has exercises');
    });

    it('should not update to a non-existent main category', async () => {
      const subCategoryId = await dbService.createSubCategory({
        name: 'Push',
        mainCategoryId,
      });

      await expect(
        dbService.updateSubCategory(subCategoryId, { 
          mainCategoryId: 'nonexistent-id' 
        })
      ).rejects.toThrow('Main category does not exist');
    });

    it('should delete a subcategory', async () => {
      const subCategoryId = await dbService.createSubCategory({
        name: 'Push',
        mainCategoryId,
      });

      await dbService.deleteSubCategory(subCategoryId);
      
      const subCategory = await dbService.db.subCategories.get(subCategoryId);
      expect(subCategory).toBeUndefined();
    });

    it('should not delete a subcategory with exercises', async () => {
      const subCategoryId = await dbService.createSubCategory({
        name: 'Push',
        mainCategoryId,
      });

      // Add an exercise
      await dbService.db.exercises.add({
        id: uuidv4(),
        name: 'Bench Press',
        subCategoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        dbService.deleteSubCategory(subCategoryId)
      ).rejects.toThrow('Cannot delete subcategory that has exercises');
    });
  });

  describe('Full Exercise Details', () => {
    let mainCategoryId: string;
    let subCategoryId: string;
    let exerciseId: string;

    beforeEach(async () => {
      // Create a main category
      mainCategoryId = await dbService.createMainCategory({
        name: 'Upper Body',
      });

      // Create a subcategory
      subCategoryId = await dbService.createSubCategory({
        name: 'Push',
        mainCategoryId,
      });

      // Create an exercise
      exerciseId = await dbService.createExercise({
        name: 'Bench Press',
        subCategoryId,
        exerciseType: 'barbell',
      });
    });

    it('should get full exercise details', async () => {
      const details = await dbService.getFullExerciseDetails(exerciseId);
      
      expect(details).toBeDefined();
      expect(details?.exercise.name).toBe('Bench Press');
      expect(details?.subCategory.name).toBe('Push');
      expect(details?.mainCategory.name).toBe('Upper Body');
    });

    it('should return undefined for non-existent exercise', async () => {
      const details = await dbService.getFullExerciseDetails('nonexistent-id');
      expect(details).toBeUndefined();
    });

    it('should throw error for missing subcategory', async () => {
      // Delete the subcategory to simulate a broken reference
      await dbService.db.subCategories.delete(subCategoryId);
      
      await expect(
        dbService.getFullExerciseDetails(exerciseId)
      ).rejects.toThrow('Subcategory not found for exercise');
    });

    it('should throw error for missing main category', async () => {
      // Delete the main category to simulate a broken reference
      await dbService.db.mainCategories.delete(mainCategoryId);
      
      await expect(
        dbService.getFullExerciseDetails(exerciseId)
      ).rejects.toThrow('Main category not found for subcategory');
    });
  });
});
