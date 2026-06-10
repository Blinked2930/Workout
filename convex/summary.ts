import { action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

const SCHEMA_TO_GOAL: Record<string, string> = {
  chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps',
  back: 'Back', upperTraps: 'Upper Traps', biceps: 'Biceps',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
  forearms: 'Forearms', neck: 'Neck', core: 'Core',
};

// 1. The Engine: Calculates volume from Monday and cross-references with Goals
export const getWeeklyBreakdown = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Dynamically find the start of the current week (Monday at 00:00:00)
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Convert Sunday (0) to 7
    now.setHours(0, 0, 0, 0);
    const startOfWeekTimestamp = now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000;

    // Fetch lifts, exercises, and goals starting from MONDAY
    const lifts = await ctx.db
      .query("liftSets")
      .filter((q) => q.gte(q.field("timestamp"), startOfWeekTimestamp))
      .collect();

    const exercises = await ctx.db.query("exercises").collect();
    const weeklyGoals = await ctx.db.query("weeklyGoals").collect();

    // Map exercise muscle weights
    const exerciseMuscleMap: Record<string, Record<string, number>> = {};
    for (const ex of exercises) {
      exerciseMuscleMap[ex.name] = (ex.muscleWeights as Record<string, number>) ?? {};
    }

    // Calculate actual sets completed
    const rawMuscleSetMap: Record<string, number> = {};
    let totalSets = 0;
    let totalVolume = 0;

    for (const lift of lifts) {
      totalSets += lift.sets;
      totalVolume += lift.volume || 0;

      const weights = exerciseMuscleMap[lift.exerciseName] ?? {};
      for (const [schemaKey, w] of Object.entries(weights)) {
        if ((w as number) > 0) {
          rawMuscleSetMap[schemaKey] = (rawMuscleSetMap[schemaKey] ?? 0) + lift.sets * (w as number);
        }
      }
    }

    // Cross-reference actuals with goals to generate rich statuses
    const detailedBreakdown: Record<string, { sets: number, target: string, status: string }> = {};

    for (const [schemaKey, displayKey] of Object.entries(SCHEMA_TO_GOAL)) {
      const actualSets = rawMuscleSetMap[schemaKey] || 0;
      const goal = weeklyGoals.find(g => g.muscleGroup === schemaKey);

      let status = "";
      let targetText = "";

      if (goal) {
        targetText = `${goal.lowGoal}-${goal.highGoal}`;
        if (actualSets === 0) status = "⚪ EMPTY";
        else if (actualSets < goal.lowGoal) status = "📉 UNDER";
        else if (actualSets > goal.highGoal) status = "🔥 MAX";
        else status = "✅ OPTIMAL";
      } else {
        targetText = "No target";
        status = actualSets > 0 ? "⚡ UNTRACKED" : "⚪ EMPTY";
      }

      detailedBreakdown[displayKey] = {
        sets: actualSets,
        target: targetText,
        status: status
      };
    }

    return {
      totalSets,
      totalVolume: Math.round(totalVolume), // Fixed the massive decimal!
      totalExercises: new Set(lifts.map(l => l.exerciseName)).size,
      muscleBreakdown: detailedBreakdown
    };
  }
});

// 2. The Sender: Packages it for Make.com and fires the Webhook
export const sendWeeklySummary = action({
  args: {},
  handler: async (ctx) => {
    // Deadbolt for Demo Environment
    const cloudUrl = process.env.CONVEX_CLOUD_URL;
    if (cloudUrl?.includes("giddy-anaconda-476")) {
      console.log("Demo environment detected. Skipping weekly summary webhook.");
      return;
    }

    const stats = await ctx.runQuery(internal.summary.getWeeklyBreakdown, {});
    const bd = stats.muscleBreakdown;

    // Create a guaranteed HTML-formatted text list for your email
    const emailText = Object.entries(bd)
      .filter(([_, data]) => data.sets > 0 || data.target !== "No target")
      .sort((a, b) => b[1].sets - a[1].sets)
      .map(([muscle, data]) => {
        return `<li><b>${muscle}:</b> ${data.sets.toFixed(1)} sets <i>[Goal: ${data.target}]</i> &rarr; ${data.status}</li>`;
      })
      .join("");

    const summaryPayload = {
      totalSets: stats.totalSets,
      totalVolume: stats.totalVolume,
      totalExercises: stats.totalExercises,
      emailFormattedBreakdown: `<ul>${emailText}</ul>`, // Wrapped in a clean HTML list

      // Flat data points for your Google Sheets columns
      chestSets: bd['Chest']?.sets || 0,
      shouldersSets: bd['Shoulders']?.sets || 0,
      tricepsSets: bd['Triceps']?.sets || 0,
      backSets: bd['Back']?.sets || 0,
      upperTrapsSets: bd['Upper Traps']?.sets || 0,
      bicepsSets: bd['Biceps']?.sets || 0,
      quadsSets: bd['Quads']?.sets || 0,
      hamstringsSets: bd['Hamstrings']?.sets || 0,
      glutesSets: bd['Glutes']?.sets || 0,
      calvesSets: bd['Calves']?.sets || 0,
      coreSets: bd['Core']?.sets || 0,
      forearmsSets: bd['Forearms']?.sets || 0,
      neckSets: bd['Neck']?.sets || 0,

      timestamp: new Date().toISOString().split('T')[0]
    };

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("No WEBHOOK_URL environment variable set.");
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryPayload),
      });
      console.log("Detailed Weekly summary webhook sent successfully.");
    } catch (error) {
      console.error("Error sending webhook:", error);
    }
  },
});