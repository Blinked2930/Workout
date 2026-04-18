import { mutation } from "./_generated/server";

// ── 1. REAL HISTORICAL DATA ─────────────────────────────────────────────────
const RAW_LIFTS = [[1752364800000,"Leg extensions","Machine/Cable",130.0,8,1,1040.0,""],[1752364800000,"Seated leg curls","Other",70.0,11,1,770.0,""],[1752364800000,"Leg press","Other",230.0,9,1,2070.0,""],[1752192000000,"Lat pullover","Other",35.0,5,1,175.0,""],[1752192000000,"Seated machine row","Machine/Cable",130.0,8,1,1040.0,""],[1752192000000,"Reverse close grip lat pull-down","Machine/Cable",120.0,8,1,960.0,""],[1752105600000,"Inclined curls","Other",35.0,5,1,175.0,""],[1752105600000,"Leaning DB lateral raise","Dumbbell",20.0,5,1,100.0,""],[1752105600000,"Glute-ham raise","Other",105.0,10,1,1050.0,""],[1752105600000,"Seated DB shoulder press","Dumbbell",30.0,10,1,300.0,""],[1752105600000,"Shoulder press machine","Machine/Cable",60.0,5,1,300.0,""],[1752105600000,"Single leg Standing (leg press machine) toe raises","Machine/Cable",160.0,5,1,800.0,""],[1752105600000,"Seated toe raises","Other",210.0,10,1,2100.0,""],[1752105600000,"Laying Leg curls","Other",95.0,10,1,950.0,""],[1752105600000,"Cable cross over","Machine/Cable",15.0,10,1,150.0,""],[1752105600000,"Bench press","Barbell",155.0,5,1,775.0,""],[1752105600000,"RDL","Barbell",219.0,5,1,1095.0,""],[1752105600000,"Cable Lateral raise","Machine/Cable",10.0,5,1,50.0,""],[1752105600000,"Cable lateral raises","Machine/Cable",5.0,10,1,50.0,""],[1752105600000,"Barbell Overhead Press","Other",75.0,5,1,375.0,""],[1752105600000,"Z bar curl","Other",75.0,5,1,375.0,""],[1752105600000,"Tricep pushdowns","Other",60.0,5,1,300.0,""],[1752105600000,"Overhead cable tricep extensions","Machine/Cable",32.5,5,1,162.5,""],[1752105600000,"Wide grip pull down","Other",40.0,10,1,400.0,""],[1752105600000,"DB row","Dumbbell",50.0,10,1,500.0,""],[1752105600000,"Laying Leg curls","Other",155.0,5,1,775.0,""],[1752105600000,"Inclined curls","Other",20.0,10,1,200.0,""],[1752105600000,"Cable crunch","Machine/Cable",85.0,5,1,425.0,""],[1752105600000,"Standing (leg press machine) toe raises","Machine/Cable",390.0,5,1,1950.0,""],[1752105600000,"Cable cross over","Machine/Cable",20.0,5,1,100.0,""],[1752105600000,"Overhead cable tricep extensions","Machine/Cable",32.5,5,1,162.5,""],[1752105600000,"Tricep pushdowns","Other",35.0,10,1,350.0,""],[1752105600000,"Lat pull down","Other",150.0,5,1,750.0,""],[1752105600000,"Overhead cable tricep extensions","Machine/Cable",30.0,10,1,300.0,""],[1752105600000,"bayesian curl","Other",25.0,5,1,125.0,""],[1752105600000,"Incline bench","Other",105.0,10,1,1050.0,""],[1752105600000,"Leg extensions","Machine/Cable",225.0,5,1,1125.0,""],[1752105600000,"Chest press machine one arm","Machine/Cable",40.0,5,1,200.0,""],[1752105600000,"Leg press","Other",310.0,5,1,1550.0,""],[1752105600000,"Seated DB shoulder press","Dumbbell",35.0,5,1,175.0,""],[1752105600000,"Standing (leg press machine) toe raises","Machine/Cable",280.0,10,1,2800.0,""],[1752105600000,"Cable lateral raises","Machine/Cable",10.0,5,1,50.0,""],[1752105600000,"Single leg Seated toe raises","Other",200.0,5,1,1000.0,""],[1752105600000,"Cable tricep extensions straight bar","Machine/Cable",35.0,10,1,350.0,""],[1752105600000,"DB bench","Dumbbell",50.0,5,1,250.0,""],[1752105600000,"Leg press","Other",230.0,10,1,2300.0,""],[1752105600000,"Smith machine incline press","Machine/Cable",95.0,5,1,475.0,""],[1752105600000,"Seated machine row","Machine/Cable",175.0,5,1,875.0,""],[1752105600000,"Seated machine row","Machine/Cable",145.0,10,1,1450.0,""],[1752105600000,"Squat","Barbell",205.0,5,1,1025.0,""],[1752105600000,"Tricep pushdowns","Other",40.0,10,1,400.0,""],[1752105600000,"Z bar curl","Other",45.0,10,1,450.0,""],[1752105600000,"Cable tricep extensions straight bar","Machine/Cable",37.5,5,1,187.5,""],[1752105600000,"Single leg Seated toe raises","Other",185.0,10,1,1850.0,""],[1752105600000,"Leg extensions","Machine/Cable",145.0,10,1,1450.0,""],[1752105600000,"One leg standing toe raise","Other",40.0,10,1,400.0,""],[1752105600000,"Leaning DB lateral raise","Dumbbell",15.0,10,1,150.0,""],[1753700733000,"DB bench","Dumbbell",45.0,10,1,450.0,""],[1753700879000,"Goblet squat","Barbell",45.0,13,1,585.0,""],[1753702567000,"RDL","Dumbbell",50.0,12,1,600.0,""],[1753702614000,"Face pulls","Other",30.0,12,1,360.0,""],[1753989430000,"Seated machine row","Machine/Cable",130.0,9,1,1170.0,""],[1753989462000,"DB standing overhead press","Dumbbell",35.0,11,1,385.0,""],[1753989520000,"DB side lunges","Dumbbell",40.0,8,1,320.0,""],[1754148315000,"Barbell Deadlift - Conventional","Barbell",90.0,12,1,1080.0,""],[1754148681000,"Smith machine deadlift","Machine/Cable",180.0,8,1,1440.0,""],[1754149389000,"Incline DB bench","Dumbbell",40.0,12,1,480.0,""],[1754149411000,"Pullups","Bodyweight",161.0,8,1,1288.0,""],[1754149942000,"Reverse Lunges","Dumbbell",30.0,12,1,360.0,""],[1754730133000,"Smith machine deadlift","Machine/Cable",180.0,9,1,1620.0,""],[1754731504000,"Incline DB bench","Dumbbell",40.0,11,1,440.0,""],[1754731551000,"Pullups","Bodyweight",161.0,8,1,1288.0,""],[1754732138000,"Reverse Lunges","Dumbbell",40.0,8,1,320.0,""],[1754937139000,"Goblet squat","Barbell",45.0,15,1,675.0,""],[1754937160000,"Lat pull down","Other",155.0,8,1,1240.0,""],[1754937238000,"Chest press machine","Machine/Cable",110.0,8,1,880.0,""],[1754938054000,"Face pulls","Other",39.0,10,1,390.0,""],[1754938073000,"RDL","Dumbbell",55.0,12,1,660.0,""],[1764750601000,"DB bench","Dumbbell",36.0,9,4,1296.0,""],[1764751258000,"Pullups","Bodyweight",160.0,8,4,5120.0,""],[1764751789000,"Seated machine row","Machine/Cable",90.0,10,3,2700.0,""],[1764755020000,"Seated DB shoulder press","Dumbbell",26.0,6,3,468.0,""],[1764756356000,"Overhead cable tricep extensions","Machine/Cable",10.0,8,3,240.0,"Single arm"],[1764756545000,"Inclined curls","Other",20.0,6,3,360.0,""],[1764834567000,"Squat","Barbell",136.0,6,3,2448.0,""],[1764834983000,"RDL","Barbell",116.0,10,2,2320.0,""],[1764835309000,"RDL","Barbell",132.0,9,1,1188.0,""],[1764836491000,"Cable Pull-Through","Machine/Cable",30.0,20,2,1200.0,""],[1764937934000,"Bench press","Barbell",115.0,6,3,2070.0,""],[1764938688000,"Cable cross over","Machine/Cable",60.0,10,3,1800.0,""],[1765199800000,"Bench press","Barbell",126.0,5,3,1890.0,""],[1765200919000,"Barbell Overhead Press","Barbell",72.0,7,3,1512.0,""],[1765201509000,"Seated machine row","Machine/Cable",110.0,8,3,2640.0,""],[1765203012000,"Tricep pushdowns","Other",40.0,12,3,1440.0,""],[1765203034000,"Face pulls","Other",40.0,13,3,1560.0,""],[1765532649000,"Squat","Barbell",146.0,7,3,3066.0,""],[1765533342000,"RDL","Barbell",156.0,10,3,4680.0,""],[1765534707000,"Cable Pull-Through","Machine/Cable",60.0,15,3,2700.0,""],[1765535434000,"Cable crunch","Machine/Cable",70.0,10,3,2100.0,""],[1765628445000,"DB row","Dumbbell",40.0,15,2,1200.0,""],[1765628783000,"DB bench","Dumbbell",46.0,11,4,2024.0,""],[1765628805000,"Seated machine row","Machine/Cable",100.0,10,2,2000.0,""],[1765629718000,"DB standing overhead press","Dumbbell",26.0,10,3,780.0,""],[1765629739000,"Inclined curls","Other",20.0,10,3,600.0,""],[1765630652000,"Skull Crushers","Other",26.0,12,3,936.0,""],[1765630747000,"Rear Delt Fly - DB","Other",10.0,15,3,450.0,"too heavy"],[1765632175000,"Dumbbell Hammer Curl","Dumbbell",20.0,10,4,800.0,""],[1765632210000,"One leg standing toe raise","Other",50.0,15,4,3000.0,""],[1770275245000,"Archer Push-Ups","Bodyweight",160.0,3,3,1440.0,""],[1770285997000,"Pullups","Bodyweight",160.0,7,3,3360.0,""],[1770376358000,"Pistol Squats","Other",160.0,5,3,2400.0,""],[1770376383000,"Airborne Lunges","Other",0.0,12,3,0.0,""],[1770376412000,"Tibialis Raises (Wall/Weight)","Other",0.0,20,2,0.0,""],[1770463833000,"Pike Push-ups","Bodyweight",160.0,12,3,5760.0,""],[1770463867000,"Archer Push-Ups","Bodyweight",160.0,4,2,1280.0,""],[1770463910000,"Planche Leans","Other",0.0,20,2,0.0,""],[1770463936000,"Hollow Body Rocks","Other",0.0,10,1,0.0,""],[1770802243000,"Archer Push-Ups","Bodyweight",160.0,5,3,2400.0,""],[1770803361000,"Pseudo Planche Push-Ups","Bodyweight",160.0,10,3,4800.0,""],[1770804764000,"Diamond Push-Ups","Bodyweight",160.0,4,1,640.0,""],[1770804832000,"Back Extensions","Machine/Cable",0.0,20,3,0.0,""],[1770804872000,"Hollow Body Rocks","Other",0.0,40,3,0.0,""],[1770866812000,"Pullups","Bodyweight",160.0,7,3,3360.0,""],[1770866834000,"Chin ups","Bodyweight",160.0,4,2,1280.0,""],[1772620599000,"Pullups","Bodyweight",160.0,7,3,3360.0,""],[1772620599000,"Dips - Chest Focused","Bodyweight",160.0,12,3,5760.0,""],[1772620599000,"Chin ups","Bodyweight",160.0,3,2,960.0,""],[1772598084000,"Hanging Knee Raise","Other",0.0,5,3,0.0,""],[1772684330000,"Pistol Squats","Other",160.0,7,3,3920.0,""],[1772684368000,"Slider Leg Curls","Other",0.0,5,3,0.0,""]];
const RAW_CARDIO = [[1753868266000,11.0,null,"Zone 2",""],[1753868290000,1.0,null,"Zone 2",""],[1753901545000,21.0,null,"Zone 2",""],[1754028117000,26.0,null,"Zone 2",""],[1754142340000,37.0,null,"Zone 2",""],[1754148006000,2.0,null,"Zone 2",""],[1754150117000,16.0,null,"Zone 2",""],[1754207616000,15.0,null,"Anaerobic",""],[1754207639000,32.0,null,"Zone 2",""],[1754207663000,7.0,null,"Zone 2",""],[1754476464000,15.0,null,"Zone 2",""],[1754476475000,20.0,null,"Zone 2",""],[1754730535000,20.0,null,"Anaerobic",""],[1754730552000,16.0,null,"Zone 2",""],[1754730574000,10.0,null,"Zone 2",""],[1754730590000,25.0,null,"Zone 2",""],[1754810263000,36.0,null,"Zone 2",""],[1754921332000,12.0,null,"Zone 2",""],[1761671446000,67.0,null,"Zone 2","Work for mom"],[1761671489000,3.0,null,"Anaerobic","Work for mom"],[1761820662000,10.0,null,"Zone 2",""],[1761844461000,45.0,null,"Zone 2",""],[1762248130000,15.0,null,"Zone 2",""],[1762248152000,7.0,null,"Anaerobic",""],[1762292605000,41.0,null,"Anaerobic",""],[1762292628000,37.0,null,"Zone 2",""],[1762881743000,20.0,null,"Zone 2",""],[1762881821000,5.0,null,"Anaerobic",""],[1763042749000,7.0,null,"Zone 2",""],[1764786416000,65.0,null,"Zone 2","Mix of ping pong, karate, outside work and running today "],[1764786657000,53.0,null,"Anaerobic","Mix of running, martial arts, and ping pong"],[1764868083000,35.0,null,"Zone 2",""],[1765203065000,10.0,null,"Zone 2",""],[1765469173000,10.0,null,"Zone 2",""],[1765469236000,6.0,null,"Zone 2",""],[1765721456000,20.0,null,"Zone 2",""],[1772707107000,40.0,null,"Zone 2",""],[1773056612000,36.0,null,"Zone 2",""],[1773056625000,7.5,null,"Anaerobic",""]];

// ── 2. THE HISTORICAL AUTO-TRANSLATOR ───────────────────────────────────────
// This ensures your messy old history names map perfectly to the new clean standard
const HISTORICAL_MAPPING: Record<string, string> = {
  "Cable cross over": "Chest Fly",
  "Bench press": "Bench Press",
  "DB bench": "Bench Press",
  "Incline bench": "Incline Bench Press",
  "Incline DB bench": "Incline Bench Press",
  "Smith machine incline press": "Incline Bench Press",
  "Chest press machine": "Chest Press Machine",
  "Chest press machine one arm": "Chest Press Machine",
  "Seated DB shoulder press": "Overhead Press",
  "Barbell Overhead Press": "Overhead Press",
  "DB standing overhead press": "Overhead Press",
  "Shoulder press machine": "Overhead Press",
  "Cable Lateral raise": "Lateral Raise",
  "Cable lateral raises": "Lateral Raise",
  "Leaning DB lateral raise": "Lateral Raise",
  "Rear Delt Fly - DB": "Rear Delt Fly",
  "Face pulls": "Face Pull",
  "Tricep pushdowns": "Tricep Pushdown",
  "Overhead cable tricep extensions": "Overhead Tricep Extension",
  "Cable tricep extensions straight bar": "Tricep Extension",
  "Skull Crushers": "Skull Crusher",
  "Lat pullover": "Lat Pullover",
  "Seated machine row": "Row",
  "DB row": "Row",
  "Reverse close grip lat pull-down": "Lat Pulldown",
  "Wide grip pull down": "Lat Pulldown",
  "Lat pull down": "Lat Pulldown",
  "Pullups": "Pull-Up",
  "Chin ups": "Chin-Up",
  "Inclined curls": "Incline Bicep Curl",
  "Z bar curl": "Bicep Curl",
  "bayesian curl": "Bicep Curl",
  "Dumbbell Hammer Curl": "Hammer Curl",
  "Leg press": "Leg Press",
  "Leg extensions": "Leg Extension",
  "Squat": "Squat",
  "Goblet squat": "Goblet Squat",
  "DB side lunges": "Side Lunge",
  "Reverse Lunges": "Reverse Lunge",
  "Pistol Squats": "Pistol Squat",
  "Airborne Lunges": "Airborne Lunge",
  "Seated leg curls": "Leg Curl",
  "Laying Leg curls": "Leg Curl",
  "Glute-ham raise": "Glute-Ham Raise",
  "RDL": "Romanian Deadlift",
  "Barbell Deadlift - Conventional": "Deadlift",
  "Smith machine deadlift": "Deadlift",
  "Back Extensions": "Back Extension",
  "Slider Leg Curls": "Slider Leg Curl",
  "Single leg Standing (leg press machine) toe raises": "Standing Calf Raise",
  "Standing (leg press machine) toe raises": "Standing Calf Raise",
  "One leg standing toe raise": "Standing Calf Raise",
  "Seated toe raises": "Seated Calf Raise",
  "Single leg Seated toe raises": "Seated Calf Raise",
  "Tibialis Raises (Wall/Weight)": "Tibialis Raise",
  "Cable crunch": "Cable Crunch",
  "Hanging Knee Raise": "Hanging Knee Raise",
  "Hollow Body Rocks": "Hollow Body Rock",
  "Archer Push-Ups": "Archer Push-Up",
  "Pseudo Planche Push-Ups": "Pseudo Planche Push-Up",
  "Planche Leans": "Planche Lean",
  "Diamond Push-Ups": "Diamond Push-Up",
  "Dips - Chest Focused": "Dips",
  "Cable Pull-Through": "Cable Pull-Through"
};

// ── 3. FULL EXERCISE DATABASE (DEEP DEDUPLICATION) ──────────────────────────
type ExRow = [string, string, string, boolean, Record<string, number>];
const EXERCISES: ExRow[] = [
  // Push / Chest
  ["Bench Press", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Incline Bench Press", "Push", "Chest", false, { chest: 1, shoulders: 1 }],
  ["Decline Bench Press", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Chest Press Machine", "Push", "Chest", false, { chest: 1, shoulders: 0.5 }],
  ["Chest Fly", "Push", "Chest", false, { chest: 1 }],
  ["Close-Grip Bench Press", "Push", "Triceps", false, { chest: 1, shoulders: 0.5, triceps: 1 }],
  ["Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Incline Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Decline Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 1, core: 0.5 }],
  ["Dips", "Push", "Chest", true, { chest: 1, shoulders: 0.5, triceps: 0.5 }],
  ["Archer Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Ring Dips", "Push", "Chest", true, { chest: 1, shoulders: 0.5, triceps: 0.5 }],
  ["Ring Flys", "Push", "Chest", true, { chest: 1 }],
  ["RTO Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Pseudo Planche Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 1, core: 0.5 }],
  ["Typewriter Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["One-Arm Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["Explosive Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.25 }],
  ["Deep Deficit Push-Up", "Push", "Chest", true, { chest: 1, shoulders: 0.5, core: 0.5 }],
  ["QDR", "Push", "Chest", true, { chest: 0.5, shoulders: 0.5, core: 0.5 }],

  // Push / Shoulders
  ["Overhead Press", "Push", "Shoulders", false, { shoulders: 1, triceps: 0.5 }],
  ["Lateral Raise", "Push", "Shoulders", false, { shoulders: 1 }],
  ["Front Raise", "Push", "Shoulders", false, { shoulders: 1 }],
  ["Rear Delt Fly", "Push", "Shoulders", false, { shoulders: 1, back: 0.5 }],
  ["Face Pull", "Push", "Shoulders", false, { shoulders: 1, upperTraps: 0.5, back: 0.5 }],
  ["Upright Row", "Push", "Shoulders", false, { shoulders: 1, upperTraps: 0.5 }],
  ["Handstand Push-Up", "Push", "Shoulders", true, { shoulders: 1, core: 0.5 }],
  ["Deficit Pike Push-Up", "Push", "Shoulders", true, { shoulders: 1, core: 0.5 }],
  ["Wall Walks", "Push", "Shoulders", true, { shoulders: 1, core: 0.5 }],
  ["Planche Lean", "Push", "Shoulders", true, { shoulders: 1, core: 0.5 }],
  ["Hindu Push-Up", "Push", "Shoulders", true, { shoulders: 0.5, chest: 0.5, core: 0.25 }],
  ["Straddle Planche", "Push", "Shoulders", true, { shoulders: 1, core: 0.5 }],
  ["Pike Push-up", "Push", "Shoulders", true, { shoulders: 1, core: 0.5 }],

  // Push / Triceps
  ["Tricep Pushdown", "Push", "Triceps", false, { triceps: 1 }],
  ["Tricep Extension", "Push", "Triceps", false, { triceps: 1 }],
  ["Overhead Tricep Extension", "Push", "Triceps", false, { triceps: 1 }],
  ["Skull Crusher", "Push", "Triceps", false, { triceps: 1 }],
  ["Dumbbell Kickback", "Push", "Triceps", false, { triceps: 1 }],
  ["Sphinx Push-Up", "Push", "Triceps", true, { triceps: 1 }],
  ["Tiger Bend Push-Up", "Push", "Triceps", true, { triceps: 1, shoulders: 0.5 }],
  ["Impossible Dips", "Push", "Triceps", true, { triceps: 1, chest: 0.5 }],
  ["Diamond Push-Up", "Push", "Triceps", true, { triceps: 1, chest: 0.5 }],
  ["Bench Dips", "Push", "Triceps", true, { triceps: 1 }],
  ["Korean Dips", "Push", "Triceps", true, { triceps: 1, shoulders: 0.5 }],

  // Pull / Back
  ["Lat Pullover", "Pull", "Back", false, { back: 1 }],
  ["Row", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Lat Pulldown", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Pull-Up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Chin-Up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["T-Bar Row", "Pull", "Back", false, { back: 1, biceps: 0.4 }],
  ["Dead Hang", "Pull", "Back", true, { back: 0.5, forearms: 0.5 }],
  ["Back Extension", "Pull", "Back", true, { back: 1, hamstrings: 0.5 }],
  ["Muscle-Up", "Pull", "Back", true, { back: 1, biceps: 0.5, triceps: 0.5 }],
  ["Front Lever", "Pull", "Back", true, { back: 1, core: 0.5 }],
  ["Archer Pull-Up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Typewriter Pull-Up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["L-Sit Pull-Up", "Pull", "Back", true, { back: 1, biceps: 0.5, core: 0.5 }],
  ["Commando Pull-Up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Ring Row", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Skin the Cat", "Pull", "Back", true, { back: 1, core: 0.5 }],
  ["Mantle Chin-Up", "Pull", "Back", true, { back: 1, biceps: 0.5 }],
  ["Iron Cross", "Pull", "Back", true, { back: 1, chest: 0.5, core: 0.5 }],

  // Pull / Upper Traps
  ["Shrugs", "Pull", "Upper Traps", false, { upperTraps: 1 }],
  ["Handstand Shrugs", "Pull", "Upper Traps", true, { upperTraps: 1 }],
  ["Inverted Shrugs", "Pull", "Upper Traps", true, { upperTraps: 1 }],

  // Pull / Biceps
  ["Bicep Curl", "Pull", "Biceps", false, { biceps: 1 }],
  ["Incline Bicep Curl", "Pull", "Biceps", false, { biceps: 1 }],
  ["Hammer Curl", "Pull", "Biceps", false, { biceps: 1, forearms: 0.5 }],
  ["Preacher Curl", "Pull", "Biceps", false, { biceps: 1 }],
  ["Concentration Curl", "Pull", "Biceps", false, { biceps: 1 }],
  ["Pelican Curls", "Pull", "Biceps", true, { biceps: 1 }],
  ["Headbangers", "Pull", "Biceps", true, { biceps: 1 }],
  ["Chin-Up Iso Hold", "Pull", "Biceps", true, { biceps: 1, back: 0.5 }],

  // Legs / Glutes
  ["Glute Bridge", "Legs", "Glutes", false, { glutes: 1, hamstrings: 0.5 }],
  ["Hip Thrust", "Legs", "Glutes", false, { glutes: 1, hamstrings: 0.5 }],
  ["Single-Leg Hip Thrust", "Legs", "Glutes", true, { glutes: 1, hamstrings: 0.5 }],
  ["Reverse Hyper", "Legs", "Glutes", false, { glutes: 1, hamstrings: 0.5 }],
  ["Ring Fallout", "Legs", "Glutes", true, { glutes: 0.5, core: 0.5 }],
  ["Cable Pull-Through", "Legs", "Glutes", false, { glutes: 1, hamstrings: 0.5 }],

  // Legs / Quads
  ["Squat", "Legs", "Quads", false, { quads: 1, glutes: 0.8, core: 0.5 }],
  ["Leg Press", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Leg Extension", "Legs", "Quads", false, { quads: 1 }],
  ["Front Squat", "Legs", "Quads", false, { quads: 1, core: 0.5 }],
  ["Goblet Squat", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Bulgarian Split Squat", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Walking Lunge", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Step-Ups", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Pistol Squat", "Legs", "Quads", true, { quads: 1, glutes: 0.5 }],
  ["Hack Squat", "Legs", "Quads", false, { quads: 1 }],
  ["Shrimp Squat", "Legs", "Quads", true, { quads: 1, glutes: 0.5 }],
  ["Sissy Squat", "Legs", "Quads", true, { quads: 1 }],
  ["Airborne Lunge", "Legs", "Quads", true, { quads: 1, glutes: 0.5 }],
  ["Matrix Lunge", "Legs", "Quads", false, { quads: 1, glutes: 0.5 }],
  ["Jump Squat", "Legs", "Quads", true, { quads: 1, glutes: 0.5 }],
  ["Box Jump", "Legs", "Quads", true, { quads: 1, glutes: 0.5 }],
  ["Cossack Squat", "Legs", "Quads", true, { quads: 1, glutes: 0.25 }],
  ["Reverse Nordic Curl", "Legs", "Quads", true, { quads: 1, hamstrings: 0.25 }],
  ["Broad Jump", "Legs", "Quads", true, { quads: 1, glutes: 0.5 }],

  // Legs / Hamstrings
  ["Romanian Deadlift", "Legs", "Hamstrings", false, { hamstrings: 1, glutes: 0.8 }],
  ["Deadlift", "Legs", "Hamstrings", false, { hamstrings: 1, glutes: 0.5, back: 0.5 }],
  ["Sumo Deadlift", "Legs", "Hamstrings", false, { hamstrings: 1, glutes: 0.5, back: 0.5 }],
  ["Single-Leg RDL", "Legs", "Hamstrings", true, { hamstrings: 1, glutes: 0.5 }],
  ["Leg Curl", "Legs", "Hamstrings", false, { hamstrings: 1 }],
  ["Glute-Ham Raise", "Legs", "Hamstrings", true, { hamstrings: 1, glutes: 0.5 }],
  ["Nordic Hamstring Curl", "Legs", "Hamstrings", true, { hamstrings: 1 }],
  ["Slider Leg Curl", "Legs", "Hamstrings", true, { hamstrings: 1, glutes: 0.25 }],
  ["Harop Curl", "Legs", "Hamstrings", true, { hamstrings: 1 }],
  ["Jefferson Curl", "Legs", "Hamstrings", false, { hamstrings: 1, back: 0.5 }],

  // Legs / Calves
  ["Standing Calf Raise", "Legs", "Calves", false, { calves: 1 }],
  ["Seated Calf Raise", "Legs", "Calves", false, { calves: 1 }],
  ["Donkey Calf Raise", "Legs", "Calves", false, { calves: 1 }],
  ["Explosive Pogo Hops", "Legs", "Calves", true, { calves: 1 }],
  ["Jump Rope", "Legs", "Calves", true, { calves: 1 }],
  ["Tibialis Raise", "Legs", "Calves", true, { calves: 0.5 }],

  // Legs / Other
  ["Hip Adduction", "Legs", "Other", false, { quads: 0.5 }],
  ["Hip Abduction", "Legs", "Other", false, { glutes: 0.5 }],
  ["Side Lunge", "Legs", "Other", true, { quads: 0.5, glutes: 0.5 }],
  ["Reverse Lunge", "Legs", "Other", false, { quads: 1, glutes: 0.5 }],
  ["Curtsy Lunge", "Legs", "Other", true, { quads: 0.5, glutes: 0.5 }],
  ["Kettlebell Swing", "Legs", "Other", false, { glutes: 1, hamstrings: 0.5 }],
  ["Copenhagen Plank", "Legs", "Other", true, { quads: 0.5, core: 0.5 }],
  ["Lateral Step-Up", "Legs", "Other", true, { quads: 0.5, glutes: 0.5 }],
  ["Duck Walk", "Legs", "Other", true, { quads: 0.5, glutes: 0.5 }],
  ["Horse Stance", "Legs", "Other", true, { quads: 0.5 }],
  ["Good Morning", "Legs", "Other", false, { hamstrings: 0.5, back: 0.5 }],

  // Extra / Forearms
  ["Wrist Curl", "Extra", "Forearms", false, { forearms: 1 }],
  ["Reverse Wrist Curl", "Extra", "Forearms", false, { forearms: 1 }],
  ["Farmer's Walk", "Extra", "Forearms", false, { forearms: 1, upperTraps: 0.5 }],
  ["Suitcase Carry", "Extra", "Forearms", false, { forearms: 1, core: 0.5 }],
  ["Towel Hang", "Extra", "Forearms", true, { forearms: 1 }],
  ["Fingertip Push-Up", "Extra", "Forearms", true, { forearms: 0.5, chest: 0.5 }],
  ["Wrist Roller", "Extra", "Forearms", false, { forearms: 1 }],

  // Extra / Neck
  ["Neck Curl", "Extra", "Neck", true, { neck: 1 }],
  ["Neck Extension", "Extra", "Neck", true, { neck: 1 }],
  ["Neck Bridge", "Extra", "Neck", true, { neck: 1 }],
  ["Isometric Neck Hold", "Extra", "Neck", true, { neck: 1 }],

  // Extra / Core
  ["Cable Crunch", "Extra", "Core", false, { core: 1 }],
  ["Deadbugs", "Extra", "Core", true, { core: 1 }],
  ["Wood Chops", "Extra", "Core", false, { core: 1 }],
  ["Ab Rollout", "Extra", "Core", true, { core: 1 }],
  ["Body Saw", "Extra", "Core", true, { core: 1 }],
  ["Pallof Press", "Extra", "Core", false, { core: 1 }],
  ["Plank", "Extra", "Core", true, { core: 1 }],
  ["Side Plank", "Extra", "Core", true, { core: 1 }],
  ["Hanging Leg Raise", "Extra", "Core", true, { core: 1 }],
  ["Hanging Knee Raise", "Extra", "Core", true, { core: 1 }],
  ["Russian Twist", "Extra", "Core", true, { core: 1 }],
  ["Reverse Crunch", "Extra", "Core", true, { core: 1 }],
  ["Dragon Flag", "Extra", "Core", true, { core: 1 }],
  ["Toes-to-Bar", "Extra", "Core", true, { core: 1, back: 0.25 }],
  ["Windshield Wiper", "Extra", "Core", true, { core: 1 }],
  ["L-Sit", "Extra", "Core", true, { core: 1 }],
  ["V-Sit", "Extra", "Core", true, { core: 1 }],
  ["Manna", "Extra", "Core", true, { core: 1, shoulders: 0.5 }],
  ["Human Flag", "Extra", "Core", true, { core: 1, back: 0.5 }],
  ["Hollow Body Rock", "Extra", "Core", true, { core: 1 }],
  ["Compression Leg Lift", "Extra", "Core", true, { core: 1 }],
  ["Vacuum", "Extra", "Core", true, { core: 0.5 }],
];

// ── 4. WEEKLY GOALS ─────────────────────────────────────────────────────────
const GOALS = [
  { muscleGroup: "chest",       lowGoal: 8,  highGoal: 15 },
  { muscleGroup: "shoulders",   lowGoal: 10, highGoal: 20 },
  { muscleGroup: "triceps",     lowGoal: 6,  highGoal: 10 },
  { muscleGroup: "back",        lowGoal: 10, highGoal: 20 },
  { muscleGroup: "upperTraps",  lowGoal: 3,  highGoal: 10 },
  { muscleGroup: "biceps",      lowGoal: 6,  highGoal: 10 },
  { muscleGroup: "glutes",      lowGoal: 10, highGoal: 20 },
  { muscleGroup: "quads",       lowGoal: 10, highGoal: 15 },
  { muscleGroup: "hamstrings",  lowGoal: 8,  highGoal: 12 },
  { muscleGroup: "calves",      lowGoal: 6,  highGoal: 10 },
  { muscleGroup: "forearms",    lowGoal: 3,  highGoal: 8  },
  { muscleGroup: "neck",        lowGoal: 3,  highGoal: 10 },
  { muscleGroup: "core",        lowGoal: 6,  highGoal: 10 },
];

export const restorePersonalData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. SAFETY CHECK
    const deploymentName = process.env.CONVEX_DEPLOYMENT_NAME;
    if (deploymentName?.includes("giddy-anaconda-476")) {
      throw new Error(`CRITICAL: You are trying to push REAL data to the DEMO database! Aborting.`);
    }

    // Map Categories automatically so lifts are perfectly classified
    const exerciseMeta = new Map();
    for (const [name, category, subcat] of EXERCISES) {
      exerciseMeta.set(name, { category, subcategory: subcat || undefined });
    }

    // 2. WIPE EXISTING TABLES
    const liftSets = await ctx.db.query("liftSets").collect();
    for (const ls of liftSets) await ctx.db.delete(ls._id);
    
    const cardio = await ctx.db.query("cardioSessions").collect();
    for (const c of cardio) await ctx.db.delete(c._id);
    
    const exercises = await ctx.db.query("exercises").collect();
    for (const ex of exercises) await ctx.db.delete(ex._id);

    const weeklyGoals = await ctx.db.query("weeklyGoals").collect();
    for (const wg of weeklyGoals) await ctx.db.delete(wg._id);

    // 3. SEED THE COMPREHENSIVE EXERCISE LIBRARY
    for (const [name, category, subcategory, isBodyweight, rawWeights] of EXERCISES) {
      await ctx.db.insert("exercises", {
        name,
        category,
        subcategory,
        isBodyweight,
        muscleWeights: rawWeights as any,
      });
    }

    // 4. SEED THE WEEKLY GOALS
    for (const g of GOALS) {
        await ctx.db.insert("weeklyGoals", g);
    }

    // 5. RESTORE THE REAL LIFTING HISTORY WITH TRANSLATED NAMES
    let translatedCount = 0;
    for (const l of RAW_LIFTS) {
      const oldName = l[1] as string;
      
      // Auto-Translate the old name into the new standard name. If not mapped, keep the original.
      const translatedName = HISTORICAL_MAPPING[oldName] || oldName; 
      
      if (translatedName !== oldName) translatedCount++;

      const meta = exerciseMeta.get(translatedName) || { category: "Extra", subcategory: "Other" };

      await ctx.db.insert("liftSets", {
        timestamp: l[0] as number,
        exerciseName: translatedName,
        category: meta.category,
        subcategory: meta.subcategory,
        equipmentType: l[2] as string,
        weight: l[3] as number,
        reps: l[4] as number,
        sets: l[5] as number,
        volume: l[6] as number,
        notes: (l[7] as string) || undefined,
      });
    }

    // 6. RESTORE THE CARDIO HISTORY
    for (const c of RAW_CARDIO) {
      await ctx.db.insert("cardioSessions", {
        timestamp: c[0] as number,
        movementType: "Other", 
        duration: c[1] as number,
        rpe: (c[2] as number) || undefined,
        zone: c[3] as string,
        notes: (c[4] as string) || undefined,
      });
    }

    return `Success! ${EXERCISES.length} fully consolidated exercises seeded. ${translatedCount} historical lifts automatically renamed and restored.`;
  }
});