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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cardioSessions", {
      timestamp: Date.now(),
      ...args,
    });
  },
});

export const getCardioSessions = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    zone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let sessions = await ctx.db
      .query("cardioSessions")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    if (args.zone) {
      sessions = sessions.filter(s => s.zone === args.zone);
    }
    if (args.startDate) {
      sessions = sessions.filter(s => s.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      sessions = sessions.filter(s => s.timestamp <= args.endDate!);
    }
    return sessions;
  },
});

export const getThisWeeksCardio = query({
  args: {},
  handler: async (ctx) => {
    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
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