/**
 * Utility functions for exercise-related calculations
 */

/**
 * Calculate the volume of a lift (weight × reps)
 * @param weight - The weight used
 * @param reps - The number of repetitions
 * @param isEachSide - Whether the weight is per side (e.g., dumbbells)
 * @returns The total volume
 */
export const calculateVolume = (
  weight: number,
  reps: number,
  isEachSide: boolean = false
): number => {
  const effectiveWeight = isEachSide ? weight * 2 : weight;
  return effectiveWeight * reps;
};

/**
 * Calculate estimated 1 Rep Max using the Epley formula
 * @param weight - The weight used
 * @param reps - The number of repetitions
 * @returns The estimated 1 Rep Max
 */
export const calculateE1RM = (weight: number, reps: number): number => {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  
  // Epley formula: e1RM = weight × (1 + reps/30)
  return weight * (1 + reps / 30);
};

/**
 * Calculate the best set by volume
 * @param lifts - Array of lift objects with weight, reps, and isEachSide properties
 * @returns The best set with highest volume
 */
export const findBestVolumeSet = <T extends { weight: number; reps: number; isEachSide?: boolean }>(
  lifts: T[]
): { volume: number; set: T | null } => {
  if (!lifts.length) return { volume: 0, set: null };
  
  let bestSet = lifts[0];
  let bestVolume = calculateVolume(bestSet.weight, bestSet.reps, bestSet.isEachSide);
  
  for (let i = 1; i < lifts.length; i++) {
    const currentVolume = calculateVolume(lifts[i].weight, lifts[i].reps, lifts[i].isEachSide);
    if (currentVolume > bestVolume) {
      bestVolume = currentVolume;
      bestSet = lifts[i];
    }
  }
  
  return { volume: bestVolume, set: bestSet };
};

/**
 * Calculate the heaviest lift
 * @param lifts - Array of lift objects with weight and isEachSide properties
 * @returns The heaviest weight lifted
 */
export const findHeaviestLift = <T extends { weight: number; isEachSide?: boolean }>(
  lifts: T[]
): { weight: number; set: T | null } => {
  if (!lifts.length) return { weight: 0, set: null };
  
  let heaviest = lifts[0];
  let maxWeight = heaviest.isEachSide ? heaviest.weight * 2 : heaviest.weight;
  
  for (let i = 1; i < lifts.length; i++) {
    const currentWeight = lifts[i].isEachSide ? lifts[i].weight * 2 : lifts[i].weight;
    if (currentWeight > maxWeight) {
      maxWeight = currentWeight;
      heaviest = lifts[i];
    }
  }
  
  return { weight: maxWeight, set: heaviest };
};
