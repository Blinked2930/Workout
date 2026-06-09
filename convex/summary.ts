import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const sendWeeklySummary = action({
  args: {},
  handler: async (ctx) => {
    // We need to fetch the last 7 days of lifts
    // We can call an internal query to get this.
    const lastWeekLifts = await ctx.runQuery(internal.lifts.getThisWeeksLiftsInternal, {});

    const totalSets = lastWeekLifts.reduce((a, l) => a + l.sets, 0);
    const totalVolume = lastWeekLifts.reduce((a, l) => a + l.volume, 0);
    const totalExercises = new Set(lastWeekLifts.map(l => l.exerciseName)).size;

    const summaryPayload = {
      totalSets,
      totalVolume,
      totalExercises,
      totalLiftsCount: lastWeekLifts.length,
      timestamp: Date.now()
    };

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("No WEBHOOK_URL environment variable set. Skipping summary webhook.");
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summaryPayload),
      });
      if (!response.ok) {
        console.error("Webhook failed to send:", response.statusText);
      } else {
        console.log("Weekly summary webhook sent successfully.");
      }
    } catch (error) {
      console.error("Error sending webhook:", error);
    }
  },
});
