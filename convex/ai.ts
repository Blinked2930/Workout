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

// Fallback Goals if DB fetch fails
const defaultGoals = [
  { muscleGroup: "Core", lowGoal: 6, highGoal: 10 },
  { muscleGroup: "Neck", lowGoal: 3, highGoal: 10 },
  { muscleGroup: "Forearms", lowGoal: 3, highGoal: 8 },
  { muscleGroup: "Calves", lowGoal: 6, highGoal: 10 },
  { muscleGroup: "Hamstrings", lowGoal: 8, highGoal: 12 },
  { muscleGroup: "Quads", lowGoal: 10, highGoal: 15 },
  { muscleGroup: "Glute", lowGoal: 10, highGoal: 20 },
  { muscleGroup: "Biceps - Isolation", lowGoal: 6, highGoal: 10 },
  { muscleGroup: "Upper Traps", lowGoal: 3, highGoal: 10 },
  { muscleGroup: "Back", lowGoal: 10, highGoal: 20 },
  { muscleGroup: "Triceps - Isolation", lowGoal: 6, highGoal: 10 },
  { muscleGroup: "Shoulders", lowGoal: 10, highGoal: 20 },
  { muscleGroup: "Chest", lowGoal: 8, highGoal: 15 }
];

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
    let weeklyGoals: any[] = [];
    try {
      allLifts = await ctx.runQuery(api.lifts.getLifts, {});
      exercises = await ctx.runQuery(api.exercises.getExercises, { category: "" });
      try {
        weeklyGoals = await ctx.runQuery(api.weeklyGoals.get as any, {});
      } catch (e) {
        weeklyGoals = defaultGoals;
      }
    } catch (e) {
      console.error("Data fetch error:", e);
    }
    
    if (!weeklyGoals || weeklyGoals.length === 0) weeklyGoals = defaultGoals;

    const muscleMap = new Map((exercises || []).map(e => [
      e.name.toLowerCase(), 
      (e.subcategory || e.category || "Unknown").toLowerCase()
    ]));

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

    // Target vs Actual Math
    const muscleBreakdown: Record<string, number> = {};
    recentLifts.forEach((l: any) => {
      let muscle = muscleMap.get(l.exerciseName.toLowerCase()) || "unknown";
      // Ensure isolation tracking for arms based on goals map
      if (muscle.includes("tricep")) muscle = "triceps - isolation";
      if (muscle.includes("bicep")) muscle = "biceps - isolation";
      muscleBreakdown[muscle] = (muscleBreakdown[muscle] || 0) + l.sets;
    });

    const goalsMap = new Map(weeklyGoals.map(g => [g.muscleGroup.toLowerCase(), { low: g.lowGoal, high: g.highGoal }]));
    const volumeStrings: string[] = [];
    
    for (const [muscle, goal] of goalsMap.entries()) {
        const sets = muscleBreakdown[muscle] || 0;
        volumeStrings.push(`${muscle}: ${sets} sets (Target: ${goal.low}-${goal.high})`);
    }
    const muscleBreakdownStr = volumeStrings.join(" | ") || "No volume logged this week.";

    const equipmentContext = equipmentRules[args.equipment] || "Standard rules apply.";

    const systemInstruction = `
    You are an elite, science-based Strength & Conditioning Coach. You design highly bespoke, structurally balanced training protocols using advanced kinesiology frameworks.
    Output ONLY valid JSON. No markdown.

    STATE:
    - User Request: "${args.customRequest || "None"}"
    - Environment Limits: ${args.equipment} -> ${equipmentContext}
    - Workout Style: ${args.style}
    - BANNED TODAY (Hit Yesterday): ${bannedStr}
    - Weekly Muscle Volume Scoreboard: ${muscleBreakdownStr}

    AVAILABLE EXERCISES:
    ${exercisesCSV}

    PROGRAMMING FRAMEWORKS TO ENFORCE:
    1. VOLUME TARGETS: Analyze the Weekly Muscle Volume Scoreboard. Prioritize muscle groups that are furthest behind their weekly targets.
    2. EXERCISE SELECTION & STRUCTURE: 
       - Aim for 2-3 unique exercises per primary muscle group within the chosen modality (e.g., Push day = 2 chest, 2 shoulders, 1-2 triceps).
       - Biceps and Triceps volume ONLY counts from strict isolation exercises. Do not prescribe compound movements to target them.
    3. MOVEMENT PATTERN BALANCE: 
       - PUSH must include both Horizontal (e.g., push-ups) and Vertical (e.g., pike push-ups/overhead) patterns.
       - PULL must include both Horizontal (e.g., rows) and Vertical (e.g., pull-ups/pulldowns) patterns.
       - LEGS must include both Knee-Dominant (e.g., squats) and Hip-Dominant/Hinge (e.g., glute bridges/deadlifts) patterns.
    4. SAID PRINCIPLE: Adapt the sets, reps, and rest periods strictly to the requested Workout Style.

    RULES:
    1. Honor explicit user modality requests.
    2. Otherwise, pick the broad Modality (PUSH, PULL, or LEGS) containing the muscles furthest behind their weekly targets that are NOT banned today. Ensure you can build a balanced workout given the Environment constraints.
    3. STRICT ENVIRONMENT: You MUST strictly obey the Environment Limits above. Exclude any exercise that requires equipment violating these physical constraints.
    4. State reasoning in 2-3 sentences explaining the biomechanical rationale for today's protocol based on their targets, limits, and the required movement patterns.

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
    
    const exercisesCSV = "Exercise Name,Category,Subcategory\n" + 
      (exercises || []).map(ex => `"${ex.name}",${ex.category},${ex.subcategory || ''}`).join("\n");
    
    const equipmentContext = equipmentRules[args.equipment] || "Standard rules apply.";

    const systemInstruction = `
    You are an elite, science-based Strength Coach. Generate a JSON workout protocol based ONLY on the Approved Focus.
    
    ENVIRONMENT LIMITS: ${args.equipment} -> ${equipmentContext}
    WORKOUT STYLE: ${args.style}
    TIME AVAILABLE: ${args.timeAvailable} minutes.

    PROGRAMMING FRAMEWORKS TO ENFORCE:
    1. EXERCISE SELECTION & STRUCTURE: 
       - Aim for 2-3 unique exercises per primary muscle group. Scale total volume to fit Time Available.
       - Biceps/Triceps volume ONLY counts from strict isolation exercises.
    2. MOVEMENT PATTERN BALANCE: Include both Horizontal and Vertical patterns for Push/Pull, and Knee/Hip patterns for Legs.
    3. NEUROLOGICAL ORDERING: Order Main Block from most complex/heavy compound movements to least complex isolations.
    4. WARM-UP & COOLDOWN: Warm-ups = joint prep/mobility. Cooldowns = down-regulation/stretching.
    5. SAID PRINCIPLE: Adapt sets, reps, and rest strictly to Workout Style:
       - Hypertrophy (8-12 reps): 8-12 reps, 90s rest.
       - Strength (4-10 reps): 4-10 reps, 120s+ rest.
       - HIIT/Recovery: Adjust as needed.
    
    RULES:
    1. Output ONLY JSON. No markdown.
    2. STRICT ENVIRONMENT: Obey the Environment Limits above using your expert knowledge of equipment required for each exercise in Available Exercises.
    3. Use EXACT names from Available Exercises.
    4. For mainBlock items, output sets, repsMin, and repsMax strictly as INTEGERS.

    JSON SCHEMA:
    {
      "title": "String",
      "focus": "String",
      "warmup": [ { "name": "Exercise", "reps": "Target" } ],
      "mainBlock": [ { "name": "Exact Name", "sets": Number, "repsMin": Number, "repsMax": Number, "rest": "90s", "notes": "Cues" } ],
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