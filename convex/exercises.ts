import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getExercises = query({
  args: {
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let exercises = await ctx.db.query("exercises").collect();
    
    // Filter out archived exercises so they don't clutter your main views
    exercises = exercises.filter(e => !e.isArchived);

    if (args.category) {
      exercises = exercises.filter(e => e.category === args.category);
    }
    if (args.subcategory) {
      exercises = exercises.filter(e => e.subcategory === args.subcategory);
    }
    return exercises.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const searchExercises = query({
  args: { search: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("exercises").collect();
    const lower = args.search.toLowerCase();
    return all
      .filter(e => !e.isArchived) // Hide archived from search
      .filter(e => e.name.toLowerCase().includes(lower))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20);
  },
});

export const addExercise = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    isBodyweight: v.boolean(),
    muscleWeights: v.object({
      chest: v.optional(v.number()),
      shoulders: v.optional(v.number()),
      triceps: v.optional(v.number()),
      back: v.optional(v.number()),
      upperTraps: v.optional(v.number()),
      biceps: v.optional(v.number()),
      glutes: v.optional(v.number()),
      quads: v.optional(v.number()),
      hamstrings: v.optional(v.number()),
      calves: v.optional(v.number()),
      forearms: v.optional(v.number()),
      neck: v.optional(v.number()),
      core: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("exercises")
      .filter(q => q.eq(q.field("name"), args.name))
      .first();
      
    // If it exists but is archived, we un-archive it instead of making a duplicate
    if (existing) {
      if (existing.isArchived) {
        await ctx.db.patch(existing._id, { isArchived: false, ...args });
      }
      return existing._id;
    }
    
    return await ctx.db.insert("exercises", { ...args, isArchived: false });
  },
});

export const updateExercise = mutation({
  args: {
    id: v.id("exercises"),
    name: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    isBodyweight: v.boolean(),
    muscleWeights: v.object({
      chest: v.optional(v.number()),
      shoulders: v.optional(v.number()),
      triceps: v.optional(v.number()),
      back: v.optional(v.number()),
      upperTraps: v.optional(v.number()),
      biceps: v.optional(v.number()),
      glutes: v.optional(v.number()),
      quads: v.optional(v.number()),
      hamstrings: v.optional(v.number()),
      calves: v.optional(v.number()),
      forearms: v.optional(v.number()),
      neck: v.optional(v.number()),
      core: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteExercise = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const archiveExercise = mutation({
  args: { id: v.id("exercises") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isArchived: true });
  },
});

// --- ONE-TIME CLEANUP SCRIPT ---
// You can delete this entire function after you run it from the Convex Dashboard!
export const runOneTimeMerge = mutation({
  args: {},
  handler: async (ctx) => {
    // ⚠️ EDIT THIS ARRAY WITH YOUR EXACT EXERCISE NAMES BEFORE RUNNING ⚠️
    const merges = [
      { oldName: "DB Lunge", newName: "Lunge", equipmentType: "Dumbbell" },
      { oldName: "Barbell Lunge", newName: "Lunge", equipmentType: "Barbell" },
      { oldName: "Bodyweight Lunge", newName: "Lunge", equipmentType: "Bodyweight" },
      // Add as many pairs as you need here...
    ];

    for (const m of merges) {
      // 1. Find all historical sets for the old name
      const setsToUpdate = await ctx.db
        .query("liftSets")
        .withIndex("by_exercise", (q) => q.eq("exerciseName", m.oldName))
        .collect();

      // 2. Update every set with the new name, equipment, and recalculated math
      for (const set of setsToUpdate) {
        const calcWeight = m.equipmentType === 'Dumbbell' ? set.weight * 2 : set.weight;
        const effectiveWeight = calcWeight + (set.addedWeight ?? 0);
        
        const volume = effectiveWeight * set.reps * set.sets;
        const e1rm = effectiveWeight > 0 ? effectiveWeight * (1 + set.reps / 30) : undefined;

        await ctx.db.patch(set._id, {
          exerciseName: m.newName,
          equipmentType: m.equipmentType,
          volume,
          e1rm,
        });
      }

      // 3. Find the old master exercise and archive it so it disappears from your app
      const oldEx = await ctx.db
        .query("exercises")
        .filter(q => q.eq(q.field("name"), m.oldName))
        .first();
        
      if (oldEx) {
        await ctx.db.patch(oldEx._id, { isArchived: true });
      }
    }
  }
});