// convex/seed.ts
import { mutation } from "./_generated/server";

type ExRow = [string, string, string, boolean, Record<string, number>];
// [name, category, subcategory, isBodyweight, muscleWeights]

const EXERCISES: ExRow[] = [
  // ── Push / Chest ──────────────────────────────────────────────────────────
  ["Cable cross over",              "Push","Chest",false,{chest:1}],
  ["Bench press",                   "Push","Chest",false,{chest:1,shoulders:0.5}],
  ["Incline bench",                 "Push","Chest",false,{chest:1,shoulders:1}],
  ["Chest press machine one arm",   "Push","Chest",false,{chest:1,shoulders:0.5}],
  ["DB bench",                      "Push","Chest",false,{chest:1,shoulders:0.5}],
  ["Smith machine incline press",   "Push","Chest",false,{chest:1,shoulders:0.5}],
  ["Push-Ups",                      "Push","Chest",true, {chest:1,shoulders:0.5,core:0.5}],
  ["Incline Push-Ups",              "Push","Chest",true, {chest:1,shoulders:0.5,core:0.5}],
  ["Decline Push-Ups",              "Push","Chest",true, {chest:1,shoulders:1,core:0.5}],
  ["Incline DB bench",              "Push","Chest",false,{chest:1,shoulders:0.5}],
  ["Chest press machine",           "Push","Chest",false,{chest:1,shoulders:0.5}],
  ["Dips - Chest Focused",          "Push","Chest",true, {chest:1,shoulders:0.5}],
  ["Barbell Incline Press",         "Push","Chest",false,{chest:1,shoulders:1}],
  ["Barbell Flys - Flat",           "Push","Chest",false,{chest:1}],
  ["Barbell Flys - Incline",        "Push","Chest",false,{chest:1}],
  ["Pec Deck Machine",              "Push","Chest",false,{chest:1}],
  ["Close-Grip Bench Press",        "Push","Chest",false,{chest:1,shoulders:0.5}],
  ["Archer Push-Ups",               "Push","Chest",true, {chest:1,shoulders:0.5,core:0.5}],
  ["Ring Dips (Bulgarian)",         "Push","Chest",true, {chest:1,shoulders:0.5,triceps:0.5}],
  ["Ring Flys",                     "Push","Chest",true, {chest:1}],
  ["RTO Push-Ups",                  "Push","Chest",true, {chest:1,shoulders:0.5,core:0.5}],
  ["Pseudo Planche Push-Ups",       "Push","Chest",true, {chest:1,shoulders:1,core:0.5}],
  ["Typewriter Push-Ups",           "Push","Chest",true, {chest:1,shoulders:0.5,core:0.5}],
  ["One-Arm Push-Up Progressions",  "Push","Chest",true, {chest:1,shoulders:0.5,core:0.5}],
  ["Explosive/Clapping Push-Ups",   "Push","Chest",true, {chest:1,shoulders:0.5,core:0.25}],
  ["Deep Deficit Push-Ups",         "Push","Chest",true, {chest:1,shoulders:0.5,core:0.5}],
  ["QDR (Rotational Push-Ups)",     "Push","Chest",true, {chest:0.5,shoulders:0.5,core:0.5}],

  // ── Push / Shoulders ──────────────────────────────────────────────────────
  ["Seated DB shoulder press",            "Push","Shoulders",false,{shoulders:1}],
  ["Shoulder press machine",              "Push","Shoulders",false,{shoulders:1}],
  ["Cable Lateral raise",                 "Push","Shoulders",false,{shoulders:1}],
  ["Face pulls",                          "Push","Shoulders",false,{shoulders:1,upperTraps:0.5}],
  ["Barbell Overhead Press",              "Push","Shoulders",false,{shoulders:1,triceps:0.5}],
  ["DB standing overhead press",          "Push","Shoulders",false,{shoulders:1}],
  ["Handstand Push-ups",                  "Push","Shoulders",true, {shoulders:1,core:0.5}],
  ["Pike Push-ups",                       "Push","Shoulders",true, {shoulders:1,core:0.5}],
  ["Arnold Press",                        "Push","Shoulders",false,{shoulders:1}],
  ["Leaning DB lateral raise",            "Push","Shoulders",false,{shoulders:1}],
  ["Cable lateral raises",                "Push","Shoulders",false,{shoulders:1}],
  ["Front Raises - DB",                   "Push","Shoulders",false,{shoulders:1}],
  ["Front Raises - Plate",                "Push","Shoulders",false,{shoulders:1}],
  ["Front Raises - Cable",                "Push","Shoulders",false,{shoulders:1}],
  ["Rear Delt Fly - DB",                  "Push","Shoulders",false,{shoulders:1}],
  ["Rear Delt Fly - Cable",               "Push","Shoulders",false,{shoulders:1}],
  ["Rear Delt Fly - Reverse Pec deck",    "Push","Shoulders",false,{shoulders:1}],
  ["Upright Row",                         "Push","Shoulders",false,{shoulders:1,upperTraps:0.5}],
  ["Freestanding Handstand Push-Ups",     "Push","Shoulders",true, {shoulders:1,core:0.5}],
  ["Deficit Pike Push-Ups",               "Push","Shoulders",true, {shoulders:1,core:0.5}],
  ["Wall Walks",                          "Push","Shoulders",true, {shoulders:1,core:0.5}],
  ["Planche Leans",                       "Push","Shoulders",true, {shoulders:1,core:0.5}],
  ["Ring Face Pulls",                     "Push","Shoulders",true, {shoulders:1,upperTraps:0.25}],
  ["Ring Rear Delt Flys",                 "Push","Shoulders",true, {shoulders:1}],
  ["Rear Delt \"Y\" Raises",              "Push","Shoulders",false,{shoulders:1}],
  ["Hindu / Dive Bomber Push-Ups",        "Push","Shoulders",true, {shoulders:0.5,chest:0.5,core:0.25}],
  ["Straddle Planche",                    "Push","Shoulders",true, {shoulders:1,core:0.5}],

  // ── Push / Triceps ────────────────────────────────────────────────────────
  ["Tricep pushdowns",                "Push","Triceps",false,{triceps:1}],
  ["Overhead cable tricep extensions","Push","Triceps",false,{triceps:1}],
  ["Cable tricep extensions straight bar","Push","Triceps",false,{triceps:1}],
  ["Skull Crushers",                  "Push","Triceps",false,{triceps:1}],
  ["Dips - Tricep Focused",           "Push","Triceps",true, {triceps:1,shoulders:0.5}],
  ["Dumbbell Kickbacks",              "Push","Triceps",false,{triceps:1}],
  ["Rope Pushdowns",                  "Push","Triceps",false,{triceps:1}],
  ["Bodyweight Skull Crushers",       "Push","Triceps",true, {triceps:1}],
  ["Ring Tricep Extensions",          "Push","Triceps",true, {triceps:1}],
  ["Sphinx Push-Ups",                 "Push","Triceps",true, {triceps:1}],
  ["Tiger Bend Push-Ups",             "Push","Triceps",true, {triceps:1,shoulders:0.5}],
  ["Impossible Dips",                 "Push","Triceps",true, {triceps:1,chest:0.5}],
  ["Diamond Push-Ups",                "Push","Triceps",true, {triceps:1,chest:0.5}],
  ["Bench Dips (Elevated Feet)",      "Push","Triceps",true, {triceps:1}],
  ["Korean Dips (Bar Behind)",        "Push","Triceps",true, {triceps:1,shoulders:0.5}],

  // ── Pull / Back ───────────────────────────────────────────────────────────
  ["Lat pullover",                    "Pull","Back",false,{back:1}],
  ["Seated machine row",              "Pull","Back",false,{back:1}],
  ["Reverse close grip lat pull-down","Pull","Back",false,{back:1,biceps:0.5}],
  ["DB row",                          "Pull","Back",false,{back:1}],
  ["Wide grip pull down",             "Pull","Back",false,{back:1,biceps:0.5}],
  ["Lat pull down",                   "Pull","Back",false,{back:1,biceps:0.5}],
  ["Barbell Bent-Over Row",           "Pull","Back",false,{back:1,upperTraps:0.5}],
  ["Pullups",                         "Pull","Back",true, {back:1,biceps:0.5}],
  ["Bodyweight Rows",                 "Pull","Back",true, {back:1,biceps:0.5}],
  ["T-Bar Row",                       "Pull","Back",false,{back:1}],
  ["Dead Hang",                       "Pull","Back",true, {back:0.5,forearms:0.5}],
  ["Chin ups",                        "Pull","Back",true, {back:1,biceps:0.5}],
  ["Back Extensions",                 "Pull","Back",true, {back:1,hamstrings:0.5}],
  ["Muscle-Ups",                      "Pull","Back",true, {back:1,biceps:0.5,triceps:0.5}],
  ["Front Lever Rows",                "Pull","Back",true, {back:1,biceps:0.5}],
  ["Front Lever Holds",               "Pull","Back",true, {back:1,core:0.5}],
  ["Archer Pull-Ups",                 "Pull","Back",true, {back:1,biceps:0.5}],
  ["Typewriter Pull-Ups",             "Pull","Back",true, {back:1,biceps:0.5}],
  ["L-Sit Pull-Ups",                  "Pull","Back",true, {back:1,biceps:0.5,core:0.5}],
  ["Commando Pull-Ups",               "Pull","Back",true, {back:1,biceps:0.5}],
  ["Ring Rows (Feet Elevated)",       "Pull","Back",true, {back:1,biceps:0.5}],
  ["One-Arm Ring Rows",               "Pull","Back",true, {back:1,biceps:0.5}],
  ["Skin the Cat",                    "Pull","Back",true, {back:1,core:0.5}],
  ["Mantle Chin-Ups",                 "Pull","Back",true, {back:1,biceps:0.5}],
  ["Iron Cross Hold (Support)",       "Pull","Back",true, {back:1,chest:0.5,core:0.5}],

  // ── Pull / Upper Traps ────────────────────────────────────────────────────
  ["Shrugs - Barbell",      "Pull","Upper Traps",false,{upperTraps:1}],
  ["Shrugs - DB",           "Pull","Upper Traps",false,{upperTraps:1}],
  ["Handstand Shrugs",      "Pull","Upper Traps",true, {upperTraps:1}],
  ["Inverted Shrugs",       "Pull","Upper Traps",true, {upperTraps:1}],
  ["Parallel Bar Shrugs",   "Pull","Upper Traps",true, {upperTraps:1}],

  // ── Pull / Biceps ─────────────────────────────────────────────────────────
  ["Inclined curls",            "Pull","Biceps",false,{biceps:1}],
  ["Z bar curl",                "Pull","Biceps",false,{biceps:1}],
  ["bayesian curl",             "Pull","Biceps",false,{biceps:1}],
  ["Barbell Curl",              "Pull","Biceps",false,{biceps:1}],
  ["Dumbbell Hammer Curl",      "Pull","Biceps",false,{biceps:1,forearms:0.5}],
  ["Preacher Curl - Machine",   "Pull","Biceps",false,{biceps:1}],
  ["Preacher Curl - DB",        "Pull","Biceps",false,{biceps:1}],
  ["Preacher Curl - zbar",      "Pull","Biceps",false,{biceps:1}],
  ["Concentration Curl",        "Pull","Biceps",false,{biceps:1}],
  ["Pelican Curls (Rings)",     "Pull","Biceps",true, {biceps:1}],
  ["Ring Bicep Curls",          "Pull","Biceps",true, {biceps:1}],
  ["Headbangers",               "Pull","Biceps",true, {biceps:1}],
  ["Chin-Up Iso Holds",         "Pull","Biceps",true, {biceps:1,back:0.5}],
  ["Inverted Row (Underhand)",  "Pull","Biceps",true, {biceps:1,back:0.5}],

  // ── Legs / Glutes ─────────────────────────────────────────────────────────
  ["Barbell Glute bridges",           "Legs","Glutes",false,{glutes:1,hamstrings:0.5}],
  ["DB glute bridges",                "Legs","Glutes",false,{glutes:1,hamstrings:0.5}],
  ["Barbell Glute bridges on bench",  "Legs","Glutes",false,{glutes:1,hamstrings:0.5}],
  ["DB Glute bridges on bench",       "Legs","Glutes",false,{glutes:1,hamstrings:0.5}],
  ["Barbell Hip Thrust",              "Legs","Glutes",false,{glutes:1,hamstrings:0.5}],
  ["Cable Pull-Through",              "Legs","Glutes",false,{glutes:1,hamstrings:0.5}],
  ["Single-Leg Hip Thrust",           "Legs","Glutes",true, {glutes:1,hamstrings:0.5}],
  ["Elevated Single-Leg Glute Bridge","Legs","Glutes",true, {glutes:1,hamstrings:0.5}],
  ["Reverse Hyper",                   "Legs","Glutes",false,{glutes:1,hamstrings:0.5}],
  ["Ring Fallout",                    "Legs","Glutes",true, {glutes:0.5,core:0.5}],
  ["Single-Leg Glute Bridge Sliders", "Legs","Glutes",true, {glutes:1,hamstrings:0.5}],

  // ── Legs / Quads ──────────────────────────────────────────────────────────
  ["Leg extensions",                  "Legs","Quads",false,{quads:1}],
  ["Leg press",                       "Legs","Quads",false,{quads:1,hamstrings:0.5}],
  ["Back squat",                      "Legs","Quads",false,{quads:1,hamstrings:0.5,glutes:0.5}],
  ["Goblet squat",                    "Legs","Quads",false,{quads:1,glutes:0.5}],
  ["Front Squat",                     "Legs","Quads",false,{quads:1}],
  ["Bulgarian Split Squat",           "Legs","Quads",false,{quads:1,glutes:0.5}],
  ["Walking Lunges",                  "Legs","Quads",false,{quads:1,glutes:0.5}],
  ["Step-Ups - Barbell",              "Legs","Quads",false,{quads:1,glutes:0.5}],
  ["Step-Ups - DB",                   "Legs","Quads",false,{quads:1,glutes:0.5}],
  ["Pistol Squats",                   "Legs","Quads",true, {quads:1,glutes:0.5}],
  ["Hack Squat Machine",              "Legs","Quads",false,{quads:1}],
  ["Shrimp Squats",                   "Legs","Quads",true, {quads:1,glutes:0.5}],
  ["Sissy Squats",                    "Legs","Quads",true, {quads:1}],
  ["Airborne Lunges",                 "Legs","Quads",true, {quads:1,glutes:0.5}],
  ["Matrix Lunges",                   "Legs","Quads",false,{quads:1,glutes:0.5}],
  ["Assisted Pistol Squats (Rings)",  "Legs","Quads",true, {quads:1,glutes:0.5}],
  ["Jump Squats",                     "Legs","Quads",true, {quads:1,glutes:0.5}],
  ["Box Jumps",                       "Legs","Quads",true, {quads:1,glutes:0.5}],
  ["Cossack Squats",                  "Legs","Quads",true, {quads:1,glutes:0.25}],
  ["Reverse Nordic Curls",            "Legs","Quads",true, {quads:1,hamstrings:0.25}],
  ["Broad Jumps (Plyo)",              "Legs","Quads",true, {quads:1,glutes:0.5}],

  // ── Legs / Hamstrings ─────────────────────────────────────────────────────
  ["Seated leg curls",            "Legs","Hamstrings",false,{hamstrings:1}],
  ["Glute-ham raise",             "Legs","Hamstrings",true, {hamstrings:1,glutes:0.5}],
  ["Laying Leg curls",            "Legs","Hamstrings",false,{hamstrings:1}],
  ["Barbell RDL",                 "Legs","Hamstrings",false,{hamstrings:1,glutes:0.5}],
  ["DB RDL",                      "Legs","Hamstrings",false,{hamstrings:1,glutes:0.5}],
  ["Barbell Deadlift - Sumo",     "Legs","Hamstrings",false,{hamstrings:1,glutes:0.5,back:0.5}],
  ["Barbell Deadlift - Conventional","Legs","Hamstrings",false,{hamstrings:1,glutes:0.5,back:0.5}],
  ["Single-Leg Bodyweight RDL",   "Legs","Hamstrings",true, {hamstrings:1,glutes:0.5}],
  ["Smith machine deadlift",      "Legs","Hamstrings",false,{hamstrings:1,glutes:0.5}],
  ["Nordic Hamstring Curl",       "Legs","Hamstrings",true, {hamstrings:1}],
  ["Slider Leg Curls",            "Legs","Hamstrings",true, {hamstrings:1,glutes:0.25}],
  ["Ring Leg Curls",              "Legs","Hamstrings",true, {hamstrings:1,glutes:0.25}],
  ["Harop Curl",                  "Legs","Hamstrings",true, {hamstrings:1}],
  ["Jefferson Curl",              "Legs","Hamstrings",false,{hamstrings:1,back:0.5}],

  // ── Legs / Calves ─────────────────────────────────────────────────────────
  ["Single leg Standing (leg press machine) toe raises","Legs","Calves",false,{calves:1}],
  ["Seated toe raises",                    "Legs","Calves",false,{calves:1}],
  ["Standing (leg press machine) toe raises","Legs","Calves",false,{calves:1}],
  ["Single leg Seated toe raises",         "Legs","Calves",false,{calves:1}],
  ["One leg standing toe raise",           "Legs","Calves",true, {calves:1}],
  ["Donkey Calf Raise",                    "Legs","Calves",false,{calves:1}],
  ["Explosive Pogo Hops",                  "Legs","Calves",true, {calves:1}],
  ["Single Leg Calf Raise (Deficit)",      "Legs","Calves",true, {calves:1}],
  ["Jump Rope (Double Unders)",            "Legs","Calves",true, {calves:1}],
  ["Tibialis Raises (Wall/Weight)",        "Legs","Calves",true, {calves:0.5}],

  // ── Legs / Other ──────────────────────────────────────────────────────────
  ["Hip Adduction Machine",       "Legs","Other",false,{quads:0.5}],
  ["Hip Abduction Machine",       "Legs","Other",false,{glutes:0.5}],
  ["Bodyweight side lunges",      "Legs","Other",true, {quads:0.5,glutes:0.5}],
  ["Bodyweight Reverse Lunges",   "Legs","Other",true, {quads:1,glutes:0.5}],
  ["DB Reverse Lunges",           "Legs","Other",false,{quads:1,glutes:0.5}],
  ["Curtsy Lunges",               "Legs","Other",true, {quads:0.5,glutes:0.5}],
  ["DB Curtsy Lunges",            "Legs","Other",false,{quads:0.5,glutes:0.5}],
  ["Barbell Reverse Lunges",      "Legs","Other",false,{quads:1,glutes:0.5}],
  ["Kettlebell Swings",           "Legs","Other",false,{glutes:1,hamstrings:0.5}],
  ["Copenhagen Plank (Adductor)", "Legs","Other",true, {quads:0.5,core:0.5}],
  ["Lateral Step-Ups",            "Legs","Other",true, {quads:0.5,glutes:0.5}],
  ["Duck Walk",                   "Legs","Other",true, {quads:0.5,glutes:0.5}],
  ["Horse Stance",                "Legs","Other",true, {quads:0.5}],
  ["Seated Good Morning",         "Legs","Other",false,{hamstrings:0.5,back:0.5}],

  // ── Extra / Forearms ──────────────────────────────────────────────────────
  ["Wrist Curls",           "Extra","Forearms",false,{forearms:1}],
  ["Reverse Wrist Curls",   "Extra","Forearms",false,{forearms:1}],
  ["Farmer's Walk",         "Extra","Forearms",false,{forearms:1,upperTraps:0.5}],
  ["Suitcase Carry",        "Extra","Forearms",false,{forearms:1,core:0.5}],
  ["Towel Hangs",           "Extra","Forearms",true, {forearms:1}],
  ["Fingertip Push-Ups",    "Extra","Forearms",true, {forearms:0.5,chest:0.5}],
  ["Wrist Roller",          "Extra","Forearms",false,{forearms:1}],
  ["Dead Hang (One Arm)",   "Extra","Forearms",true, {forearms:1,back:0.5}],

  // ── Extra / Neck ──────────────────────────────────────────────────────────
  ["Neck Curls",                "Extra","Neck",true, {neck:1}],
  ["Neck Extensions",           "Extra","Neck",true, {neck:1}],
  ["Neck Bridges (Wrestler)",   "Extra","Neck",true, {neck:1}],
  ["Isometric Neck Holds",      "Extra","Neck",true, {neck:1}],
  ["Neck Plank (Front/Back)",   "Extra","Neck",true, {neck:1}],

  // ── Extra / Core ──────────────────────────────────────────────────────────
  ["Cable crunch",              "Extra","Core",false,{core:1}],
  ["Deadbugs",                  "Extra","Core",true, {core:1}],
  ["Cable wood chops",          "Extra","Core",false,{core:1}],
  ["Ab Rollout",                "Extra","Core",true, {core:1}],
  ["Body Saw",                  "Extra","Core",true, {core:1}],
  ["Cable Pallof Press",        "Extra","Core",false,{core:1}],
  ["Plank",                     "Extra","Core",true, {core:1}],
  ["Side Plank",                "Extra","Core",true, {core:1}],
  ["Hanging Leg Raises",        "Extra","Core",true, {core:1}],
  ["Hanging Knee Raise",        "Extra","Core",true, {core:1}],
  ["Russian Twists",            "Extra","Core",true, {core:1}],
  ["Reverse Crunch",            "Extra","Core",true, {core:1}],
  ["Dragon Flags",              "Extra","Core",true, {core:1}],
  ["Toes-to-Bar",               "Extra","Core",true, {core:1,back:0.25}],
  ["Windshield Wipers",         "Extra","Core",true, {core:1}],
  ["L-Sit",                     "Extra","Core",true, {core:1}],
  ["V-Sit",                     "Extra","Core",true, {core:1}],
  ["Manna",                     "Extra","Core",true, {core:1,shoulders:0.5}],
  ["Human Flag Progressions",   "Extra","Core",true, {core:1,back:0.5}],
  ["Ring Rollouts",             "Extra","Core",true, {core:1}],
  ["Hollow Body Rocks",         "Extra","Core",true, {core:1}],
  ["Compression Leg Lifts",     "Extra","Core",true, {core:1}],
  ["Vacuum",                    "Extra","Core",true, {core:0.5}],
  ["Press to Handstand",        "Extra","Core",true, {shoulders:1,core:0.5}],
  ["Back Lever Progressions",   "Extra","Core",true, {back:1,core:0.5}],
  ["Ice Cream Makers",          "Extra","Core",true, {back:1,core:0.5}],
];

export const seedExercises = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("exercises").collect();
    const existingNames = new Set(existing.map(e => e.name));
    let added = 0;

    for (const [name, category, subcategory, isBodyweight, rawWeights] of EXERCISES) {
      if (existingNames.has(name)) continue;
      await ctx.db.insert("exercises", {
        name,
        category,
        subcategory,
        isBodyweight,
        muscleWeights: rawWeights,
      });
      added++;
    }

    return { added, total: EXERCISES.length, skipped: EXERCISES.length - added };
  },
});

export const seedWeeklyGoalsIfEmpty = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("weeklyGoals").collect();
    if (existing.length > 0) return { skipped: true };

    const goals = [
      { muscleGroup: "Chest",             lowGoal: 8,  highGoal: 15 },
      { muscleGroup: "Shoulders",         lowGoal: 10, highGoal: 20 },
      { muscleGroup: "Triceps - Isolation",lowGoal: 6, highGoal: 10 },
      { muscleGroup: "Back",              lowGoal: 10, highGoal: 20 },
      { muscleGroup: "Upper Traps",       lowGoal: 3,  highGoal: 10 },
      { muscleGroup: "Biceps - Isolation",lowGoal: 6,  highGoal: 10 },
      { muscleGroup: "Glute",             lowGoal: 10, highGoal: 20 },
      { muscleGroup: "Quads",             lowGoal: 10, highGoal: 15 },
      { muscleGroup: "Hamstrings",        lowGoal: 8,  highGoal: 12 },
      { muscleGroup: "Calves",            lowGoal: 6,  highGoal: 10 },
      { muscleGroup: "Forearms",          lowGoal: 3,  highGoal: 8  },
      { muscleGroup: "Neck",              lowGoal: 3,  highGoal: 10 },
      { muscleGroup: "Core",              lowGoal: 6,  highGoal: 10 },
    ];

    for (const g of goals) await ctx.db.insert("weeklyGoals", g);
    return { added: goals.length };
  },
});