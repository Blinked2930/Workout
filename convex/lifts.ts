import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logSet = mutation({
  args: {
    exerciseName: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    weight: v.number(),
    addedWeight: v.optional(v.number()),
    reps: v.number(),
    sets: v.number(),
    rir: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const effectiveWeight = args.weight + (args.addedWeight ?? 0);
    const volume = effectiveWeight * args.reps * args.sets;
    const e1rm = effectiveWeight > 0
      ? effectiveWeight * (1 + args.reps / 30)
      : undefined;

    return await ctx.db.insert("liftSets", {
      timestamp: Date.now(),
      exerciseName: args.exerciseName,
      category: args.category,
      subcategory: args.subcategory,
      weight: args.weight,
      addedWeight: args.addedWeight,
      reps: args.reps,
      sets: args.sets,
      rir: args.rir,
      notes: args.notes,
      volume,
      e1rm,
    });
  },
});

export const getLifts = query({
  args: {
    exerciseName: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let lifts = await ctx.db
      .query("liftSets")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    if (args.exerciseName) {
      lifts = lifts.filter(l => l.exerciseName === args.exerciseName);
    }
    if (args.startDate) {
      lifts = lifts.filter(l => l.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      lifts = lifts.filter(l => l.timestamp <= args.endDate!);
    }
    return lifts;
  },
});

export const getThisWeeksLifts = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const startOfWeek = now - (new Date().getDay() * 86400000);
    const monday = new Date(startOfWeek);
    monday.setHours(0, 0, 0, 0);

    return await ctx.db
      .query("liftSets")
      .withIndex("by_timestamp")
      .filter(q => q.gte(q.field("timestamp"), monday.getTime()))
      .collect();
  },
});

export const deleteSet = mutation({
  args: { id: v.id("liftSets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});