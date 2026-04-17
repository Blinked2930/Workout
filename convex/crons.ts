import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run the demo reset script every day at 3:00 AM UTC
crons.daily(
  "reset-demo-database",
  { hourUTC: 3, minuteUTC: 0 },
  api.demo.resetAndSeedDemo
);

export default crons;