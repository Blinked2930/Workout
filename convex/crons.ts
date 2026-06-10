import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run the demo reset script every day at 3:00 AM UTC
crons.daily(
  "reset-demo-database",
  { hourUTC: 3, minuteUTC: 0 },
  api.demo.resetAndSeedDemo
);

// Send the weekly summary webhook every Sunday at 11:55 PM local time (21:55 UTC)
crons.weekly(
  "send-weekly-summary",
  { dayOfWeek: "sunday", hourUTC: 21, minuteUTC: 55 },
  api.summary.sendWeeklySummary
);

export default crons;