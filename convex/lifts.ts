import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logSet = mutation({
  args: {
    exerciseName: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    equipmentType: v.optional(v.string()), // <-- This allows the backend to accept the equipment!
    weight: v.number(),
    addedWeight: v.optional(v.number()),
    reps: v.number(),
    sets: v.number(),
    rir: v.optional(v.number()),
    notes: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Smart Dumbbell Math for Volume/e1RM
    const calcWeight = args.equipmentType === 'Dumbbell' ? args.weight * 2 : args.weight;
    const effectiveWeight = calcWeight + (args.addedWeight ?? 0);
    
    const volume = effectiveWeight * args.reps * args.sets;
    const e1rm = effectiveWeight > 0
      ? effectiveWeight * (1 + args.reps / 30)
      : undefined;

    return await ctx.db.insert("liftSets", {
      timestamp: args.timestamp ?? Date.now(),
      exerciseName: args.exerciseName,
      category: args.category,
      subcategory: args.subcategory,
      equipmentType: args.equipmentType,
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

export const updateSet = mutation({
  args: {
    id: v.id("liftSets"),
    equipmentType: v.optional(v.string()),
    weight: v.number(),
    reps: v.number(),
    sets: v.number(),
    rir: v.optional(v.number()),
    notes: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    // Smart Dumbbell Math for Volume/e1RM on edits
    const calcWeight = updates.equipmentType === 'Dumbbell' ? updates.weight * 2 : updates.weight;
    const effectiveWeight = calcWeight; 
    
    const volume = effectiveWeight * updates.reps * updates.sets;
    const e1rm = effectiveWeight > 0
      ? effectiveWeight * (1 + updates.reps / 30)
      : undefined;

    await ctx.db.patch(id, {
      ...updates,
      volume,
      e1rm,
      timestamp: updates.timestamp ?? Date.now(),
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
    // Monday-Start Logic
    const day = new Date().getDay();
    const diff = day === 0 ? 6 : day - 1; 
    const startOfWeek = now - (diff * 86400000);
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