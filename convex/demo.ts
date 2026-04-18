import { mutation } from "./_generated/server";

// This is the expanded library from your screenshot + necessary PPL exercises
const EXERCISES_DATA = [
  // Push / Chest
  ["Cable cross over", "Push", "Chest", false, { chest: 1 }],
  ["Bench press", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Incline bench", "Push", "Chest", false, { chest: 1, shoulders: 1 }],
  ["Chest press machine one arm", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["DB bench", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Smith machine incline press", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Push-Ups", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Incline Push-Ups", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Decline Push-Ups", "Push", "Chest", true, { chest: 1, core: 0.5 }],
  ["Incline DB bench", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Chest press machine", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Dips - Chest Focused", "Push", "Chest", true, { chest: 1, shoulders: 0.5 }],
  ["Barbell Incline Press", "Push", "Chest", false, { chest: 1, shoulders: 1 }],
  ["Barbell Flys - Flat", "Push", "Chest", false, { chest: 1 }],
  ["Barbell Flys - Incline", "Push", "Chest", false, { chest: 1 }],
  ["Pec Deck Machine", "Push", "Chest", false, { chest: 1 }],
  ["Close-Grip Bench Press", "Push", "Chest", false, { chest: 1, shoulders: 0.5, triceps: 0.5 }],
  ["Archer Push-Ups", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Ring Dips (Bulgarian)", "Push", "Chest", true, { chest: 1, shoulders: 0.5, triceps: 0.5 }],
  ["Ring Flys", "Push", "Chest", true, { chest: 1 }],
  ["RTO Push-Ups", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Pseudo Planche Push-Ups", "Push", "Chest", true, { chest: 1, shoulders: 1, core: 0.5 }],
  // Additional for PPL Seeding
  ["Back Squat", "Legs", "Quads", false, { quads: 1, glutes: 0.8, core: 0.5 }],
  ["Pull-up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Barbell Row", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Bicep Curl", "Pull", "Biceps", false, { biceps: 1 }],
  ["Romanian Deadlift", "Legs", "Hamstrings", false, { hamstrings: 1, glutes: 0.8 }],
  ["Calf Raise", "Legs", "Calves", false, { calves: 1 }]
];

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

    // 2. SEED EXERCISE DATABASE
    for (const row of EXERCISES_DATA) {
      await ctx.db.insert("exercises", {
        name: row[0] as string,
        category: row[1] as string,
        subcategory: row[2] as string,
        isBodyweight: row[3] as boolean,
        muscleWeights: row[4] as any,
      });
    }

    // 3. SEED REALISTIC 30-DAY HISTORY (Push/Pull/Legs Split)
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let week = 0; week < 4; week++) {
      const weekOffset = (4 - week) * 7 * msPerDay; 
      
      // MONDAY: PUSH DAY
      await ctx.db.insert("lifts", {
        exerciseName: "Bench press", category: "Push", equipmentType: "Barbell",
        weight: 185 + (week * 5), reps: 8, sets: 3, volume: (185 + (week * 5)) * 8 * 3,
        e1rm: (185 + (week * 5)) * (36 / (37 - 8)), timestamp: now - weekOffset + (1 * msPerDay), notes: "Felt strong today!"
      });

      // WEDNESDAY: LEGS DAY
      await ctx.db.insert("lifts", {
        exerciseName: "Back Squat", category: "Legs", equipmentType: "Barbell",
        weight: 225 + (week * 10), reps: 6, sets: 3, volume: (225 + (week * 10)) * 6 * 3,
        e1rm: (225 + (week * 10)) * (36 / (37 - 6)), timestamp: now - weekOffset + (3 * msPerDay)
      });

      // FRIDAY: PULL DAY
      await ctx.db.insert("lifts", {
        exerciseName: "Pull-up", category: "Pull", equipmentType: "Bodyweight",
        weight: 0, reps: 6 + week, sets: 3, volume: 0, e1rm: 0,
        timestamp: now - weekOffset + (5 * msPerDay), notes: "Strict form."
      });
    }

    return "Massive Demo database reset and successfully seeded!";
  },
});