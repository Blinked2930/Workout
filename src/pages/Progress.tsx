// src/pages/Progress.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, InputAdornment,
  List, ListItemButton, ListItemText, Divider, Button, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';

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

// ── Tooltip ────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, viewMode }: any) {
  if (!active || !payload?.length) return null;
  const name = payload[0]?.name;
  const metricList = viewMode === 'bodyweight' ? BODYWEIGHT_METRICS : WEIGHTED_METRICS;
  const m = metricList.find(m => m.value === name);
  const showLbs = viewMode === 'weighted' && (name === 'e1rm' || name === 'weight' || name === 'volume');
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
  // 'weighted' | 'bodyweight' — null means auto-detect
  const [viewOverride, setViewOverride] = useState<'weighted' | 'bodyweight' | null>(null);

  useEffect(() => {
    if (selectedExercise) localStorage.setItem('progress_exercise', selectedExercise);
    else localStorage.removeItem('progress_exercise');
  }, [selectedExercise]);

  useEffect(() => {
    localStorage.setItem('progress_metric', metric);
  }, [metric]);

  const exercises = useQuery(api.exercises.getExercises, { category: '' });
  const allLifts   = useQuery(api.lifts.getLifts, {});

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

  // ── Detect view mode from actual data ──────────────────────────────────
  const { hasWeighted, hasBodyweight, isMixed } = useMemo(() => {
    const hasW = historyForSelected.some(l => l.weight > 0);
    const hasBW = historyForSelected.some(l => l.weight === 0);
    return { hasWeighted: hasW, hasBodyweight: hasBW, isMixed: hasW && hasBW };
  }, [historyForSelected]);

  // Resolve which mode to actually show
  const viewMode: 'weighted' | 'bodyweight' = useMemo(() => {
    if (isMixed && viewOverride) return viewOverride;
    if (hasWeighted) return 'weighted';
    return 'bodyweight';
  }, [hasWeighted, isMixed, viewOverride]);

  // Reset override when exercise changes
  useEffect(() => { setViewOverride(null); }, [selectedExercise]);

  // Auto-switch metric when mode changes
  useEffect(() => {
    if (viewMode === 'bodyweight' && !BODYWEIGHT_METRICS.find(m => m.value === metric)) {
      setMetric('reps');
    }
    if (viewMode === 'weighted' && !WEIGHTED_METRICS.find(m => m.value === metric)) {
      setMetric('e1rm');
    }
  }, [viewMode, metric]);

  // ── Chart data ─────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    // Filter sessions by current view mode
    const sessions = viewMode === 'weighted'
      ? (isMixed ? historyForSelected.filter(l => l.weight > 0) : historyForSelected)
      : (isMixed ? historyForSelected.filter(l => l.weight === 0) : historyForSelected);

    return sessions.map(l => ({
      date: format(new Date(l.timestamp), 'MMM d'),
      e1rm: +(l.e1rm ?? 0).toFixed(1),
      volume: l.volume,
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
      totalReps: l.reps * l.sets,
    }));
  }, [historyForSelected, viewMode, isMixed]);

  // ── Weighted stats ─────────────────────────────────────────────────────
  const bestE1RM    = chartData.length ? Math.max(...chartData.map(d => d.e1rm)) : 0;
  const heaviestLift = chartData.length ? Math.max(...chartData.map(d => d.weight)) : 0;
  const bestVolume  = chartData.length ? Math.max(...chartData.map(d => d.volume)) : 0;
  const e4RM = bestE1RM * (33 / 36);
  const e8RM = bestE1RM * (29 / 36);

  const strengthLifts = historyForSelected.filter(l => l.weight > 0 && l.reps >= 4 && l.reps <= 7).sort((a, b) => b.timestamp - a.timestamp);
  const hyperLifts    = historyForSelected.filter(l => l.weight > 0 && l.reps >= 8 && l.reps <= 15).sort((a, b) => b.timestamp - a.timestamp);
  const lastStrength  = strengthLifts[0]?.weight ?? null;
  const lastHyper     = hyperLifts[0]?.weight ?? null;

  // ── Bodyweight stats ───────────────────────────────────────────────────
  const bestMaxReps   = chartData.length ? Math.max(...chartData.map(d => d.reps)) : 0;
  const bestTotalReps = chartData.length ? Math.max(...chartData.map(d => d.totalReps)) : 0;
  const mostSets      = chartData.length ? Math.max(...chartData.map(d => d.sets)) : 0;

  const currentMetricsList = viewMode === 'bodyweight' ? BODYWEIGHT_METRICS : WEIGHTED_METRICS;
  const selectedMetric = currentMetricsList.find(m => m.value === metric) ?? currentMetricsList[0];

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSelectExercise = (name: string) => {
    setSelectedExercise(name);
    setSearch(name);
    setShowList(false);
  };

  const exportToCSV = () => {
    if (!allLifts?.length) return;
    const headers = ['Date', 'Time', 'Category', 'Subcategory', 'Exercise', 'Weight (lbs)', 'Reps', 'Sets', 'Volume', 'e1RM', 'Notes'];
    const rows = [...allLifts].sort((a, b) => a.timestamp - b.timestamp).map(l => {
      const d = new Date(l.timestamp);
      return [
        format(d, 'yyyy-MM-dd'), format(d, 'HH:mm:ss'),
        l.category ?? '', l.subcategory ?? '', `"${l.exerciseName}"`,
        l.weight, l.reps, l.sets, l.volume,
        l.e1rm ? l.e1rm.toFixed(1) : '', `"${l.notes ?? ''}"`,
      ].join(',');
    });
    const uri = 'data:text/csv;charset=utf-8,' + encodeURI([headers.join(','), ...rows].join('\n'));
    const a = document.createElement('a');
    a.href = uri;
    a.download = `LiftLog_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
            Over Time
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Progress<br />
            <Box component="span" sx={{ color: '#00d4ff' }}>Charts 📈</Box>
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={exportToCSV}
          sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', fontSize: '0.75rem', py: 0.5,
            '&:hover': { borderColor: '#00d4ff', color: '#00d4ff', bgcolor: 'rgba(0,212,255,0.05)' } }}>
          Export CSV 📥
        </Button>
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

      {/* Mixed data toggle */}
      {selectedExercise && isMixed && (
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            This exercise has both weighted & bodyweight sessions
          </Typography>
          <ToggleButtonGroup
            value={viewMode} exclusive
            onChange={(_, v) => v && setViewOverride(v)}
            size="small"
            sx={{ '& .MuiToggleButton-root': {
              fontWeight: 700, fontSize: '0.78rem', borderRadius: '10px !important',
              border: '1px solid rgba(255,255,255,0.1)', px: 2, py: 0.75,
              '&.Mui-selected': { bgcolor: 'rgba(0,212,255,0.15)', color: '#00d4ff', borderColor: 'rgba(0,212,255,0.4)' },
            }}}
          >
            <ToggleButton value="weighted">🏋️ Weighted</ToggleButton>
            <ToggleButton value="bodyweight">🤸 Bodyweight</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Stats dashboard */}
      {selectedExercise && chartData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {viewMode === 'weighted' ? (
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
            {isMixed && <Box component="span" sx={{ ml: 1, color: viewMode === 'weighted' ? '#ffb800' : '#00e096' }}>({viewMode})</Box>}
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
              <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
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

      {/* History list */}
      {selectedExercise && chartData.length > 0 && (
        <>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
            Session History
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...chartData].reverse().map((entry, i) => (
              <Paper key={i} sx={{ px: 2, py: 1.5, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  {viewMode === 'bodyweight' ? (
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
  );
}