import { describe, it, expect } from 'vitest';
import { calculateVolume, calculateE1RM, findBestVolumeSet, findHeaviestLift } from '../calculations';

describe('Exercise Calculations', () => {
  describe('calculateVolume', () => {
    it('calculates volume for a single set', () => {
      expect(calculateVolume(100, 10)).toBe(1000); // 100 * 10 = 1000
    });

    it('handles each side weight (e.g., dumbbells)', () => {
      expect(calculateVolume(50, 8, true)).toBe(800); // (50 * 2) * 8 = 800
    });

    it('returns 0 for 0 reps', () => {
      expect(calculateVolume(100, 0)).toBe(0);
    });
  });

  describe('calculateE1RM', () => {
    it('returns the same weight for 1 rep', () => {
      expect(calculateE1RM(100, 1)).toBe(100);
    });

    it('calculates e1RM for multiple reps', () => {
      // 100 * (1 + 5/30) = 100 * 1.1666... ≈ 116.67
      expect(calculateE1RM(100, 5)).toBeCloseTo(116.67, 2);
    });

    it('returns 0 for 0 reps', () => {
      expect(calculateE1RM(100, 0)).toBe(0);
    });
  });

  describe('findBestVolumeSet', () => {
    const testLifts = [
      { weight: 100, reps: 5, isEachSide: false },  // 500
      { weight: 80, reps: 10, isEachSide: false },  // 800 (best volume)
      { weight: 60, reps: 8, isEachSide: true },    // 960 (best with each side)
      { weight: 50, reps: 12, isEachSide: false },  // 600
    ];

    it('finds the set with the highest volume', () => {
      const result = findBestVolumeSet(testLifts);
      expect(result.volume).toBe(960);
      expect(result.set).toEqual(testLifts[2]);
    });

    it('returns null for empty array', () => {
      const result = findBestVolumeSet([]);
      expect(result.volume).toBe(0);
      expect(result.set).toBeNull();
    });
  });

  describe('findHeaviestLift', () => {
    const testLifts = [
      { weight: 100, reps: 5, isEachSide: false },  // 100
      { weight: 80, reps: 10, isEachSide: false },  // 80
      { weight: 60, reps: 8, isEachSide: true },    // 120 (heaviest with each side)
      { weight: 50, reps: 12, isEachSide: false },  // 50
    ];

    it('finds the heaviest lift', () => {
      const result = findHeaviestLift(testLifts);
      expect(result.weight).toBe(120);
      expect(result.set).toEqual(testLifts[2]);
    });

    it('returns 0 for empty array', () => {
      const result = findHeaviestLift([]);
      expect(result.weight).toBe(0);
      expect(result.set).toBeNull();
    });
  });
});
