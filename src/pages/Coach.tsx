// src/pages/Coach.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Slider, Select, MenuItem, FormControl, InputLabel, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Collapse } from '@mui/material';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; 
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TerminalIcon from '@mui/icons-material/Terminal';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useUnit } from '../context/UnitContext';
import { useNavigate } from 'react-router-dom';

interface SuggestionJSON { focusTitle: string; reasoning: string; }
interface WorkoutJSON { 
  title: string; 
  focus: string; 
  warmup: { name: string; reps: string }[]; 
  mainBlock: { name: string; sets?: number; repsMin?: number; repsMax?: number; setsReps?: string; rest: string; notes: string }[]; 
  cooldown: { name: string; reps: string }[]; 
}
interface DebugData { yesterdayBanned: string; weeklyMuscle: string; dateMath: string; aiPrompt: string; }

const parseAIJSON = (rawStr: string) => {
  try {
    const cleaned = rawStr.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.Required_JSON_Schema) return parsed.Required_JSON_Schema;
    return parsed;
  } catch (error) { return null; }
};

export default function Coach() {
  const { unit, displayWeight, toDisplay, toDB } = useUnit();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'SETUP' | 'REVIEW' | 'WORKOUT'>('SETUP');
  const [time, setTime] = useState<number>(45);
  const [equipment, setEquipment] = useState<string>('Floor Mode (Bodyweight Only)');
  const [style, setStyle] = useState<string>('Hypertrophy (9+ reps)'); 
  const [customInput, setCustomInput] = useState<string>('');
  
  const [suggestion, setSuggestion] = useState<SuggestionJSON | null>(null);
  const [debugData, setDebugData] = useState<DebugData | null>(null); 
  const [showDebug, setShowDebug] = useState(false); 
  const [tweaks, setTweaks] = useState<string>('');

  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(() => {
    const saved = localStorage.getItem('liftlog_active_ai_workout');
    return saved ? JSON.parse(saved) : null;
  });

  const [swapTarget, setSwapTarget] = useState<{ section: 'warmup' | 'main' | 'cooldown', index: number } | null>(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [draggedItem, setDraggedItem] = useState<{ section: string, index: number } | null>(null);
  
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [loggedExercises, setLoggedExercises] = useState<Record<string, boolean>>({});
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});
  
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLoggingExercise, setActiveLoggingExercise] = useState<string>('');
  const [logCategory, setLogCategory] = useState('Custom'); 
  const [logEquipment, setLogEquipment] = useState('Bodyweight');
  const [logTimestamp, setLogTimestamp] = useState<number>(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [logWeight, setLogWeight] = useState<string | number>('');
  const [logReps, setLogReps] = useState<string | number>('');
  const [logSets, setLogSets] = useState<string | number>('');
  const [logNotes, setLogNotes] = useState<string>(''); 

  const [ghostWeight, setGhostWeight] = useState('');
  const [ghostReps, setGhostReps] = useState('');
  const [ghostSets, setGhostSets] = useState('');

  const suggestWorkoutFocus = useAction("ai:suggestWorkoutFocus");
  const generateWorkout = useAction("ai:generateWorkout");
  const logSet = useMutation(api.lifts.logSet);
  const exercisesDB = useQuery(api.exercises.getExercises, { category: "" });
  const allLiftsDB = useQuery(api.lifts.getLifts, {}) || [];

  useEffect(() => { if (workoutData) setPhase('WORKOUT'); }, [workoutData]);

  useEffect(() => {
    if (workoutData) localStorage.setItem('liftlog_active_ai_workout', JSON.stringify(workoutData));
    else localStorage.removeItem('liftlog_active_ai_workout');
  }, [workoutData]);

  const filteredSwapExercises = useMemo(() => {
    if (!Array.isArray(exercisesDB)) return [];
    if (!swapSearch) return exercisesDB.slice(0, 15);
    return exercisesDB.filter(ex => String(ex?.name || '').toLowerCase().includes(swapSearch.toLowerCase())).slice(0, 15);
  }, [exercisesDB, swapSearch]);

  const handleGetSuggestion = async () => {
    setIsProcessing(true);
    setShowDebug(false);
    try {
      const response: any = await suggestWorkoutFocus({ timeAvailable: time, equipment, style, customRequest: customInput, localTime: new Date().toISOString(), timezoneOffset: new Date().getTimezoneOffset() });
      setSuggestion(parseAIJSON(response.suggestionText));
      setDebugData(response.debugData);
      setPhase('REVIEW');
    } finally { setIsProcessing(false); }
  };

  const handleFinalizeWorkout = async () => {
    setIsProcessing(true);
    try {
      const result = await generateWorkout({ timeAvailable: time, equipment, style, localTime: new Date().toISOString(), approvedFocus: suggestion?.focusTitle || "", userTweaks: tweaks });
      const parsed = parseAIJSON(result as string);
      setWorkoutData(parsed);
      setPhase('WORKOUT');
    } finally { setIsProcessing(false); }
  };

  const handleSwapExercise = (newName: string) => {
    if (!workoutData || !swapTarget) return;
    const newWorkout = { ...workoutData };
    if (swapTarget.section === 'main') newWorkout.mainBlock[swapTarget.index].name = newName;
    else if (swapTarget.section === 'warmup') newWorkout.warmup[swapTarget.index].name = newName;
    else if (swapTarget.section === 'cooldown') newWorkout.cooldown[swapTarget.index].name = newName;
    setWorkoutData(newWorkout);
    setSwapTarget(null);
    setSwapSearch('');
  };

  const moveExercise = (section: 'warmup'|'main'|'cooldown', index: number, direction: 'up'|'down') => {
    if (!workoutData) return;
    const newWorkout = { ...workoutData };
    let list: any;
    if (section === 'main') list = newWorkout.mainBlock;
    else if (section === 'warmup') list = newWorkout.warmup;
    else if (section === 'cooldown') list = newWorkout.cooldown;
    if (!list) return;

    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setWorkoutData(newWorkout);
  };

  const handleDragStart = (e: React.DragEvent, section: string, index: number) => setDraggedItem({ section, index });
  const handleDragEnter = (e: React.DragEvent, section: string, index: number) => {
    e.preventDefault();
    if (!draggedItem || !workoutData) return;
    if (draggedItem.section !== section || draggedItem.index === index) return;
    const newWorkout = { ...workoutData };
    let list: any;
    if (section === 'main') list = newWorkout.mainBlock;
    else if (section === 'warmup') list = newWorkout.warmup;
    else if (section === 'cooldown') list = newWorkout.cooldown;
    if (!list) return;
    const item = list[draggedItem.index];
    list.splice(draggedItem.index, 1);
    list.splice(index, 0, item);
    setWorkoutData(newWorkout);
    setDraggedItem({ section, index });
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragEnd = () => setDraggedItem(null);

  const clearSession = () => {
    setWorkoutData(null);
    setCompletedExercises({});
    setLoggedExercises({});
    setExpandedCells({});
    setTweaks('');
    setPhase('SETUP');
  };

  const toggleCellExpand = (exerciseName: string) => setExpandedCells(prev => ({ ...prev, [exerciseName]: !prev[exerciseName] }));

  const openLogger = (exerciseName: string, suggestedWeight?: number | string, suggestedReps?: number | string, suggestedSets?: number | string) => {
    setActiveLoggingExercise(exerciseName);
    setLogTimestamp(Date.now());
    const dbMatch = exercisesDB?.find(ex => String(ex?.name || '').toLowerCase() === exerciseName.toLowerCase());
    const lastLift = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase()).sort((a,b) => b.timestamp - a.timestamp)[0];
    
    let eq = lastLift?.equipmentType || 'Bodyweight';
    if (eq === 'Machine' || eq === 'Cable') eq = 'Machine/Cable';
    
    setLogCategory(dbMatch?.category || 'Custom');
    setLogEquipment(eq);
    
    setLogWeight('');
    setLogReps('');
    setLogSets('');
    setLogNotes('');

    setGhostWeight(suggestedWeight ? `Target: ${suggestedWeight}` : (lastLift?.weight > 0 ? `Last: ${toDisplay(lastLift.weight)}` : 'Last: BW'));
    setGhostReps(suggestedReps ? `Target: ${suggestedReps}` : (lastLift?.reps ? `Last: ${lastLift.reps}` : ''));
    setGhostSets(suggestedSets ? `Target: ${suggestedSets}` : (lastLift?.sets ? `Last: ${lastLift.sets}` : ''));
    
    setLogModalOpen(true);
  };

  const handleCheckboxClick = (e: React.MouseEvent, exerciseName: string, isCurrentlyDone: boolean, targetWeight?: number | string, targetReps?: number | string, targetSets?: number | string) => {
    e.stopPropagation(); 
    if (isCurrentlyDone) setCompletedExercises(prev => ({ ...prev, [exerciseName]: false }));
    else {
      setCompletedExercises(prev => ({ ...prev, [exerciseName]: true }));
      openLogger(exerciseName, targetWeight, targetReps, targetSets);
    }
  };

  const handleSaveLogToDB = async () => {
    setIsProcessing(true);
    try {
      const finalWeight = logWeight !== '' ? parseFloat(String(logWeight)) : parseFloat(String(ghostWeight).replace(/[^\d.-]/g, ''));
      const finalReps = logReps !== '' ? parseInt(String(logReps)) : parseInt(String(ghostReps).replace(/[^\d.-]/g, ''));
      const finalSets = logSets !== '' ? parseInt(String(logSets)) : parseInt(String(ghostSets).replace(/[^\d.-]/g, ''));

      await logSet({
        exerciseName: activeLoggingExercise, category: logCategory, equipmentType: logEquipment,
        weight: toDB(finalWeight || 0), reps: finalReps || 0, sets: finalSets || 1, 
        notes: logNotes || undefined, timestamp: logTimestamp,
      });
      setLoggedExercises(prev => ({ ...prev, [activeLoggingExercise]: true }));
      setCompletedExercises(prev => ({ ...prev, [activeLoggingExercise]: true })); 
      setLogModalOpen(false);
    } finally { setIsProcessing(false); }
  };

  const renderLiftHistory = (exerciseName: string, minReps?: number, maxReps?: number) => {
    let history = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase()).sort((a,b) => b.timestamp - a.timestamp);
    if (minReps !== undefined && maxReps !== undefined) history = history.filter(l => l.reps >= minReps && l.reps <= maxReps);
    history = history.slice(0, 3);

    const navToProgress = (e: React.MouseEvent) => {
      e.stopPropagation();
      localStorage.setItem('progress_exercise', exerciseName);
      navigate('/progress');
    };

    if (history.length === 0) return (
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5, mt: 1, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#8a8a9a', fontStyle: 'italic', mb: 1 }}>No history found matching this rep range.</Typography>
        <Button size="small" onClick={navToProgress} sx={{ color: '#00d4ff', fontSize: '0.7rem', fontWeight: 800 }}>Full Progress 📈</Button>
      </Box>
    );

    return (
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5, mt: 1 }}>
        {history.map((lift, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: i === 0 ? '#b06aff' : '#d2a8ff' }}>{displayWeight(lift.weight)} × {lift.reps} reps</Typography>
            <Typography variant="body2" sx={{ color: '#8a8a9a' }}>{new Date(lift.timestamp).toLocaleDateString()}</Typography>
          </Box>
        ))}
        <Button fullWidth size="small" onClick={navToProgress} sx={{ mt: 1, color: '#00d4ff', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid rgba(255,255,255,0.05)', pt: 1.5 }}>
          Full Progress 📈
        </Button>
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 3, md: 5 }, pb: 10, maxWidth: { xs: 480, md: 900 }, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#b06aff', textTransform: 'uppercase', mb: 0.5 }}>AI Integration</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 1 }}>Coach <AutoAwesomeIcon sx={{ color: '#b06aff', fontSize: '2rem' }} /></Typography>
          </Box>
          {phase === 'WORKOUT' && <Button size="small" sx={{ color: '#ff4d6d' }} onClick={clearSession}>End Session</Button>}
        </Box>

        {phase === 'SETUP' && (
          <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1, color: '#00d4ff' }}>Time Available: {time} Minutes</Typography>
              <Slider value={time} onChange={(_, v) => setTime(v as number)} step={15} marks min={15} max={120} sx={{ color: '#00d4ff' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Environment</InputLabel>
                <Select value={equipment} label="Environment" onChange={(e) => setEquipment(e.target.value)}>
                  <MenuItem value="Floor Mode (Bodyweight Only)">Floor Mode (No Gear)</MenuItem>
                  <MenuItem value="Bar Mode (Pull-up & Dip Bars)">Bar Mode (Pull/Dip Bars)</MenuItem>
                  <MenuItem value="Full Gym Access">Full Gym Access</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Workout Style</InputLabel>
                <Select value={style} label="Workout Style" onChange={(e) => setStyle(e.target.value)}>
                  <MenuItem value="Hypertrophy (9+ reps)">Hypertrophy (9+ reps)</MenuItem>
                  <MenuItem value="Strength (4-10 reps)">Strength (4-10 reps)</MenuItem>
                  <MenuItem value="High Intensity Interval Training (HIIT)">High Intensity Interval Training (HIIT)</MenuItem>
                  <MenuItem value="Active Recovery & Mobility">Active Recovery & Mobility</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField fullWidth label="Specific Request? (Optional)" value={customInput} onChange={(e) => setCustomInput(e.target.value)} />
            <Button variant="contained" onClick={handleGetSuggestion} disabled={isProcessing} sx={{ py: 2, borderRadius: 3 }}>{isProcessing ? <CircularProgress size={28} /> : <><SearchIcon sx={{ mr: 1 }} /> Analyze Data</>}</Button>
          </Paper>
        )}

        {phase === 'REVIEW' && suggestion && (
          <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #b06aff' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>{suggestion.focusTitle}</Typography>
            <Typography sx={{ color: '#d2a8ff', mb: 3 }}>{suggestion.reasoning}</Typography>

            {debugData && (
              <Box sx={{ mt: 1, mb: 1 }}>
                <Button size="small" onClick={() => setShowDebug(!showDebug)} sx={{ color: '#8a8a9a', textTransform: 'none', display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

            <Divider sx={{ borderColor: 'rgba(176, 106, 255, 0.2)', my: 2 }} />

            <TextField fullWidth label="Any tweaks before I build this?" placeholder="e.g., 'Make it harder' or 'I don't have rings'" value={tweaks} onChange={(e) => setTweaks(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)' }, mb: 3 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setPhase('SETUP')} sx={{ color: '#8a8a9a', borderColor: '#8a8a9a' }}>Back</Button>
              <Button fullWidth variant="contained" onClick={handleFinalizeWorkout} disabled={isProcessing}>{isProcessing ? <CircularProgress size={24} /> : 'Approve & Build'}</Button>
            </Box>
          </Paper>
        )}

        {phase === 'WORKOUT' && workoutData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {workoutData.warmup.map((ex, idx) => (
              <Paper 
                key={ex.name} 
                draggable onDragStart={(e) => handleDragStart(e, 'warmup', idx)} onDragEnter={(e) => handleDragEnter(e, 'warmup', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                onClick={() => toggleCellExpand(ex.name)} 
                sx={{ p: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(176, 106, 255, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'warmup' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                    <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ p: 0, mt: 0.8 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name}</Typography>
                      <Typography variant="body2" sx={{ color: '#00d4ff' }}>Target: {ex.reps}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('warmup', idx, 'up'); }} disabled={idx === 0}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('warmup', idx, 'down'); }} disabled={idx === workoutData.warmup.length - 1}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'warmup', index: idx }); }}><SwapHorizIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Collapse in={expandedCells[ex.name]}><Box sx={{ pl: { xs: 4, sm: 5 }, mt: 2 }}>{renderLiftHistory(ex.name)}</Box></Collapse>
              </Paper>
            ))}

            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

            {workoutData.mainBlock.map((ex, idx) => {
               const repsMax = ex.repsMax || (ex.setsReps ? parseInt((ex as any).setsReps.split('x')[1]) : 999);
               const repsLabel = repsMax >= 99 ? `${ex.repsMin}+` : `${ex.repsMin}-${repsMax}`;
               const targetRepsGhost = repsMax >= 99 ? `${ex.repsMin}+` : repsMax;
               const sets = ex.sets || 3;
               const hist = allLiftsDB.filter(l => l.exerciseName === ex.name && l.reps >= (ex.repsMin || 0) && l.reps <= repsMax).sort((a,b)=>b.timestamp-a.timestamp)[0];
               const overloaded = hist?.weight ? Math.round((hist.weight * 1.05)/5)*5 : null;

               return (
                <Paper 
                  key={ex.name} 
                  draggable onDragStart={(e) => handleDragStart(e, 'main', idx)} onDragEnter={(e) => handleDragEnter(e, 'main', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                  onClick={() => toggleCellExpand(ex.name)} 
                  sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(176, 106, 255, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'main' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                      <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], overloaded || '', targetRepsGhost, sets)} sx={{ p: 0, mt: 0.8 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name} {loggedExercises[ex.name] && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(176, 106, 255, 0.2)', color: '#b06aff', px: 1, py: 0.3, borderRadius: 2, ml: 1 }}>Logged</Typography>}</Typography>
                        <Typography variant="caption" sx={{ color: '#00d4ff', mt: 0.5, display: 'block' }}>{sets} Sets | {repsLabel} Reps | Load: {overloaded ? displayWeight(overloaded) : 'Baseline'}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'up'); }} disabled={idx === 0} sx={{ color: 'rgba(255,255,255,0.5)' }}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'down'); }} disabled={idx === workoutData.mainBlock.length - 1} sx={{ color: 'rgba(255,255,255,0.5)' }}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'main', index: idx }); }} sx={{ color: 'rgba(255,255,255,0.5)' }}><SwapHorizIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Collapse in={expandedCells[ex.name]}><Box sx={{ pl: { xs: 4, sm: 5 }, mt: 2 }}>{renderLiftHistory(ex.name, ex.repsMin, repsMax)}</Box></Collapse>
                </Paper>
               )
            })}

            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

            {workoutData.cooldown.map((ex, idx) => (
              <Paper 
                key={ex.name} 
                draggable onDragStart={(e) => handleDragStart(e, 'cooldown', idx)} onDragEnter={(e) => handleDragEnter(e, 'cooldown', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                onClick={() => toggleCellExpand(ex.name)} 
                sx={{ p: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(176, 106, 255, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'cooldown' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                    <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ p: 0, mt: 0.8 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name}</Typography>
                      <Typography variant="body2" sx={{ color: '#00d4ff' }}>Target: {ex.reps}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('cooldown', idx, 'up'); }} disabled={idx === 0}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('cooldown', idx, 'down'); }} disabled={idx === workoutData.cooldown!.length - 1}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'cooldown', index: idx }); }}><SwapHorizIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Collapse in={expandedCells[ex.name]}><Box sx={{ pl: { xs: 4, sm: 5 }, mt: 2 }}>{renderLiftHistory(ex.name)}</Box></Collapse>
              </Paper>
            ))}
          </Box>
        )}

        {/* SWAP DIALOG */}
        <Dialog open={!!swapTarget} onClose={() => setSwapTarget(null)} fullWidth maxWidth="xs">
          <DialogTitle>Swap Exercise</DialogTitle>
          <DialogContent>
            <TextField fullWidth placeholder="Search..." value={swapSearch} onChange={e => setSwapSearch(e.target.value)} sx={{ my: 2 }} />
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {filteredSwapExercises.map(ex => (
                <MenuItem key={ex.name} onClick={() => handleSwapExercise(String(ex.name))}>
                   <Box>
                    <Typography sx={{ fontWeight: 600 }}>{ex.name}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{ex.category}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Box>
          </DialogContent>
        </Dialog>

        {/* LOG MODAL */}
        <Dialog open={logModalOpen} onClose={() => setLogModalOpen(false)}>
          <DialogTitle sx={{ fontWeight: 800, color: '#00d4ff' }}>Log Set</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
             <Typography variant="h5" sx={{ fontWeight: 900 }}>{activeLoggingExercise}</Typography>
             <DateTimePicker label="Time" value={new Date(logTimestamp)} onChange={(v) => v && setLogTimestamp(v.getTime())} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
             <FormControl fullWidth size="small">
                <InputLabel>Equipment</InputLabel>
                <Select value={logEquipment} onChange={(e) => setLogEquipment(e.target.value)} label="Equipment">
                  <MenuItem value="Bodyweight">Bodyweight</MenuItem><MenuItem value="Barbell">Barbell</MenuItem><MenuItem value="Dumbbell">Dumbbell</MenuItem><MenuItem value="Smith">Smith</MenuItem><MenuItem value="Machine/Cable">Machine/Cable</MenuItem>
                </Select>
             </FormControl>
             <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth type="text" inputMode="decimal" label={`Weight (${unit})`} placeholder={ghostWeight ? `Target: ${ghostWeight}` : ''} value={logWeight} onChange={e => setLogWeight(e.target.value)} />
                <TextField fullWidth type="text" inputMode="numeric" label="Reps" placeholder={ghostReps ? `Target: ${ghostReps}` : ''} value={logReps} onChange={e => setLogReps(e.target.value)} />
                <TextField fullWidth type="text" inputMode="numeric" label="Sets" placeholder={ghostSets ? `Target: ${ghostSets}` : ''} value={logSets} onChange={e => setLogSets(e.target.value)} />
             </Box>
             <TextField fullWidth label="Notes (optional)" size="small" multiline rows={2} value={logNotes} onChange={e => setLogNotes(e.target.value)} sx={{ mt: 2 }} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
             <Button fullWidth variant="contained" onClick={handleSaveLogToDB} disabled={isProcessing} sx={{ bgcolor: '#b06aff', color: '#fff' }}>Save Log</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}