// src/pages/Progress.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, InputAdornment,
  List, ListItemButton, ListItemText, Divider, Button, ToggleButton, ToggleButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { useUnit } from '../context/UnitContext'; 

// ── Metric definitions ─────────────────────────────────────────────────────
const WEIGHTED_METRICS = [
  { value: 'e1rm',   label: 'Est. 1RM',  color: '#00d4ff' },
  { value: 'volume', label: 'Volume',    color: '#00e096' },
  { value: 'weight', label: 'Weight',    color: '#ffb800' },
  { value: 'reps',   label: 'Reps',      color: '#ff6b35' },
];

const BODYWEIGHT_METRICS = [
  { value: 'reps',      label: 'Max Reps/Set', color: '#00d4ff' },
  { value: 'totalReps', label: 'Total Reps',   color: '#00e096' },
  { value: 'sets',      label: 'Sets',         color: '#ffb800' },
];

const EQUIPMENT_TYPES = [
  { value: 'Barbell', emoji: '🏋️' },
  { value: 'Dumbbell', emoji: '🫳' },
  { value: 'Smith', emoji: '🦾' },
  { value: 'Machine/Cable', emoji: '⚙️' },
  { value: 'Bodyweight', emoji: '🤸' },
  { value: 'Other', emoji: '⚡' },
];

const EQUIPMENT_EMOJIS: Record<string, string> = EQUIPMENT_TYPES.reduce((acc, curr) => {
  acc[curr.value] = curr.emoji;
  return acc;
}, {} as Record<string, string>);

// ── Tooltip ────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, isBW, unit }: any) {
  if (!active || !payload?.length) return null;
  const name = payload[0]?.name;
  const metricList = isBW ? BODYWEIGHT_METRICS : WEIGHTED_METRICS;
  const m = metricList.find(m => m.value === name);
  const isWeightBased = !isBW && (name === 'e1rm' || name === 'weight' || name === 'volume');
  return (
    <Paper sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, color: m?.color ?? '#00d4ff', fontSize: '1rem' }}>
        {payload[0]?.value?.toFixed(isWeightBased ? 1 : 0)}{isWeightBased ? ` ${unit}` : ''}
      </Typography>
    </Paper>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Progress() {
  const { unit, toDisplay, toDB } = useUnit(); 

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedExercise, setSelectedExercise] = useState<string | null>(
    () => localStorage.getItem('progress_exercise')
  );
  const [search, setSearch] = useState(
    () => localStorage.getItem('progress_exercise') || ''
  );
  const [showList, setShowList] = useState(false);
  const [metric, setMetric] = useState(() => localStorage.getItem('progress_metric') || 'e1rm');
  const [equipmentOverride, setEquipmentOverride] = useState<string | null>(null);

  // Edit State
  const [editSet, setEditSet] = useState<any | null>(null);
  
  // New Log State
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logEquipment, setLogEquipment] = useState('Barbell');
  const [logWeight, setLogWeight] = useState<string | number>('');
  const [logReps, setLogReps] = useState<string | number>('');
  const [logSets, setLogSets] = useState<string | number>(1);
  const [logTimestamp, setLogTimestamp] = useState<number>(Date.now());
  const [isSavingLog, setIsSavingLog] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const exercises = useQuery(api.exercises.getExercises, { category: '' });
  const allLifts = useQuery(api.lifts.getLifts, {});
  const updateSetMutation = useMutation(api.lifts.updateSet);
  const deleteSetMutation = useMutation(api.lifts.deleteSet);
  const logSetMutation = useMutation(api.lifts.logSet);

  useEffect(() => {
    if (selectedExercise) localStorage.setItem('progress_exercise', selectedExercise);
    else localStorage.removeItem('progress_exercise');
  }, [selectedExercise]);

  useEffect(() => {
    localStorage.setItem('progress_metric', metric);
  }, [metric]);

  const exercisesWithHistory = useMemo(() => {
    if (!allLifts) return new Set<string>();
    return new Set(allLifts.map(l => l.exerciseName));
  }, [allLifts]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const withHistory = exercises.filter(e => exercisesWithHistory.has(e.name));
    if (!search) return withHistory.slice(0, 30);
    return withHistory.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 25);
  }, [exercises, search, exercisesWithHistory]);

  const historyForSelected = useMemo(() => {
    if (!allLifts || !selectedExercise) return [];
    return allLifts
      .filter(l => l.exerciseName === selectedExercise)
      .map(l => {
        // Clean up legacy categories dynamically
        let eq = l.equipmentType;
        if (eq === 'Machine' || eq === 'Cable') eq = 'Machine/Cable';
        return { ...l, equipmentType: eq };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allLifts, selectedExercise]);

  const availableEquipments = useMemo(() => {
    const types = new Set(historyForSelected.map(l => l.equipmentType || (l.weight > 0 ? 'Barbell' : 'Bodyweight')));
    return Array.from(types).sort();
  }, [historyForSelected]);

  const activeEquipment = useMemo(() => {
    if (equipmentOverride && availableEquipments.includes(equipmentOverride)) return equipmentOverride;
    return availableEquipments.includes('Barbell') ? 'Barbell' : (availableEquipments[0] || 'Barbell');
  }, [availableEquipments, equipmentOverride]);

  const isBW = activeEquipment === 'Bodyweight';

  useEffect(() => { setEquipmentOverride(null); }, [selectedExercise]);

  useEffect(() => {
    if (isBW && !BODYWEIGHT_METRICS.find(m => m.value === metric)) setMetric('reps');
    if (!isBW && !WEIGHTED_METRICS.find(m => m.value === metric)) setMetric('e1rm');
  }, [isBW, metric]);

  const chartData = useMemo(() => {
    const sessions = historyForSelected.filter(l => {
      const eq = l.equipmentType || (l.weight > 0 ? 'Barbell' : 'Bodyweight');
      return eq === activeEquipment;
    });

    return sessions.map(l => ({
      date: format(new Date(l.timestamp), 'MMM d'),
      e1rm: isBW ? 0 : Number(toDisplay(l.e1rm ?? 0)),
      volume: isBW ? 0 : Number(toDisplay(l.volume)),
      weight: isBW ? 0 : Number(toDisplay(l.weight)),
      reps: l.reps,
      sets: l.sets,
      totalReps: l.reps * l.sets,
      rawSet: l, 
    }));
  }, [historyForSelected, activeEquipment, isBW, toDisplay]);

  const bestE1RM = chartData.length ? Math.max(...chartData.map(d => d.e1rm)) : 0;
  const heaviestLift = chartData.length ? Math.max(...chartData.map(d => d.weight)) : 0;
  const bestVolume = chartData.length ? Math.max(...chartData.map(d => d.volume)) : 0;
  const e4RM = bestE1RM * (33 / 36);
  const e8RM = bestE1RM * (29 / 36);

  const strengthLifts = chartData.filter(d => d.weight > 0 && d.reps >= 4 && d.reps <= 8).reverse();
  const hyperLifts = chartData.filter(d => d.weight > 0 && d.reps >= 9 && d.reps <= 15).reverse();
  const lastStrength = strengthLifts[0]?.weight ?? null;
  const lastHyper = hyperLifts[0]?.weight ?? null;

  const bestMaxReps = chartData.length ? Math.max(...chartData.map(d => d.reps)) : 0;
  const bestTotalReps = chartData.length ? Math.max(...chartData.map(d => d.totalReps)) : 0;
  const mostSets = chartData.length ? Math.max(...chartData.map(d => d.sets)) : 0;

  const currentMetricsList = isBW ? BODYWEIGHT_METRICS : WEIGHTED_METRICS;
  const selectedMetric = currentMetricsList.find(m => m.value === metric) ?? currentMetricsList[0];

  const handleSelectExercise = (name: string) => {
    setSelectedExercise(name);
    setSearch(name);
    setShowList(false);
  };

  const handleClearSearch = () => {
    setSearch('');
    setSelectedExercise(null);
    setShowList(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);
  };

  const handleOpenNewLog = () => {
    const lastLift = historyForSelected.length > 0 ? historyForSelected[historyForSelected.length - 1] : null;
    setLogEquipment(activeEquipment || 'Barbell');
    setLogWeight(lastLift?.weight ? toDisplay(lastLift.weight) : '');
    setLogReps(lastLift?.reps || '');
    setLogSets(1);
    setLogTimestamp(Date.now());
    setLogModalOpen(true);
  };

  const handleSaveNewLog = async () => {
    if (!selectedExercise) return;
    setIsSavingLog(true);
    try {
      const dbMatch = exercises?.find(ex => ex.name.toLowerCase() === selectedExercise.toLowerCase());
      const safeCategory = dbMatch?.category || 'Custom';
      
      await logSetMutation({
        exerciseName: selectedExercise,
        category: safeCategory,
        equipmentType: logEquipment,
        weight: toDB(parseFloat(logWeight.toString()) || 0),
        reps: parseInt(logReps.toString()) || 0,
        sets: parseInt(logSets.toString()) || 1,
        timestamp: logTimestamp,
      });
      setLogModalOpen(false);
      setSuccessMsg('Set logged successfully! 💪');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to log set.');
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleUpdate = async () => {
    if (!editSet) return;
    try {
      const weightVal = toDB(parseFloat(editSet.weight) || 0); 
      const repsVal = parseInt(editSet.reps) || 0;
      const setsVal = parseInt(editSet.sets) || 1;
      const rirVal = editSet.rir !== '' && editSet.rir !== null && editSet.rir !== undefined ? parseInt(editSet.rir) : undefined;
      const targetTimestamp = isNaN(new Date(editSet.timestamp).getTime()) ? Date.now() : new Date(editSet.timestamp).getTime();
      
      await updateSetMutation({
        id: editSet._id,
        weight: weightVal,
        reps: repsVal,
        sets: setsVal,
        rir: rirVal,
        notes: editSet.notes || undefined,
        equipmentType: editSet.equipmentType,
        timestamp: targetTimestamp,
      });
      
      setEditSet(null);
      setSuccessMsg('Entry updated! 🔄');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update set.');
    }
  };

  const handleDelete = async () => {
    if (!editSet) return;
    try {
      await deleteSetMutation({ id: editSet._id });
      setEditSet(null);
      setSuccessMsg('Entry deleted! 🗑️');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete set.');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      {/* DESKTOP LAYOUT APPLIED HERE: maxWidth expanded to 900 */}
      <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 3, md: 5 }, pb: 10, maxWidth: { xs: 480, md: 900 }, mx: 'auto' }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
            Over Time
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Progress<br />
            <Box component="span" sx={{ color: '#00d4ff' }}>Charts 📈</Box>
          </Typography>
        </Box>

        {/* Exercise search */}
        <Box sx={{ mb: 3 }}>
          <TextField fullWidth size="small" placeholder="Search logged exercises..."
            inputRef={searchInputRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedExercise(null); setShowList(true); }}
            onFocus={() => setShowList(true)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch} edge="end">
                    <CloseIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          {showList && !selectedExercise && filteredExercises.length > 0 && (
            <Paper sx={{ mt: 0.5, borderRadius: 2, maxHeight: 220, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
              <List dense disablePadding>
                {filteredExercises.map((ex, i) => (
                  <React.Fragment key={ex._id}>
                    {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                    <ListItemButton onClick={() => handleSelectExercise(ex.name)}
                      sx={{ py: 0.75, bgcolor: selectedExercise === ex.name ? 'rgba(0,212,255,0.08)' : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                      <ListItemText
                        primary={ex.name}
                        secondary={ex.subcategory ?? ex.category}
                        primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
                        secondaryTypographyProps={{ fontSize: '0.7rem' }}
                      />
                    </ListItemButton>
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        {/* Dynamic Equipment Toggle & Quick Log Button */}
        {selectedExercise && (
          <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {availableEquipments.length > 1 && (
                <>
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Equipment Types Used
                  </Typography>
                  <ToggleButtonGroup
                    value={activeEquipment} exclusive
                    onChange={(_, v) => v && setEquipmentOverride(v)}
                    size="small"
                    sx={{ 
                      display: 'flex', flexWrap: 'wrap', gap: 1, 
                      '& .MuiToggleButtonGroup-grouped': { border: 0 },
                      '& .MuiToggleButton-root': {
                        fontWeight: 700, fontSize: '0.78rem', borderRadius: '10px !important',
                        border: '1px solid rgba(255,255,255,0.1) !important', px: 1.5, py: 0.75,
                        '&.Mui-selected': { bgcolor: 'rgba(0,212,255,0.15)', color: '#00d4ff', borderColor: 'rgba(0,212,255,0.4) !important' },
                      }
                    }}
                  >
                    {availableEquipments.map(eq => (
                      <ToggleButton key={eq} value={eq}>
                        {EQUIPMENT_EMOJIS[eq] ?? '⚡'} {eq}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </>
              )}
            </Box>
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleOpenNewLog}
              sx={{ fontWeight: 800, bgcolor: '#00d4ff', color: '#000', '&:hover': { bgcolor: '#00b8e6' }, borderRadius: 2, height: 36, whiteSpace: 'nowrap', flexShrink: 0 }}
              startIcon={<AddTaskIcon />}
            >
              Log Set
            </Button>
          </Box>
        )}

        {/* Stats dashboard */}
        {selectedExercise && chartData.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {!isBW ? (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5, mb: 1.5 }}>
                  {[
                    { label: 'e1RM', value: bestE1RM.toFixed(0), color: '#00d4ff', hi: true },
                    { label: 'e4RM', value: e4RM.toFixed(0), color: '#f0f0f0' },
                    { label: 'e8RM', value: e8RM.toFixed(0), color: '#f0f0f0' },
                  ].map(s => (
                    <Paper key={s.label} sx={{ p: 1.5, borderRadius: 3, textAlign: 'center',
                      bgcolor: s.hi ? 'rgba(0,212,255,0.05)' : undefined,
                      border: s.hi ? '1px solid rgba(0,212,255,0.1)' : undefined }}>
                      <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</Typography>
                    </Paper>
                  ))}
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1.5, mb: 1.5 }}>
                  <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Heaviest Lift</Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffb800' }}>{heaviestLift > 0 ? `${heaviestLift} ${unit}` : '—'}</Typography>
                  </Paper>
                  <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Best Volume</Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e096' }}>{bestVolume > 0 ? `${bestVolume} ${unit}` : '—'}</Typography>
                  </Paper>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1.5 }}>
                  <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Last Strength (4-8)</Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{lastStrength ? `${lastStrength} ${unit}` : '—'}</Typography>
                  </Paper>
                  <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Last Hyper (9-15)</Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{lastHyper ? `${lastHyper} ${unit}` : '—'}</Typography>
                  </Paper>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5 }}>
                {[
                  { label: 'Best Set', value: bestMaxReps, color: '#00d4ff', hi: true },
                  { label: 'Total Reps', value: bestTotalReps, color: '#00e096', hi: true },
                  { label: 'Most Sets', value: mostSets, color: '#ffb800' },
                ].map(s => (
                  <Paper key={s.label} sx={{ p: 1.5, borderRadius: 3, textAlign: 'center',
                    bgcolor: s.hi ? `${s.color}08` : undefined,
                    border: s.hi ? `1px solid ${s.color}22` : undefined }}>
                    <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: s.color }}>{s.value}</Typography>
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* SPLIT LAYOUT FOR DESKTOP: Chart on left, History on right */}
        {selectedExercise && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: { xs: 0, md: 4 }, alignItems: 'start' }}>
            
            {/* LEFT COLUMN: Chart */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                {currentMetricsList.map(m => (
                  <Chip key={m.value} label={m.label} onClick={() => setMetric(m.value)}
                    sx={{ cursor: 'pointer', fontWeight: 700,
                      bgcolor: metric === m.value ? `${m.color}22` : 'rgba(255,255,255,0.05)',
                      color: metric === m.value ? m.color : 'text.secondary',
                      border: metric === m.value ? `1px solid ${m.color}55` : '1px solid transparent' }} />
                ))}
              </Box>

              {chartData.length > 1 && (
                <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '0.82rem', color: 'text.secondary' }}>
                    {selectedMetric.label} Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={selectedMetric.color} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={selectedMetric.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: '#555566', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#555566', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip isBW={isBW} unit={unit} />} />
                      <Area type="monotone" dataKey={metric} name={metric}
                        stroke={selectedMetric.color} strokeWidth={2.5}
                        fill="url(#metricGrad)"
                        dot={{ fill: selectedMetric.color, r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              )}

              {chartData.length === 1 && (
                <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3 }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>📍</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                    One session logged — keep going to see your trend!
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* RIGHT COLUMN: History */}
            <Box>
              {chartData.length > 0 && (
                <>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
                    Session History (Tap to Edit)
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[...chartData].reverse().map((entry, i) => (
                      <Paper 
                        key={i} 
                        onClick={() => setEditSet(entry.rawSet)}
                        sx={{ px: 2, py: 1.5, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {entry.weight > 0 ? `${entry.weight} ${unit}` : 'Bodyweight'}
                            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                              {' '}× {entry.reps} reps × {entry.sets} sets
                            </Box>
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{entry.date}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          {isBW ? (
                            <>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#00d4ff' }}>{entry.totalReps}</Typography>
                              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Total Reps</Typography>
                            </>
                          ) : (
                            <>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#00d4ff' }}>
                                {entry.e1rm > 0 ? entry.e1rm.toFixed(0) : '—'}
                              </Typography>
                              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>e1RM</Typography>
                            </>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}

        {!selectedExercise && (
          <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3, bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🔍</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
              Search for a logged exercise above<br />to see your progress dashboard
            </Typography>
          </Paper>
        )}

        {/* LOG DIALOG */}
        <Dialog open={logModalOpen} onClose={() => setLogModalOpen(false)} PaperProps={{ sx: { bgcolor: '#16171a', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: 400 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography sx={{ fontWeight: 800, color: '#00d4ff' }}>Log Completed Set</Typography>
            <IconButton onClick={() => setLogModalOpen(false)} size="small" sx={{ color: '#8a8a9a' }}><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>{selectedExercise}</Typography>
            
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
                  <MenuItem value="Smith">Smith</MenuItem>
                  <MenuItem value="Machine/Cable">Machine/Cable</MenuItem>
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
            <Button fullWidth variant="contained" onClick={handleSaveNewLog} disabled={isSavingLog} sx={{ py: 1.5, borderRadius: 3, fontWeight: 800, background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)', color: '#000' }}>
              {isSavingLog ? <CircularProgress size={24} sx={{ color: '#000' }} /> : <><AddTaskIcon sx={{ mr: 1 }} /> Save Log</>}
            </Button>
          </DialogActions>
        </Dialog>

        {/* FULL EDIT DIALOG */}
        <Dialog open={!!editSet} onClose={() => setEditSet(null)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Edit Entry</Typography>
            <IconButton onClick={() => setEditSet(null)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            
            <DateTimePicker 
              label="Date & Time" 
              value={new Date(editSet?.timestamp || Date.now())} 
              onChange={(v) => v && setEditSet({...editSet, timestamp: v.getTime()})} 
              format="MMM d, yyyy '·' h:mm a" 
              slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mt: 1 } } }} 
            />

            <Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase' }}>Equipment</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {EQUIPMENT_TYPES.map(eq => (
                  <Chip 
                    key={eq.value} 
                    label={`${eq.emoji} ${eq.value}`} 
                    onClick={() => setEditSet({...editSet, equipmentType: eq.value})} 
                    sx={{ 
                      cursor: 'pointer', fontWeight: 700, 
                      bgcolor: editSet?.equipmentType === eq.value ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', 
                      color: editSet?.equipmentType === eq.value ? '#00d4ff' : 'text.secondary', 
                      border: editSet?.equipmentType === eq.value ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent' 
                    }} 
                  />
                ))}
              </Box>
            </Box>

            <TextField 
              label={editSet?.equipmentType === 'Dumbbell' ? `Weight Per Side (${unit})` : `Weight (${unit})`} 
              type="number" size="small" fullWidth 
              value={editSet?.weight ? toDisplay(editSet.weight) : ''} 
              onChange={e => setEditSet({...editSet, weight: toDB(parseFloat(e.target.value))})} 
            />
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField label="Reps" type="number" size="small" fullWidth value={editSet?.reps ?? ''} onChange={e => setEditSet({...editSet, reps: e.target.value})} />
              <TextField label="Sets" type="number" size="small" fullWidth value={editSet?.sets ?? ''} onChange={e => setEditSet({...editSet, sets: e.target.value})} />
              <TextField label="RIR" type="number" size="small" fullWidth value={editSet?.rir ?? ''} onChange={e => setEditSet({...editSet, rir: e.target.value})} />
            </Box>
            
            <TextField label="Notes" size="small" multiline rows={2} fullWidth value={editSet?.notes ?? ''} onChange={e => setEditSet({...editSet, notes: e.target.value})} />
          
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button color="error" onClick={handleDelete} sx={{ fontWeight: 700 }}>Delete</Button>
            <Button variant="contained" fullWidth onClick={handleUpdate} sx={{ fontWeight: 800 }}>Save Changes</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!successMsg} autoHideDuration={2000} onClose={() => setSuccessMsg('')}><Alert severity="success">{successMsg}</Alert></Snackbar>
        <Snackbar open={!!errorMsg} autoHideDuration={3000} onClose={() => setErrorMsg('')}><Alert severity="error">{errorMsg}</Alert></Snackbar>
      </Box>
    </LocalizationProvider>
  );
}