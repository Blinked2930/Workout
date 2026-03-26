import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase, createDbService } from '../database';
import { v4 as uuidv4 } from 'uuid';
import { createTestDatabase, cleanupTestDatabase } from '../../test/test-utils';

let db: ReturnType<typeof createDatabase>;
let dbService: ReturnType<typeof createDbService>;
let exerciseId: string;

beforeEach(async () => {
  // Create a fresh database for each test
  db = await createTestDatabase();
  dbService = createDbService(db);
  
  // Create a test exercise
  exerciseId = uuidv4();
  await db.exercises.add({
    id: exerciseId,
    name: 'Bench Press',
    subCategoryId: 'chest',
    exerciseType: 'barbell',
    defaultRestTime: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
});

afterEach(async () => {
  // Clean up the test database
  if (db) {
    await cleanupTestDatabase(db);
  }
});

describe('Database Service', () => {
  describe('Exercise Operations', () => {
    it('should create a new exercise', async () => {
      const exerciseData = {
        name: 'Squat',
        subCategoryId: 'legs',
        exerciseType: 'barbell' as const,
        defaultRestTime: 120,
      };

      const id = await dbService.createExercise(exerciseData);
      expect(id).toBeDefined();

      const exercise = await dbService.getExercise(id);
      expect(exercise).toBeDefined();
      expect(exercise?.name).toBe('Squat');
      expect(exercise?.subCategoryId).toBe('legs');
      expect(exercise?.exerciseType).toBe('barbell');
      expect(exercise?.defaultRestTime).toBe(120);
      expect(exercise?.createdAt).toBeInstanceOf(Date);
      expect(exercise?.updatedAt).toBeInstanceOf(Date);
    });

    it('should retrieve all exercises', async () => {
      // Create another exercise
      await dbService.createExercise({
        name: 'Squat',
        subCategoryId: 'legs',
        exerciseType: 'barbell',
        defaultRestTime: 120,
      });
      
      const exercises = await dbService.getAllExercises();
      expect(exercises).toHaveLength(2);
      expect(exercises.some(e => e.name === 'Bench Press')).toBe(true);
      expect(exercises.some(e => e.name === 'Squat')).toBe(true);
    });

    it('should update an exercise', async () => {
      // First, create an exercise to update
      const exerciseId = await dbService.createExercise({
        name: 'Squat',
        subCategoryId: 'legs',
        exerciseType: 'barbell',
        defaultRestTime: 120,
      });

      // Update the exercise
      await dbService.updateExercise(exerciseId, {
        name: 'Back Squat',
        defaultRestTime: 180,
      });

      // Verify the update
      const updatedExercise = await dbService.getExercise(exerciseId);
      expect(updatedExercise).toBeDefined();
      expect(updatedExercise?.name).toBe('Back Squat');
      expect(updatedExercise?.defaultRestTime).toBe(180);
      // Should not change other fields
      expect(updatedExercise?.subCategoryId).toBe('legs');
      expect(updatedExercise?.exerciseType).toBe('barbell');
      // Should update the updatedAt timestamp
      expect(updatedExercise?.updatedAt.getTime()).toBeGreaterThan(
        updatedExercise?.createdAt.getTime() || 0
      );
    });

    it('should delete an exercise', async () => {
      // First, create an exercise to delete
      const exerciseId = await dbService.createExercise({
        name: 'Squat',
        subCategoryId: 'legs',
        exerciseType: 'barbell',
        defaultRestTime: 120,
      });

      // Delete the exercise
      await dbService.deleteExercise(exerciseId);

      // Verify it's deleted
      const deletedExercise = await dbService.getExercise(exerciseId);
      expect(deletedExercise).toBeUndefined();
    });
  });

  describe('Lift Operations', () => {
    it('should create a new lift', async () => {
      const liftData = {
        exerciseId,
        date: new Date(),
        weight: 100,
        reps: 5,
        isEachSide: false,
        notes: 'Felt good today',
      };

      const id = await dbService.createLift(liftData);
      expect(id).toBeDefined();

      // Get the lift through the service
      const lifts = await dbService.getLiftsForExercise(exerciseId);
      const lift = lifts.find(l => l.id === id);
      
      expect(lift).toBeDefined();
      expect(lift?.exerciseId).toBe(exerciseId);
      expect(lift?.weight).toBe(100);
      expect(lift?.reps).toBe(5);
      expect(lift?.notes).toBe('Felt good today');
      expect(lift?.isEachSide).toBe(false);
      expect(lift?.createdAt).toBeInstanceOf(Date);
      expect(lift?.updatedAt).toBeInstanceOf(Date);
    });

    it('should retrieve lifts for an exercise', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      
      // Create two lifts for the test exercise
      await dbService.createLift({
        exerciseId,
        date: now,
        weight: 100,
        reps: 5,
        isEachSide: false,
      });

      await dbService.createLift({
        exerciseId,
        date: yesterday,
        weight: 95,
        reps: 6,
        isEachSide: false,
      });

      const lifts = await dbService.getLiftsForExercise(exerciseId);
      expect(lifts).toHaveLength(2);
      // Should be sorted by date (oldest first)
      expect(lifts[0].weight).toBe(95);
      expect(lifts[1].weight).toBe(100);
    });

    it('should update a lift', async () => {
      // First, create a lift to update
      const liftId = await dbService.createLift({
        exerciseId,
        date: new Date(),
        weight: 100,
        reps: 5,
        isEachSide: false,
        notes: 'First attempt',
      });

      // Update the lift
      await dbService.updateLift(liftId, {
        weight: 105,
        reps: 6,
        notes: 'Increased weight and reps',
      });

      // Verify the update
      const lifts = await dbService.getLiftsForExercise(exerciseId);
      const updatedLift = lifts.find(l => l.id === liftId);
      
      expect(updatedLift).toBeDefined();
      expect(updatedLift?.weight).toBe(105);
      expect(updatedLift?.reps).toBe(6);
      expect(updatedLift?.notes).toBe('Increased weight and reps');
      expect(updatedLift?.isEachSide).toBe(false); // Should not change
      expect(updatedLift?.updatedAt.getTime()).toBeGreaterThan(
        updatedLift?.createdAt.getTime() || 0
      );
    });

    it('should delete a lift', async () => {
      // First, create a lift to delete
      const liftId = await dbService.createLift({
        exerciseId,
        date: new Date(),
        weight: 100,
        reps: 5,
        isEachSide: false,
      });

      // Delete the lift
      await dbService.deleteLift(liftId);

      // Verify it's deleted
      const lifts = await dbService.getLiftsForExercise(exerciseId);
      const deletedLift = lifts.find(l => l.id === liftId);
      expect(deletedLift).toBeUndefined();
    });

    it('should handle non-existent lift operations', async () => {
      const nonExistentId = 'non-existent-id';
      
      // Try to update a non-existent lift
      await expect(
        dbService.updateLift(nonExistentId, { weight: 100 })
      ).resolves.not.toThrow();
      
      // Try to delete a non-existent lift
      await expect(
        dbService.deleteLift(nonExistentId)
      ).resolves.not.toThrow();
    });
  });

  describe('Time Goals', () => {
    it('should have default time goals', async () => {
      const zone2Goal = await dbService.db.timeGoals.get('zone2');
      const anaerobicGoal = await dbService.db.timeGoals.get('anaerobic');

      expect(zone2Goal).toBeDefined();
      expect(anaerobicGoal).toBeDefined();
      expect(zone2Goal?.weeklyGoal).toBe(150);
      expect(anaerobicGoal?.weeklyGoal).toBe(75);
    });
  });
});
