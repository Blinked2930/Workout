import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getWeeklyGoals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("weeklyGoals").collect();
  },
});

export const seedWeeklyGoals = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("weeklyGoals").collect();
    if (existing.length > 0) return;

    const goals = [
      { muscleGroup: "Chest", lowGoal: 8, highGoal: 15 },
      { muscleGroup: "Shoulders", lowGoal: 10, highGoal: 20 },
      { muscleGroup: "Triceps - Isolation", lowGoal: 6, highGoal: 10 },
      { muscleGroup: "Back", lowGoal: 10, highGoal: 20 },
      { muscleGroup: "Upper Traps", lowGoal: 3, highGoal: 10 },
      { muscleGroup: "Biceps - Isolation", lowGoal: 6, highGoal: 10 },
      { muscleGroup: "Glute", lowGoal: 10, highGoal: 20 },
      { muscleGroup: "Quads", lowGoal: 10, highGoal: 15 },
      { muscleGroup: "Hamstrings", lowGoal: 8, highGoal: 12 },
      { muscleGroup: "Calves", lowGoal: 6, highGoal: 10 },
      { muscleGroup: "Forearms", lowGoal: 3, highGoal: 8 },
      { muscleGroup: "Neck", lowGoal: 3, highGoal: 10 },
      { muscleGroup: "Core", lowGoal: 6, highGoal: 10 },
    ];

    for (const goal of goals) {
      await ctx.db.insert("weeklyGoals", goal);
    }
  },
});

export const updateWeeklyGoal = mutation({
  args: {
    muscleGroup: v.string(),
    lowGoal: v.number(),
    highGoal: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyGoals")
      .withIndex("by_muscle", q => q.eq("muscleGroup", args.muscleGroup))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lowGoal: args.lowGoal,
        highGoal: args.highGoal,
      });
    } else {
      await ctx.db.insert("weeklyGoals", args);
    }
  },
});