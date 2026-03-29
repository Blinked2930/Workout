// src/pages/Progress.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, TextField, InputAdornment,
  List, ListItemButton, ListItemText, Divider,
} from '@mui/material';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';

const METRIC_OPTIONS = [
  { value: 'e1rm', label: 'Est. 1RM', color: '#00d4ff' },
  { value: 'volume', label: 'Volume', color: '#00e096' },
  { value: 'weight', label: 'Weight', color: '#ffb800' },
  { value: 'reps', label: 'Reps', color: '#ff6b35' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const m = METRIC_OPTIONS.find(m => m.value === payload[0]?.name);
  return (
    <Paper sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, color: m?.color ?? '#00d4ff', fontSize: '1rem' }}>
        {payload[0]?.value?.toFixed(1)}
        {payload[0]?.name === 'e1rm' || payload[0]?.name === 'weight' || payload[0]?.name === 'volume' ? ' lbs' : ''}
      </Typography>
    </Paper>
  );
}

export default function Progress() {
  // Pull initial state from localStorage for persistence
  const [selectedExercise, setSelectedExercise] = useState<string | null>(() => localStorage.getItem('progress_selectedExercise'));
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);
  const [metric, setMetric] = useState(() => localStorage.getItem('progress_metric') || 'e1rm');

  // Save to localStorage whenever they change
  useEffect(() => {
    if (selectedExercise) localStorage.setItem('progress_selectedExercise', selectedExercise);
    else localStorage.removeItem('progress_selectedExercise');
  }, [selectedExercise]);

  useEffect(() => {
    localStorage.setItem('progress_metric', metric);
  }, [metric]);

  const exercises = useQuery(api.exercises.getExercises, { category: '' });
  
  // Fetch ALL lifts to determine history, rather than just the selected one
  const allLifts = useQuery(api.lifts.getLifts, {});

  // Build a Set of exercise names that actually have logged history
  const exercisesWithHistory = useMemo(() => {
    if (!allLifts) return new Set<string>();
    return new Set(allLifts.map(l => l.exerciseName));
  }, [allLifts]);

  // Filter exercises: Must have history AND match search
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const historyOnly = exercises.filter(e => exercisesWithHistory.has(e.name));
    
    if (!search) return historyOnly.slice(0, 30);
    return historyOnly.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 25);
  }, [exercises, search, exercisesWithHistory]);

  const historyForSelected = useMemo(() => {
    if (!allLifts || !selectedExercise) return [];
    return allLifts.filter(l => l.exerciseName === selectedExercise).sort((a, b) => a.timestamp - b.timestamp);
  }, [allLifts, selectedExercise]);

  const chartData = useMemo(() => {
    return historyForSelected.map(l => ({
      date: format(new Date(l.timestamp), 'MMM d'),
      e1rm: +(l.e1rm ?? 0).toFixed(1),
      volume: l.volume,
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
    }));
  }, [historyForSelected]);

  // --- Advanced Calculations ---
  const bestE1RM = chartData.length ? Math.max(...chartData.map(d => d.e1rm)) : 0;
  const heaviestLift = chartData.length ? Math.max(...chartData.map(d => d.weight)) : 0;
  const bestVolume = chartData.length ? Math.max(...chartData.map(d => d.volume)) : 0;

  // Brzycki formula approximations for e4RM and e8RM based on best e1RM
  const e4RM = bestE1RM * (33 / 36);
  const e8RM = bestE1RM * (29 / 36);

  // Last Strength (4-7 reps)
  const strengthLifts = historyForSelected.filter(l => l.reps >= 4 && l.reps <= 7).sort((a, b) => b.timestamp - a.timestamp);
  const lastStrength = strengthLifts.length > 0 ? strengthLifts[0].weight : null;

  // Last Hyper (8-15 reps)
  const hyperLifts = historyForSelected.filter(l => l.reps >= 8 && l.reps <= 15).sort((a, b) => b.timestamp - a.timestamp);
  const lastHyper = hyperLifts.length > 0 ? hyperLifts[0].weight : null;

  const selectedMetric = METRIC_OPTIONS.find(m => m.value === metric)!;

  const handleSelectExercise = (name: string) => {
    setSelectedExercise(name);
    setSearch(name); // Optional: clear search or keep it as the name
    setShowList(false);
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
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
        <TextField
          fullWidth size="small"
          placeholder="Search logged exercises..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setShowList(true);
          }}
          onFocus={() => setShowList(true)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: selectedExercise ? (
              <InputAdornment position="end">
                <Typography sx={{ fontSize: '0.75rem', color: '#00e096', fontWeight: 700 }}>✓</Typography>
              </InputAdornment>
            ) : null,
          }}
        />
        {showList && filteredExercises.length > 0 && (
          <Paper sx={{ mt: 0.5, borderRadius: 2, maxHeight: 220, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <List dense disablePadding>
              {filteredExercises.map((ex, i) => (
                <React.Fragment key={ex._id}>
                  {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                  <ListItemButton
                    onClick={() => handleSelectExercise(ex.name)}
                    sx={{
                      py: 0.75,
                      bgcolor: selectedExercise === ex.name ? 'rgba(0,212,255,0.08)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    }}
                  >
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

      {/* Data Dashboard */}
      {selectedExercise && chartData.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {/* Target Rep Maxes Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 1.5 }}>
            <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center', bgcolor: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#00d4ff' }}>{bestE1RM.toFixed(0)}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>e1RM</Typography>
            </Paper>
            <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800 }}>{e4RM.toFixed(0)}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>e4RM</Typography>
            </Paper>
            <Paper sx={{ p: 1.5, borderRadius: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800 }}>{e8RM.toFixed(0)}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>e8RM</Typography>
            </Paper>
          </Box>

          {/* Historical Records Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 1.5 }}>
            <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Heaviest Lift</Typography>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffb800' }}>{heaviestLift > 0 ? `${heaviestLift} lbs` : '—'}</Typography>
            </Paper>
            <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Best Volume</Typography>
              <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#00e096' }}>{bestVolume > 0 ? `${bestVolume} lbs` : '—'}</Typography>
            </Paper>
          </Box>

          {/* Recent Training Zones Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
            <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Last Strength (4-7)</Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{lastStrength ? `${lastStrength} lbs` : '—'}</Typography>
            </Paper>
            <Paper sx={{ p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', mb: 0.25 }}>Last Hyper (8-15)</Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>{lastHyper ? `${lastHyper} lbs` : '—'}</Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Metric selector */}
      {selectedExercise && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
          {METRIC_OPTIONS.map(m => (
            <Chip
              key={m.value} label={m.label}
              onClick={() => setMetric(m.value)}
              sx={{
                cursor: 'pointer', fontWeight: 700,
                bgcolor: metric === m.value ? `${m.color}22` : 'rgba(255,255,255,0.05)',
                color: metric === m.value ? m.color : 'text.secondary',
                border: metric === m.value ? `1px solid ${m.color}55` : '1px solid transparent',
              }}
            />
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
                  <stop offset="5%" stopColor={selectedMetric.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={selectedMetric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#555566', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555566', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey={metric} name={metric}
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
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3, bgcolor: 'rgba(255,255,255,0.02)' }}>
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
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#00d4ff' }}>
                    {entry.e1rm > 0 ? entry.e1rm.toFixed(0) : '—'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>e1RM</Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}