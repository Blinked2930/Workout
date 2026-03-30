import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const logCardio = mutation({
  args: {
    movementType: v.string(),
    duration: v.number(),
    distance: v.optional(v.number()),
    rpe: v.optional(v.number()),
    zone: v.string(),
    notes: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cardioSessions", {
      timestamp: args.timestamp ?? Date.now(),
      movementType: args.movementType,
      duration: args.duration,
      distance: args.distance,
      rpe: args.rpe,
      zone: args.zone,
      notes: args.notes,
    });
  },
});

export const updateCardio = mutation({
  args: {
    id: v.id("cardioSessions"),
    movementType: v.string(),
    duration: v.number(),
    distance: v.optional(v.number()),
    rpe: v.optional(v.number()),
    zone: v.string(),
    notes: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      timestamp: updates.timestamp ?? Date.now(),
    });
  },
});

export const getCardioSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cardioSessions")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
  },
});

export const getThisWeeksCardio = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // 👇 Monday-Start Logic
    const day = new Date().getDay();
    const diff = day === 0 ? 6 : day - 1; // If Sunday (0), go back 6 days. Otherwise go back (day - 1) days.
    const startOfWeek = now - (diff * 86400000);
    const monday = new Date(startOfWeek);
    monday.setHours(0, 0, 0, 0);

    return await ctx.db
      .query("cardioSessions")
      .withIndex("by_timestamp")
      .filter(q => q.gte(q.field("timestamp"), monday.getTime()))
      .collect();
  },
});

export const deleteCardio = mutation({
  args: { id: v.id("cardioSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});