import { mutation } from "./_generated/server";

// Expanded library to support full 5-exercise workout days
const EXERCISES_DATA = [
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
  // PPL Essentials
  ["Back Squat", "Legs", "Quads", false, { quads: 1, glutes: 0.8, core: 0.5 }],
  ["Romanian Deadlift", "Legs", "Hamstrings", false, { hamstrings: 1, glutes: 0.8 }],
  ["Leg Press", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Leg Extension", "Legs", "Quads", false, { quads: 1 }],
  ["Calf Raise", "Legs", "Calves", false, { calves: 1 }],
  ["Pull-up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Lat Pulldown", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Barbell Row", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Face Pull", "Pull", "Shoulders", false, { back: 0.5, shoulders: 0.8, upperTraps: 0.4 }],
  ["Bicep Curl", "Pull", "Biceps", false, { biceps: 1 }]
];

export const resetAndSeedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.DEMO_MODE !== "true") {
      console.log("Not in DEMO_MODE. Aborting.");
      return "Aborted: Not Demo Environment";
    }

    console.log("DEMO_MODE active. Generating massive realistic workout history...");

    // 1. WIPE EVERYTHING
    const liftSets = await ctx.db.query("liftSets").collect();
    for (const ls of liftSets) await ctx.db.delete(ls._id);

    const cardio = await ctx.db.query("cardioSessions").collect();
    for (const c of cardio) await ctx.db.delete(c._id);

    const exercises = await ctx.db.query("exercises").collect();
    for (const ex of exercises) await ctx.db.delete(ex._id);

    // 2. SEED EXERCISE DATABASE
    for (const row of EXERCISES_DATA) {
      await ctx.db.insert("exercises", {
        name: row[0] as string, category: row[1] as string, subcategory: row[2] as string,
        isBodyweight: row[3] as boolean, muscleWeights: row[4] as any,
      });
    }

    // 3. SEED REALISTIC 30-DAY HISTORY (5 Exercises per Workout)
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let week = 0; week < 4; week++) {
      const weekOffset = (4 - week) * 7 * msPerDay; 
      
      // ==========================================
      // MONDAY: HEAVY PUSH DAY (5 Exercises)
      // ==========================================
      const pushTime = now - weekOffset + (1 * msPerDay);
      await ctx.db.insert("liftSets", {
        exerciseName: "Bench press", category: "Push", subcategory: "Chest", equipmentType: "Barbell",
        weight: 185 + (week * 5), reps: 8, sets: 4, volume: (185 + (week * 5)) * 8 * 4, e1rm: (185 + (week * 5)) * (36 / (37 - 8)), timestamp: pushTime
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Incline DB bench", category: "Push", subcategory: "Chest", equipmentType: "Dumbbell",
        weight: 65 + (week * 5), reps: 10, sets: 3, volume: (65 + (week * 5)) * 10 * 3, e1rm: (65 + (week * 5)) * (36 / (37 - 10)), timestamp: pushTime + 1000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Pec Deck Machine", category: "Push", subcategory: "Chest", equipmentType: "Machine/Cable",
        weight: 120 + (week * 5), reps: 12, sets: 3, volume: (120 + (week * 5)) * 12 * 3, e1rm: (120 + (week * 5)) * (36 / (37 - 12)), timestamp: pushTime + 2000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Close-Grip Bench Press", category: "Push", subcategory: "Triceps", equipmentType: "Barbell",
        weight: 135 + (week * 5), reps: 10, sets: 3, volume: (135 + (week * 5)) * 10 * 3, e1rm: (135 + (week * 5)) * (36 / (37 - 10)), timestamp: pushTime + 3000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Dips - Chest Focused", category: "Push", subcategory: "Chest", equipmentType: "Bodyweight",
        weight: 0, reps: 8 + week, sets: 3, volume: 0, e1rm: 0, timestamp: pushTime + 4000
      });

      // TUESDAY: CARDIO (Zone 2)
      await ctx.db.insert("cardioSessions", {
        timestamp: now - weekOffset + (2 * msPerDay), movementType: "Running",
        duration: 45, distance: 4.2, rpe: 4, zone: "Zone 2", notes: "Easy neighborhood jog."
      });

      // ==========================================
      // WEDNESDAY: LEGS DAY (5 Exercises)
      // ==========================================
      const legTime = now - weekOffset + (3 * msPerDay);
      await ctx.db.insert("liftSets", {
        exerciseName: "Back Squat", category: "Legs", subcategory: "Quads", equipmentType: "Barbell",
        weight: 225 + (week * 10), reps: 6, sets: 4, volume: (225 + (week * 10)) * 6 * 4, e1rm: (225 + (week * 10)) * (36 / (37 - 6)), timestamp: legTime
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Romanian Deadlift", category: "Legs", subcategory: "Hamstrings", equipmentType: "Barbell",
        weight: 185 + (week * 5), reps: 8, sets: 3, volume: (185 + (week * 5)) * 8 * 3, e1rm: (185 + (week * 5)) * (36 / (37 - 8)), timestamp: legTime + 1000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Leg Press", category: "Legs", subcategory: "Quads", equipmentType: "Machine/Cable",
        weight: 360 + (week * 10), reps: 10, sets: 3, volume: (360 + (week * 10)) * 10 * 3, e1rm: (360 + (week * 10)) * (36 / (37 - 10)), timestamp: legTime + 2000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Leg Extension", category: "Legs", subcategory: "Quads", equipmentType: "Machine/Cable",
        weight: 110 + (week * 5), reps: 15, sets: 3, volume: (110 + (week * 5)) * 15 * 3, e1rm: (110 + (week * 5)) * (36 / (37 - 15)), timestamp: legTime + 3000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Calf Raise", category: "Legs", subcategory: "Calves", equipmentType: "Machine/Cable",
        weight: 100, reps: 20, sets: 4, volume: 100 * 20 * 4, e1rm: 100 * (36 / (37 - 20)), timestamp: legTime + 4000
      });

      // ==========================================
      // FRIDAY: PULL DAY (5 Exercises)
      // ==========================================
      const pullTime = now - weekOffset + (5 * msPerDay);
      await ctx.db.insert("liftSets", {
        exerciseName: "Pull-up", category: "Pull", subcategory: "Back", equipmentType: "Bodyweight",
        weight: 0, reps: 6 + week, sets: 4, volume: 0, e1rm: 0, timestamp: pullTime, notes: "Strict form."
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Barbell Row", category: "Pull", subcategory: "Back", equipmentType: "Barbell",
        weight: 135 + (week * 5), reps: 10, sets: 3, volume: (135 + (week * 5)) * 10 * 3, e1rm: (135 + (week * 5)) * (36 / (37 - 10)), timestamp: pullTime + 1000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Lat Pulldown", category: "Pull", subcategory: "Back", equipmentType: "Machine/Cable",
        weight: 120 + (week * 5), reps: 12, sets: 3, volume: (120 + (week * 5)) * 12 * 3, e1rm: (120 + (week * 5)) * (36 / (37 - 12)), timestamp: pullTime + 2000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Face Pull", category: "Pull", subcategory: "Shoulders", equipmentType: "Machine/Cable",
        weight: 50 + (week * 2.5), reps: 15, sets: 3, volume: (50 + (week * 2.5)) * 15 * 3, e1rm: (50 + (week * 2.5)) * (36 / (37 - 15)), timestamp: pullTime + 3000
      });
      await ctx.db.insert("liftSets", {
        exerciseName: "Bicep Curl", category: "Pull", subcategory: "Biceps", equipmentType: "Dumbbell",
        weight: 30 + (week * 2.5), reps: 12, sets: 3, volume: (30 + (week * 2.5)) * 12 * 3, e1rm: (30 + (week * 2.5)) * (36 / (37 - 12)), timestamp: pullTime + 4000
      });

      // SATURDAY: CARDIO (HIIT)
      await ctx.db.insert("cardioSessions", {
        timestamp: now - weekOffset + (6 * msPerDay), movementType: "Cycling",
        duration: 20, distance: 6.5, rpe: 9, zone: "Zone 5", notes: "Norwegian 4x4s."
      });
    }

    return "Massive 5-exercise-per-day Demo database successfully seeded!";
  },
});