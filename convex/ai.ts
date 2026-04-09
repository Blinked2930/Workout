"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- EXPONENTIAL BACKOFF RETRY HELPER ---
async function fetchWithRetry(model: any, prompt: string, retries = 4) {
  const baseDelay = 5000; 
  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      if (i === retries - 1 || (!errorMessage.includes("503") && !errorMessage.includes("429"))) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`[AI] API Busy. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries - 1})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// --- NEW: ENVIRONMENT CONTEXT DICTIONARY ---
const equipmentRules: Record<string, string> = {
  "Floor Mode (Bodyweight Only)": "STRICTLY floor-based bodyweight exercises. ABSOLUTELY NO pull-up bars, NO dip bars, NO rings, and NO weights. (e.g., Pushups, squats, lunges, and floor core only).",
  "Bar Mode (Pull-up & Dip Bars)": "Bodyweight exercises PLUS access to pull-up bars and dip stations. NO external weights. (e.g., Pull-ups, chin-ups, dips, and hanging core are allowed).",
  "Full Gym Access": "Full commercial gym access. Barbells, dumbbells, cables, and machines are all permitted."
};

// ---------------------------------------------------------
// ACTION 1: The Gap Analysis & Suggestion Engine
// ---------------------------------------------------------
export const suggestWorkoutFocus = action({
  args: {
    timeAvailable: v.number(),
    equipment: v.string(),
    style: v.string(),
    localTime: v.string(),
    timezoneOffset: v.number(), 
    customRequest: v.optional(v.string()), 
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set.");

    let allLifts: any[] = [];
    let exercises: any[] = [];
    try {
      allLifts = await ctx.runQuery(api.lifts.getLifts, {});
      exercises = await ctx.runQuery(api.exercises.getExercises, { category: "" });
    } catch (e) {
      console.error("Data fetch error:", e);
    }
    
    const muscleMap = new Map((exercises || []).map(e => [
      e.name.toLowerCase(), 
      (e.subcategory || e.category || "Unknown").toLowerCase()
    ]));

    // REMOVED BROKEN EQUIPMENT TAG. The AI will use its internal knowledge.
    const exercisesCSV = "Exercise Name,Category,Subcategory\n" + 
      (exercises || []).map(ex => `"${ex.name}",${ex.category},${ex.subcategory || ''}`).join("\n");

    const pushGroups = ['chest', 'shoulders', 'triceps', 'upper body push'];
    const pullGroups = ['back', 'u. traps', 'biceps', 'forearms', 'neck', 'upper body pull'];
    const legGroups = ['glute', 'quads', 'hamstrings', 'calves', 'legs', 'lower body'];

    const formatLocalYMD = (epochMs: number) => {
      const localEpoch = epochMs - (args.timezoneOffset * 60 * 1000);
      const d = new Date(localEpoch);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    };

    const nowEpoch = Date.now();
    const localNow = new Date(nowEpoch - (args.timezoneOffset * 60 * 1000));
    const currentDay = localNow.getUTCDay(); 
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; 
    
    const localMondayStart = new Date(localNow.getTime());
    localMondayStart.setUTCDate(localNow.getUTCDate() - daysSinceMonday);
    localMondayStart.setUTCHours(0, 0, 0, 0);
    const mondayEpoch = localMondayStart.getTime() + (args.timezoneOffset * 60 * 1000);

    const yesterdayStr = formatLocalYMD(nowEpoch - 24 * 60 * 60 * 1000);
    const recentLifts = (allLifts || []).filter((l: any) => l.timestamp >= mondayEpoch);

    const yesterdayLifts = recentLifts.filter((l: any) => formatLocalYMD(l.timestamp) === yesterdayStr);
    const yesterdayModalities = new Set<string>();
    yesterdayLifts.forEach((l: any) => {
      const muscle = muscleMap.get(l.exerciseName.toLowerCase()) || "unknown";
      if (pushGroups.includes(muscle)) yesterdayModalities.add("PUSH");
      if (pullGroups.includes(muscle)) yesterdayModalities.add("PULL");
      if (legGroups.includes(muscle)) yesterdayModalities.add("LEGS");
    });
    const bannedStr = yesterdayModalities.size > 0 ? Array.from(yesterdayModalities).join(", ") : "None. User is rested.";

    const muscleBreakdown: Record<string, number> = {};
    recentLifts.forEach((l: any) => {
      const muscle = muscleMap.get(l.exerciseName.toLowerCase()) || "unknown";
      muscleBreakdown[muscle] = (muscleBreakdown[muscle] || 0) + l.sets;
    });

    const muscleBreakdownStr = Object.entries(muscleBreakdown).map(([m, s]) => `${m}: ${s} sets`).join(", ") || "No volume logged this week.";

    const equipmentContext = equipmentRules[args.equipment] || "Standard rules apply.";

    const systemInstruction = `
    You are an elite, science-based Strength & Conditioning Coach. You design highly bespoke, structurally balanced training protocols using advanced kinesiology frameworks.
    Output ONLY valid JSON. No markdown.

    STATE:
    - User Request: "${args.customRequest || "None"}"
    - Environment Limits: ${args.equipment} -> ${equipmentContext}
    - Workout Style: ${args.style}
    - BANNED TODAY (Hit Yesterday): ${bannedStr}
    - Weekly Muscle Volume: ${muscleBreakdownStr}

    AVAILABLE EXERCISES:
    ${exercisesCSV}

    PROGRAMMING FRAMEWORKS TO ENFORCE:
    1. MOVEMENT PATTERN BALANCE: 
       - PUSH must include both Horizontal (e.g., push-ups) and Vertical (e.g., pike push-ups/overhead) patterns.
       - PULL must include both Horizontal (e.g., rows) and Vertical (e.g., pull-ups/pulldowns) patterns.
       - LEGS must include both Knee-Dominant (e.g., squats) and Hip-Dominant/Hinge (e.g., glute bridges/deadlifts) patterns.
    2. NEUROLOGICAL ORDERING: Order the Main Block from the most complex/heavy compound movements to the least complex isolation movements.
    3. WARM-UP & COOLDOWN PROTOCOL: Warm-ups must focus on joint prep and dynamic mobility, NOT fatiguing working sets. Cooldowns must focus on down-regulation and antagonist stretching.
    4. SAID PRINCIPLE: Adapt the sets, reps, and rest periods strictly to the requested Workout Style (e.g., longer rest and 6-15 reps for Hypertrophy; short rest and high reps/time for HIIT).

    RULES:
    1. Honor explicit user modality requests.
    2. Otherwise, pick the broad Modality (PUSH, PULL, or LEGS) with the lowest volume/most rested muscles that are NOT banned today. Ensure you can actually build a balanced workout given the Environment constraints.
    3. STRICT ENVIRONMENT: You MUST strictly obey the Environment Limits above. Use your expert knowledge to determine the equipment required for each exercise in the Available Exercises list. Exclude any exercise that requires equipment violating these physical constraints.
    4. State reasoning in 2-3 sentences explaining the biomechanical rationale for today's protocol based on their limits, volume, and the required movement patterns.

    JSON SCHEMA:
    {
      "focusTitle": "String",
      "reasoning": "String"
    }
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" } 
    });

    const result = await fetchWithRetry(model, "Generate JSON based on State and Rules.");
    
    return {
      suggestionText: result.response.text(),
      debugData: {
        yesterdayBanned: bannedStr,
        weeklyMuscle: muscleBreakdownStr,
        dateMath: `Today: ${formatLocalYMD(nowEpoch)} | Mon: ${formatLocalYMD(mondayEpoch)} | Offset: ${args.timezoneOffset}m`,
        aiPrompt: `${systemInstruction.trim()}`
      }
    };
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
    
    // REMOVED BROKEN EQUIPMENT TAG. The AI will use its internal knowledge.
    const exercisesCSV = "Exercise Name,Category,Subcategory\n" + 
      (exercises || []).map(ex => `"${ex.name}",${ex.category},${ex.subcategory || ''}`).join("\n");
    
    const equipmentContext = equipmentRules[args.equipment] || "Standard rules apply.";

    const systemInstruction = `
    You are an elite, science-based Strength Coach. Generate a JSON workout protocol based ONLY on the Approved Focus.
    
    ENVIRONMENT LIMITS: ${args.equipment} -> ${equipmentContext}
    WORKOUT STYLE: ${args.style}

    PROGRAMMING FRAMEWORKS TO ENFORCE:
    1. MOVEMENT PATTERN BALANCE: 
       - PUSH must include both Horizontal and Vertical patterns.
       - PULL must include both Horizontal and Vertical patterns.
       - LEGS must include both Knee-Dominant and Hip-Dominant/Hinge patterns.
    2. NEUROLOGICAL ORDERING: Order the Main Block from the most complex/heavy compound movements to the least complex isolation movements.
    3. WARM-UP & COOLDOWN PROTOCOL: Warm-ups must focus on joint prep and dynamic mobility, NOT fatiguing working sets. Cooldowns must focus on down-regulation and antagonist stretching.
    4. SAID PRINCIPLE: Adapt the sets, reps, and rest periods strictly to the requested Workout Style (e.g., longer rest and 6-15 reps for Hypertrophy; short rest and high reps/time for HIIT).
    
    RULES:
    1. Output ONLY JSON. No markdown.
    2. STRICT ISOLATION: Do not mix modalities. If focus is PUSH, no LEGS or PULL.
    3. STRICT ENVIRONMENT: You MUST strictly obey the Environment Limits above. Use your expert knowledge to determine the equipment required for each exercise in the Available Exercises list. Exclude any exercise that requires equipment violating these physical constraints.
    4. Use EXACT names from Available Exercises.

    JSON SCHEMA:
    {
      "title": "String",
      "focus": "String",
      "warmup": [ { "name": "Exercise", "reps": "Target" } ],
      "mainBlock": [ { "name": "Exact Name", "setsReps": "e.g., 4 x 8-12", "rest": "90s", "notes": "Cues based on biomechanics" } ],
      "cooldown": [ { "name": "Exercise", "reps": "Target" } ]
    }
    
    Available Exercises:\n${exercisesCSV}
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `Generate: ${args.approvedFocus}. Tweaks: ${args.userTweaks || "None"}. Time: ${args.timeAvailable}m.`;
    const result = await fetchWithRetry(model, prompt);
    return result.response.text();
  },
});