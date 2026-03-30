// src/pages/Progress.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, InputAdornment,
  List, ListItemButton, ListItemText, Divider, Button, ToggleButton, ToggleButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Snackbar, Alert
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
  { value: 'Kettlebell', emoji: '💣' },
  { value: 'Machine/Cable', emoji: '⚙️' },
  { value: 'Bodyweight', emoji: '🤸' },
  { value: 'Other', emoji: '⚡' },
];

const EQUIPMENT_EMOJIS: Record<string, string> = EQUIPMENT_TYPES.reduce((acc, curr) => {
  acc[curr.value] = curr.emoji;
  return acc;
}, {} as Record<string, string>);

// ── Tooltip ────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, isBW }: any) {
  if (!active || !payload?.length) return null;
  const name = payload[0]?.name;
  const metricList = isBW ? BODYWEIGHT_METRICS : WEIGHTED_METRICS;
  const m = metricList.find(m => m.value === name);
  const showLbs = !isBW && (name === 'e1rm' || name === 'weight' || name === 'volume');
  return (
    <Paper sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, color: m?.color ?? '#00d4ff', fontSize: '1rem' }}>
        {payload[0]?.value?.toFixed(showLbs ? 1 : 0)}{showLbs ? ' lbs' : ''}
      </Typography>
    </Paper>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Progress() {
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
  const [successMsg, setSuccessMsg] = useState('');

  const exercises = useQuery(api.exercises.getExercises, { category: '' });
  const allLifts = useQuery(api.lifts.getLifts, {});
  const updateSetMutation = useMutation(api.lifts.updateSet);
  const deleteSetMutation = useMutation(api.lifts.deleteSet);

  useEffect(() => {
    if (selectedExercise) localStorage.setItem('progress_exercise', selectedExercise);
    else localStorage.removeItem('progress_exercise');
  }, [selectedExercise]);

  useEffect(() => {
    localStorage.setItem('progress_metric', metric);
  }, [metric]);

  // Only show exercises that have history
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

  // All logged sessions for selected exercise
  const historyForSelected = useMemo(() => {
    if (!allLifts || !selectedExercise) return [];
    return allLifts
      .filter(l => l.exerciseName === selectedExercise)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [allLifts, selectedExercise]);

  // ── Auto-Detect Equipment Types ─────────────────────────────────────────
  const availableEquipments = useMemo(() => {
    const types = new Set(historyForSelected.map(l => l.equipmentType || (l.weight > 0 ? 'Barbell' : 'Bodyweight')));
    return Array.from(types).sort();
  }, [historyForSelected]);

  const activeEquipment = useMemo(() => {
    if (equipmentOverride && availableEquipments.includes(equipmentOverride)) return equipmentOverride;
    return availableEquipments.includes('Barbell') ? 'Barbell' : (availableEquipments[0] || 'Barbell');
  }, [availableEquipments, equipmentOverride]);

  const isBW = activeEquipment === 'Bodyweight';

  // Reset override when exercise changes
  useEffect(() => { setEquipmentOverride(null); }, [selectedExercise]);

  // Auto-switch metric when equipment mode changes
  useEffect(() => {
    if (isBW && !BODYWEIGHT_METRICS.find(m => m.value === metric)) setMetric('reps');
    if (!isBW && !WEIGHTED_METRICS.find(m => m.value === metric)) setMetric('e1rm');
  }, [isBW, metric]);

  // ── Chart data ─────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const sessions = historyForSelected.filter(l => {
      const eq = l.equipmentType || (l.weight > 0 ? 'Barbell' : 'Bodyweight');
      return eq === activeEquipment;
    });

    return sessions.map(l => ({
      date: format(new Date(l.timestamp), 'MMM d'),
      e1rm: +(l.e1rm ?? 0).toFixed(1),
      volume: l.volume,
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
      totalReps: l.reps * l.sets,
      rawSet: l, 
    }));
  }, [historyForSelected, activeEquipment]);

  // ── Weighted stats ─────────────────────────────────────────────────────
  const bestE1RM = chartData.length ? Math.max(...chartData.map(d => d.e1rm)) : 0;
  const heaviestLift = chartData.length ? Math.max(...chartData.map(d => d.weight)) : 0;
  const bestVolume = chartData.length ? Math.max(...chartData.map(d => d.volume)) : 0;
  const e4RM = bestE1RM * (33 / 36);
  const e8RM = bestE1RM * (29 / 36);

  const strengthLifts = chartData.filter(d => d.weight > 0 && d.reps >= 4 && d.reps <= 7).reverse();
  const hyperLifts = chartData.filter(d => d.weight > 0 && d.reps >= 8 && d.reps <= 15).reverse();
  const lastStrength = strengthLifts[0]?.weight ?? null;
  const lastHyper = hyperLifts[0]?.weight ?? null;

  // ── Bodyweight stats ───────────────────────────────────────────────────
  const bestMaxReps = chartData.length ? Math.max(...chartData.map(d => d.reps)) : 0;
  const bestTotalReps = chartData.length ? Math.max(...chartData.map(d => d.totalReps)) : 0;
  const mostSets = chartData.length ? Math.max(...chartData.map(d => d.sets)) : 0;

  const currentMetricsList = isBW ? BODYWEIGHT_METRICS : WEIGHTED_METRICS;
  const selectedMetric = currentMetricsList.find(m => m.value === metric) ?? currentMetricsList[0];

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSelectExercise = (name: string) => {
    setSelectedExercise(name);
    setSearch(name);
    setShowList(false);
  };

  const handleUpdate = async () => {
    if (!editSet) return;
    const weightVal = parseFloat(editSet.weight) || 0;
    const repsVal = parseInt(editSet.reps) || 0;
    const setsVal = parseInt(editSet.sets) || 1;
    const rirVal = editSet.rir !== '' && editSet.rir !== null && editSet.rir !== undefined ? parseInt(editSet.rir) : undefined;
    
    await updateSetMutation({
      id: editSet._id,
      weight: weightVal,
      reps: repsVal,
      sets: setsVal,
      rir: rirVal,
      notes: editSet.notes || undefined,
      equipmentType: editSet.equipmentType,
      timestamp: editSet.timestamp,
    });
    
    setEditSet(null);
    setSuccessMsg('Entry updated! 🔄');
  };

  const handleDelete = async () => {
    if (!editSet) return;
    await deleteSetMutation({ id: editSet._id });
    setEditSet(null);
    setSuccessMsg('Entry deleted! 🗑️');
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
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
          value={search}
          onChange={e => { setSearch(e.target.value); setSelectedExercise(null); setShowList(true); }}
          onFocus={() => setShowList(true)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} /></InputAdornment>,
            endAdornment: selectedExercise ? <InputAdornment position="end"><Typography sx={{ fontSize: '0.75rem', color: '#00e096', fontWeight: 700 }}>✓</Typography></InputAdornment> : null,
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

      {/* Dynamic Equipment Toggle */}
      {selectedExercise && availableEquipments.length > 1 && (
        <Box sx={{ mb: 2.5 }}>
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
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffb800' }}>{heaviestLift > 0 ? `${heaviestLift} lbs` : '—'}</Typography>
                </Paper>
                <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Best Volume</Typography>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e096' }}>{bestVolume > 0 ? `${bestVolume} lbs` : '—'}</Typography>
                </Paper>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1.5 }}>
                <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Last Strength (4–7)</Typography>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{lastStrength ? `${lastStrength} lbs` : '—'}</Typography>
                </Paper>
                <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Last Hyper (8–15)</Typography>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{lastHyper ? `${lastHyper} lbs` : '—'}</Typography>
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

      {/* Metric selector */}
      {selectedExercise && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
          {currentMetricsList.map(m => (
            <Chip key={m.value} label={m.label} onClick={() => setMetric(m.value)}
              sx={{ cursor: 'pointer', fontWeight: 700,
                bgcolor: metric === m.value ? `${m.color}22` : 'rgba(255,255,255,0.05)',
                color: metric === m.value ? m.color : 'text.secondary',
                border: metric === m.value ? `1px solid ${m.color}55` : '1px solid transparent' }} />
          ))}
        </Box>
      )}

      {/* Chart */}
      {selectedExercise && chartData.length > 1 && (
        <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '0.82rem', color: 'text.secondary' }}>
            {selectedMetric.label} Trend
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
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
              <Tooltip content={<CustomTooltip isBW={isBW} />} />
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

      {selectedExercise && chartData.length === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3 }}>
          <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>📍</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            One session logged — keep going to see your trend!
          </Typography>
        </Paper>
      )}

      {!selectedExercise && (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3, bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🔍</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Search for a logged exercise above<br />to see your progress dashboard
          </Typography>
        </Paper>
      )}

      {/* History list with Edit feature */}
      {selectedExercise && chartData.length > 0 && (
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
                    {entry.weight > 0 ? `${entry.weight} lbs` : 'Bodyweight'}
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

      {/* Full Edit Dialog */}
      <Dialog open={!!editSet} onClose={() => setEditSet(null)} fullWidth maxWidth="sm">
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
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
              label={editSet?.equipmentType === 'Dumbbell' ? "Weight Per Side (lbs)" : "Weight (lbs)"} 
              type="number" size="small" fullWidth 
              value={editSet?.weight ?? ''} 
              onChange={e => setEditSet({...editSet, weight: e.target.value})} 
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
        </LocalizationProvider>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={2000} onClose={() => setSuccessMsg('')}>
        <Alert severity="success" sx={{ borderRadius: 2, fontWeight: 700 }}>{successMsg}</Alert>
      </Snackbar>

    </Box>
  );
}