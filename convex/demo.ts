import { mutation } from "./_generated/server";

// Aggressively consolidated list: Equipment variations are merged by movement pattern
const EXERCISES_DATA = [
  // Push
  ["Bench Press", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Incline Bench Press", "Push", "Chest", false, { chest: 1, shoulders: 1 }],
  ["Chest Press Machine", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Chest Fly", "Push", "Chest", false, { chest: 1 }],
  ["Close-Grip Bench Press", "Push", "Triceps", false, { chest: 1, shoulders: 0.5, triceps: 1 }],
  ["Push-Ups", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Dips", "Push", "Chest", true, { chest: 1, shoulders: 0.5, triceps: 0.5 }],
  
  // Legs
  ["Squat", "Legs", "Quads", false, { quads: 1, glutes: 0.8, core: 0.5 }],
  ["Romanian Deadlift", "Legs", "Hamstrings", false, { hamstrings: 1, glutes: 0.8 }],
  ["Leg Press", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Leg Extension", "Legs", "Quads", false, { quads: 1 }],
  ["Calf Raise", "Legs", "Calves", false, { calves: 1 }],
  
  // Pull
  ["Pull-up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Lat Pulldown", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Row", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Face Pull", "Pull", "Shoulders", false, { back: 0.5, shoulders: 0.8, upperTraps: 0.4 }],
  ["Bicep Curl", "Pull", "Biceps", false, { biceps: 1 }],
  
  // Extra Additions for Full Muscle Coverage
  ["Hanging Leg Raise", "Extra", "Core", true, { core: 1 }],
  ["Farmers Walk", "Extra", "Forearms", false, { forearms: 1, upperTraps: 0.5, core: 0.5 }],
  ["Neck Extension", "Extra", "Neck", false, { neck: 1 }]
];

const DEFAULT_GOALS = [
  { muscleGroup: "chest", lowGoal: 10, highGoal: 20 },
  { muscleGroup: "back", lowGoal: 10, highGoal: 20 },
  { muscleGroup: "quads", lowGoal: 8, highGoal: 15 },
  { muscleGroup: "hamstrings", lowGoal: 6, highGoal: 12 },
  { muscleGroup: "glutes", lowGoal: 4, highGoal: 10 },
  { muscleGroup: "shoulders", lowGoal: 8, highGoal: 16 },
  { muscleGroup: "triceps", lowGoal: 6, highGoal: 12 },
  { muscleGroup: "biceps", lowGoal: 6, highGoal: 12 },
  { muscleGroup: "calves", lowGoal: 6, highGoal: 12 },
  { muscleGroup: "core", lowGoal: 4, highGoal: 10 },
  { muscleGroup: "upperTraps", lowGoal: 4, highGoal: 10 },
  { muscleGroup: "forearms", lowGoal: 2, highGoal: 6 },
  { muscleGroup: "neck", lowGoal: 2, highGoal: 6 },
];

export const resetAndSeedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // THE IRONCLAD DEADBOLT
    const cloudUrl = process.env.CONVEX_CLOUD_URL;
    if (!cloudUrl?.includes("giddy-anaconda-476")) {
      throw new Error(`CRITICAL: Attempted to run demo seed on PROD. Cloud URL was: ${cloudUrl}`);
    }

    // 1. WIPE EVERYTHING
    const liftSets = await ctx.db.query("liftSets").collect();
    for (const ls of liftSets) await ctx.db.delete(ls._id);

    const cardio = await ctx.db.query("cardioSessions").collect();
    for (const c of cardio) await ctx.db.delete(c._id);

    const exercises = await ctx.db.query("exercises").collect();
    for (const ex of exercises) await ctx.db.delete(ex._id);

    const weeklyGoals = await ctx.db.query("weeklyGoals").collect();
    for (const wg of weeklyGoals) await ctx.db.delete(wg._id);

    // 2. SEED EXERCISES & GOALS
    for (const row of EXERCISES_DATA) {
      await ctx.db.insert("exercises", {
        name: row[0] as string, category: row[1] as string, subcategory: row[2] as string,
        isBodyweight: row[3] as boolean, muscleWeights: row[4] as any,
      });
    }

    for (const goal of DEFAULT_GOALS) {
      await ctx.db.insert("weeklyGoals", goal);
    }

    // 3. SEED 30-DAY HISTORY
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let week = 0; week < 4; week++) {
      const weekOffset = (4 - week) * 7 * msPerDay; 
      
      // MONDAY: PUSH + CORE
      const pushTime = now - weekOffset + (1 * msPerDay);
      await ctx.db.insert("liftSets", { exerciseName: "Bench Press", category: "Push", subcategory: "Chest", equipmentType: "Barbell", weight: 185 + (week * 5), reps: 8, sets: 4, volume: (185 + (week * 5)) * 8 * 4, timestamp: pushTime });
      await ctx.db.insert("liftSets", { exerciseName: "Incline Bench Press", category: "Push", subcategory: "Chest", equipmentType: "Dumbbell", weight: 65 + (week * 5), reps: 10, sets: 3, volume: (65 + (week * 5)) * 10 * 3, timestamp: pushTime + 1000 });
      await ctx.db.insert("liftSets", { exerciseName: "Chest Fly", category: "Push", subcategory: "Chest", equipmentType: "Machine/Cable", weight: 120 + (week * 5), reps: 12, sets: 3, volume: (120 + (week * 5)) * 12 * 3, timestamp: pushTime + 2000 });
      await ctx.db.insert("liftSets", { exerciseName: "Close-Grip Bench Press", category: "Push", subcategory: "Triceps", equipmentType: "Barbell", weight: 135 + (week * 5), reps: 10, sets: 3, volume: (135 + (week * 5)) * 10 * 3, timestamp: pushTime + 3000 });
      await ctx.db.insert("liftSets", { exerciseName: "Hanging Leg Raise", category: "Extra", subcategory: "Core", equipmentType: "Bodyweight", weight: 0, reps: 12 + week, sets: 3, volume: 0, timestamp: pushTime + 4000 });

      // TUESDAY: CARDIO
      await ctx.db.insert("cardioSessions", { timestamp: now - weekOffset + (2 * msPerDay), movementType: "Running", duration: 45, distance: 4.2, rpe: 4, zone: "Zone 2" });

      // WEDNESDAY: LEGS + NECK
      const legTime = now - weekOffset + (3 * msPerDay);
      await ctx.db.insert("liftSets", { exerciseName: "Squat", category: "Legs", subcategory: "Quads", equipmentType: "Barbell", weight: 225 + (week * 10), reps: 6, sets: 4, volume: (225 + (week * 10)) * 6 * 4, timestamp: legTime });
      await ctx.db.insert("liftSets", { exerciseName: "Romanian Deadlift", category: "Legs", subcategory: "Hamstrings", equipmentType: "Barbell", weight: 185 + (week * 5), reps: 8, sets: 3, volume: (185 + (week * 5)) * 8 * 3, timestamp: legTime + 1000 });
      await ctx.db.insert("liftSets", { exerciseName: "Leg Press", category: "Legs", subcategory: "Quads", equipmentType: "Machine/Cable", weight: 360 + (week * 10), reps: 10, sets: 3, volume: (360 + (week * 10)) * 10 * 3, timestamp: legTime + 2000 });
      await ctx.db.insert("liftSets", { exerciseName: "Calf Raise", category: "Legs", subcategory: "Calves", equipmentType: "Machine/Cable", weight: 100, reps: 20, sets: 4, volume: 100 * 20 * 4, timestamp: legTime + 3000 });
      await ctx.db.insert("liftSets", { exerciseName: "Neck Extension", category: "Extra", subcategory: "Neck", equipmentType: "Other", weight: 25, reps: 15, sets: 3, volume: 25 * 15 * 3, timestamp: legTime + 4000 });

      // FRIDAY: PULL + FOREARMS
      const pullTime = now - weekOffset + (5 * msPerDay);
      await ctx.db.insert("liftSets", { exerciseName: "Pull-up", category: "Pull", subcategory: "Back", equipmentType: "Bodyweight", weight: 0, reps: 6 + week, sets: 4, volume: 0, timestamp: pullTime });
      await ctx.db.insert("liftSets", { exerciseName: "Row", category: "Pull", subcategory: "Back", equipmentType: "Barbell", weight: 135 + (week * 5), reps: 10, sets: 3, volume: (135 + (week * 5)) * 10 * 3, timestamp: pullTime + 1000 });
      await ctx.db.insert("liftSets", { exerciseName: "Lat Pulldown", category: "Pull", subcategory: "Back", equipmentType: "Machine/Cable", weight: 120 + (week * 5), reps: 12, sets: 3, volume: (120 + (week * 5)) * 12 * 3, timestamp: pullTime + 2000 });
      await ctx.db.insert("liftSets", { exerciseName: "Face Pull", category: "Pull", subcategory: "Shoulders", equipmentType: "Machine/Cable", weight: 50 + (week * 2.5), reps: 15, sets: 3, volume: (50 + (week * 2.5)) * 15 * 3, timestamp: pullTime + 3000 });
      await ctx.db.insert("liftSets", { exerciseName: "Farmers Walk", category: "Extra", subcategory: "Forearms", equipmentType: "Dumbbell", weight: 100, reps: 1, sets: 3, volume: 100 * 3, timestamp: pullTime + 4000 });

      // SATURDAY: CARDIO
      await ctx.db.insert("cardioSessions", { timestamp: now - weekOffset + (6 * msPerDay), movementType: "Cycling", duration: 20, distance: 6.5, rpe: 9, zone: "Zone 5" });
    }

    return "Demo database fully loaded with goals, full muscle coverage, and complete history!";
  },
});