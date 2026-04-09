// src/pages/Coach.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Slider, Select, MenuItem, FormControl, InputLabel, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Collapse } from '@mui/material';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import TerminalIcon from '@mui/icons-material/Terminal';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// JSON Interfaces
interface SuggestionJSON { focusTitle: string; reasoning: string; }
interface WorkoutJSON { 
  title: string; 
  focus: string; 
  warmup: { name: string; reps: string }[]; 
  mainBlock: { name: string; sets: number; repsMin: number; repsMax: number; rest: string; notes: string }[]; 
  cooldown: { name: string; reps: string }[]; 
}
interface ExerciseDraft { equipment: string; category: string; weight: number | string; reps: number | string; sets: number | string; }
interface DebugData { yesterdayBanned: string; weeklyMuscle: string; dateMath: string; aiPrompt: string; }

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

  const [time, setTime] = useState<number>(45);
  const [equipment, setEquipment] = useState<string>('Floor Mode (Bodyweight Only)');
  const [style, setStyle] = useState<string>('Hypertrophy (8-12 reps)'); 
  const [customInput, setCustomInput] = useState<string>('');
  
  const [suggestion, setSuggestion] = useState<SuggestionJSON | null>(null);
  const [debugData, setDebugData] = useState<DebugData | null>(null); 
  const [showDebug, setShowDebug] = useState(false); 
  const [tweaks, setTweaks] = useState<string>('');
  
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

  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLoggingExercise, setActiveLoggingExercise] = useState<string>('');
  
  const [logCategory, setLogCategory] = useState('Custom'); 
  const [logEquipment, setLogEquipment] = useState('Bodyweight');
  const [logWeight, setLogWeight] = useState<string | number>('');
  const [logReps, setLogReps] = useState<string | number>('');
  const [logSets, setLogSets] = useState<string | number>(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);

  const [errorModal, setErrorModal] = useState({ open: false, title: '', message: '', rawError: '' });
  const [isCopied, setIsCopied] = useState(false);
  
  const suggestWorkoutFocus = useAction("ai:suggestWorkoutFocus");
  const generateWorkout = useAction("ai:generateWorkout");
  const logSet = useMutation(api.lifts.logSet);
  
  const exercisesDB = useQuery(api.exercises.getExercises, { category: "" });
  const allLiftsDB = useQuery(api.lifts.getLifts, {}) || [];

  useEffect(() => {
    if (workoutData) setPhase('WORKOUT');
  }, [workoutData]);

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

  const handleCopyError = () => {
    navigator.clipboard.writeText(errorModal.rawError);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleGetSuggestion = async () => {
    setIsProcessing(true);
    setShowDebug(false); 
    try {
      const response: any = await suggestWorkoutFocus({ 
        timeAvailable: time, 
        equipment, 
        style, 
        customRequest: customInput, 
        localTime: new Date().toISOString(),
        timezoneOffset: new Date().getTimezoneOffset()
      });
      
      let rawAIString = "";
      let incomingDebugData = null;

      if (typeof response === "string") {
        rawAIString = response;
      } else if (response && response.suggestionText) {
        rawAIString = response.suggestionText;
        incomingDebugData = response.debugData;
      } else {
        throw new Error("Invalid response format from server.");
      }
      
      const parsedSuggestion = parseAIJSON(rawAIString);
      setSuggestion(parsedSuggestion);
      if (incomingDebugData) {
        setDebugData(incomingDebugData); 
      }
      setPhase('REVIEW');
    } catch (err: any) {
      console.error(err);
      setErrorModal({
        open: true,
        title: "AI Analysis Interrupted",
        message: "The model encountered an error during gap analysis. It may be experiencing high demand.",
        rawError: err.message || String(err)
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizeWorkout = async () => {
    if (!suggestion) return;
    setIsProcessing(true);
    setCompletedExercises({}); 
    setLoggedExercises({});
    setExerciseDrafts({});
    setExpandedCells({});

    try {
      const result = await generateWorkout({ timeAvailable: time, equipment, style, localTime: new Date().toISOString(), approvedFocus: suggestion.focusTitle, userTweaks: tweaks });
      setWorkoutData(parseAIJSON(result as string));
      setPhase('WORKOUT');
    } catch (err: any) {
      console.error(err);
      setErrorModal({
        open: true,
        title: "Protocol Generation Failed",
        message: "Could not generate the workout protocol. The model may have rejected the constraints or timed out.",
        rawError: err.message || String(err)
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSession = () => {
    setWorkoutData(null);
    setCompletedExercises({});
    setLoggedExercises({});
    setExerciseDrafts({});
    setExpandedCells({});
    setSuggestion(null);
    setDebugData(null);
    setTweaks('');
    setCustomInput('');
    setPhase('SETUP');
  };

  const toggleCellExpand = (exerciseName: string) => {
    setExpandedCells(prev => ({ ...prev, [exerciseName]: !prev[exerciseName] }));
  };

  const openLogger = (exerciseName: string) => {
    setActiveLoggingExercise(exerciseName);
    
    const dbMatch = exercisesDB?.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
    const resolvedCategory = dbMatch?.category || 'Custom';
    
    const previousLifts = allLiftsDB.filter(l => l.exerciseName.toLowerCase() === exerciseName.toLowerCase()).sort((a,b) => b.timestamp - a.timestamp);
    const lastLift = previousLifts.length > 0 ? previousLifts[0] : null;

    const draft = exerciseDrafts[exerciseName];
    setLogCategory(draft?.category || resolvedCategory);
    setLogEquipment(draft?.equipment || lastLift?.equipmentType || 'Bodyweight');
    setLogWeight(draft?.weight !== undefined ? draft.weight : (lastLift?.weight || ''));
    setLogReps(draft?.reps !== undefined ? draft.reps : (lastLift?.reps || ''));
    setLogSets(draft?.sets !== undefined ? draft.sets : 1);
    
    setLogModalOpen(true);
  };

  const handleCheckboxClick = (e: React.MouseEvent, exerciseName: string, isCurrentlyDone: boolean) => {
    e.stopPropagation(); 
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
      const safeWeight = isNaN(Number(logWeight)) ? 0 : Number(logWeight);
      const safeReps = isNaN(Number(logReps)) ? 0 : Number(logReps);
      const safeSets = isNaN(Number(logSets)) ? 1 : Number(logSets);
      const safeCategory = logCategory ? String(logCategory) : "Custom";

      await logSet({
        exerciseName: activeLoggingExercise,
        category: safeCategory, 
        equipmentType: logEquipment,
        weight: safeWeight,
        reps: safeReps,
        sets: safeSets,
      });
      
      setExerciseDrafts(prev => ({
        ...prev,
        [activeLoggingExercise]: { equipment: logEquipment, category: safeCategory, weight: safeWeight, reps: safeReps, sets: safeSets }
      }));
      
      setLoggedExercises(prev => ({ ...prev, [activeLoggingExercise]: true }));
      setCompletedExercises(prev => ({ ...prev, [activeLoggingExercise]: true })); 
      setLogModalOpen(false);
    } catch (err: any) {
      console.error("Error saving log:", err);
      setErrorModal({
        open: true,
        title: "Database Sync Error",
        message: "Failed to save your set to the database. Check your connection.",
        rawError: err.message || String(err)
      });
    } finally {
      setIsSavingLog(false);
    }
  };

  // OVERLOAD MATH & HISTORY FILTER
  const renderLiftHistory = (exerciseName: string, minReps?: number, maxReps?: number) => {
    let history = allLiftsDB
      .filter(l => l.exerciseName.toLowerCase() === exerciseName.toLowerCase())
      .sort((a,b) => b.timestamp - a.timestamp);
    
    // STRICT FILTER: If min/max are provided (Main Block), only show relevant history
    if (minReps !== undefined && maxReps !== undefined) {
      history = history.filter(l => l.reps >= minReps && l.reps <= maxReps);
    }

    history = history.slice(0, 3);
    
    if (history.length === 0) {
      return (
        <Typography variant="body2" sx={{ color: '#8a8a9a', fontStyle: 'italic', p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
          {minReps ? `No previous logs found matching this ${minReps}-${maxReps} rep range. Time to set a baseline!` : `No previous logs found for this exercise.`}
        </Typography>
      );
    }

    return (
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5, mt: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#00d4ff', textTransform: 'uppercase', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HistoryIcon sx={{ fontSize: '1rem' }}/> Relevant Performance
        </Typography>
        {history.map((lift, i) => {
          return (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', py: 0.5 }}>
              <Typography variant="body2" sx={{ color: i === 0 ? '#00e096' : '#d2a8ff', fontWeight: i === 0 ? 700 : 400 }}>
                {lift.weight > 0 ? `${lift.weight} lbs` : 'Bodyweight'} × {lift.reps} reps ({lift.sets} sets)
              </Typography>
              <Typography variant="body2" sx={{ color: '#8a8a9a', fontSize: '0.8rem' }}>
                {new Date(lift.timestamp).toLocaleDateString()}
              </Typography>
            </Box>
          )
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 10, maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      
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
                <MenuItem value="Hypertrophy (8-12 reps)">Hypertrophy (Muscle Growth)</MenuItem>
                <MenuItem value="Strength (4-10 reps)">Max Strength (Heavy/Low Rep)</MenuItem>
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

      {phase === 'REVIEW' && suggestion && (
        <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(176, 106, 255, 0.08)', border: '1px solid #b06aff', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography sx={{ color: '#b06aff', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', mb: 1 }}>Draft Protocol Prepared</Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#fff', mb: 1 }}>{suggestion.focusTitle}</Typography>
            <Typography variant="body1" sx={{ color: '#d2a8ff' }}>{suggestion.reasoning}</Typography>
          </Box>

          {debugData && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Button 
                size="small" 
                onClick={() => setShowDebug(!showDebug)} 
                sx={{ color: '#8a8a9a', textTransform: 'none', display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <TerminalIcon sx={{ fontSize: '1rem' }} /> {showDebug ? "Hide System Audit" : "View Data Sent to AI"} <ExpandMoreIcon sx={{ transform: showDebug ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </Button>
              <Collapse in={showDebug}>
                <Paper sx={{ p: 2, mt: 1, bgcolor: '#0d0e12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.8rem', color: '#00d4ff', maxHeight: '400px', overflowY: 'auto' }}>
                  
                  <Typography variant="caption" sx={{ color: '#ffb800', display: 'block', mb: 1 }}>// Diagnostics: Timezone & Date Math</Typography>
                  <Box sx={{ mb: 2, pl: 1, color: '#ff4d6d' }}>{debugData.dateMath}</Box>

                  <Typography variant="caption" sx={{ color: '#ffb800', display: 'block', mb: 1 }}>// Yesterday's Banned Modalities</Typography>
                  <Box sx={{ mb: 2, pl: 1 }}>{debugData.yesterdayBanned}</Box>

                  <Typography variant="caption" sx={{ color: '#ffb800', display: 'block', mb: 1 }}>// This Week's Specific Muscle Sets</Typography>
                  <Box sx={{ mb: 2, pl: 1 }}>{debugData.weeklyMuscle}</Box>

                  <Typography variant="caption" sx={{ color: '#ffb800', display: 'block', mb: 1 }}>// Payload Sent to AI:</Typography>
                  <Box sx={{ pl: 1, color: '#d2a8ff', whiteSpace: 'pre-wrap' }}>{debugData.aiPrompt}</Box>
                </Paper>
              </Collapse>
            </Box>
          )}

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

      {phase === 'WORKOUT' && workoutData && (
        <Paper sx={{ p: 0, borderRadius: 4, bgcolor: 'rgba(176, 106, 255, 0.05)', border: '1px solid rgba(176, 106, 255, 0.2)', overflow: 'hidden' }}>
          <Box sx={{ p: 3, bgcolor: 'rgba(176, 106, 255, 0.1)' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#b06aff', mb: 1 }}>{workoutData.title}</Typography>
            <Typography variant="body2" sx={{ color: '#d2a8ff' }}>{workoutData.focus}</Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 1.5 }}>1. Warm-up</Typography>
            {workoutData.warmup.map((ex, idx) => {
              const isDone = completedExercises[ex.name] || false;
              const isLogged = loggedExercises[ex.name] || false;
              const isExpanded = expandedCells[ex.name] || false;
              
              return (
                <Paper key={idx} onClick={() => toggleCellExpand(ex.name)} sx={{ 
                  p: 2, mb: 2, borderRadius: 3, cursor: 'pointer',
                  bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', 
                  border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isDone ? 0.6 : 1, transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isExpanded ? 1 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox checked={isDone} onClick={(e) => handleCheckboxClick(e, ex.name, isDone)} sx={{ color: '#b06aff', '&.Mui-checked': { color: '#00e096' }, p: 0 }} />
                      <Box 
                        onClick={(e) => { if(isDone) { e.stopPropagation(); openLogger(ex.name); } }} 
                        sx={{ display: 'flex', flexDirection: 'column', cursor: isDone ? 'pointer' : 'default', '&:hover': { opacity: isDone ? 0.8 : 1 } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {ex.name}
                          </Typography>
                          {isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Logged</Typography>}
                          {isDone && !isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(255, 184, 0, 0.2)', color: '#ffb800', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Not Logged</Typography>}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.8rem', mt: 0.3 }}>
                          Target: {ex.reps}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Collapse in={isExpanded}>
                    <Box sx={{ pl: 4 }}>
                      {renderLiftHistory(ex.name)}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 2 }}>2. Main Block</Typography>
            {workoutData.mainBlock.map((ex, idx) => {
              const isDone = completedExercises[ex.name] || false;
              const isLogged = loggedExercises[ex.name] || false;
              const isExpanded = expandedCells[ex.name] || false;
              
              // Overload Filter Logic
              const relevantHistory = allLiftsDB
                .filter(l => l.exerciseName.toLowerCase() === ex.name.toLowerCase() && l.reps >= ex.repsMin && l.reps <= ex.repsMax)
                .sort((a,b) => b.timestamp - a.timestamp);
              
              const lastLift = relevantHistory.length > 0 ? relevantHistory[0] : null;

              let targetWeightLabel = 'Baseline / Bodyweight';
              if (lastLift && lastLift.weight > 0) {
                  // Apply 5% increase and round to nearest 5 lbs
                  const overloadedWeight = Math.round((lastLift.weight * 1.05) / 5) * 5;
                  targetWeightLabel = `${overloadedWeight} lbs`;
              }

              return (
                <Paper key={idx} onClick={() => toggleCellExpand(ex.name)} sx={{ 
                  p: 2, mb: 2, borderRadius: 3, cursor: 'pointer',
                  bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', 
                  border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isDone ? 0.6 : 1, transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isExpanded ? 1 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Checkbox checked={isDone} onClick={(e) => handleCheckboxClick(e, ex.name, isDone)} sx={{ color: '#b06aff', '&.Mui-checked': { color: '#00e096' }, p: 0, mt: 0.5 }} />
                      
                      <Box 
                        onClick={(e) => { if(isDone) { e.stopPropagation(); openLogger(ex.name); } }} 
                        sx={{ display: 'flex', flexDirection: 'column', cursor: isDone ? 'pointer' : 'default', '&:hover': { opacity: isDone ? 0.8 : 1 } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {ex.name}
                          </Typography>
                          {isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Logged</Typography>}
                          {isDone && !isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(255, 184, 0, 0.2)', color: '#ffb800', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Not Logged</Typography>}
                        </Box>
                        
                        <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.85rem', mt: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <span><strong style={{color: '#fff'}}>Sets:</strong> {ex.sets}</span> |
                          <span><strong style={{color: '#fff'}}>Reps:</strong> {ex.repsMin}-{ex.repsMax}</span> |
                          <span><strong style={{color: '#fff'}}>Load:</strong> {targetWeightLabel}</span> |
                          <span><strong style={{color: '#fff'}}>Rest:</strong> {ex.rest}</span>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Collapse in={isExpanded}>
                    <Box sx={{ pl: 4, mt: 2 }}>
                      <Typography variant="body2" sx={{ color: '#d2a8ff', fontStyle: 'italic', mb: 2 }}>{ex.notes}</Typography>
                      {/* Strictly filter history based on AI assigned rep range */}
                      {renderLiftHistory(ex.name, ex.repsMin, ex.repsMax)}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 1.5 }}>3. Cooldown</Typography>
            {workoutData.cooldown.map((ex, idx) => {
              const isDone = completedExercises[ex.name] || false;
              const isLogged = loggedExercises[ex.name] || false;
              const isExpanded = expandedCells[ex.name] || false;
              
              return (
                <Paper key={idx} onClick={() => toggleCellExpand(ex.name)} sx={{ 
                  p: 2, mb: 2, borderRadius: 3, cursor: 'pointer',
                  bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', 
                  border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isDone ? 0.6 : 1, transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isExpanded ? 1 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox checked={isDone} onClick={(e) => handleCheckboxClick(e, ex.name, isDone)} sx={{ color: '#b06aff', '&.Mui-checked': { color: '#00e096' }, p: 0 }} />
                      <Box 
                        onClick={(e) => { if(isDone) { e.stopPropagation(); openLogger(ex.name); } }} 
                        sx={{ display: 'flex', flexDirection: 'column', cursor: isDone ? 'pointer' : 'default', '&:hover': { opacity: isDone ? 0.8 : 1 } }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {ex.name}
                          </Typography>
                          {isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Logged</Typography>}
                          {isDone && !isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(255, 184, 0, 0.2)', color: '#ffb800', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Not Logged</Typography>}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600, fontSize: '0.8rem', mt: 0.3 }}>
                          Target: {ex.reps}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Collapse in={isExpanded}>
                    <Box sx={{ pl: 4 }}>
                      {renderLiftHistory(ex.name)}
                    </Box>
                  </Collapse>
                </Paper>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* COMPLETED EXERCISE LOGGER DIALOG */}
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
              <Select value={logEquipment} onChange={(e) => setLogEquipment(e.target.value)} label="Equipment" sx={{ borderRadius: 2 }}>
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
          <Button fullWidth variant="contained" onClick={handleSaveLogToDB} disabled={isSavingLog} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)', color: '#000' }}>
            {isSavingLog ? <CircularProgress size={24} sx={{ color: '#000' }} /> : <><AddTaskIcon sx={{ mr: 1 }} /> Save Log</>}
          </Button>
        </DialogActions>
      </Dialog>

      {/* THEMED ERROR MODAL */}
      <Dialog 
        open={errorModal.open} 
        onClose={() => setErrorModal(prev => ({ ...prev, open: false }))}
        PaperProps={{ sx: { bgcolor: '#1a0f14', borderRadius: 4, border: '1px solid rgba(255, 77, 109, 0.4)', width: '100%', maxWidth: 500 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid rgba(255, 77, 109, 0.2)' }}>
          <Typography sx={{ fontWeight: 800, color: '#ff4d6d', display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorOutlineIcon /> {errorModal.title}
          </Typography>
          <IconButton onClick={() => setErrorModal(prev => ({ ...prev, open: false }))} size="small" sx={{ color: '#ff4d6d' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: '#fff', mb: 3, fontWeight: 500 }}>
            {errorModal.message}
          </Typography>
          
          <Box sx={{ position: 'relative' }}>
            <Paper sx={{ p: 2, bgcolor: '#0d0709', border: '1px solid rgba(255, 77, 109, 0.2)', borderRadius: 2, maxHeight: '200px', overflowY: 'auto' }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#ff8da1', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {errorModal.rawError}
              </Typography>
            </Paper>
            <Button 
              size="small" 
              onClick={handleCopyError} 
              sx={{ 
                position: 'absolute', top: 8, right: 8, 
                bgcolor: 'rgba(255, 77, 109, 0.1)', color: '#ff4d6d', 
                '&:hover': { bgcolor: 'rgba(255, 77, 109, 0.2)' },
                textTransform: 'none', fontWeight: 700, borderRadius: 2
              }}
              startIcon={<ContentCopyIcon sx={{ fontSize: '1rem' }}/>}
            >
              {isCopied ? 'Copied!' : 'Copy Error'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button fullWidth variant="contained" onClick={() => setErrorModal(prev => ({ ...prev, open: false }))} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, bgcolor: '#ff4d6d', color: '#000', '&:hover': { bgcolor: '#ff2a55' } }}>
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}