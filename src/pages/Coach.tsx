// src/pages/Coach.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Slider, Select, MenuItem, FormControl, InputLabel, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';

// JSON Interfaces
interface SuggestionJSON { focusTitle: string; reasoning: string; }
interface WorkoutJSON { title: string; focus: string; warmup: { name: string; reps: string }[]; mainBlock: { name: string; setsReps: string; rest: string; notes: string }[]; cooldown: { name: string; reps: string }[]; }
interface ExerciseDraft { equipment: string; category: string; weight: number | string; reps: number | string; sets: number | string; }

// Sanitizer for AI JSON output
const parseAIJSON = (rawStr: string) => {
  try {
    const cleaned = rawStr.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.Required_JSON_Schema) return parsed.Required_JSON_Schema;
    return parsed;
  } catch (error) {
    console.error("JSON Parsing Error. Raw string:", rawStr);
    throw error;
  }
};

export default function Coach() {
  const [phase, setPhase] = useState<'SETUP' | 'REVIEW' | 'WORKOUT'>('SETUP');

  // Form State
  const [time, setTime] = useState<number>(45);
  const [equipment, setEquipment] = useState<string>('Floor Mode (Bodyweight Only)');
  const [style, setStyle] = useState<string>('Strength & Hypertrophy');
  const [customInput, setCustomInput] = useState<string>('');
  
  // Suggestion & Tweaks State
  const [suggestion, setSuggestion] = useState<SuggestionJSON | null>(null);
  const [tweaks, setTweaks] = useState<string>('');
  
  // --- PERSISTENT WORKOUT STATES ---
  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(() => {
    const saved = localStorage.getItem('liftlog_active_workout');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('liftlog_completed_exercises');
    return saved ? JSON.parse(saved) : {};
  });

  const [loggedExercises, setLoggedExercises] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('liftlog_logged_exercises');
    return saved ? JSON.parse(saved) : {};
  });

  const [exerciseDrafts, setExerciseDrafts] = useState<Record<string, ExerciseDraft>>(() => {
    const saved = localStorage.getItem('liftlog_exercise_drafts');
    return saved ? JSON.parse(saved) : {};
  });

  // Modal Logging State
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLoggingExercise, setActiveLoggingExercise] = useState<string>('');
  
  // Live Modal Inputs
  const [logCategory, setLogCategory] = useState('Custom'); 
  const [logEquipment, setLogEquipment] = useState('Bodyweight');
  const [logWeight, setLogWeight] = useState<string | number>('');
  const [logReps, setLogReps] = useState<string | number>('');
  const [logSets, setLogSets] = useState<string | number>(1);

  // AI & DB Actions
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const suggestWorkoutFocus = useAction("ai:suggestWorkoutFocus");
  const generateWorkout = useAction("ai:generateWorkout");
  const logSet = useMutation(api.lifts.logSet);
  
  // Fetch live exercises to auto-fill category
  const exercisesDB = useQuery(api.exercises.getExercises, { category: "" });

  // Auto-route to WORKOUT phase
  useEffect(() => {
    if (workoutData) setPhase('WORKOUT');
  }, []);

  // Save states to LocalStorage
  useEffect(() => {
    if (workoutData) {
      localStorage.setItem('liftlog_active_workout', JSON.stringify(workoutData));
    } else {
      localStorage.removeItem('liftlog_active_workout');
    }
    localStorage.setItem('liftlog_completed_exercises', JSON.stringify(completedExercises));
    localStorage.setItem('liftlog_logged_exercises', JSON.stringify(loggedExercises));
    localStorage.setItem('liftlog_exercise_drafts', JSON.stringify(exerciseDrafts));
  }, [workoutData, completedExercises, loggedExercises, exerciseDrafts]);

  // --- HANDLERS ---
  const handleGetSuggestion = async () => {
    setIsProcessing(true);
    try {
      const result = await suggestWorkoutFocus({ timeAvailable: time, equipment, style, customRequest: customInput, localTime: new Date().toISOString() });
      setSuggestion(parseAIJSON(result as string));
      setPhase('REVIEW');
    } catch (err) {
      console.error(err);
      alert("⚠️ Error analyzing data.");
    }
    setIsProcessing(false);
  };

  const handleFinalizeWorkout = async () => {
    if (!suggestion) return;
    setIsProcessing(true);
    setCompletedExercises({}); 
    setLoggedExercises({});
    setExerciseDrafts({}); // Clear old drafts

    try {
      const result = await generateWorkout({ timeAvailable: time, equipment, style, localTime: new Date().toISOString(), approvedFocus: suggestion.focusTitle, userTweaks: tweaks });
      setWorkoutData(parseAIJSON(result as string));
      setPhase('WORKOUT');
    } catch (err) {
      console.error(err);
      alert("⚠️ Error generating workout.");
    }
    setIsProcessing(false);
  };

  const clearSession = () => {
    setWorkoutData(null);
    setCompletedExercises({});
    setLoggedExercises({});
    setExerciseDrafts({});
    setSuggestion(null);
    setTweaks('');
    setCustomInput('');
    setPhase('SETUP');
  };

  // Opening the Logger logic
  const openLogger = (exerciseName: string) => {
    setActiveLoggingExercise(exerciseName);
    
    // Auto-resolve Category from DB
    const dbMatch = exercisesDB?.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
    const resolvedCategory = dbMatch?.category || 'Custom';
    
    // Pull from draft memory if it exists
    const draft = exerciseDrafts[exerciseName];
    setLogCategory(draft?.category || resolvedCategory);
    setLogEquipment(draft?.equipment || 'Bodyweight');
    setLogWeight(draft?.weight !== undefined ? draft.weight : '');
    setLogReps(draft?.reps !== undefined ? draft.reps : '');
    setLogSets(draft?.sets !== undefined ? draft.sets : 1);
    
    setLogModalOpen(true);
  };

  const handleExerciseClick = (exerciseName: string, isCurrentlyDone: boolean) => {
    if (isCurrentlyDone) {
      setCompletedExercises(prev => ({ ...prev, [exerciseName]: false }));
    } else {
      setCompletedExercises(prev => ({ ...prev, [exerciseName]: true }));
      openLogger(exerciseName);
    }
  };

  const handleCloseModal = () => {
    setExerciseDrafts(prev => ({
      ...prev,
      [activeLoggingExercise]: { equipment: logEquipment, category: logCategory, weight: logWeight, reps: logReps, sets: logSets }
    }));
    setLogModalOpen(false);
  };

  const handleSaveLogToDB = async () => {
    setIsSavingLog(true);
    try {
      await logSet({
        exerciseName: activeLoggingExercise,
        category: logCategory, 
        equipmentType: logEquipment,
        weight: Number(logWeight) || 0,
        reps: Number(logReps) || 0,
        sets: Number(logSets) || 1,
      });
      
      setExerciseDrafts(prev => ({
        ...prev,
        [activeLoggingExercise]: { equipment: logEquipment, category: logCategory, weight: logWeight, reps: logReps, sets: logSets }
      }));
      
      setLoggedExercises(prev => ({ ...prev, [activeLoggingExercise]: true }));
      setCompletedExercises(prev => ({ ...prev, [activeLoggingExercise]: true })); 
      setLogModalOpen(false);
    } catch (err) {
      console.error("Error saving log:", err);
      alert("⚠️ Failed to save set to database.");
    }
    setIsSavingLog(false);
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 10, maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#b06aff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
            AI Integration
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 1 }}>
            Coach <AutoAwesomeIcon sx={{ color: '#b06aff', fontSize: '2rem' }} />
          </Typography>
        </Box>
        {phase === 'WORKOUT' && (
          <Button size="small" sx={{ color: '#ff4d6d' }} onClick={clearSession}>End Session</Button>
        )}
      </Box>

      {/* PHASE 1: SETUP */}
      {phase === 'SETUP' && (
        <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1, color: '#00d4ff' }}>Time Available: {time} Minutes</Typography>
            <Slider value={time} onChange={(_, v) => setTime(v as number)} step={15} marks min={15} max={120} sx={{ color: '#00d4ff' }} />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Environment</InputLabel>
              <Select value={equipment} label="Environment" onChange={(e) => setEquipment(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="Floor Mode (Bodyweight Only)">Floor Mode (No Gear)</MenuItem>
                <MenuItem value="Bar Mode (Pull-up & Dip Bars)">Bar Mode (Pull/Dip Bars)</MenuItem>
                <MenuItem value="Full Gym Access">Full Gym Access</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Workout Style</InputLabel>
              <Select value={style} label="Workout Style" onChange={(e) => setStyle(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="Strength & Hypertrophy">Strength & Muscle</MenuItem>
                <MenuItem value="High Intensity Interval Training (HIIT)">HIIT / Fast Paced</MenuItem>
                <MenuItem value="Active Recovery & Mobility">Mobility / Recovery</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField 
            fullWidth label="Specific Request? (Optional)" placeholder="e.g., 'Target quads today' or 'Skip shoulders'"
            value={customInput} onChange={(e) => setCustomInput(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />

          <Button variant="contained" onClick={handleGetSuggestion} disabled={isProcessing} sx={{ py: 2, borderRadius: 3, fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #b06aff 0%, #7c3aed 100%)' }}>
            {isProcessing ? <CircularProgress size={28} sx={{ color: '#fff' }} /> : <><SearchIcon sx={{ mr: 1 }} /> Analyze Data</>}
          </Button>
        </Paper>
      )}

      {/* PHASE 2: REVIEW AI SUGGESTION */}
      {phase === 'REVIEW' && suggestion && (
        <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(176, 106, 255, 0.08)', border: '1px solid #b06aff', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography sx={{ color: '#b06aff', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Draft Protocol Prepared</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', mb: 1 }}>{suggestion.focusTitle}</Typography>
            <Typography variant="body1" sx={{ color: '#d2a8ff' }}>{suggestion.reasoning}</Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(176, 106, 255, 0.2)' }} />

          <TextField 
            fullWidth label="Any tweaks before I build this?" placeholder="e.g., 'Make it harder' or 'I don't have rings'"
            value={tweaks} onChange={(e) => setTweaks(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' } }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" onClick={() => setPhase('SETUP')} sx={{ color: '#8a8a9a', borderColor: '#8a8a9a', borderRadius: 3 }}>Back</Button>
            <Button fullWidth variant="contained" onClick={handleFinalizeWorkout} disabled={isProcessing} sx={{ borderRadius: 3, fontWeight: 800, bgcolor: '#00d4ff', color: '#000', '&:hover': { bgcolor: '#00b8e6' } }}>
              {isProcessing ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Approve & Build'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* PHASE 3: ACTIVE WORKOUT */}
      {phase === 'WORKOUT' && workoutData && (
        <Paper sx={{ p: 0, borderRadius: 4, bgcolor: 'rgba(176, 106, 255, 0.05)', border: '1px solid rgba(176, 106, 255, 0.2)', overflow: 'hidden' }}>
          <Box sx={{ p: 3, bgcolor: 'rgba(176, 106, 255, 0.1)' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#b06aff', mb: 1 }}>{workoutData.title}</Typography>
            <Typography variant="body2" sx={{ color: '#d2a8ff' }}>{workoutData.focus}</Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            
            {/* 🔥 UPDATED WARM-UP SECTION 🔥 */}
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 1.5 }}>1. Warm-up</Typography>
            {workoutData.warmup.map((ex, idx) => {
              const isDone = completedExercises[ex.name] || false;
              const isLogged = loggedExercises[ex.name] || false;
              
              return (
                <Paper key={idx} sx={{ 
                  p: 2, mb: 2, borderRadius: 3, 
                  bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', 
                  border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isDone ? 0.6 : 1, transition: 'all 0.2s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox 
                        checked={isDone} 
                        onChange={() => handleExerciseClick(ex.name, isDone)} 
                        sx={{ color: '#b06aff', '&.Mui-checked': { color: '#00e096' }, p: 0 }} 
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
                        {ex.name}
                        {isLogged && (
                          <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>
                            Logged
                          </Typography>
                        )}
                        {isDone && !isLogged && (
                          <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(255, 184, 0, 0.2)', color: '#ffb800', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>
                            Not Logged
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => openLogger(ex.name)} sx={{ bgcolor: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', borderRadius: 2 }}>
                      <EditNoteIcon sx={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ pl: 4 }}>
                    <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600 }}>{ex.reps}</Typography>
                  </Box>
                </Paper>
              );
            })}

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 2 }}>2. Main Block</Typography>
            {workoutData.mainBlock.map((ex, idx) => {
              const isDone = completedExercises[ex.name] || false;
              const isLogged = loggedExercises[ex.name] || false;
              
              return (
                <Paper key={idx} sx={{ 
                  p: 2, mb: 2, borderRadius: 3, 
                  bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', 
                  border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isDone ? 0.6 : 1, transition: 'all 0.2s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox 
                        checked={isDone} 
                        onChange={() => handleExerciseClick(ex.name, isDone)} 
                        sx={{ color: '#b06aff', '&.Mui-checked': { color: '#00e096' }, p: 0 }} 
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
                        {ex.name}
                        {isLogged && (
                          <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>
                            Logged
                          </Typography>
                        )}
                        {isDone && !isLogged && (
                          <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(255, 184, 0, 0.2)', color: '#ffb800', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>
                            Not Logged
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => openLogger(ex.name)} sx={{ bgcolor: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', borderRadius: 2 }}>
                      <EditNoteIcon sx={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ pl: 4 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600 }}>{ex.setsReps}</Typography>
                      <Typography variant="body2" sx={{ color: '#8a8a9a' }}>Rest: {ex.rest}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#d2a8ff', fontStyle: 'italic' }}>{ex.notes}</Typography>
                  </Box>
                </Paper>
              );
            })}

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* 🔥 UPDATED COOLDOWN SECTION 🔥 */}
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 1.5 }}>3. Cooldown</Typography>
            {workoutData.cooldown.map((ex, idx) => {
              const isDone = completedExercises[ex.name] || false;
              const isLogged = loggedExercises[ex.name] || false;
              
              return (
                <Paper key={idx} sx={{ 
                  p: 2, mb: 2, borderRadius: 3, 
                  bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', 
                  border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isDone ? 0.6 : 1, transition: 'all 0.2s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox 
                        checked={isDone} 
                        onChange={() => handleExerciseClick(ex.name, isDone)} 
                        sx={{ color: '#b06aff', '&.Mui-checked': { color: '#00e096' }, p: 0 }} 
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
                        {ex.name}
                        {isLogged && (
                          <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>
                            Logged
                          </Typography>
                        )}
                        {isDone && !isLogged && (
                          <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(255, 184, 0, 0.2)', color: '#ffb800', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>
                            Not Logged
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => openLogger(ex.name)} sx={{ bgcolor: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', borderRadius: 2 }}>
                      <EditNoteIcon sx={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ pl: 4 }}>
                    <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600 }}>{ex.reps}</Typography>
                  </Box>
                </Paper>
              );
            })}

          </Box>
        </Paper>
      )}

      {/* INLINE LOGGING MODAL */}
      <Dialog 
        open={logModalOpen} 
        onClose={handleCloseModal}
        PaperProps={{ sx: { bgcolor: '#16171a', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 400 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography sx={{ fontWeight: 800, color: '#00d4ff' }}>Log Completed Set</Typography>
          <IconButton onClick={handleCloseModal} size="small" sx={{ color: '#8a8a9a' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 3 }}>{activeLoggingExercise}</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Equipment</InputLabel>
              <Select 
                value={logEquipment} 
                onChange={(e) => setLogEquipment(e.target.value)}
                label="Equipment" 
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="Bodyweight">Bodyweight</MenuItem>
                <MenuItem value="Barbell">Barbell</MenuItem>
                <MenuItem value="Dumbbell">Dumbbell</MenuItem>
                <MenuItem value="Machine">Machine</MenuItem>
                <MenuItem value="Cable">Cable</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField fullWidth type="number" label="Weight (lbs)" value={logWeight} onChange={(e) => setLogWeight(e.target.value)} InputProps={{ inputProps: { min: 0 } }} />
            <TextField fullWidth type="number" label="Reps" value={logReps} onChange={(e) => setLogReps(e.target.value)} InputProps={{ inputProps: { min: 0 } }} />
            <TextField fullWidth type="number" label="Sets" value={logSets} onChange={(e) => setLogSets(e.target.value)} InputProps={{ inputProps: { min: 1 } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            fullWidth variant="contained" 
            onClick={handleSaveLogToDB}
            disabled={isSavingLog}
            sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)', color: '#000' }}
          >
            {isSavingLog ? <CircularProgress size={24} sx={{ color: '#000' }} /> : <><AddTaskIcon sx={{ mr: 1 }} /> Save Log</>}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}