import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  exercises: defineTable({
    name: v.string(),
    category: v.string(),          
    subcategory: v.optional(v.string()), 
    isBodyweight: v.boolean(),
    isArchived: v.optional(v.boolean()), // Added back so we can safely archive exercises!
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
  }).index("by_category", ["category"]),

  liftSets: defineTable({
    timestamp: v.number(),
    exerciseName: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    equipmentType: v.optional(v.string()), // "Barbell" | "Dumbbell" | "Kettlebell" | "Machine/Cable" | "Bodyweight" | "Other"
    weight: v.number(),            
    addedWeight: v.optional(v.number()), 
    reps: v.number(),
    sets: v.number(),
    rir: v.optional(v.number()),
    notes: v.optional(v.string()),
    volume: v.number(),            
    e1rm: v.optional(v.number()),  
  }).index("by_timestamp", ["timestamp"])
    .index("by_exercise", ["exerciseName"]),

  cardioSessions: defineTable({
    timestamp: v.number(),
    movementType: v.string(),      
    duration: v.number(),          
    distance: v.optional(v.number()),
    rpe: v.optional(v.number()),
    zone: v.string(),              
    notes: v.optional(v.string()),
  }).index("by_timestamp", ["timestamp"])
    .index("by_zone", ["zone"]),

  weeklyGoals: defineTable({
    muscleGroup: v.string(),
    lowGoal: v.number(),
    highGoal: v.number(),
  }).index("by_muscle", ["muscleGroup"]),
});