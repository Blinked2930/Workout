"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateWorkout = action({
  args: {
    timeAvailable: v.number(),
    equipment: v.string(),
    style: v.string(),
    localTime: v.string(), 
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set.");

    // 1. Fetch live data safely
    let exercises: any[] = [];
    let allLifts: any[] = [];

    try {
      exercises = await ctx.runQuery(api.exercises.getExercises, { category: "" });
      allLifts = await ctx.runQuery(api.lifts.getLifts, {});
    } catch (e) {
      console.error("Data fetch error:", e);
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLifts = (allLifts || []).filter((l: any) => l.timestamp >= oneWeekAgo);

    const exercisesCSV = "Exercise Name,Category,Subcategory,Equipment Type\n" + 
      (exercises || []).map(ex => `"${ex.name}",${ex.category},${ex.subcategory || ''},${ex.isBodyweight ? 'Bodyweight' : 'Weighted'}`).join("\n");
    
    const recentLiftsCSV = "Date,Exercise,Equipment,Weight,Reps,Sets\n" + 
      recentLifts.map(l => `${new Date(l.timestamp).toISOString().split('T')[0]},"${l.exerciseName}",${l.equipmentType || ''},${l.weight},${l.reps},${l.sets}`).join("\n");

    // 4. JSON-Forced System Prompt
    const systemInstruction = `
    You are an elite Strength & Conditioning AI Coach. Generate an optimized workout for Emmett (in Albania).
    
    CRITICAL: YOU MUST OUTPUT ONLY VALID JSON. NO MARKDOWN. NO BACKTICKS. NO EXTRA TEXT.
    
    <Operational_Rules>
      1. GAP ANALYSIS: Review the 'Recent Lifts CSV'. Avoid muscles trained yesterday. Target muscles neglected this week.
      2. INVENTORY: You MUST prioritize using the EXACT exercise names found in the 'Available Exercises CSV'. If you absolutely must create a new exercise, format its name logically (e.g., "Archer Push-up"), but prefer the CSV.
    </Operational_Rules>

    <Required_JSON_Schema>
    {
      "title": "String (e.g., 45-Min Lower Body Hypertrophy)",
      "focus": "String (1 sentence on what this targets and why)",
      "warmup": [ { "name": "Exercise Name", "reps": "Target" } ],
      "mainBlock": [ { "name": "Exact Exercise Name", "setsReps": "e.g., 4 x 8-12", "rest": "90s", "notes": "Form cues" } ],
      "cooldown": [ { "name": "Exercise Name", "reps": "Target" } ]
    }
    </Required_JSON_Schema>

    <User_Context>
      - Baseline: Capable of Pistol Squats and Archer Pushups.
      - Time Available: ${args.timeAvailable} mins
      - Equipment: ${args.equipment}
      - Style: ${args.style}
      - Local Time: ${args.localTime}
    </User_Context>

    <Database_State>
      <Available_Exercises_CSV>\n${exercisesCSV}\n</Available_Exercises_CSV>
      <Recent_Lifts_Last_7_Days_CSV>\n${recentLiftsCSV}\n</Recent_Lifts_Last_7_Days_CSV>
    </Database_State>
    `;

    const prompt = `Generate the JSON workout plan now based on the system instructions.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", 
      systemInstruction: systemInstruction,
      // 🔥 THIS FORCES PERFECT JSON EVERY TIME 🔥
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await model.generateContent(prompt);
    return result.response.text();
  },
});