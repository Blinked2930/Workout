import { mutation } from "./_generated/server";
import { v } from "convex/values";

const exercises = [
  // CHEST
  { name: "Bench Press", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 1.0, shoulders: 0.5, triceps: 0.5 } },
  { name: "Incline Bench Press", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 0.9, shoulders: 0.6, triceps: 0.5 } },
  { name: "Decline Bench Press", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 0.9, shoulders: 0.4, triceps: 0.5 } },
  { name: "Dumbbell Bench Press", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 1.0, shoulders: 0.5, triceps: 0.5 } },
  { name: "Incline Dumbbell Press", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 0.9, shoulders: 0.6, triceps: 0.5 } },
  { name: "Decline Dumbbell Press", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 0.9, shoulders: 0.4, triceps: 0.5 } },
  { name: "Chest Fly", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 1.0, shoulders: 0.2 } },
  { name: "Incline Fly", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 0.9, shoulders: 0.3 } },
  { name: "Decline Fly", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 0.9, shoulders: 0.1 } },
  { name: "Pec Deck", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 1.0, shoulders: 0.2 } },
  { name: "Cable Fly", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 1.0, shoulders: 0.2 } },
  { name: "Push Up", category: "Push", subcategory: "Chest", isBodyweight: true, muscleWeights: { chest: 1.0, shoulders: 0.5, triceps: 0.5 } },
  { name: "Weighted Push Up", category: "Push", subcategory: "Chest", isBodyweight: false, muscleWeights: { chest: 1.0, shoulders: 0.5, triceps: 0.5 } },
  // SHOULDERS
  { name: "Overhead Press", category: "Push", subcategory: "Shoulders", isBodyweight: false, muscleWeights: { shoulders: 1.0, triceps: 0.5 } },
  { name: "Dumbbell Shoulder Press", category: "Push", subcategory: "Shoulders", isBodyweight: false, muscleWeights: { shoulders: 1.0, triceps: 0.5 } },
  { name: "Arnold Press", category: "Push", subcategory: "Shoulders", isBodyweight: false, muscleWeights: { shoulders: 1.0, triceps: 0.5 } },
  { name: "Lateral Raise", category: "Push", subcategory: "Shoulders", isBodyweight: false, muscleWeights: { shoulders: 1.0 } },
  { name: "Front Raise", category: "Push", subcategory: "Shoulders", isBodyweight: false, muscleWeights: { shoulders: 1.0 } },
  { name: "Reverse Fly", category: "Push", subcategory: "Shoulders", isBodyweight: false, muscleWeights: { shoulders: 0.8, back: 0.2 } },
  { name: "Face Pull", category: "Pull", subcategory: "Shoulders", isBodyweight: false, muscleWeights: { shoulders: 0.6, back: 0.4 } },
  // TRICEPS
  { name: "Tricep Pushdown", category: "Push", subcategory: "Triceps", isBodyweight: false, muscleWeights: { triceps: 1.0 } },
  { name: "Skullcrusher", category: "Push", subcategory: "Triceps", isBodyweight: false, muscleWeights: { triceps: 1.0 } },
  { name: "Overhead Tricep Extension", category: "Push", subcategory: "Triceps", isBodyweight: false, muscleWeights: { triceps: 1.0 } },
  { name: "Close Grip Bench Press", category: "Push", subcategory: "Triceps", isBodyweight: false, muscleWeights: { triceps: 1.0, chest: 0.5, shoulders: 0.5 } },
  { name: "Diamond Push Up", category: "Push", subcategory: "Triceps", isBodyweight: true, muscleWeights: { triceps: 1.0, chest: 0.5, shoulders: 0.5 } },
  // BACK
  { name: "Pull Up", category: "Pull", subcategory: "Back", isBodyweight: true, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Weighted Pull Up", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Chin Up", category: "Pull", subcategory: "Back", isBodyweight: true, muscleWeights: { back: 0.8, biceps: 0.7 } },
  { name: "Lat Pulldown", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Seated Row", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Bent Over Row", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "T‑Bar Row", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Cable Row", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Single Arm Dumbbell Row", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Inverted Row", category: "Pull", subcategory: "Back", isBodyweight: true, muscleWeights: { back: 1.0, biceps: 0.5 } },
  { name: "Straight Arm Pulldown", category: "Pull", subcategory: "Back", isBodyweight: false, muscleWeights: { back: 1.0 } },
  // UPPER TRAPS
  { name: "Barbell Shrug", category: "Pull", subcategory: "Upper Traps", isBodyweight: false, muscleWeights: { upperTraps: 1.0 } },
  { name: "Dumbbell Shrug", category: "Pull", subcategory: "Upper Traps", isBodyweight: false, muscleWeights: { upperTraps: 1.0 } },
  // BICEPS
  { name: "Barbell Curl", category: "Pull", subcategory: "Biceps", isBodyweight: false, muscleWeights: { biceps: 1.0 } },
  { name: "Dumbbell Curl", category: "Pull", subcategory: "Biceps", isBodyweight: false, muscleWeights: { biceps: 1.0 } },
  { name: "Hammer Curl", category: "Pull", subcategory: "Biceps", isBodyweight: false, muscleWeights: { biceps: 1.0, forearms: 0.5 } },
  { name: "Preacher Curl", category: "Pull", subcategory: "Biceps", isBodyweight: false, muscleWeights: { biceps: 1.0 } },
  { name: "Concentration Curl", category: "Pull", subcategory: "Biceps", isBodyweight: false, muscleWeights: { biceps: 1.0 } },
  { name: "Cable Curl", category: "Pull", subcategory: "Biceps", isBodyweight: false, muscleWeights: { biceps: 1.0 } },
  // LEGS
  { name: "Squat", category: "Legs", subcategory: "Quads", isBodyweight: false, muscleWeights: { quads: 1.0, glutes: 0.8, hamstrings: 0.5 } },
  { name: "Front Squat", category: "Legs", subcategory: "Quads", isBodyweight: false, muscleWeights: { quads: 1.0, glutes: 0.6 } },
  { name: "Leg Press", category: "Legs", subcategory: "Quads", isBodyweight: false, muscleWeights: { quads: 1.0, glutes: 0.7, hamstrings: 0.5 } },
  { name: "Hack Squat", category: "Legs", subcategory: "Quads", isBodyweight: false, muscleWeights: { quads: 1.0, glutes: 0.5 } },
  { name: "Bulgarian Split Squat", category: "Legs", subcategory: "Quads", isBodyweight: false, muscleWeights: { quads: 1.0, glutes: 0.8, hamstrings: 0.3 } },
  { name: "Lunge", category: "Legs", subcategory: "Quads", isBodyweight: true, muscleWeights: { quads: 1.0, glutes: 0.8, hamstrings: 0.3 } },
  { name: "Deadlift", category: "Legs", subcategory: "Hamstrings", isBodyweight: false, muscleWeights: { hamstrings: 1.0, glutes: 0.8, back: 0.6 } },
  { name: "Romanian Deadlift", category: "Legs", subcategory: "Hamstrings", isBodyweight: false, muscleWeights: { hamstrings: 1.0, glutes: 0.6 } },
  { name: "Leg Curl", category: "Legs", subcategory: "Hamstrings", isBodyweight: false, muscleWeights: { hamstrings: 1.0 } },
  { name: "Hip Thrust", category: "Legs", subcategory: "Glutes", isBodyweight: false, muscleWeights: { glutes: 1.0, hamstrings: 0.5 } },
  { name: "Glute Bridge", category: "Legs", subcategory: "Glutes", isBodyweight: true, muscleWeights: { glutes: 1.0 } },
  { name: "Calf Raise", category: "Legs", subcategory: "Calves", isBodyweight: false, muscleWeights: { calves: 1.0 } },
  { name: "Seated Calf Raise", category: "Legs", subcategory: "Calves", isBodyweight: false, muscleWeights: { calves: 1.0 } },
  // FOREARMS / NECK / CORE
  { name: "Wrist Curl", category: "Pull", subcategory: "Forearms", isBodyweight: false, muscleWeights: { forearms: 1.0 } },
  { name: "Farmer's Walk", category: "Pull", subcategory: "Forearms", isBodyweight: false, muscleWeights: { forearms: 1.0 } },
  { name: "Neck Flexion", category: "Core", subcategory: "Neck", isBodyweight: false, muscleWeights: { neck: 1.0 } },
  { name: "Neck Extension", category: "Core", subcategory: "Neck", isBodyweight: false, muscleWeights: { neck: 1.0 } },
  { name: "Plank", category: "Core", subcategory: "Core", isBodyweight: true, muscleWeights: { core: 1.0 } },
  { name: "Side Plank", category: "Core", subcategory: "Core", isBodyweight: true, muscleWeights: { core: 1.0 } },
  { name: "Crunches", category: "Core", subcategory: "Core", isBodyweight: true, muscleWeights: { core: 1.0 } },
  { name: "Leg Raise", category: "Core", subcategory: "Core", isBodyweight: true, muscleWeights: { core: 1.0 } },
  { name: "Russian Twist", category: "Core", subcategory: "Core", isBodyweight: false, muscleWeights: { core: 1.0 } },
  { name: "Cable Crunch", category: "Core", subcategory: "Core", isBodyweight: false, muscleWeights: { core: 1.0 } },
  { name: "Hanging Leg Raise", category: "Core", subcategory: "Core", isBodyweight: true, muscleWeights: { core: 1.0 } },
];

export const seedExercises = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing exercises
    const existing = await ctx.db.query("exercises").collect();
    for (const ex of existing) {
      await ctx.db.delete(ex._id);
    }

    // Insert all exercises
    for (const ex of exercises) {
      await ctx.db.insert("exercises", ex);
    }
  },
});