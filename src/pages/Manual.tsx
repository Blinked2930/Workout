// src/pages/Manual.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Paper, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Collapse, CircularProgress, Chip } from '@mui/material';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import ConstructionIcon from '@mui/icons-material/Construction';
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

interface WorkoutJSON { 
  title: string; 
  focus: string; 
  warmup?: { name: string; reps: string }[]; 
  mainBlock: { name: string; sets: number; repsMin: number; repsMax: number; rest: string; notes: string }[]; 
  cooldown?: { name: string; reps: string }[]; 
}

const parseAIJSON = (rawStr: string) => {
  try {
    const cleaned = rawStr.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON Parsing Error. Raw string:", rawStr);
    return { warmup: [], cooldown: [] };
  }
};

export default function Manual() {
  const { unit, displayWeight, toDisplay, toDB } = useUnit(); 
  
  // PERSISTENT MEMORY STATES
  const [phase, setPhase] = useState<'SETUP' | 'WORKOUT'>(() => (localStorage.getItem('manual_phase') as any) || 'SETUP');
  const [selectedExercisesList, setSelectedExercisesList] = useState<string[]>(() => {
    const saved = localStorage.getItem('manual_selected');
    return saved ? JSON.parse(saved) : [];
  });
  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(() => {
    const saved = localStorage.getItem('manual_workout');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [equipment, setEquipment] = useState<string>('Full Gym Access');
  const [style, setStyle] = useState<string>('Hypertrophy (8-12 reps)'); 
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [isGenerating, setIsGenerating] = useState(false);

  // SWAP & DRAG STATES
  const [swapTarget, setSwapTarget] = useState<{ section: 'warmup' | 'main' | 'cooldown', index: number } | null>(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [draggedItem, setDraggedItem] = useState<{ section: string, index: number } | null>(null);

  // LOGGING STATES
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});
  const [loggedExercises, setLoggedExercises] = useState<Record<string, boolean>>({});
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLoggingExercise, setActiveLoggingExercise] = useState<string>('');
  const [logCategory, setLogCategory] = useState('Custom'); 
  const [logEquipment, setLogEquipment] = useState('Barbell');
  const [logWeight, setLogWeight] = useState<string | number>('');
  const [logReps, setLogReps] = useState<string | number>('');
  const [logSets, setLogSets] = useState<string | number>(3);
  const [logTimestamp, setLogTimestamp] = useState<number>(Date.now());
  const [isSavingLog, setIsSavingLog] = useState(false);

  const generateWarmupCooldown = useAction(api.ai.generateWarmupCooldown);
  const logSet = useMutation(api.lifts.logSet);
  const exercisesDB = useQuery(api.exercises.getExercises, { category: "" });
  const allLiftsDB = useQuery(api.lifts.getLifts, {}) || [];

  // SYNC MEMORY EFFECTS
  useEffect(() => { localStorage.setItem('manual_phase', phase); }, [phase]);
  useEffect(() => { localStorage.setItem('manual_selected', JSON.stringify(selectedExercisesList)); }, [selectedExercisesList]);
  useEffect(() => {
    if (workoutData) localStorage.setItem('manual_workout', JSON.stringify(workoutData));
    else localStorage.removeItem('manual_workout');
  }, [workoutData]);

  const categories = useMemo(() => {
    try {
      if (!Array.isArray(exercisesDB)) return [];
      const cats = exercisesDB.map(ex => String(ex?.category || '')).filter(c => c.trim() !== '');
      return Array.from(new Set(cats)).sort();
    } catch (e) { return []; }
  }, [exercisesDB]);

  const subcategories = useMemo(() => {
    try {
      if (!Array.isArray(exercisesDB)) return [];
      let source = exercisesDB;
      if (activeCategory !== 'All') source = source.filter(ex => String(ex?.category || '') === activeCategory);
      const subcats = source.map(ex => String(ex?.subcategory || '')).filter(c => c.trim() !== '');
      return Array.from(new Set(subcats)).sort();
    } catch (e) { return []; }
  }, [exercisesDB, activeCategory]);

  const displayedExercises = useMemo(() => {
    try {
      if (!Array.isArray(exercisesDB)) return [];
      return exercisesDB.filter(ex => {
        const catMatch = activeCategory === 'All' || String(ex?.category || '') === activeCategory;
        const subMatch = activeSubcategory === 'All' || String(ex?.subcategory || '') === activeSubcategory;
        return catMatch && subMatch;
      });
    } catch (e) { return []; }
  }, [exercisesDB, activeCategory, activeSubcategory]);

  const filteredSwapExercises = useMemo(() => {
    if (!Array.isArray(exercisesDB)) return [];
    if (!swapSearch) return exercisesDB.slice(0, 15);
    return exercisesDB.filter(ex => String(ex?.name || '').toLowerCase().includes(swapSearch.toLowerCase())).slice(0, 15);
  }, [exercisesDB, swapSearch]);

  const handleCategoryChange = (newCat: string) => {
    setActiveCategory(newCat);
    setActiveSubcategory('All');
  };

  const handleToggleExerciseSelection = (name: string) => {
    setSelectedExercisesList(prev => prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]);
  };

  const handleStartWorkout = async (useAI: boolean) => {
    if (selectedExercisesList.length === 0) return;
    const isStrength = style.includes('Strength');
    const repsMin = isStrength ? 4 : 8;
    const repsMax = isStrength ? 8 : 12;
    const rest = isStrength ? '120s' : '90s';

    const mainBlock = selectedExercisesList.map(name => ({ name, sets: 3, repsMin, repsMax, rest, notes: "Manual selection" }));

    if (!useAI) {
      setWorkoutData({ title: "Custom Built Protocol", focus: style, warmup: [], mainBlock, cooldown: [] });
      setPhase('WORKOUT');
      return;
    }

    setIsGenerating(true);
    try {
      const aiResponse = await generateWarmupCooldown({ equipment, style, mainBlock: selectedExercisesList });
      const parsed = parseAIJSON(aiResponse);
      setWorkoutData({ title: "Custom Built Protocol", focus: style, warmup: parsed.warmup || [], mainBlock, cooldown: parsed.cooldown || [] });
      setPhase('WORKOUT');
    } catch (err) { alert("AI Warmup Generation failed. Check console."); } 
    finally { setIsGenerating(false); }
  };

  const handleSwapExercise = (newName: string) => {
    if (!workoutData || !swapTarget) return;
    const newWorkout = { ...workoutData };
    if (swapTarget.section === 'main') newWorkout.mainBlock[swapTarget.index].name = newName;
    else if (swapTarget.section === 'warmup' && newWorkout.warmup) newWorkout.warmup[swapTarget.index].name = newName;
    else if (swapTarget.section === 'cooldown' && newWorkout.cooldown) newWorkout.cooldown[swapTarget.index].name = newName;
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
    setSelectedExercisesList([]);
    setPhase('SETUP');
  };

  const toggleCellExpand = (exerciseName: string) => {
    setExpandedCells(prev => ({ ...prev, [exerciseName]: !prev[exerciseName] }));
  };

  const openLogger = (exerciseName: string, suggestedWeight?: number | string, suggestedReps?: number | string, suggestedSets?: number | string) => {
    setActiveLoggingExercise(exerciseName);
    setLogTimestamp(Date.now());
    const dbMatch = exercisesDB?.find(ex => String(ex?.name || '').toLowerCase() === exerciseName.toLowerCase());
    const lastLift = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase()).sort((a,b) => b.timestamp - a.timestamp)[0];
    let eq = lastLift?.equipmentType || 'Barbell';
    if (eq === 'Machine' || eq === 'Cable') eq = 'Machine/Cable';

    setLogCategory(dbMatch?.category || 'Custom');
    setLogEquipment(eq);
    setLogWeight(suggestedWeight !== undefined && suggestedWeight !== '' ? suggestedWeight : (lastLift?.weight ? toDisplay(lastLift.weight) : ''));
    setLogReps(suggestedReps !== undefined ? suggestedReps : (lastLift?.reps || ''));
    setLogSets(suggestedSets !== undefined ? suggestedSets : 3);
    setLogModalOpen(true);
  };

  const handleCloseModal = () => setLogModalOpen(false);

  const handleCheckboxClick = (e: React.MouseEvent, exerciseName: string, isCurrentlyDone: boolean, targetWeight?: number | string, targetReps?: number | string, targetSets?: number | string) => {
    e.stopPropagation(); 
    if (isCurrentlyDone) setCompletedExercises(prev => ({ ...prev, [exerciseName]: false }));
    else {
      setCompletedExercises(prev => ({ ...prev, [exerciseName]: true }));
      openLogger(exerciseName, targetWeight, targetReps, targetSets);
    }
  };

  const handleSaveLogToDB = async () => {
    setIsSavingLog(true);
    try {
      await logSet({
        exerciseName: activeLoggingExercise, category: logCategory, equipmentType: logEquipment,
        weight: toDB(parseFloat(String(logWeight)) || 0), reps: parseInt(String(logReps)) || 0, sets: parseInt(String(logSets)) || 1, timestamp: logTimestamp,
      });
      setLoggedExercises(prev => ({ ...prev, [activeLoggingExercise]: true }));
      setCompletedExercises(prev => ({ ...prev, [activeLoggingExercise]: true })); 
      setLogModalOpen(false);
    } finally { setIsSavingLog(false); }
  };

  const renderLiftHistory = (exerciseName: string, minReps?: number, maxReps?: number) => {
    let history = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase()).sort((a,b) => b.timestamp - a.timestamp);
    if (minReps !== undefined && maxReps !== undefined) history = history.filter(l => l.reps >= minReps && l.reps <= maxReps);
    history = history.slice(0, 3);
    if (history.length === 0) return <Typography variant="body2" sx={{ color: '#8a8a9a', fontStyle: 'italic', p: 2 }}>No previous logs found matching this rep range.</Typography>;
    return (
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5, mt: 1 }}>
        {history.map((lift, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: i === 0 ? '#00e096' : '#d2a8ff' }}>{displayWeight(lift.weight)} × {lift.reps} reps</Typography>
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
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00e096', textTransform: 'uppercase', mb: 0.5 }}>Self Select</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 1 }}>
              Builder <ConstructionIcon sx={{ color: '#00e096', fontSize: '2rem' }} />
            </Typography>
          </Box>
          {phase === 'WORKOUT' && <Button size="small" color="error" onClick={clearSession}>End Session</Button>}
        </Box>

        {phase === 'SETUP' && (
          <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl fullWidth size="small"><InputLabel>Environment</InputLabel><Select value={equipment} label="Environment" onChange={(e) => setEquipment(e.target.value)}><MenuItem value="Floor Mode (Bodyweight Only)">Floor Mode</MenuItem><MenuItem value="Bar Mode (Pull-up & Dip Bars)">Bar Mode</MenuItem><MenuItem value="Full Gym Access">Full Gym Access</MenuItem></Select></FormControl>
              <FormControl fullWidth size="small"><InputLabel>Style</InputLabel><Select value={style} label="Style" onChange={(e) => setStyle(e.target.value)}><MenuItem value="Hypertrophy (8-12 reps)">Hypertrophy</MenuItem><MenuItem value="Strength (4-8 reps)">Strength</MenuItem></Select></FormControl>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="All Patterns" onClick={() => { setActiveCategory('All'); setActiveSubcategory('All'); }} sx={{ fontWeight: 700, bgcolor: activeCategory === 'All' ? 'rgba(0, 224, 150, 0.2)' : 'transparent' }} />
              {categories.map(cat => <Chip key={cat} label={cat} onClick={() => { setActiveCategory(cat); setActiveSubcategory('All'); }} sx={{ fontWeight: 700, bgcolor: activeCategory === cat ? 'rgba(0, 224, 150, 0.2)' : 'transparent' }} />)}
            </Box>

            {subcategories.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5 }}>
                <Chip size="small" label="All Muscles" onClick={() => setActiveSubcategory('All')} sx={{ fontWeight: 600, py: 1.5, bgcolor: activeSubcategory === 'All' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)' }} />
                {subcategories.map(sub => <Chip key={sub} size="small" label={sub} onClick={() => setActiveSubcategory(sub)} sx={{ fontWeight: 600, py: 1.5, bgcolor: activeSubcategory === sub ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)' }} />)}
              </Box>
            )}

            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700 }}>3. Select Exercises</Typography>
                {selectedExercisesList.length > 0 && <Chip size="small" label={`${selectedExercisesList.length} Selected`} sx={{ bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', fontWeight: 800 }} />}
              </Box>

              <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                {displayedExercises.map((ex, idx) => {
                  const safeName = String(ex?.name || 'Unnamed Exercise');
                  return (
                    <Box key={ex?._id || idx} onClick={() => handleToggleExerciseSelection(safeName)} sx={{ display: 'flex', alignItems: 'center', p: 1, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Checkbox checked={selectedExercisesList.includes(safeName)} sx={{ color: '#00e096' }} />
                      <Box><Typography sx={{ fontWeight: 600 }}>{safeName}</Typography></Box>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button fullWidth variant="outlined" onClick={() => handleStartWorkout(false)} disabled={selectedExercisesList.length === 0 || isGenerating} sx={{ color: '#00e096' }}>Quick Start</Button>
              <Button fullWidth variant="contained" onClick={() => handleStartWorkout(true)} disabled={selectedExercisesList.length === 0 || isGenerating} sx={{ bgcolor: '#00e096', color: '#000' }}>{isGenerating ? <CircularProgress size={24} /> : '+ AI Warmup'}</Button>
            </Box>
          </Paper>
        )}

        {phase === 'WORKOUT' && workoutData && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {workoutData.warmup && workoutData.warmup.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 1 }}>1. Warm-up (AI)</Typography>
                {workoutData.warmup.map((ex, idx) => (
                  <Paper 
                    key={ex.name} 
                    draggable onDragStart={(e) => handleDragStart(e, 'warmup', idx)} onDragEnter={(e) => handleDragEnter(e, 'warmup', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                    onClick={() => toggleCellExpand(ex.name)} 
                    sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'warmup' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                        <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ color: '#00e096', p: 0, mt: 0.8 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name}</Typography>
                          <Typography variant="body2" sx={{ color: '#00e096' }}>Target: {ex.reps}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('warmup', idx, 'up'); }} disabled={idx === 0}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('warmup', idx, 'down'); }} disabled={idx === workoutData.warmup!.length - 1}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
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
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 1 }}>{workoutData.warmup && workoutData.warmup.length > 0 ? '2.' : '1.'} Main Block</Typography>
              {workoutData.mainBlock.map((ex, idx) => {
                const hist = allLiftsDB.filter(l => l.exerciseName === ex.name && l.reps >= ex.repsMin && l.reps <= ex.repsMax).sort((a,b)=>b.timestamp-a.timestamp)[0];
                const overloaded = hist?.weight ? Math.round((hist.weight * 1.05)/5)*5 : null;
                
                return (
                  <Paper 
                    key={ex.name} 
                    draggable onDragStart={(e) => handleDragStart(e, 'main', idx)} onDragEnter={(e) => handleDragEnter(e, 'main', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                    onClick={() => toggleCellExpand(ex.name)} 
                    sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'main' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                        <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], overloaded || '', ex.repsMax, ex.sets)} sx={{ color: '#00e096', p: 0, mt: 0.8 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name} {loggedExercises[ex.name] && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, ml: 1 }}>Logged</Typography>}</Typography>
                          <Typography variant="caption" sx={{ color: '#00d4ff', mt: 0.5, display: 'block' }}>{ex.sets} Sets | {ex.repsMin}-{ex.repsMax} Reps | Load: {overloaded ? displayWeight(overloaded) : 'Baseline'}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'up'); }} disabled={idx === 0} sx={{ color: 'rgba(255,255,255,0.5)' }}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'down'); }} disabled={idx === workoutData.mainBlock.length - 1} sx={{ color: 'rgba(255,255,255,0.5)' }}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'main', index: idx }); }} sx={{ color: 'rgba(255,255,255,0.5)' }}><SwapHorizIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Collapse in={expandedCells[ex.name]}><Box sx={{ pl: { xs: 4, sm: 5 }, mt: 2 }}>{renderLiftHistory(ex.name, ex.repsMin, ex.repsMax)}</Box></Collapse>
                  </Paper>
                );
              })}
            </Box>

            {workoutData.cooldown && workoutData.cooldown.length > 0 && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 1 }}>3. Cooldown (AI)</Typography>
                {workoutData.cooldown.map((ex, idx) => (
                  <Paper 
                    key={ex.name} 
                    draggable onDragStart={(e) => handleDragStart(e, 'cooldown', idx)} onDragEnter={(e) => handleDragEnter(e, 'cooldown', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                    onClick={() => toggleCellExpand(ex.name)} 
                    sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'cooldown' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                        <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ color: '#00e096', p: 0, mt: 0.8 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name}</Typography>
                          <Typography variant="body2" sx={{ color: '#00e096' }}>Target: {ex.reps}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('cooldown', idx, 'up'); }} disabled={idx === 0}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('cooldown', idx, 'down'); }} disabled={idx === workoutData.cooldown!.length - 1}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'cooldown', index: idx }); }} sx={{ color: 'rgba(255,255,255,0.5)' }}><SwapHorizIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Collapse in={expandedCells[ex.name]}><Box sx={{ pl: { xs: 4, sm: 5 }, mt: 2 }}>{renderLiftHistory(ex.name)}</Box></Collapse>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        <Dialog open={!!swapTarget} onClose={() => setSwapTarget(null)} fullWidth maxWidth="xs">
          <DialogTitle>Swap Exercise</DialogTitle>
          <DialogContent>
            <TextField fullWidth placeholder="Search..." value={swapSearch} onChange={e => setSwapSearch(e.target.value)} sx={{ my: 2 }} />
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {filteredSwapExercises.map(ex => (
                <MenuItem key={ex.name} onClick={() => handleSwapExercise(String(ex.name))}>{ex.name}</MenuItem>
              ))}
            </Box>
          </DialogContent>
        </Dialog>

        <Dialog open={logModalOpen} onClose={() => setLogModalOpen(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Log Set: {activeLoggingExercise}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
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
            <Button fullWidth variant="contained" onClick={handleSaveLogToDB} disabled={isSavingLog}>Save</Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
}