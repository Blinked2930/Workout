import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDatabase, createDbService } from '../database';
import { createTestDatabase, cleanupTestDatabase } from '../../test/test-utils';

describe('Database Service', () => {
  let db: ReturnType<typeof createDatabase>;
  let dbService: ReturnType<typeof createDbService>;

  beforeEach(async () => {
    // Create a fresh database for each test
    db = await createTestDatabase();
    dbService = createDbService(db);
  });

  afterEach(async () => {
    // Clean up the test database
    if (db) {
      await cleanupTestDatabase(db);
    }
  });

  describe('Exercise Operations', () => {
    it('should create a new exercise', async () => {
      const exerciseData = {
        name: 'Bench Press',
        subCategoryId: 'sub-1',
        exerciseType: 'barbell' as const,
        defaultRestTime: 90,
      };

      const id = await dbService.createExercise(exerciseData);
      expect(id).toBeDefined();

      const exercise = await dbService.db.exercises.get(id);
      expect(exercise).toMatchObject({
        ...exerciseData,
        id,
      });
      expect(exercise?.createdAt).toBeInstanceOf(Date);
      expect(exercise?.updatedAt).toBeInstanceOf(Date);
    });

    it('should retrieve an exercise by id', async () => {
      const exerciseData = {
        name: 'Squat',
        subCategoryId: 'sub-1',
      };

      const id = await dbService.createExercise(exerciseData);
      const exercise = await dbService.getExercise(id);

      expect(exercise).toMatchObject({
        id,
        ...exerciseData,
      });
    });

    it('should retrieve all exercises', async () => {
      const exercises = [
        { name: 'Bench Press', subCategoryId: 'sub-1' },
        { name: 'Squat', subCategoryId: 'sub-1' },
        { name: 'Deadlift', subCategoryId: 'sub-1' },
      ];

      await Promise.all(exercises.map(ex => dbService.createExercise(ex)));
      const allExercises = await dbService.getAllExercises();

      expect(allExercises).toHaveLength(exercises.length);
      expect(allExercises.map(e => e.name)).toEqual(
        expect.arrayContaining(exercises.map(e => e.name))
      );
    });

    it('should update an exercise', async () => {
      const id = await dbService.createExercise({
        name: 'Old Name',
        subCategoryId: 'sub-1',
      });

      await dbService.updateExercise(id, { name: 'New Name' });
      const updated = await dbService.getExercise(id);

      expect(updated?.name).toBe('New Name');
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        updated?.createdAt.getTime() || 0
      );
    });

    it('should delete an exercise', async () => {
      const id = await dbService.createExercise({
        name: 'To Be Deleted',
        subCategoryId: 'sub-1',
      });

      await dbService.deleteExercise(id);
      const exercise = await dbService.getExercise(id);

      expect(exercise).toBeUndefined();
    });
  });

  describe('Lift Operations', () => {
    let exerciseId: string;

    beforeEach(async () => {
      // Create a test exercise
      exerciseId = await dbService.createExercise({
        name: 'Test Exercise',
        subCategoryId: 'sub-1',
        exerciseType: 'barbell',
        defaultRestTime: 90,
      });
    });

    it('should create a new lift', async () => {
      const liftData = {
        exerciseId,
        date: new Date(),
        weight: 135,
        reps: 5,
        rir: 2,
        notes: 'Felt good',
        isEachSide: false,
      };

      const id = await dbService.createLift(liftData);
      expect(id).toBeDefined();

      const lift = await db.lifts.get(id);
      expect(lift).toMatchObject({
        ...liftData,
        id,
      });
      expect(lift?.createdAt).toBeInstanceOf(Date);
      expect(lift?.updatedAt).toBeInstanceOf(Date);
    });

    it('should retrieve lifts for an exercise', async () => {
      const now = new Date();
      const lifts = [
        { 
          exerciseId, 
          date: new Date(now.getTime() - 86400000), 
          weight: 135, 
          reps: 5, 
          isEachSide: false 
        },
        { 
          exerciseId, 
          date: now, 
          weight: 140, 
          reps: 5, 
          isEachSide: false 
        },
      ];

      await Promise.all(lifts.map(lift => dbService.createLift(lift)));
      const exerciseLifts = await dbService.getLiftsForExercise(exerciseId);

      expect(exerciseLifts).toHaveLength(lifts.length);
      // Should be sorted by date desc, so the second lift (140) should come first
      expect(exerciseLifts[0].weight).toBe(135);
      expect(exerciseLifts[1].weight).toBe(140);
    });

    it('should update a lift', async () => {
      const id = await dbService.createLift({
        exerciseId,
        date: new Date(),
        weight: 135,
        reps: 5,
        isEachSide: false,
      });

      await dbService.updateLift(id, { weight: 140, reps: 6 });
      const updated = await db.lifts.get(id);

      expect(updated?.weight).toBe(140);
      expect(updated?.reps).toBe(6);
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        updated?.createdAt.getTime() || 0
      );
    });

    it('should delete a lift', async () => {
      const id = await dbService.createLift({
        exerciseId,
        date: new Date(),
        weight: 135,
        reps: 5,
        isEachSide: false,
      });

      await dbService.deleteLift(id);
      const lift = await db.lifts.get(id);

      expect(lift).toBeUndefined();
    });
  });
});
