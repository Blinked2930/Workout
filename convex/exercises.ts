import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getExercises = query({
  args: {
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let exercises = await ctx.db.query("exercises").collect();
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
    if (existing) return existing._id;
    return await ctx.db.insert("exercises", args);
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