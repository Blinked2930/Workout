import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  mainCategories: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_creator", ["createdBy"]),

  subCategories: defineTable({
    name: v.string(),
    mainCategoryId: v.id("mainCategories"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_main_category", ["mainCategoryId"]).index("by_creator", ["createdBy"]),

  exercises: defineTable({
    name: v.string(),
    subCategoryId: v.id("subCategories"),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_sub_category", ["subCategoryId"]).index("by_creator", ["createdBy"]),

  lifts: defineTable({
    exerciseId: v.id("exercises"),
    weight: v.number(),
    reps: v.number(),
    isEachSide: v.boolean(),
    date: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_exercise", ["exerciseId"]).index("by_date", ["date"]).index("by_creator", ["createdBy"]),

  cardioSessions: defineTable({
    activityType: v.string(),
    time: v.number(),
    distance: v.optional(v.number()),
    date: v.number(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_date", ["date"]).index("by_creator", ["createdBy"]),

  timeGoals: defineTable({
    activityType: v.string(),
    weeklyGoal: v.number(),
    currentWeekProgress: v.number(),
    lastUpdated: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_activity_type", ["activityType"]).index("by_creator", ["createdBy"]),
});
