// src/pages/Manual.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, Paper, Button, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Collapse, CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import ConstructionIcon from '@mui/icons-material/Construction';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; 
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useUnit } from '../context/UnitContext'; 
import { useNavigate } from 'react-router-dom';

interface WorkoutJSON { 
  title: string; 
  focus: string; 
  warmup?: { name: string; reps: string; equipment?: string }[]; 
  mainBlock: { name: string; sets: number; repsMin: number; repsMax: number; rest: string; notes: string; setsReps?: string; equipment?: string }[]; 
  cooldown?: { name: string; reps: string; equipment?: string }[]; 
}

const EQUIPMENT_TYPES = [
  { value: 'Barbell', emoji: '🏋️' },
  { value: 'Dumbbell', emoji: '🫳' },
  { value: 'Smith', emoji: '🦾' },
  { value: 'Machine/Cable', emoji: '⚙️' },
  { value: 'Bodyweight', emoji: '🤸' },
  { value: 'Other', emoji: '⚡' },
];

const parseAIJSON = (rawStr: string) => {
  try {
    const cleaned = rawStr.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) { return { warmup: [], cooldown: [] }; }
};

export default function Manual() {
  const { unit, displayWeight, toDisplay, toDB } = useUnit(); 
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState<'SETUP' | 'WORKOUT'>(() => {
    try { return (localStorage.getItem('manual_phase') as any) || 'SETUP'; } 
    catch (e) { return 'SETUP'; }
  });
  
  const [selectedExercisesList, setSelectedExercisesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('manual_selected');
      return saved ? JSON.parse(saved) || [] : [];
    } catch (e) { return []; }
  });

  const [setupEquipment, setSetupEquipment] = useState<Record<string, string>>({});
  
  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(() => {
    try {
      const saved = localStorage.getItem('manual_workout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mainBlock) {
          parsed.mainBlock = parsed.mainBlock.map((ex: any) => {
            if (ex.repsMax === 12) return { ...ex, repsMin: 9, repsMax: 999 };
            return ex;
          });
        }
        return parsed;
      }
      return null;
    } catch (e) { return null; }
  });

  const equipment = 'Full Gym Access'; 
  const [style, setStyle] = useState<string>('Hypertrophy (9+ reps)'); 
  
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  const [isGenerating, setIsGenerating] = useState(false);

  const [swapTarget, setSwapTarget] = useState<{ section: 'warmup' | 'main' | 'cooldown', index: number } | null>(null);
  const [swapSearch, setSwapSearch] = useState('');
  const [draggedItem, setDraggedItem] = useState<{ section: string, index: number } | null>(null);

  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('manual_completed');
      return saved ? JSON.parse(saved) || {} : {};
    } catch (e) { return {}; }
  });
  
  const [loggedExercises, setLoggedExercises] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('manual_logged');
      return saved ? JSON.parse(saved) || {} : {};
    } catch (e) { return {}; }
  });

  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({});
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeLoggingExercise, setActiveLoggingExercise] = useState<string>('');
  
  const [ghostWeight, setGhostWeight] = useState<string | number>('');
  const [ghostReps, setGhostReps] = useState<string | number>('');
  const [ghostSets, setGhostSets] = useState<string | number>('');

  const [logCategory, setLogCategory] = useState('Custom'); 
  const [logEquipment, setLogEquipment] = useState('Barbell');
  const [logWeight, setLogWeight] = useState<string | number>('');
  const [logReps, setLogReps] = useState<string | number>('');
  const [logSets, setLogSets] = useState<string | number>('');
  const [logNotes, setLogNotes] = useState<string>('');
  const [logTimestamp, setLogTimestamp] = useState<number>(Date.now());
  const [isSavingLog, setIsSavingLog] = useState(false);

  const generateWarmupCooldown = useAction(api.ai.generateWarmupCooldown);
  const logSet = useMutation(api.lifts.logSet);
  const exercisesDB = useQuery(api.exercises.getExercises, { category: "" });
  const allLiftsDB = useQuery(api.lifts.getLifts, {}) || [];

  useEffect(() => { localStorage.setItem('manual_phase', phase); }, [phase]);
  useEffect(() => { localStorage.setItem('manual_selected', JSON.stringify(selectedExercisesList)); }, [selectedExercisesList]);
  useEffect(() => { localStorage.setItem('manual_completed', JSON.stringify(completedExercises)); }, [completedExercises]);
  useEffect(() => { localStorage.setItem('manual_logged', JSON.stringify(loggedExercises)); }, [loggedExercises]);
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

  const handleToggleExerciseSelection = (name: string) => {
    if (selectedExercisesList.includes(name)) {
      setSelectedExercisesList(prev => prev.filter(e => e !== name));
    } else {
      setSelectedExercisesList(prev => [...prev, name]);
      const lastLift = allLiftsDB.filter(l => l.exerciseName === name).sort((a,b)=>b.timestamp-a.timestamp)[0];
      let eq = lastLift?.equipmentType || 'Barbell';
      if (eq === 'Machine' || eq === 'Cable') eq = 'Machine/Cable';
      setSetupEquipment(prev => ({...prev, [name]: eq}));
    }
  };

  const handleStartWorkout = async (useAI: boolean) => {
    if (selectedExercisesList.length === 0) return;
    const repsMin = 4;
    const repsMax = 15;
    const rest = '90s - 120s';

    const mainBlock = selectedExercisesList.map(name => ({ 
      name, equipment: setupEquipment[name] || 'Barbell', sets: 3, repsMin, repsMax, rest, notes: "Manual selection" 
    }));

    if (!useAI) {
      setWorkoutData({ title: "Custom Built Protocol", focus: "General Training", warmup: [], mainBlock, cooldown: [] });
      setPhase('WORKOUT');
      return;
    }

    setIsGenerating(true);
    try {
      const aiResponse = await generateWarmupCooldown({ equipment, style: "General Training", mainBlock: selectedExercisesList });
      const parsed = parseAIJSON(aiResponse);
      
      const applyEq = (list: any[]) => list?.map(ex => {
         const lastLift = allLiftsDB.filter(l => l.exerciseName === ex.name).sort((a,b)=>b.timestamp-a.timestamp)[0];
         let eq = lastLift?.equipmentType || 'Bodyweight';
         if (eq === 'Machine' || eq === 'Cable') eq = 'Machine/Cable';
         return { ...ex, equipment: eq };
      });

      setWorkoutData({ 
        title: "Custom Built Protocol", focus: "General Training", 
        warmup: applyEq(parsed.warmup) || [], 
        mainBlock, 
        cooldown: applyEq(parsed.cooldown) || [] 
      });
      setPhase('WORKOUT');
    } finally { setIsGenerating(false); }
  };

  const handleSwapExercise = (newName: string) => {
    if (!workoutData || !swapTarget) return;
    const newWorkout = { ...workoutData };
    const lastLift = allLiftsDB.filter(l => l.exerciseName === newName).sort((a,b)=>b.timestamp-a.timestamp)[0];
    let eq = lastLift?.equipmentType || 'Barbell';
    if (eq === 'Machine' || eq === 'Cable') eq = 'Machine/Cable';

    if (swapTarget.section === 'main' && newWorkout.mainBlock) {
      newWorkout.mainBlock[swapTarget.index].name = newName;
      newWorkout.mainBlock[swapTarget.index].equipment = eq;
    } else if (swapTarget.section === 'warmup' && newWorkout.warmup) {
      newWorkout.warmup[swapTarget.index].name = newName;
      newWorkout.warmup[swapTarget.index].equipment = eq;
    } else if (swapTarget.section === 'cooldown' && newWorkout.cooldown) {
      newWorkout.cooldown[swapTarget.index].name = newName;
      newWorkout.cooldown[swapTarget.index].equipment = eq;
    }
    setWorkoutData(newWorkout);
    setSwapTarget(null);
    setSwapSearch('');
  };

  const updateEquipment = (section: 'warmup'|'main'|'cooldown', index: number, eq: string) => {
    if (!workoutData) return;
    const newWorkout = { ...workoutData };
    if (section === 'main' && newWorkout.mainBlock) newWorkout.mainBlock[index].equipment = eq;
    else if (section === 'warmup' && newWorkout.warmup) newWorkout.warmup[index].equipment = eq;
    else if (section === 'cooldown' && newWorkout.cooldown) newWorkout.cooldown[index].equipment = eq;
    setWorkoutData(newWorkout);
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
    setSelectedExercisesList([]);
    setSetupEquipment({});
    setPhase('SETUP');
  };

  const toggleCellExpand = (exerciseName: string) => {
    setExpandedCells(prev => ({ ...prev, [exerciseName]: !prev[exerciseName] }));
  };

  const openLogger = (exerciseName: string, equipment: string, suggestedWeight?: number | string, suggestedReps?: number | string, suggestedSets?: number | string) => {
    setActiveLoggingExercise(exerciseName);
    setLogTimestamp(Date.now());
    const dbMatch = exercisesDB?.find(ex => String(ex?.name || '').toLowerCase() === exerciseName.toLowerCase());
    const lastLift = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase() && (l.equipmentType || 'Barbell') === equipment).sort((a,b) => b.timestamp - a.timestamp)[0];

    setLogCategory(dbMatch?.category || 'Custom');
    setLogEquipment(equipment);
    
    setGhostWeight(suggestedWeight !== undefined && suggestedWeight !== '' ? suggestedWeight : (lastLift?.weight > 0 ? toDisplay(lastLift.weight) : ''));
    setGhostReps(suggestedReps !== undefined && suggestedReps !== '' ? suggestedReps : (lastLift?.reps || ''));
    setGhostSets(suggestedSets !== undefined ? suggestedSets : 3);
    
    setLogWeight('');
    setLogReps('');
    setLogSets('');
    setLogNotes('');
    
    setLogModalOpen(true);
  };

  const handleCloseModal = () => setLogModalOpen(false);

  const handleCheckboxClick = (e: React.MouseEvent, exerciseName: string, equipment: string, isCurrentlyDone: boolean, targetWeight?: number | string, targetReps?: number | string, targetSets?: number | string) => {
    e.stopPropagation(); 
    if (isCurrentlyDone) setCompletedExercises(prev => ({ ...prev, [exerciseName]: false }));
    else {
      setCompletedExercises(prev => ({ ...prev, [exerciseName]: true }));
      openLogger(exerciseName, equipment, targetWeight, targetReps, targetSets);
    }
  };

  const handleSaveLogToDB = async () => {
    setIsSavingLog(true);
    try {
      const finalWeight = logWeight !== '' ? parseFloat(String(logWeight)) : parseFloat(String(ghostWeight).replace(/[^\d.-]/g, ''));
      const finalReps = logReps !== '' ? parseInt(String(logReps)) : parseInt(String(ghostReps).replace(/[^\d.-]/g, ''));
      const finalSets = logSets !== '' ? parseInt(String(logSets)) : parseInt(String(ghostSets).replace(/[^\d.-]/g, ''));

      await logSet({
        exerciseName: activeLoggingExercise, category: logCategory, equipmentType: logEquipment,
        weight: toDB(finalWeight || 0), reps: finalReps || 0, sets: finalSets || 1, notes: logNotes || undefined, timestamp: logTimestamp,
      });
      setLoggedExercises(prev => ({ ...prev, [activeLoggingExercise]: true }));
      setCompletedExercises(prev => ({ ...prev, [activeLoggingExercise]: true })); 
      setLogModalOpen(false);
    } finally { setIsSavingLog(false); }
  };

  const renderLiftHistory = (exerciseName: string, equipment: string, recentE1RM_Display?: number) => {
    const history = allLiftsDB.filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase() && (l.equipmentType || 'Barbell') === equipment).sort((a,b) => b.timestamp - a.timestamp).slice(0, 3);
    
    const navToProgress = (e: React.MouseEvent) => {
      e.stopPropagation();
      localStorage.setItem('progress_exercise', exerciseName);
      navigate('/progress');
    };

    const e4RM = recentE1RM_Display ? recentE1RM_Display * (33 / 36) : 0;
    const e8RM = recentE1RM_Display ? recentE1RM_Display * (29 / 36) : 0;

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        
        {/* CALCULATED LOADING TARGETS PANEL */}
        {recentE1RM_Display && recentE1RM_Display > 0 ? (
          <Paper sx={{ p: 2, mt: 1, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, display: 'flex', justifyContent: 'center', gap: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', pr: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#00d4ff' }}>{Math.round(e4RM)} {unit}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>Target (4 Reps)</Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#d2a8ff' }}>{Math.round(e8RM)} {unit}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>Target (8 Reps)</Typography>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ p: 1.5, mt: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, textAlign: 'center' }}><Typography sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.8rem' }}>Set baseline lift to generate targets.</Typography></Paper>
        )}

        {/* RAW HISTORY LIST WITH NOTES */}
        <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5 }}>
          {history.length > 0 ? (
            history.map((lift, i) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: i === 0 ? '#00e096' : '#8a8a9a' }}>
                    {lift.weight > 0 ? displayWeight(lift.weight) : (lift.equipmentType === 'Bodyweight' ? 'BW' : 'Unlabeled')} × {lift.reps} reps
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#555566' }}>{new Date(lift.timestamp).toLocaleDateString()}</Typography>
                </Box>
                {lift.notes && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 0.25 }}>"{lift.notes}"</Typography>
                )}
              </Box>
            ))
          ) : (
             <Typography variant="body2" sx={{ color: '#8a8a9a', fontStyle: 'italic', textAlign: 'center', py: 1 }}>No history found for {equipment}.</Typography>
          )}
          <Button fullWidth size="small" onClick={navToProgress} sx={{ mt: 1.5, color: '#00e096', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid rgba(255,255,255,0.05)', pt: 1 }}>
            Full Progress Chart 📈
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 3, md: 5 }, pb: 10, maxWidth: { xs: 480, md: 900 }, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00e096', textTransform: 'uppercase', mb: 0.5 }}>Self Select</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 1 }}>Builder <ConstructionIcon sx={{ color: '#00e096', fontSize: '2rem' }} /></Typography>
          </Box>
          {phase === 'WORKOUT' && <Button size="small" color="error" onClick={clearSession}>End Session</Button>}
        </Box>

        {phase === 'SETUP' && (
          <Paper sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: 700 }}>Select Exercises</Typography>
                {selectedExercisesList.length > 0 && <Chip size="small" label={`${selectedExercisesList.length} Selected`} sx={{ bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', fontWeight: 800 }} />}
              </Box>
              <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2 }}>
                {displayedExercises.map((ex, idx) => {
                  const safeName = String(ex?.name || 'Unnamed Exercise');
                  const isSelected = selectedExercisesList.includes(safeName);
                  return (
                    <Box key={ex?._id || idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <Box onClick={() => handleToggleExerciseSelection(safeName)} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}>
                        <Checkbox checked={isSelected} sx={{ color: '#00e096' }} />
                        <Typography sx={{ fontWeight: 600 }}>{safeName}</Typography>
                      </Box>
                      {isSelected && (
                        <Select
                          size="small"
                          value={setupEquipment[safeName] || 'Barbell'}
                          onChange={(e) => setSetupEquipment(prev => ({...prev, [safeName]: e.target.value}))}
                          sx={{ height: 28, fontSize: '0.75rem', borderRadius: 2, minWidth: 110, bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { border: 'none' } }}
                        >
                          {EQUIPMENT_TYPES.map(eq => <MenuItem key={eq.value} value={eq.value} sx={{ fontSize: '0.8rem' }}>{eq.emoji} {eq.value}</MenuItem>)}
                        </Select>
                      )}
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
                {workoutData.warmup.map((ex, idx) => {
                  const eq = ex.equipment || 'Bodyweight';
                  return (
                    <Paper 
                      key={ex.name} 
                      draggable onDragStart={(e) => handleDragStart(e, 'warmup', idx)} onDragEnter={(e) => handleDragEnter(e, 'warmup', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                      onClick={() => toggleCellExpand(ex.name)} 
                      sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'warmup' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                          <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, eq, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ color: '#00e096', p: 0, mt: 0.8 }} />
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name}</Typography>
                            <Typography variant="body2" sx={{ color: '#00e096' }}>Target: {ex.reps}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('warmup', idx, 'up'); }} disabled={idx === 0}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('warmup', idx, 'down'); }} disabled={idx === workoutData.warmup?.length - 1}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'warmup', index: idx }); }}><SwapHorizIcon fontSize="small" /></IconButton>
                        </Box>
                      </Box>
                      <Collapse in={expandedCells[ex.name]}>
                        <Box sx={{ pl: { xs: 4, sm: 5 }, pr: 2, pb: 1 }}>
                          {renderLiftHistory(ex.name, eq)}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>Equipment</Typography>
                            <Select size="small" value={eq} onChange={(e) => updateEquipment('warmup', idx, e.target.value)} onClick={(e) => e.stopPropagation()} sx={{ height: 30, fontSize: '0.8rem', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { border: 'none' } }}>
                              {EQUIPMENT_TYPES.map(type => <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.8rem' }}>{type.emoji} {type.value}</MenuItem>)}
                            </Select>
                          </Box>
                        </Box>
                      </Collapse>
                    </Paper>
                  )
                })}
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 1 }}>{workoutData.warmup && workoutData.warmup.length > 0 ? '2.' : '1.'} Main Block</Typography>
              {workoutData.mainBlock?.map((ex, idx) => {
                const eq = ex.equipment || 'Barbell';
                const repsMax = ex.repsMax || (ex.setsReps ? parseInt((ex as any).setsReps.split('x')[1]) : 999);
                const repsLabel = repsMax >= 99 ? `${ex.repsMin}+` : `${ex.repsMin}-${repsMax}`;
                const targetRepsGhost = repsMax >= 99 ? `${ex.repsMin}+` : repsMax;
                const sets = ex.sets || 3;
                
                const eqLifts = allLiftsDB.filter(l => l.exerciseName === ex.name && (l.equipmentType || 'Barbell') === eq);
                const recentEqLift = eqLifts.sort((a,b)=>b.timestamp-a.timestamp)[0];
                const recentE1RM_Display = recentEqLift?.e1rm ? Number(toDisplay(recentEqLift.e1rm)) : 0;

                const hist = eqLifts.filter(l => l.reps >= (ex.repsMin || 0) && l.reps <= repsMax).sort((a,b)=>b.timestamp-a.timestamp)[0];
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
                        <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, eq, !!completedExercises[ex.name], overloaded || '', targetRepsGhost, sets)} sx={{ color: '#00e096', p: 0, mt: 0.8 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 700, textDecoration: completedExercises[ex.name] ? 'line-through' : 'none' }}>{ex.name} {loggedExercises[ex.name] && <Typography component="span" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(0, 224, 150, 0.2)', color: '#00e096', px: 1, py: 0.3, borderRadius: 2, ml: 1 }}>Logged</Typography>}</Typography>
                          <Typography variant="caption" sx={{ color: '#8a8a9a', mt: 0.2 }}>{sets} Sets | Baselines: {recentE1RM_Display > 0 ? "Avail." : "Set"}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'up'); }} disabled={idx === 0} sx={{ color: 'rgba(255,255,255,0.5)' }}><KeyboardArrowUpIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); moveExercise('main', idx, 'down'); }} disabled={idx === workoutData.mainBlock?.length - 1} sx={{ color: 'rgba(255,255,255,0.5)' }}><KeyboardArrowDownIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setSwapTarget({ section: 'main', index: idx }); }} sx={{ color: 'rgba(255,255,255,0.5)' }}><SwapHorizIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Collapse in={expandedCells[ex.name]}>
                      <Box sx={{ pl: { xs: 4, sm: 5 }, pr: 2, pb: 1 }}>
                        {renderLiftHistory(ex.name, eq, recentE1RM_Display)}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>Equipment</Typography>
                          <Select size="small" value={eq} onChange={(e) => updateEquipment('main', idx, e.target.value)} onClick={(e) => e.stopPropagation()} sx={{ height: 30, fontSize: '0.8rem', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { border: 'none' } }}>
                            {EQUIPMENT_TYPES.map(type => <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.8rem' }}>{type.emoji} {type.value}</MenuItem>)}
                          </Select>
                        </Box>
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Box>

            {workoutData.cooldown && workoutData.cooldown.length > 0 && (
              <Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#00e096', mb: 1 }}>3. Cooldown (AI)</Typography>
                {workoutData.cooldown.map((ex, idx) => {
                  const eq = ex.equipment || 'Bodyweight';
                  return (
                    <Paper 
                      key={ex.name} 
                      draggable onDragStart={(e) => handleDragStart(e, 'cooldown', idx)} onDragEnter={(e) => handleDragEnter(e, 'cooldown', idx)} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                      onClick={() => toggleCellExpand(ex.name)} 
                      sx={{ p: 2, mb: 2, borderRadius: 3, cursor: 'pointer', bgcolor: completedExercises[ex.name] ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', opacity: draggedItem?.section === 'cooldown' && draggedItem?.index === idx ? 0.3 : (completedExercises[ex.name] ? 0.6 : 1), transition: 'all 0.2s ease' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <DragIndicatorIcon sx={{ color: 'rgba(255,255,255,0.2)', mt: 1, cursor: 'grab', display: { xs: 'none', sm: 'block' } }} />
                          <Checkbox checked={!!completedExercises[ex.name]} onClick={(e) => handleCheckboxClick(e, ex.name, eq, !!completedExercises[ex.name], 0, ex.reps, 1)} sx={{ color: '#00e096', p: 0, mt: 0.8 }} />
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
                      <Collapse in={expandedCells[ex.name]}>
                        <Box sx={{ pl: { xs: 4, sm: 5 }, pr: 2, pb: 1 }}>
                          {renderLiftHistory(ex.name, eq)}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>Equipment</Typography>
                            <Select size="small" value={eq} onChange={(e) => updateEquipment('cooldown', idx, e.target.value)} onClick={(e) => e.stopPropagation()} sx={{ height: 30, fontSize: '0.8rem', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { border: 'none' } }}>
                              {EQUIPMENT_TYPES.map(type => <MenuItem key={type.value} value={type.value} sx={{ fontSize: '0.8rem' }}>{type.emoji} {type.value}</MenuItem>)}
                            </Select>
                          </Box>
                        </Box>
                      </Collapse>
                    </Paper>
                  )
                })}
              </Box>
            )}
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
             <Button fullWidth variant="contained" onClick={handleSaveLogToDB} disabled={isProcessing} sx={{ bgcolor: '#00e096', color: '#000' }}>Save Log</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}