import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Main Categories
export const getMainCategories = query({
  args: {},
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
      .query("mainCategories")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();
  },
});

export const createMainCategory = mutation({
  args: {
    name: v.string(),
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

    return await ctx.db.insert("mainCategories", {
      ...args,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

// Sub Categories
export const getSubCategories = query({
  args: {
    mainCategoryId: v.optional(v.id("mainCategories")),
  },
  handler: async (ctx, { mainCategoryId }) => {
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

    if (mainCategoryId) {
      return await ctx.db
        .query("subCategories")
        .withIndex("by_main_category", (q) => q.eq("mainCategoryId", mainCategoryId))
        .filter((q) => q.eq(q.field("createdBy"), user._id))
        .collect();
    }

    return await ctx.db
      .query("subCategories")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();
  },
});

export const createSubCategory = mutation({
  args: {
    name: v.string(),
    mainCategoryId: v.id("mainCategories"),
  },
  handler: async (ctx, { name, mainCategoryId }) => {
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

    return await ctx.db.insert("subCategories", {
      name,
      mainCategoryId,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

// Exercises
export const getExercises = query({
  args: {
    subCategoryId: v.optional(v.id("subCategories")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { subCategoryId, search }) => {
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

    let exercises;

    if (subCategoryId) {
      exercises = await ctx.db
        .query("exercises")
        .withIndex("by_sub_category", (q) => q.eq("subCategoryId", subCategoryId))
        .filter((q) => q.eq(q.field("createdBy"), user._id))
        .collect();
    } else {
      exercises = await ctx.db
        .query("exercises")
        .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
        .collect();
    }

    if (search) {
      const searchLower = search.toLowerCase();
      exercises = exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchLower)
      );
    }

    return exercises;
  },
});

export const createExercise = mutation({
  args: {
    name: v.string(),
    subCategoryId: v.id("subCategories"),
  },
  handler: async (ctx, { name, subCategoryId }) => {
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

    return await ctx.db.insert("exercises", {
      name,
      subCategoryId,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const getExercise = query({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, { exerciseId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const exercise = await ctx.db.get(exerciseId);
    if (!exercise) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || exercise.createdBy !== user._id) {
      return null;
    }

    return exercise;
  },
});
