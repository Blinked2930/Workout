// convex/demo.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const resetAndSeedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // 🛑 ABSOLUTE SAFETY LOCK 🛑
    if (process.env.DEMO_MODE !== "true") {
      console.log("Not in DEMO_MODE. Aborting reset to protect personal data.");
      return "Aborted: Not Demo Environment";
    }

    console.log("DEMO_MODE active. Resetting and seeding database...");

    // 1. WIPE EXISTING LIFTS
    const existingLifts = await ctx.db.query("lifts").collect();
    for (const lift of existingLifts) {
      await ctx.db.delete(lift._id);
    }

    // 2. WIPE EXISTING EXERCISES
    const existingExercises = await ctx.db.query("exercises").collect();
    for (const ex of existingExercises) {
      await ctx.db.delete(ex._id);
    }

    // 3. SEED DEFAULT EXERCISES
    const exercisesToSeed = [
      { name: "Bench Press", category: "Push", subcategory: "Chest" },
      { name: "Back Squat", category: "Legs", subcategory: "Quads" },
      { name: "Pull-up", category: "Pull", subcategory: "Lats" },
    ];

    for (const ex of exercisesToSeed) {
      await ctx.db.insert("exercises", ex);
    }

    // 4. SEED REALISTIC 30-DAY HISTORY
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let week = 0; week < 4; week++) {
      const weekOffset = (4 - week) * 7 * msPerDay; 
      
      // Bench Press (Mondays)
      await ctx.db.insert("lifts", {
        exerciseName: "Bench Press",
        category: "Push",
        equipmentType: "Barbell",
        weight: 135 + (week * 5),
        reps: 8,
        sets: 3,
        volume: (135 + (week * 5)) * 8 * 3,
        e1rm: (135 + (week * 5)) * (36 / (37 - 8)),
        timestamp: now - weekOffset + (1 * msPerDay),
        notes: "Felt strong today!"
      });

      // Back Squat (Wednesdays)
      await ctx.db.insert("lifts", {
        exerciseName: "Back Squat",
        category: "Legs",
        equipmentType: "Barbell",
        weight: 185 + (week * 10), 
        reps: 6,
        sets: 3,
        volume: (185 + (week * 10)) * 6 * 3,
        e1rm: (185 + (week * 10)) * (36 / (37 - 6)),
        timestamp: now - weekOffset + (3 * msPerDay),
      });

      // Pull-ups (Fridays)
      await ctx.db.insert("lifts", {
        exerciseName: "Pull-up",
        category: "Pull",
        equipmentType: "Bodyweight",
        weight: 0, 
        reps: 5 + week, 
        sets: 3,
        volume: 0,
        e1rm: 0,
        timestamp: now - weekOffset + (5 * msPerDay),
        notes: "Strict form."
      });
    }

    return "Demo database reset and successfully seeded!";
  },
});