import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Lifts
export const getLifts = query({
  args: {
    exerciseId: v.optional(v.id("exercises")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, { exerciseId, startDate, endDate }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let lifts;

    if (exerciseId) {
      lifts = await ctx.db
        .query("lifts")
        .withIndex("by_exercise", (q) => q.eq("exerciseId", exerciseId))
        .filter((q) => q.eq(q.field("createdBy"), user._id))
        .collect();
    } else {
      lifts = await ctx.db
        .query("lifts")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      lifts = lifts.filter(lift => 
        lift.date >= startDate && lift.date <= endDate
      );
    }

    return lifts.sort((a, b) => b.date - a.date);
  },
});

export const createLift = mutation({
  args: {
    exerciseId: v.id("exercises"),
    weight: v.number(),
    reps: v.number(),
    isEachSide: v.boolean(),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { exerciseId, weight, reps, isEachSide, date, notes }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.db.insert("lifts", {
      exerciseId,
      weight,
      reps,
      isEachSide,
      date,
      notes,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const updateLift = mutation({
  args: {
    liftId: v.id("lifts"),
    weight: v.optional(v.number()),
    reps: v.optional(v.number()),
    isEachSide: v.optional(v.boolean()),
    date: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const lift = await ctx.db.get(args.liftId);
    if (!lift) {
      throw new Error("Lift not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || lift.createdBy !== user._id) {
      throw new Error("Unauthorized");
    }

    const { liftId, ...updates } = args;
    await ctx.db.patch(args.liftId, updates);
  },
});

export const deleteLift = mutation({
  args: {
    liftId: v.id("lifts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const lift = await ctx.db.get(args.liftId);
    if (!lift) {
      throw new Error("Lift not found");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || lift.createdBy !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.liftId);
  },
});
