// src/pages/Manual.tsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, Divider, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Collapse, CircularProgress, Chip } from '@mui/material';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import ConstructionIcon from '@mui/icons-material/Construction';
import AddTaskIcon from '@mui/icons-material/AddTask';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';

interface WorkoutJSON { 
  title: string; 
  focus: string; 
  mainBlock: { name: string; sets: number; repsMin: number; repsMax: number; rest: string; notes: string }[]; 
}

export default function Manual() {
  const [phase, setPhase] = useState<'SETUP' | 'WORKOUT'>('SETUP');
  
  const [style, setStyle] = useState<string>('Hypertrophy (8-12 reps)'); 
  
  // NEW: Split filters for Pattern vs Muscle
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('All');
  
  const [selectedExercisesList, setSelectedExercisesList] = useState<string[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(null);
  
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

  const logSet = useMutation(api.lifts.logSet);
  const exercisesDB = useQuery(api.exercises.getExercises, { category: "" });
  const allLiftsDB = useQuery(api.lifts.getLifts, {}) || [];

  // SETUP: Extract unique Patterns (Categories)
  const categories = useMemo(() => {
    try {
      if (!Array.isArray(exercisesDB)) return [];
      const cats = exercisesDB.map(ex => String(ex?.category || '')).filter(c => c.trim() !== '');
      return Array.from(new Set(cats)).sort();
    } catch (e) { return []; }
  }, [exercisesDB]);

  // SETUP: Extract unique Muscles (Subcategories) dependent on the active Category
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

  // SETUP: Final filtered list for display
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

  const handleCategoryChange = (newCat: string) => {
    setActiveCategory(newCat);
    setActiveSubcategory('All'); // Smart reset: If you switch from Push to Pull, it clears the 'Chest' filter
  };

  const handleToggleExerciseSelection = (name: string) => {
    setSelectedExercisesList(prev => 
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  };

  const handleGenerateManualWorkout = () => {
    if (selectedExercisesList.length === 0) return;
    
    const isStrength = style.includes('Strength');
    const repsMin = isStrength ? 4 : 8;
    const repsMax = isStrength ? 8 : 12;
    const rest = isStrength ? '120s' : '90s';

    const mainBlock = selectedExercisesList.map(name => ({
      name,
      sets: 3, // Defaults to 3 sets
      repsMin,
      repsMax,
      rest,
      notes: "Manual selection"
    }));

    setWorkoutData({
      title: "Custom Built Protocol",
      focus: style,
      mainBlock
    });
    setPhase('WORKOUT');
  };

  const clearSession = () => {
    setWorkoutData(null);
    setCompletedExercises({});
    setLoggedExercises({});
    setExpandedCells({});
    setSelectedExercisesList([]);
    setPhase('SETUP');
  };

  // WORKOUT LOGIC
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
    setLogWeight(suggestedWeight !== undefined && suggestedWeight !== '' ? suggestedWeight : (lastLift?.weight || ''));
    setLogReps(suggestedReps !== undefined ? suggestedReps : (lastLift?.reps || ''));
    setLogSets(suggestedSets !== undefined ? suggestedSets : 3);
    
    setLogModalOpen(true);
  };

  const handleCloseModal = () => {
    setLogModalOpen(false);
  };

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
      await logSet({
        exerciseName: activeLoggingExercise,
        category: logCategory, 
        equipmentType: logEquipment,
        weight: parseFloat(String(logWeight)) || 0,
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

  const renderLiftHistory = (exerciseName: string, minReps: number, maxReps: number) => {
    let history = allLiftsDB
      .filter(l => String(l?.exerciseName || '').toLowerCase() === exerciseName.toLowerCase() && l.reps >= minReps && l.reps <= maxReps)
      .sort((a,b) => b.timestamp - a.timestamp)
      .slice(0, 3);
    
    if (history.length === 0) {
      return (
        <Typography variant="body2" sx={{ color: '#8a8a9a', fontStyle: 'italic', p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
          No previous logs found matching this rep range.
        </Typography>
      );
    }

    return (
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2, p: 1.5, mt: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#00e096', textTransform: 'uppercase', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HistoryIcon sx={{ fontSize: '1rem' }}/> Relevant Performance
        </Typography>
        {history.map((lift, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', py: 0.5 }}>
            <Typography variant="body2" sx={{ color: i === 0 ? '#00e096' : '#d2a8ff', fontWeight: i === 0 ? 700 : 400 }}>
              {lift.weight > 0 ? `${lift.weight} lbs` : 'Bodyweight'} × {lift.reps} reps ({lift.sets} sets)
            </Typography>
            <Typography variant="body2" sx={{ color: '#8a8a9a', fontSize: '0.8rem' }}>
              {new Date(lift.timestamp).toLocaleDateString()}
            </Typography>
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
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00e096', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
              Self Select
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 1 }}>
              Builder <ConstructionIcon sx={{ color: '#00e096', fontSize: '2rem' }} />
            </Typography>
          </Box>
          {phase === 'WORKOUT' && (
            <Button size="small" sx={{ color: '#ff4d6d' }} onClick={clearSession}>End Session</Button>
          )}
        </Box>

        {phase === 'SETUP' && (
          <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <FormControl fullWidth size="small">
              <InputLabel id="manual-style-label" sx={{ color: 'rgba(255,255,255,0.5)' }}>Workout Style</InputLabel>
              <Select labelId="manual-style-label" value={style} label="Workout Style" onChange={(e) => setStyle(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="Hypertrophy (8-12 reps)">Hypertrophy (8-12 reps)</MenuItem>
                <MenuItem value="Strength (4-8 reps)">Strength (4-8 reps)</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* ROW 1: Broad Movement Patterns */}
            <Box>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                1. Movement Pattern
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="All Patterns" 
                  onClick={() => handleCategoryChange('All')}
                  sx={{ 
                    fontWeight: 700, px: 1, py: 2.5, borderRadius: 3,
                    bgcolor: activeCategory === 'All' ? 'rgba(0, 224, 150, 0.15)' : 'rgba(255,255,255,0.03)', 
                    color: activeCategory === 'All' ? '#00e096' : 'text.secondary', 
                    border: activeCategory === 'All' ? '1px solid rgba(0, 224, 150, 0.4)' : '1px solid rgba(255,255,255,0.08)' 
                  }} 
                />
                {categories.map(cat => (
                  <Chip 
                    key={cat} 
                    label={cat} 
                    onClick={() => handleCategoryChange(cat)}
                    sx={{ 
                      fontWeight: 700, px: 1, py: 2.5, borderRadius: 3,
                      bgcolor: activeCategory === cat ? 'rgba(0, 224, 150, 0.15)' : 'rgba(255,255,255,0.03)', 
                      color: activeCategory === cat ? '#00e096' : 'text.secondary', 
                      border: activeCategory === cat ? '1px solid rgba(0, 224, 150, 0.4)' : '1px solid rgba(255,255,255,0.08)' 
                    }} 
                  />
                ))}
              </Box>
            </Box>

            {/* ROW 2: Specific Target Muscle (Scrollable) */}
            {subcategories.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  2. Target Muscle
                </Typography>
                <Box sx={{ 
                  display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5,
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 }
                }}>
                  <Chip 
                    size="small"
                    label="All Muscles" 
                    onClick={() => setActiveSubcategory('All')}
                    sx={{ 
                      fontWeight: 600, py: 1.5,
                      bgcolor: activeSubcategory === 'All' ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)', 
                      color: activeSubcategory === 'All' ? '#00d4ff' : 'text.secondary', 
                      border: activeSubcategory === 'All' ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255,255,255,0.05)' 
                    }} 
                  />
                  {subcategories.map(sub => (
                    <Chip 
                      key={sub} 
                      size="small"
                      label={sub} 
                      onClick={() => setActiveSubcategory(sub)}
                      sx={{ 
                        fontWeight: 600, py: 1.5,
                        bgcolor: activeSubcategory === sub ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)', 
                        color: activeSubcategory === sub ? '#00d4ff' : 'text.secondary', 
                        border: activeSubcategory === sub ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid rgba(255,255,255,0.05)' 
                      }} 
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* EXERCISE SELECTION LIST */}
            <Box sx={{ maxHeight: 320, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 2, bgcolor: 'rgba(0,0,0,0.2)', mt: 1 }}>
              {displayedExercises.length === 0 ? (
                <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No exercises match this combination.
                </Typography>
              ) : (
                displayedExercises.map((ex, idx) => {
                  const safeName = String(ex?.name || 'Unnamed Exercise');
                  return (
                    <Box key={ex?._id || idx} onClick={() => handleToggleExerciseSelection(safeName)} sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                      <Checkbox checked={selectedExercisesList.includes(safeName)} sx={{ color: '#00e096', '&.Mui-checked': { color: '#00e096' }, p: 1.5 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{safeName}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                          {String(ex?.category || '')} {ex?.subcategory ? `· ${String(ex.subcategory)}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })
              )}
            </Box>

            <Button variant="contained" onClick={handleGenerateManualWorkout} disabled={selectedExercisesList.length === 0} sx={{ py: 2, mt: 1, borderRadius: 3, fontSize: '1.1rem', fontWeight: 800, background: selectedExercisesList.length > 0 ? 'linear-gradient(135deg, #00e096 0%, #0099cc 100%)' : 'rgba(255,255,255,0.1)', color: selectedExercisesList.length > 0 ? '#000' : 'rgba(255,255,255,0.3)' }}>
              Start Workout ({selectedExercisesList.length} Selected)
            </Button>
          </Paper>
        )}

        {phase === 'WORKOUT' && workoutData && (
          <Paper sx={{ p: 0, borderRadius: 4, bgcolor: 'rgba(0, 224, 150, 0.05)', border: '1px solid rgba(0, 224, 150, 0.2)', overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'rgba(0, 224, 150, 0.1)' }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#00e096', mb: 1 }}>{workoutData.title}</Typography>
              <Typography variant="body2" sx={{ color: '#8a8a9a' }}>Style: {workoutData.focus}</Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              {workoutData.mainBlock.map((ex, idx) => {
                const isDone = completedExercises[ex.name] || false;
                const isLogged = loggedExercises[ex.name] || false;
                const isExpanded = expandedCells[ex.name] || false;
                
                const relevantHistory = allLiftsDB
                  .filter(l => String(l?.exerciseName || '').toLowerCase() === ex.name.toLowerCase() && l.reps >= ex.repsMin && l.reps <= ex.repsMax)
                  .sort((a,b) => b.timestamp - a.timestamp);
                
                const lastLift = relevantHistory.length > 0 ? relevantHistory[0] : null;

                let targetWeightLabel = 'Baseline / Bodyweight';
                let suggestedWeightForLogger: number | string = '';
                
                if (lastLift && lastLift.weight > 0) {
                    const overloadedWeight = Math.round((lastLift.weight * 1.05) / 5) * 5;
                    targetWeightLabel = `${overloadedWeight} lbs`;
                    suggestedWeightForLogger = overloadedWeight;
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
                        <Checkbox checked={isDone} onClick={(e) => handleCheckboxClick(e, ex.name, isDone, suggestedWeightForLogger, ex.repsMax, ex.sets)} sx={{ color: '#00e096', '&.Mui-checked': { color: '#00e096' }, p: 0, mt: 0.5 }} />
                        
                        <Box onClick={(e) => { if(isDone) { e.stopPropagation(); openLogger(ex.name, suggestedWeightForLogger, ex.repsMax, ex.sets); } }} sx={{ display: 'flex', flexDirection: 'column', cursor: isDone ? 'pointer' : 'default', '&:hover': { opacity: isDone ? 0.8 : 1 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {ex.name}
                            </Typography>
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
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box sx={{ pl: 4, mt: 2 }}>
                        {renderLiftHistory(ex.name, ex.repsMin, ex.repsMax)}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* LOG DIALOG */}
        <Dialog open={logModalOpen} onClose={handleCloseModal} PaperProps={{ sx: { bgcolor: '#16171a', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 400 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography sx={{ fontWeight: 800, color: '#00e096' }}>Log Completed Set</Typography>
            <IconButton onClick={handleCloseModal} size="small" sx={{ color: '#8a8a9a' }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>{activeLoggingExercise}</Typography>
            
            <DateTimePicker 
              label="Date & Time (Defaults to Now)" 
              value={new Date(logTimestamp)} 
              onChange={(v) => v && setLogTimestamp(v.getTime())} 
              format="MMM d, yyyy '·' h:mm a" 
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mb: 2 } } }} 
            />

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
            <Button fullWidth variant="contained" onClick={handleSaveLogToDB} disabled={isSavingLog} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, background: 'linear-gradient(135deg, #00e096 0%, #0099cc 100%)', color: '#000' }}>
              {isSavingLog ? <CircularProgress size={24} sx={{ color: '#000' }} /> : <><AddTaskIcon sx={{ mr: 1 }} /> Save Log</>}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
}