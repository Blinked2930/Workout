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

// MAP SCHEMA TO WEEKLY GOAL STRINGS
const SCHEMA_TO_GOAL: Record<string, string> = {
  chest:      'Chest',
  shoulders:  'Shoulders',
  triceps:    'Triceps - Isolation',
  back:       'Back',
  upperTraps: 'Upper Traps',
  biceps:     'Biceps - Isolation',
  glutes:     'Glute',
  quads:      'Quads',
  hamstrings: 'Hamstrings',
  calves:     'Calves',
  forearms:   'Forearms',
  neck:       'Neck',
  core:       'Core',
};

const PUSH_MUSCLES = ['chest', 'shoulders', 'triceps'];
const PULL_MUSCLES = ['back', 'upperTraps', 'biceps', 'forearms'];
const LEG_MUSCLES = ['glutes', 'quads', 'hamstrings', 'calves'];

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
    // 🛑 DEMO MODE SHORT-CIRCUIT 🛑
    if (process.env.DEMO_MODE === "true") {
      return {
        suggestionText: JSON.stringify({
          focusTitle: "Simulated Full Body Protocol",
          reasoning: "Since you are exploring the public demo, I've bypassed the live AI to save API costs and generated a sample workout for you! In the real app, I analyze your actual muscle recovery and volume data to dynamically build this strategy."
        }),
        debugData: {
          yesterdayBanned: "N/A (Demo Mode)",
          weeklyMuscle: "N/A (Demo Mode)",
          dateMath: "Simulated Timezone",
          aiPrompt: "API Call Bypassed to save costs! 🛑"
        }
      };
    }

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

    // Create the Fractional Weight Map just like Volume.tsx
    const exerciseMuscleMap: Record<string, Record<string, number>> = {};
    exercises.forEach((ex: any) => {
      exerciseMuscleMap[ex.name.toLowerCase()] = ex.muscleWeights || {};
    });

    const exercisesCSV = "Exercise Name,Category,Subcategory\n" + 
      (exercises || []).map(ex => `"${ex.name}",${ex.category},${ex.subcategory || ''}`).join("\n");

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

    // Calculate true fractional volume for the week & yesterday
    const muscleBreakdown: Record<string, number> = {};
    let yesterdayPush = 0;
    let yesterdayPull = 0;
    let yesterdayLegs = 0;

    recentLifts.forEach((l: any) => {
      const isYesterday = formatLocalYMD(l.timestamp) === yesterdayStr;
      const weights = exerciseMuscleMap[l.exerciseName.toLowerCase()] || {};
      
      Object.entries(weights).forEach(([schemaKey, w]) => {
        const goalKey = SCHEMA_TO_GOAL[schemaKey];
        const addedSets = l.sets * (w as number);
        
        if (goalKey && addedSets > 0) {
          // Accumulate weekly total for this exact muscle
          muscleBreakdown[goalKey] = (muscleBreakdown[goalKey] || 0) + addedSets;
          
          // Accumulate yesterday's modality totals
          if (isYesterday) {
            if (PUSH_MUSCLES.includes(schemaKey)) yesterdayPush += addedSets;
            if (PULL_MUSCLES.includes(schemaKey)) yesterdayPull += addedSets;
            if (LEG_MUSCLES.includes(schemaKey)) yesterdayLegs += addedSets;
          }
        }
      });
    });

    // Ban modality only if they did >= 2 sets of it yesterday
    const yesterdayModalities = new Set<string>();
    if (yesterdayPush >= 2) yesterdayModalities.add("PUSH");
    if (yesterdayPull >= 2) yesterdayModalities.add("PULL");
    if (yesterdayLegs >= 2) yesterdayModalities.add("LEGS");
    
    const bannedStr = yesterdayModalities.size > 0 ? Array.from(yesterdayModalities).join(", ") : "None. User is rested.";

    // Generate accurate scoreboard
    const goalsMap = new Map(weeklyGoals.map(g => [g.muscleGroup, { low: g.lowGoal, high: g.highGoal }]));
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
    // 🛑 DEMO MODE SHORT-CIRCUIT 🛑
    if (process.env.DEMO_MODE === "true") {
      return JSON.stringify({
        title: "Demo Protocol",
        focus: "General Training",
        warmup: [
          { name: "Jumping Jacks", reps: "30s", equipment: "Bodyweight" },
          { name: "Arm Circles", reps: "15 each way", equipment: "Bodyweight" }
        ],
        mainBlock: [
          { name: "Bench Press", sets: 3, repsMin: 8, repsMax: 12, rest: "90s", notes: "Focus on a slow eccentric. (This is a simulated demo workout!)", equipment: "Barbell" },
          { name: "Back Squat", sets: 3, repsMin: 6, repsMax: 8, rest: "120s", notes: "Drive through the heels.", equipment: "Barbell" },
          { name: "Lat Pulldown", sets: 3, repsMin: 10, repsMax: 15, rest: "90s", notes: "Squeeze the lats at the bottom.", equipment: "Machine/Cable" }
        ],
        cooldown: [
          { name: "Child's Pose", reps: "60s", equipment: "Bodyweight" }
        ]
      });
    }

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
       - Hypertrophy (9+ reps): repsMin = 9, repsMax = 999, 90s rest.
       - Strength (4-10 reps): repsMin = 4, repsMax = 10, 120s+ rest.
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

// ---------------------------------------------------------
// ACTION 3: Generate Warmup/Cooldown for Manual Builder
// ---------------------------------------------------------
export const generateWarmupCooldown = action({
  args: {
    equipment: v.string(),
    style: v.string(),
    mainBlock: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // 🛑 DEMO MODE SHORT-CIRCUIT 🛑
    if (process.env.DEMO_MODE === "true") {
      return JSON.stringify({
        warmup: [
          { name: "Jumping Jacks", reps: "30s", equipment: "Bodyweight" },
          { name: "Arm Circles", reps: "15 each way", equipment: "Bodyweight" }
        ],
        cooldown: [
          { name: "Child's Pose", reps: "60s", equipment: "Bodyweight" }
        ]
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable not set.");

    const equipmentContext = equipmentRules[args.equipment] || "Standard rules apply.";

    const systemInstruction = `
    You are an elite Strength Coach. The user has manually built their workout block. 
    Generate ONLY a Warm-up and Cooldown tailored to these specific exercises.
    
    ENVIRONMENT LIMITS: ${args.equipment} -> ${equipmentContext}
    WORKOUT STYLE: ${args.style}
    MAIN EXERCISES: ${args.mainBlock.join(', ')}

    RULES:
    1. Output ONLY valid JSON. No markdown.
    2. WARM-UP: 2-3 exercises. Joint prep and mobility for the muscles used in the Main Exercises.
    3. COOLDOWN: 2-3 exercises. Stretching and down-regulation for the muscles used.
    4. STRICT ENVIRONMENT: Exclude any exercise that violates the physical constraints.

    JSON SCHEMA:
    {
      "warmup": [ { "name": "Exercise", "reps": "Target" } ],
      "cooldown": [ { "name": "Exercise", "reps": "Target" } ]
    }
    `;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.1-flash-lite-preview", 
      systemInstruction: systemInstruction,
      generationConfig: { responseMimeType: "application/json" } 
    });

    const prompt = `Generate warmup and cooldown.`;
    const result = await fetchWithRetry(model, prompt);
    return result.response.text();
  },
});