"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------
// ACTION 1: The Gap Analysis & Suggestion Engine
// ---------------------------------------------------------
export const suggestWorkoutFocus = action({
  args: {
    timeAvailable: v.number(),
    equipment: v.string(),
    style: v.string(),
    localTime: v.string(),
    customRequest: v.optional(v.string()), 
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set.");

    let allLifts: any[] = [];
    try {
      allLifts = await ctx.runQuery(api.lifts.getLifts, {});
    } catch (e) {
      console.error("Data fetch error:", e);
    }
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLifts = (allLifts || []).filter((l: any) => l.timestamp >= oneWeekAgo);
    const recentLiftsCSV = "Date,Exercise,Equipment,Weight,Reps,Sets\n" + 
      recentLifts.map(l => `${new Date(l.timestamp).toISOString().split('T')[0]},"${l.exerciseName}",${l.equipmentType || ''},${l.weight},${l.reps},${l.sets}`).join("\n");

    const systemInstruction = `
    You are an elite Strength & Conditioning AI Coach analyzing Emmett's data to suggest a workout focus.
    
    CRITICAL: Output ONLY a single JSON object. Do not wrap it in any XML tags or extra text.
    
    Operational Rules:
    - If the user provided a 'Custom Request', adopt it as the primary focus. 
    - If the 'Custom Request' is empty, review the 'Recent Lifts CSV'. Target muscles neglected this week and avoid muscles trained yesterday.
    
    Required JSON Schema:
    {
      "focusTitle": "String (e.g., 'Push Focus (Chest & Triceps)' or 'Custom: Quad Dominant')",
      "reasoning": "String (2-3 sentences explaining WHY this is the optimal session right now based on data or their request.)"
    }
    `;

    const prompt = `Analyze and suggest focus. 
    Custom Request: ${args.customRequest || "None. You decide based on data."}
    Time: ${args.timeAvailable}m | Env: ${args.equipment} | Style: ${args.style}
    Recent Lifts:\n${recentLiftsCSV}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
});

// ---------------------------------------------------------
// ACTION 2: The Final JSON Workout Generator
// ---------------------------------------------------------
export const generateWorkout = action({
  args: {
    timeAvailable: v.number(),
    equipment: v.string(),
    style: v.string(),
    localTime: v.string(), 
    approvedFocus: v.string(),
    userTweaks: v.optional(v.string()), 
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set.");

    let exercises: any[] = [];
    try {
      exercises = await ctx.runQuery(api.exercises.getExercises, { category: "" });
    } catch (e) {
      console.error("Data fetch error:", e);
    }
    const exercisesCSV = "Exercise Name,Category,Subcategory,Equipment Type\n" + 
      (exercises || []).map(ex => `"${ex.name}",${ex.category},${ex.subcategory || ''},${ex.isBodyweight ? 'Bodyweight' : 'Weighted'}`).join("\n");
    
    const systemInstruction = `
    You are an elite Strength & Conditioning AI Coach. Generate a workout based on the APPROVED focus.
    
    CRITICAL: Output ONLY a single JSON object. Do not wrap it in any XML tags or extra text.
    
    Operational Rules:
    - STRICT ADHERENCE: Base the entire workout on the 'Approved Focus'.
    - USER TWEAKS: Apply 'User Tweaks' strictly (e.g., if they say "No squats", omit them).
    - INVENTORY: Prioritize EXACT exercise names from the 'Available Exercises CSV'. Create new ones ONLY if absolutely necessary.

    Required JSON Schema:
    {
      "title": "String",
      "focus": "String",
      "warmup": [ { "name": "Exercise", "reps": "Target" } ],
      "mainBlock": [ { "name": "Exact Exercise Name", "setsReps": "e.g., 4 x 8-12", "rest": "90s", "notes": "Form cues" } ],
      "cooldown": [ { "name": "Exercise", "reps": "Target" } ]
    }
    
    Available Exercises:\n${exercisesCSV}
    `;

    const prompt = `Generate the workout.
    Approved Focus: ${args.approvedFocus}
    User Tweaks: ${args.userTweaks || "None."}
    Time: ${args.timeAvailable}m | Env: ${args.equipment} | Style: ${args.style}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  },
});