import { mutation } from "./_generated/server";

export const resetAndSeedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // 🛑 ABSOLUTE SAFETY LOCK 🛑
    if (process.env.DEMO_MODE !== "true") {
      console.log("Not in DEMO_MODE. Aborting reset to protect personal data.");
      return "Aborted: Not Demo Environment";
    }

    console.log("DEMO_MODE active. Resetting and seeding database...");

    // 1. WIPE EXISTING LIFTS & EXERCISES
    const existingLifts = await ctx.db.query("lifts").collect();
    for (const lift of existingLifts) await ctx.db.delete(lift._id);

    const existingExercises = await ctx.db.query("exercises").collect();
    for (const ex of existingExercises) await ctx.db.delete(ex._id);

    // 2. SEED MASSIVE EXERCISE DATABASE (With Muscle Weights for AI/Volume tracking)
    const exercisesToSeed = [
      { name: "Barbell Bench Press", category: "Push", subcategory: "Chest", muscleWeights: { chest: 1, shoulders: 0.2, triceps: 0.5 } },
      { name: "Incline Dumbbell Press", category: "Push", subcategory: "Chest", muscleWeights: { chest: 1, shoulders: 0.6, triceps: 0.4 } },
      { name: "Overhead Press", category: "Push", subcategory: "Shoulders", muscleWeights: { shoulders: 1, triceps: 0.6, upperTraps: 0.3 } },
      { name: "Lateral Raise", category: "Push", subcategory: "Shoulders", muscleWeights: { shoulders: 1 } },
      { name: "Tricep Pushdown", category: "Push", subcategory: "Triceps", muscleWeights: { triceps: 1 } },
      { name: "Pull-up", category: "Pull", subcategory: "Back", muscleWeights: { back: 1, biceps: 0.5 } },
      { name: "Lat Pulldown", category: "Pull", subcategory: "Back", muscleWeights: { back: 1, biceps: 0.4 } },
      { name: "Barbell Row", category: "Pull", subcategory: "Back", muscleWeights: { back: 1, biceps: 0.4, upperTraps: 0.5 } },
      { name: "Bicep Curl", category: "Pull", subcategory: "Biceps", muscleWeights: { biceps: 1 } },
      { name: "Face Pull", category: "Pull", subcategory: "Shoulders", muscleWeights: { back: 0.5, shoulders: 0.8, upperTraps: 0.4 } },
      { name: "Back Squat", category: "Legs", subcategory: "Quads", muscleWeights: { quads: 1, glutes: 0.8, hamstrings: 0.4, core: 0.5 } },
      { name: "Romanian Deadlift", category: "Legs", subcategory: "Hamstrings", muscleWeights: { hamstrings: 1, glutes: 0.8, back: 0.5 } },
      { name: "Leg Press", category: "Legs", subcategory: "Quads", muscleWeights: { quads: 1, glutes: 0.5 } },
      { name: "Leg Extension", category: "Legs", subcategory: "Quads", muscleWeights: { quads: 1 } },
      { name: "Calf Raise", category: "Legs", subcategory: "Calves", muscleWeights: { calves: 1 } },
      { name: "Hanging Leg Raise", category: "Extra", subcategory: "Core", muscleWeights: { core: 1 } },
      { name: "Plank", category: "Extra", subcategory: "Core", muscleWeights: { core: 1 } }
    ];
    for (const ex of exercisesToSeed) await ctx.db.insert("exercises", ex);

    // 3. SEED REALISTIC 30-DAY HISTORY (Push/Pull/Legs Split)
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let week = 0; week < 4; week++) {
      const weekOffset = (4 - week) * 7 * msPerDay; 
      
      // MONDAY: PUSH DAY
      await ctx.db.insert("lifts", {
        exerciseName: "Barbell Bench Press", category: "Push", equipmentType: "Barbell",
        weight: 185 + (week * 5), reps: 8, sets: 3, volume: (185 + (week * 5)) * 8 * 3,
        e1rm: (185 + (week * 5)) * (36 / (37 - 8)), timestamp: now - weekOffset + (1 * msPerDay), notes: "Felt strong today! Good bar path."
      });
      await ctx.db.insert("lifts", {
        exerciseName: "Incline Dumbbell Press", category: "Push", equipmentType: "Dumbbell",
        weight: 65 + (week * 5), reps: 10, sets: 3, volume: (65 + (week * 5)) * 10 * 3,
        e1rm: (65 + (week * 5)) * (36 / (37 - 10)), timestamp: now - weekOffset + (1 * msPerDay)
      });
      await ctx.db.insert("lifts", {
        exerciseName: "Tricep Pushdown", category: "Push", equipmentType: "Machine/Cable",
        weight: 50 + (week * 2.5), reps: 12, sets: 3, volume: (50 + (week * 2.5)) * 12 * 3,
        e1rm: (50 + (week * 2.5)) * (36 / (37 - 12)), timestamp: now - weekOffset + (1 * msPerDay), notes: "Great pump."
      });

      // WEDNESDAY: LEGS DAY
      await ctx.db.insert("lifts", {
        exerciseName: "Back Squat", category: "Legs", equipmentType: "Barbell",
        weight: 225 + (week * 10), reps: 6, sets: 3, volume: (225 + (week * 10)) * 6 * 3,
        e1rm: (225 + (week * 10)) * (36 / (37 - 6)), timestamp: now - weekOffset + (3 * msPerDay)
      });
      await ctx.db.insert("lifts", {
        exerciseName: "Romanian Deadlift", category: "Legs", equipmentType: "Barbell",
        weight: 185 + (week * 5), reps: 8, sets: 3, volume: (185 + (week * 5)) * 8 * 3,
        e1rm: (185 + (week * 5)) * (36 / (37 - 8)), timestamp: now - weekOffset + (3 * msPerDay)
      });
      await ctx.db.insert("lifts", {
        exerciseName: "Calf Raise", category: "Legs", equipmentType: "Machine/Cable",
        weight: 100, reps: 15, sets: 4, volume: 100 * 15 * 4,
        e1rm: 100 * (36 / (37 - 15)), timestamp: now - weekOffset + (3 * msPerDay)
      });

      // FRIDAY: PULL DAY
      await ctx.db.insert("lifts", {
        exerciseName: "Pull-up", category: "Pull", equipmentType: "Bodyweight",
        weight: 0, reps: 6 + week, sets: 3, volume: 0, e1rm: 0,
        timestamp: now - weekOffset + (5 * msPerDay), notes: "Strict form. Paused at the bottom."
      });
      await ctx.db.insert("lifts", {
        exerciseName: "Barbell Row", category: "Pull", equipmentType: "Barbell",
        weight: 135 + (week * 5), reps: 10, sets: 3, volume: (135 + (week * 5)) * 10 * 3,
        e1rm: (135 + (week * 5)) * (36 / (37 - 10)), timestamp: now - weekOffset + (5 * msPerDay)
      });
      await ctx.db.insert("lifts", {
        exerciseName: "Bicep Curl", category: "Pull", equipmentType: "Dumbbell",
        weight: 30 + (week * 2.5), reps: 12, sets: 3, volume: (30 + (week * 2.5)) * 12 * 3,
        e1rm: (30 + (week * 2.5)) * (36 / (37 - 12)), timestamp: now - weekOffset + (5 * msPerDay)
      });
    }

    return "Massive Demo database reset and successfully seeded!";
  },
});