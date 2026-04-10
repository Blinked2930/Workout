// src/pages/Manual.tsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Collapse, CircularProgress, Chip } from '@mui/material';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import ConstructionIcon from '@mui/icons-material/Construction';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; // Swap Icon
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
  
  const [phase, setPhase] = useState<'SETUP' | 'WORKOUT'>('SETUP');
  
  const [equipment, setEquipment] = useState<string>('Full Gym Access');
  const [style, setStyle] = useState<string>('Hypertrophy (8-12 reps)'); 
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  
  const [selectedExercisesList, setSelectedExercisesList] = useState<string[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Swap State
  const [swapTarget, setSwapTarget] = useState<{ section: 'warmup' | 'main' | 'cooldown', index: number } | null>(null);
  const [swapSearch, setSwapSearch] = useState('');

  // Logging States
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
      if (activeCategory !== 'All') {
        source = source.filter(ex => String(ex?.category || '') === activeCategory);
      }
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
    setSelectedExercisesList(prev => 
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleStartWorkout = async (useAI: boolean) => {
    if (selectedExercisesList.length === 0) return;
    
    const isStrength = style.includes('Strength');
    const repsMin = isStrength ? 4 : 8;
    const repsMax = isStrength ? 8 : 12;
    const rest = isStrength ? '120s' : '90s';

    const mainBlock = selectedExercisesList.map(name => ({
      name, sets: 3, repsMin, repsMax, rest, notes: "Manual selection"
    }));

    if (!useAI) {
      setWorkoutData({
        title: "Custom Built Protocol",
        focus: style,
        warmup: [],
        mainBlock,
        cooldown: []
      });
      setPhase('WORKOUT');
      return;
    }

    setIsGenerating(true);
    try {
      const aiResponse = await generateWarmupCooldown({
        equipment,
        style,
        mainBlock: selectedExercisesList
      });

      const parsed = parseAIJSON(aiResponse);

      setWorkoutData({
        title: "Custom Built Protocol",
        focus: style,
        warmup: parsed.warmup || [],
        mainBlock,
        cooldown: parsed.cooldown || []
      });
      setPhase('WORKOUT');
    } catch (err) {
      console.error(err);
      alert("AI Warmup Generation failed. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSwapExercise = (newName: string) => {
    if (!workoutData || !swapTarget) return;
    const newWorkout = { ...workoutData };
    
    if (swapTarget.section === 'main') {
      newWorkout.mainBlock[swapTarget.index].name = newName;
    } else if (swapTarget.section === 'warmup' && newWorkout.warmup) {
      newWorkout.warmup[swapTarget.index].name = newName;
    } else if (swapTarget.section === 'cooldown' && newWorkout.cooldown) {
      newWorkout.cooldown[swapTarget.index].name = newName;
    }
    
    setWorkoutData(newWorkout);
    setSwapTarget(null);
    setSwapSearch('');
  };

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
    const resolvedCategory = dbMatch?.category || 'Custom';
    
    const previousLifts = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase()).sort((a,b) => b.timestamp - a.timestamp);
    const lastLift = previousLifts.length > 0 ? previousLifts[0] : null;

    setLogCategory(resolvedCategory);
    setLogEquipment(lastLift?.equipmentType || 'Barbell');
    
    setLogWeight(suggestedWeight !== undefined && suggestedWeight !== '' ? suggestedWeight : (lastLift?.weight ? toDisplay(lastLift.weight) : ''));
    setLogReps(suggestedReps !== undefined ? suggestedReps : (lastLift?.reps || ''));
    setLogSets(suggestedSets !== undefined ? suggestedSets : 3);
    
    setLogModalOpen(true);
  };

  const handleCloseModal = () => setLogModalOpen(false);

  const handleCheckboxClick = (e: React.MouseEvent, exerciseName: string, isCurrentlyDone: boolean, targetWeight?: number | string, targetReps?: number | string, targetSets?: number | string) => {
    e.stopPropagation(); 
    if (isCurrentlyDone) {
      setCompletedExercises(prev => ({ ...prev, [exerciseName]: false }));
    } else {
      setCompletedExercises(prev => ({ ...prev, [exerciseName]: true }));
      openLogger(exerciseName, targetWeight, targetReps, targetSets);
    }
  };

  const handleSaveLogToDB = async () => {
    setIsSavingLog(true);
    try {
      const inputWeight = parseFloat(String(logWeight)) || 0;
      const dbWeight = toDB(inputWeight);

      await logSet({
        exerciseName: activeLoggingExercise,
        category: logCategory, 
        equipmentType: logEquipment,
        weight: dbWeight,
        reps: parseInt(String(logReps)) || 0,
        sets: parseInt(String(logSets)) || 1,
        timestamp: logTimestamp,
      });
      setLoggedExercises(prev => ({ ...prev, [activeLoggingExercise]: true }));
      setCompletedExercises(prev => ({ ...prev, [activeLoggingExercise]: true })); 
      setLogModalOpen(false);
    } finally {
      setIsSavingLog(false);
    }
  };

  const renderLiftHistory = (exerciseName: string, minReps?: number, maxReps?: number) => {
    let history = allLiftsDB
      .filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase())
      .sort((a,b) => b.timestamp - a.timestamp);

    if (minReps !== undefined && maxReps !== undefined) {
      history = history.filter(l => l.reps >= minReps && l.reps <= maxReps);
    }
    history = history.slice(0, 3);
    
    if (history.length === 0) return (
      <Typography variant="body2" sx={{ color: '#8a8a9a', fontStyle: 'italic', p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>No previous logs found matching this rep range.</Typography>
    );

    return (
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5, mt: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#00e096', textTransform: 'uppercase', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HistoryIcon sx={{ fontSize: '1rem' }}/> Relevant Performance
        </Typography>
        {history.map((lift, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: i === 0 ? '#00e096' : '#d2a8ff', fontWeight: i === 0 ? 700 : 400 }}>
              {displayWeight(lift.weight)} × {lift.reps} reps ({lift.sets} sets)
            </Typography>
            <Typography variant="body2" sx={{ color: '#8a8a9a', fontSize: '0.8rem' }}>{new Date(lift.timestamp).toLocaleDateString()}</Typography>
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
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00e096', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>Self Select</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 1 }}>
              Builder <ConstructionIcon sx={{ color: '#00e096', fontSize: '2rem' }} />
            </Typography>
          </Box>
          {phase === 'WORKOUT' && <Button size="small" sx={{ color: '#ff4d6d' }} onClick={clearSession}>End Session</Button>}
        </Box>

        {phase === 'SETUP' && (
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            
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
                  <MenuItem value="Hypertrophy (8-12 reps)">Hypertrophy (8-12 reps)</MenuItem>
                  <MenuItem value="Strength (4-8 reps)">Strength (4-8 reps)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>1. Movement Pattern</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label="All Patterns" onClick={() => handleCategoryChange('All')} sx={{ fontWeight: 700, px: 1, py: 2.5, borderRadius: 3, bgcolor: activeCategory === 'All' ? 'rgba(0, 224, 150, 0.15)' : 'rgba(255,255,255,0.03)', color: activeCategory === 'All' ? '#00e096' : 'text.secondary', border: activeCategory === 'All' ? '1px solid rgba(0, 224, 150, 0.4)' : '1px solid rgba(255,255,255,0.08)' }} />
                {categories.map(cat => (
                  <Chip key={cat} label={cat} onClick={() => handleCategoryChange(cat)} sx={{ fontWeight: 700, px: 1, py: 2.5, borderRadius: 3, bgcolor: activeCategory === cat ? 'rgba(0, 224, 150, 0.15)' : 'rgba(255,255,255,0.03)', color: activeCategory === cat ? '#00e096' : 'text.secondary', border: activeCategory === cat ? '1px solid rgba(0, 224, 150, 0.4)' : '1px solid rgba(255,255,255,0.08)' }} />
                ))}
              </Box>
            </Box>

            {subcategories.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>2. Target Muscle</Typography>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 } }}>
                  <Chip size="small" label="All Muscles" onClick={() => setActiveSubcategory('All')} sx={{ fontWeight: 600, py: 1.5, bgcolor: activeSubcategory === 'All' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)', color: activeSubcategory === 'All' ? '#00d4ff' : 'text.secondary', border: activeSubcategory === 'All' ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255,255,255,0.05)' }} />
                  {subcategories.map(sub => (
                    <Chip key={sub} size="small" label={sub} onClick={() => setActiveSubcategory(sub)} sx={{ fontWeight: 600, py: 1.5, bgcolor: activeSubcategory === sub ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)', color: activeSubcategory === sub ? '#00d4ff' : 'text.secondary', border: activeSubcategory === sub ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255,255,255,0.05)' }} />
                  ))}
                </Box>
              </Box>
            )}

            <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, bgcolor: 'rgba(0,0,0,0.2)', mt: 1 }}>
              {displayedExercises.length === 0 ? <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>No exercises match this combination.</Typography> : displayedExercises.map((ex, idx) => {
                const safeName = String(ex?.name || 'Unnamed Exercise');
                return (
                  <Box key={ex?._id || idx} onClick={() => handleToggleExerciseSelection(safeName)} sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                    <Checkbox checked={selectedExercisesList.includes(safeName)} sx={{ color: '#00e096', '&.Mui-checked': { color: '#00e096' }, p: 1.5 }} />
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{safeName}</Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{String(ex?.category || '')} {ex?.subcategory ? `· ${String(ex.subcategory)}` : ''}</Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button fullWidth variant="outlined" onClick={() => handleStartWorkout(false)} disabled={selectedExercisesList.length === 0 || isGenerating} sx={{ py: 1.5, borderRadius: 3, fontWeight: 700, borderColor: 'rgba(0, 224, 150, 0.5)', color: selectedExercisesList.length > 0 ? '#00e096' : 'rgba(255,255,255,0.3)' }}>Quick Start</Button>
              <Button fullWidth variant="contained" onClick={() => handleStartWorkout(true)} disabled={selectedExercisesList.length === 0 || isGenerating} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, background: selectedExercisesList.length > 0 ? 'linear-gradient(135deg, #00e096 0%, #0099cc 100%)' : 'rgba(255,255,255,0.1)', color: selectedExercisesList.length > 0 ? '#000' : 'rgba(255,255,255,0.3)' }}>{isGenerating ? <CircularProgress size={24} sx={{ color: '#000' }} /> : '+ AI Warmup'}</Button>
            </Box>
          </Paper>
        )}

        {phase === 'WORKOUT' && workoutData && (
          <Paper sx={{ p: 0, borderRadius: 4, bgcolor: 'rgba(0, 224, 150, 0.05)', border: '1px solid rgba(0, 224, 150, 0.2)', overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'rgba(0, 224, 150, 0.1)' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#00e096', mb: 1 }}>{workoutData.title}</Typography>
              <Typography variant="body2" sx={{ color: '#8a8a9a' }}>Style: {workoutData.focus}</Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* WARMUP */}
              {workoutData.warmup && workoutData.warmup.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 1.5 }}>1. Warm-up (AI Generated)</Typography>
                  {workoutData.warmup.map((ex, idx) => {
                    const isDone = completedExercises[ex.name] || false;
                    const isLogged = loggedExercises[ex.name] || false;
                    const isExpanded = expandedCells[ex.name] || false;
                    
                    return (
                      <Paper key={idx} onClick={() => toggleCellExpand(ex.name)} sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)', opacity: isDone ? 0.6 : 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isExpanded ? 1 : 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Checkbox checked={isDone} onClick={(e) => handleCheckboxClick(e, ex.name, isDone, 0, ex.reps, 1)} sx={{ color: '#00e096', '&.Mui-checked': { color: '#00e096' }, p: 0, mt: 0.5 }} />
                            <Box onClick={(e) => { if(isDone) { e.stopPropagation(); openLogger(ex.name, 0, ex.reps, 1); } }} sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>{ex.name}</Typography>
                                {isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Logged</Typography>}
                              </Box>
                              <Typography variant="body2" sx={{ color: '#00e096', fontWeight: 600, fontSize: '0.85rem', mt: 0.5 }}>Target: {ex.reps}</Typography>
                            </Box>
                          </Box>
                          <IconButton onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'warmup', index: idx }); }} sx={{ color: 'rgba(255,255,255,0.5)' }}><SwapHorizIcon /></IconButton>
                        </Box>
                        <Collapse in={isExpanded}><Box sx={{ pl: 4, mt: 2 }}>{renderLiftHistory(ex.name)}</Box></Collapse>
                      </Paper>
                    );
                  })}
                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                </>
              )}

              {/* MAIN BLOCK */}
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 2 }}>{workoutData.warmup && workoutData.warmup.length > 0 ? '2.' : '1.'} Main Block</Typography>
              {workoutData.mainBlock.map((ex, idx) => {
                const isDone = completedExercises[ex.name] || false;
                const isLogged = loggedExercises[ex.name] || false;
                const isExpanded = expandedCells[ex.name] || false;
                
                const relevantHistory = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === ex.name.toLowerCase() && l.reps >= ex.repsMin && l.reps <= ex.repsMax).sort((a,b) => b.timestamp - a.timestamp);
                const lastLift = relevantHistory.length > 0 ? relevantHistory[0] : null;

                let targetWeightLabel = 'Baseline / Bodyweight';
                let suggestedWeightForLogger: number | string = '';
                
                if (lastLift && lastLift.weight > 0) {
                    const overloadedWeightLbs = Math.round((lastLift.weight * 1.05) / 5) * 5;
                    targetWeightLabel = displayWeight(overloadedWeightLbs);
                    suggestedWeightForLogger = toDisplay(overloadedWeightLbs);
                }

                return (
                  <Paper key={idx} onClick={() => toggleCellExpand(ex.name)} sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)', opacity: isDone ? 0.6 : 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isExpanded ? 1 : 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Checkbox checked={isDone} onClick={(e) => handleCheckboxClick(e, ex.name, isDone, suggestedWeightForLogger, ex.repsMax, ex.sets)} sx={{ color: '#00e096', '&.Mui-checked': { color: '#00e096' }, p: 0, mt: 0.5 }} />
                        <Box onClick={(e) => { if(isDone) { e.stopPropagation(); openLogger(ex.name, suggestedWeightForLogger, ex.repsMax, ex.sets); } }} sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>{ex.name}</Typography>
                            {isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Logged</Typography>}
                          </Box>
                          <Typography variant="body2" sx={{ color: '#00e096', fontWeight: 600, fontSize: '0.85rem', mt: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <span><strong style={{color: '#fff'}}>Sets:</strong> {ex.sets}</span> |
                            <span><strong style={{color: '#fff'}}>Reps:</strong> {ex.repsMin}-{ex.repsMax}</span> |
                            <span><strong style={{color: '#fff'}}>Load:</strong> {targetWeightLabel}</span> |
                            <span><strong style={{color: '#fff'}}>Rest:</strong> {ex.rest}</span>
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'main', index: idx }); }} sx={{ color: 'rgba(255,255,255,0.5)' }}><SwapHorizIcon /></IconButton>
                    </Box>
                    <Collapse in={isExpanded}><Box sx={{ pl: 4, mt: 2 }}>{renderLiftHistory(ex.name, ex.repsMin, ex.repsMax)}</Box></Collapse>
                  </Paper>
                );
              })}

              {/* COOLDOWN */}
              {workoutData.cooldown && workoutData.cooldown.length > 0 && (
                <>
                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 1.5 }}>3. Cooldown (AI Generated)</Typography>
                  {workoutData.cooldown.map((ex, idx) => {
                    const isDone = completedExercises[ex.name] || false;
                    const isLogged = loggedExercises[ex.name] || false;
                    const isExpanded = expandedCells[ex.name] || false;
                    return (
                      <Paper key={idx} onClick={() => toggleCellExpand(ex.name)} sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)', opacity: isDone ? 0.6 : 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isExpanded ? 1 : 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Checkbox checked={isDone} onClick={(e) => handleCheckboxClick(e, ex.name, isDone, 0, ex.reps, 1)} sx={{ color: '#00e096', '&.Mui-checked': { color: '#00e096' }, p: 0, mt: 0.5 }} />
                            <Box onClick={(e) => { if(isDone) { e.stopPropagation(); openLogger(ex.name, 0, ex.reps, 1); } }} sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>{ex.name}</Typography>
                                {isLogged && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, textTransform: 'uppercase' }}>Logged</Typography>}
                              </Box>
                              <Typography variant="body2" sx={{ color: '#00e096', fontWeight: 600, fontSize: '0.85rem', mt: 0.5 }}>Target: {ex.reps}</Typography>
                            </Box>
                          </Box>
                          <IconButton onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'cooldown', index: idx }); }} sx={{ color: 'rgba(255,255,255,0.5)' }}><SwapHorizIcon /></IconButton>
                        </Box>
                        <Collapse in={isExpanded}><Box sx={{ pl: 4, mt: 2 }}>{renderLiftHistory(ex.name)}</Box></Collapse>
                      </Paper>
                    );
                  })}
                </>
              )}
            </Box>
          </Paper>
        )}

        {/* SWAP DIALOG */}
        <Dialog open={!!swapTarget} onClose={() => setSwapTarget(null)} fullWidth maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Swap Exercise</DialogTitle>
          <DialogContent>
            <TextField fullWidth size="small" placeholder="Search to swap..." value={swapSearch} onChange={e => setSwapSearch(e.target.value)} sx={{ mt: 1, mb: 2 }} />
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

        {/* LOG DIALOG */}
        <Dialog open={logModalOpen} onClose={handleCloseModal} PaperProps={{ sx: { bgcolor: '#16171a', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 400 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography sx={{ fontWeight: 800, color: '#00e096' }}>Log Completed Set</Typography>
            <IconButton onClick={handleCloseModal} size="small" sx={{ color: '#8a8a9a' }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>{activeLoggingExercise}</Typography>
            <DateTimePicker label="Date & Time" value={new Date(logTimestamp)} onChange={(v) => v && setLogTimestamp(v.getTime())} format="MMM d, yyyy '·' h:mm a" slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mb: 2 } } }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Equipment</InputLabel>
                <Select value={logEquipment} onChange={(e) => setLogEquipment(e.target.value)} label="Equipment" sx={{ borderRadius: 2 }}>
                  <MenuItem value="Bodyweight">Bodyweight</MenuItem><MenuItem value="Barbell">Barbell</MenuItem><MenuItem value="Dumbbell">Dumbbell</MenuItem><MenuItem value="Machine">Machine</MenuItem><MenuItem value="Cable">Cable</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth type="number" label={`Weight (${unit})`} value={logWeight} onChange={(e) => setLogWeight(e.target.value)} InputProps={{ inputProps: { min: 0 } }} />
              <TextField fullWidth type="number" label="Reps" value={logReps} onChange={(e) => setLogReps(e.target.value)} InputProps={{ inputProps: { min: 0 } }} />
              <TextField fullWidth type="number" label="Sets" value={logSets} onChange={(e) => setLogSets(e.target.value)} InputProps={{ inputProps: { min: 1 } }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button fullWidth variant="contained" onClick={handleSaveLogToDB} disabled={isSavingLog} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, background: 'linear-gradient(135deg, #00e096 0%, #0099cc 100%)', color: '#000' }}>
              {isSavingLog ? <CircularProgress size={24} sx={{ color: '#000' }} /> : <><AddTaskIcon sx={{ mr: 1 }} /> Save Log</>}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
}