import fs from 'fs';

// Custom CSV Parser
function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    // Safely splits by commas, ignoring any commas hidden inside quotes
    const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/(^"|"$)/g, '').replace(/\r/g, ''));
    const obj = {};
    headers.forEach((h, j) => { obj[h] = row[j] || ''; });
    results.push(obj);
  }
  return { headers, results };
}

console.log("🚀 Starting Data Migration...");

// ==========================================
// 1. PROCESS CARDIO
// ==========================================
try {
  const cardioData = parseCSV('Lift Log - Cardio Log (1).csv').results;
  const cardioJson = cardioData.map(row => {
    const duration = parseFloat(row['Time (Minutes)']);
    if (isNaN(duration)) return null;

    const rpe = parseFloat(row['RPE']);
    const distance = parseFloat(row['Distance']);
    
    const obj = {
      timestamp: new Date(row['Timestamp']).getTime(),
      movementType: row['Movement Type'],
      duration: duration,
      zone: row['Activity Type'] || 'Zone 2',
    };
    
    if (!isNaN(distance)) obj.distance = distance;
    if (!isNaN(rpe)) obj.rpe = rpe;
    if (row['Notes']) obj.notes = row['Notes'];
    
    return obj;
  }).filter(Boolean);

  fs.writeFileSync('import-cardio.json', JSON.stringify(cardioJson, null, 2));
  console.log(`✅ Created import-cardio.json with ${cardioJson.length} sessions.`);
} catch (e) {
  console.log("⚠️ Could not find or process 'Lift Log - Cardio Log (1).csv'");
}

// ==========================================
// 2. PROCESS EXERCISE DATABASE
// ==========================================
try {
  // First, map the categories from the matrix sheet
  const exCatData = parseCSV('Lift Log - Exercises (1).csv');
  const catMap = {
    'Push': ['Chest Exercises', 'Shoulders Exercises', 'Tricep Isolation Exercises'],
    'Pull': ['Back Exercises', 'Upper Trap Exercises', 'Biceps Isolation Exercises'],
    'Legs': ['Glute Exercises', 'Quad Exercises', 'Hamstring Exercises', 'Calves Exercises', 'Legs - Other'],
    'Extra': ['Forearm Exercises', 'Neck Exercises', 'Core Exercises']
  };
  const subcatLabelMap = {
    'Chest Exercises': 'Chest', 'Shoulders Exercises': 'Shoulders', 'Tricep Isolation Exercises': 'Triceps',
    'Back Exercises': 'Back', 'Upper Trap Exercises': 'Upper Traps', 'Biceps Isolation Exercises': 'Biceps',
    'Glute Exercises': 'Glutes', 'Quad Exercises': 'Quads', 'Hamstring Exercises': 'Hamstrings',
    'Calves Exercises': 'Calves', 'Legs - Other': 'Other', 'Forearm Exercises': 'Forearms',
    'Neck Exercises': 'Neck', 'Core Exercises': 'Core'
  };

  const exerciseMeta = {};
  Object.entries(catMap).forEach(([cat, cols]) => {
    cols.forEach(col => {
      exCatData.results.forEach(row => {
        const exName = row[col];
        if (exName) {
          exerciseMeta[exName] = {
            category: cat,
            subcategory: subcatLabelMap[col] || col
          };
        }
      });
    });
  });

  // Next, map the actual Muscle Group weights and build the final JSON
  const exDbData = parseCSV('Lift Log - ExerciseDB (3).csv').results;
  const exJson = exDbData.map(row => {
    const name = row['ExerciseName'];
    if (!name) return null;
    
    const meta = exerciseMeta[name] || { category: 'Other', subcategory: '' };
    
    // Intelligently guess if the exercise is pure bodyweight based on your naming conventions
    const nameLower = name.toLowerCase();
    const isBW = nameLower.includes('bodyweight') || nameLower.includes('bw') || 
                 nameLower.includes('push-up') || nameLower.includes('pullup') || 
                 nameLower.includes('chin up') || nameLower.includes('dips');

    const safeFloat = (v) => { const f = parseFloat(v); return isNaN(f) ? 0 : f; };
    
    const muscleWeights = {};
    if (safeFloat(row['Chest']) > 0) muscleWeights.chest = safeFloat(row['Chest']);
    if (safeFloat(row['Shoulders']) > 0) muscleWeights.shoulders = safeFloat(row['Shoulders']);
    if (safeFloat(row['Triceps - Isolation']) > 0) muscleWeights.triceps = safeFloat(row['Triceps - Isolation']);
    if (safeFloat(row['Back']) > 0) muscleWeights.back = safeFloat(row['Back']);
    if (safeFloat(row['Upper Traps']) > 0) muscleWeights.upperTraps = safeFloat(row['Upper Traps']);
    if (safeFloat(row['Biceps - Isolation']) > 0) muscleWeights.biceps = safeFloat(row['Biceps - Isolation']);
    if (safeFloat(row['Glute']) > 0) muscleWeights.glutes = safeFloat(row['Glute']);
    if (safeFloat(row['Quads']) > 0) muscleWeights.quads = safeFloat(row['Quads']);
    if (safeFloat(row['Hamstrings']) > 0) muscleWeights.hamstrings = safeFloat(row['Hamstrings']);
    if (safeFloat(row['Calves']) > 0) muscleWeights.calves = safeFloat(row['Calves']);
    if (safeFloat(row['Forearms']) > 0) muscleWeights.forearms = safeFloat(row['Forearms']);
    if (safeFloat(row['Neck']) > 0) muscleWeights.neck = safeFloat(row['Neck']);
    if (safeFloat(row['Core']) > 0) muscleWeights.core = safeFloat(row['Core']);

    return {
      name: name,
      category: meta.category,
      subcategory: meta.subcategory,
      isBodyweight: Boolean(isBW),
      muscleWeights: muscleWeights
    };
  }).filter(Boolean);

  fs.writeFileSync('import-exercises.json', JSON.stringify(exJson, null, 2));
  console.log(`✅ Created import-exercises.json with ${exJson.length} exercises.`);
} catch (e) {
  console.log("⚠️ Error processing Exercise files. Make sure 'Lift Log - Exercises (1).csv' and 'Lift Log - ExerciseDB (3).csv' are in the same folder.");
}