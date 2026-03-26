import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Cardio Sessions
export const getCardioSessions = query({
  args: {
    activityType: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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

    let sessions = await ctx.db
      .query("cardioSessions")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Filter by activity type if provided
    if (args.activityType) {
      sessions = sessions.filter(session => session.activityType === args.activityType);
    }

    // Filter by date range if provided
    if (args.startDate && args.endDate) {
      sessions = sessions.filter(session => 
        session.date >= args.startDate! && session.date <= args.endDate!
      );
    }

    return sessions.sort((a, b) => b.date - a.date);
  },
});

export const createCardioSession = mutation({
  args: {
    activityType: v.string(),
    time: v.number(),
    distance: v.optional(v.number()),
    date: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
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

    const sessionId = await ctx.db.insert("cardioSessions", {
      ...args,
      createdBy: user._id,
      createdAt: Date.now(),
    });

    // Update time goal progress
    if (args.activityType === "zone2" || args.activityType === "anaerobic") {
      await updateTimeGoalProgress(ctx, user._id, args.activityType, args.time);
    }

    return sessionId;
  },
});

// Time Goals
export const getTimeGoals = query({
  handler: async (ctx) => {
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

    return await ctx.db
      .query("timeGoals")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();
  },
});

export const updateTimeGoal = mutation({
  args: {
    activityType: v.string(),
    weeklyGoal: v.number(),
  },
  handler: async (ctx, args) => {
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

    const existingGoal = await ctx.db
      .query("timeGoals")
      .withIndex("by_activity_type", (q) => 
        q.eq("activityType", args.activityType).eq("createdBy", user._id)
      )
      .first();

    if (existingGoal) {
      await ctx.db.patch(existingGoal._id, {
        weeklyGoal: args.weeklyGoal,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("timeGoals", {
        activityType: args.activityType,
        weeklyGoal: args.weeklyGoal,
        currentWeekProgress: 0,
        lastUpdated: Date.now(),
        createdBy: user._id,
        createdAt: Date.now(),
      });
    }
  },
});

async function updateTimeGoalProgress(ctx: any, userId: any, activityType: string, minutes: number) {
  const goal = await ctx.db
    .query("timeGoals")
    .withIndex("by_activity_type", (q) => 
      q.eq("activityType", activityType).eq("createdBy", userId)
    )
    .first();

  const now = Date.now();
  
  if (goal) {
    // Check if it's a new week
    const lastUpdated = goal.lastUpdated;
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    if (now - lastUpdated > oneWeek) {
      // Reset progress for new week
      await ctx.db.patch(goal._id, {
        currentWeekProgress: minutes,
        lastUpdated: now,
      });
    } else {
      // Add to existing progress
      await ctx.db.patch(goal._id, {
        currentWeekProgress: goal.currentWeekProgress + minutes,
        lastUpdated: now,
      });
    }
  } else {
    // Create new goal with default values
    const defaultWeeklyGoal = activityType === "zone2" ? 150 : 60;
    await ctx.db.insert("timeGoals", {
      activityType,
      weeklyGoal: defaultWeeklyGoal,
      currentWeekProgress: minutes,
      lastUpdated: now,
      createdBy: userId,
      createdAt: now,
    });
  }
}
