// src/pages/Coach.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Slider, Select, MenuItem, FormControl, InputLabel, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Collapse } from '@mui/material';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; 
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useUnit } from '../context/UnitContext';

interface SuggestionJSON { focusTitle: string; reasoning: string; }
interface WorkoutJSON { 
  title: string; 
  focus: string; 
  warmup: { name: string; reps: string }[]; 
  mainBlock: { name: string; sets?: number; repsMin?: number; repsMax?: number; setsReps?: string; rest: string; notes: string }[]; 
  cooldown: { name: string; reps: string }[]; 
}

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

  const [phase, setPhase] = useState<'SETUP' | 'REVIEW' | 'WORKOUT'>('SETUP');
  const [time, setTime] = useState<number>(45);
  const [equipment, setEquipment] = useState<string>('Floor Mode (Bodyweight Only)');
  const [style, setStyle] = useState<string>('Hypertrophy (8-12 reps)'); 
  const [customInput, setCustomInput] = useState<string>('');
  
  const [suggestion, setSuggestion] = useState<SuggestionJSON | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(() => {
    const saved = localStorage.getItem('liftlog_active_ai_workout');
    return saved ? JSON.parse(saved) : null;
  });

  // SWAP & DRAG STATES
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
  const [logWeight, setLogWeight] = useState<string | number>('');
  const [logReps, setLogReps] = useState<string | number>('');
  const [logSets, setLogSets] = useState<string | number>(1);
  const [logTimestamp, setLogTimestamp] = useState<number>(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    try {
      const response: any = await suggestWorkoutFocus({ timeAvailable: time, equipment, style, customRequest: customInput, localTime: new Date().toISOString(), timezoneOffset: new Date().getTimezoneOffset() });
      setSuggestion(parseAIJSON(response.suggestionText));
      setPhase('REVIEW');
    } finally { setIsProcessing(false); }
  };

  const handleFinalizeWorkout = async () => {
    setIsProcessing(true);
    try {
      const result = await generateWorkout({ timeAvailable: time, equipment, style, localTime: new Date().toISOString(), approvedFocus: suggestion?.focusTitle || "" });
      const parsed = parseAIJSON(result as string);
      setWorkoutData(parsed);
      setPhase('WORKOUT');
    } finally { setIsProcessing(false); }
  };

  // SWAP FUNCTION
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

  // REORDER LOGIC
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

  const handleDragStart = (e: React.DragEvent, section: string, index: number) => {
    setDraggedItem({ section, index });
  };

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
    setPhase('SETUP');
  };

  const toggleCellExpand = (exerciseName: string) => setExpandedCells(prev => ({ ...prev, [exerciseName]: !prev[exerciseName] }));

  const openLogger = (exerciseName: string, suggestedWeight?: number | string, suggestedReps?: number | string, suggestedSets?: number | string) => {
    setActiveLoggingExercise(exerciseName);
    setLogTimestamp(Date.now());
    
    const dbMatch = exercisesDB?.find(ex => String(ex?.name || '').toLowerCase() === exerciseName.toLowerCase());
    const lastLift = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase()).sort((a,b) => b.timestamp - a.timestamp)[0];

    // Standardize 'Machine' or 'Cable' to 'Machine/Cable'
    let eq = lastLift?.equipmentType || 'Bodyweight';
    if (eq === 'Machine' || eq === 'Cable') eq = 'Machine/Cable';

    setLogCategory(dbMatch?.category || 'Custom');
    setLogEquipment(eq);
    setLogWeight(suggestedWeight !== undefined && suggestedWeight !== '' ? suggestedWeight : (lastLift?.weight ? toDisplay(lastLift.weight) : ''));
    setLogReps(suggestedReps !== undefined ? suggestedReps : (lastLift?.reps || ''));
    setLogSets(suggestedSets !== undefined ? suggestedSets : 1);
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
      await logSet({
        exerciseName: activeLoggingExercise,
        category: logCategory, 
        equipmentType: logEquipment,
        weight: toDB(parseFloat(String(logWeight)) || 0),
        reps: parseInt(String(logReps)) || 0,
        sets: parseInt(String(logSets)) || 1,
        timestamp: logTimestamp,
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
    
    if (history.length === 0) return <Typography variant="body2" sx={{ color: '#8a8a9a', fontStyle: 'italic', p: 2 }}>No history found matching this rep range.</Typography>;

    return (
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5, mt: 1 }}>
        {history.map((lift, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: i === 0 ? '#b06aff' : '#d2a8ff' }}>{displayWeight(lift.weight)} × {lift.reps} reps ({lift.sets} sets)</Typography>
            <Typography variant="body2" sx={{ color: '#8a8a9a' }}>{new Date(lift.timestamp).toLocaleDateString()}</Typography>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box sx={{ px: 2, pt: 3, pb: 10, maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        
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
                  <MenuItem value="Hypertrophy (8-12 reps)">Hypertrophy (8-12 reps)</MenuItem>
                  <MenuItem value="Strength (4-10 reps)">Strength (4-10 reps)</MenuItem>
                  {/* RESTORED HIIT & RECOVERY OPTIONS */}
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setPhase('SETUP')} sx={{ color: '#8a8a9a', borderColor: '#8a8a9a' }}>Back</Button>
              <Button fullWidth variant="contained" onClick={handleFinalizeWorkout} disabled={isProcessing}>{isProcessing ? <CircularProgress size={24} /> : 'Approve & Build'}</Button>
            </Box>
          </Paper>
        )}

        {phase === 'WORKOUT' && workoutData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {workoutData.warmup && workoutData.warmup.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#b06aff', mb: 1 }}>1. Warm-up (AI)</Typography>
                {workoutData.warmup.map((ex, idx) => (
                  <Paper 
                    key={ex.name} 
                    draggable onDragStart={(e) => handleDragStart(e, 'warmup', idx)} onDragEnter={(e) => handleDragEnter(e, 'warmup', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                    onClick={() => toggleCellExpand(ex.name)} 
                    sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(176, 106, 255, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'warmup' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                        <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ color: '#b06aff', p: 0, mt: 0.8 }} />
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
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#b06aff', mb: 1 }}>{workoutData.warmup && workoutData.warmup.length > 0 ? '2.' : '1.'} Main Block</Typography>
              {workoutData.mainBlock.map((ex, idx) => {
                const repsMax = ex.repsMax || (ex.setsReps ? parseInt(ex.setsReps.split('x')[1]) : 10);
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
                        <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], overloaded || '', repsMax, sets)} sx={{ color: '#b06aff', p: 0, mt: 0.8 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name} {loggedExercises[ex.name] && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(176, 106, 255, 0.2)', color: '#b06aff', px: 1, py: 0.3, borderRadius: 2, ml: 1 }}>Logged</Typography>}</Typography>
                          <Typography variant="caption" sx={{ color: '#00d4ff', mt: 0.5, display: 'block' }}>{sets} Sets | {ex.repsMin}-{repsMax} Reps | Load: {overloaded ? displayWeight(overloaded) : 'Baseline'}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'up'); }} disabled={idx === 0}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'down'); }} disabled={idx === workoutData.mainBlock.length - 1}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'main', index: idx }); }}><SwapHorizIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Collapse in={expandedCells[ex.name]}><Box sx={{ pl: { xs: 4, sm: 5 }, mt: 2 }}>{renderLiftHistory(ex.name, ex.repsMin, repsMax)}</Box></Collapse>
                  </Paper>
                )
              })}
            </Box>

            {workoutData.cooldown && workoutData.cooldown.length > 0 && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#b06aff', mb: 1 }}>3. Cooldown (AI)</Typography>
                {workoutData.cooldown.map((ex, idx) => (
                  <Paper 
                    key={ex.name} 
                    draggable onDragStart={(e) => handleDragStart(e, 'cooldown', idx)} onDragEnter={(e) => handleDragEnter(e, 'cooldown', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                    onClick={() => toggleCellExpand(ex.name)} 
                    sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(176, 106, 255, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'cooldown' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                        <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ color: '#b06aff', p: 0, mt: 0.8 }} />
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
          </Box>
        )}

        {/* SWAP DIALOG */}
        <Dialog open={!!swapTarget} onClose={() => setSwapTarget(null)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Swap Exercise</DialogTitle>
          <DialogContent>
            <TextField fullWidth size="small" placeholder="Search..." value={swapSearch} onChange={e => setSwapSearch(e.target.value)} sx={{ mt: 1, mb: 2 }} />
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
                <TextField fullWidth type="number" label={`Weight (${unit})`} value={logWeight} onChange={e => setLogWeight(e.target.value)} />
                <TextField fullWidth type="number" label="Reps" value={logReps} onChange={e => setLogReps(e.target.value)} />
                <TextField fullWidth type="number" label="Sets" value={logSets} onChange={e => setLogSets(e.target.value)} />
             </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
             <Button fullWidth variant="contained" onClick={handleSaveLogToDB} disabled={isProcessing}>{isProcessing ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Save Log'}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}