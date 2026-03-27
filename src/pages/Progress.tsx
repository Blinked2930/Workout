// src/pages/Progress.tsx
import React, { useState } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Select,
  FormControl, Chip, Autocomplete,
} from '@mui/material';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { format } from 'date-fns';

const METRIC_OPTIONS = [
  { value: 'e1rm', label: 'Est. 1RM', color: '#00d4ff' },
  { value: 'volume', label: 'Volume', color: '#00e096' },
  { value: 'weight', label: 'Weight', color: '#ffb800' },
  { value: 'reps', label: 'Reps', color: '#ff6b35' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ px: 2, py: 1.5, borderRadius: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
      {payload.map((p: any) => (
        <Typography key={p.name} sx={{ fontWeight: 800, color: p.color, fontSize: '1rem' }}>
          {p.value?.toFixed(1)} {p.name === 'volume' ? 'lbs' : p.name === 'e1rm' ? 'lbs' : ''}
        </Typography>
      ))}
    </Paper>
  );
}

export default function Progress() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [metric, setMetric] = useState('e1rm');

  const exercises = useQuery(api.exercises.getExercises, { category: '' });
  const lifts = useQuery(api.lifts.getLifts,
    selectedExercise ? { exerciseName: selectedExercise } : { exerciseName: undefined }
  );

  const exerciseNames = exercises?.map(e => e.name) ?? [];

  // Build chart data
  const chartData = lifts
    ?.filter(l => !selectedExercise || l.exerciseName === selectedExercise)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(l => ({
      date: format(new Date(l.timestamp), 'MMM d'),
      e1rm: l.e1rm ?? 0,
      volume: l.volume,
      weight: l.weight,
      reps: l.reps,
      sets: l.sets,
      exerciseName: l.exerciseName,
    })) ?? [];

  // Best stats for selected exercise
  const bestE1RM = Math.max(...(chartData.map(d => d.e1rm).filter(Boolean)), 0);
  const bestVolume = Math.max(...(chartData.map(d => d.volume)), 0);
  const bestWeight = Math.max(...(chartData.map(d => d.weight)), 0);
  const totalSets = chartData.reduce((a, d) => a + d.sets, 0);

  const selectedMetric = METRIC_OPTIONS.find(m => m.value === metric)!;

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff',
          textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5,
        }}>
          Over Time
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Progress<br />
          <Box component="span" sx={{ color: '#00d4ff' }}>Charts 📈</Box>
        </Typography>
      </Box>

      {/* Exercise picker */}
      <Autocomplete
        options={exerciseNames}
        value={selectedExercise}
        onChange={(_, v) => setSelectedExercise(v)}
        renderInput={(params) => (
          <TextField {...params} placeholder="Search exercise..." size="small" sx={{ mb: 2 }} />
        )}
        sx={{ mb: 2 }}
      />

      {/* Metric selector */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        {METRIC_OPTIONS.map(m => (
          <Chip
            key={m.value}
            label={m.label}
            onClick={() => setMetric(m.value)}
            sx={{
              cursor: 'pointer',
              fontWeight: 700,
              bgcolor: metric === m.value ? `${m.color}22` : 'rgba(255,255,255,0.05)',
              color: metric === m.value ? m.color : 'text.secondary',
              border: metric === m.value ? `1px solid ${m.color}55` : '1px solid transparent',
            }}
          />
        ))}
      </Box>

      {/* Stats row */}
      {selectedExercise && chartData.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          {[
            { label: 'Best 1RM', value: bestE1RM.toFixed(0), unit: 'lbs', color: '#00d4ff' },
            { label: 'Best Wt', value: bestWeight.toFixed(0), unit: 'lbs', color: '#ffb800' },
            { label: 'Sets Total', value: totalSets, color: '#00e096' },
          ].map(stat => (
            <Paper key={stat.label} sx={{ p: 1.5, borderRadius: 3, flex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: stat.color }}>
                {stat.value}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700 }}>
                {stat.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Chart */}
      {chartData.length > 1 ? (
        <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '0.85rem', color: 'text.secondary' }}>
            {selectedMetric.label} over time
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedMetric.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={selectedMetric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#555566', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#555566', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={selectedMetric.color}
                strokeWidth={2.5}
                fill="url(#colorMetric)"
                dot={{ fill: selectedMetric.color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      ) : selectedExercise && chartData.length === 1 ? (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3 }}>
          <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>📍</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Only one session logged — keep going to see your trend!
          </Typography>
        </Paper>
      ) : !selectedExercise ? (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', mb: 3, bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🔍</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Search for an exercise above<br />to see your progress chart
          </Typography>
        </Paper>
      ) : null}

      {/* Recent history */}
      {selectedExercise && chartData.length > 0 && (
        <>
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
            textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5,
          }}>
            History
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...chartData].reverse().slice(0, 10).map((entry, i) => (
              <Paper key={i} sx={{ px: 2, py: 1.5, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {entry.weight > 0 ? `${entry.weight} lbs` : 'Bodyweight'}
                    {entry.weight > 0 && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> × {entry.reps} reps × {entry.sets} sets</Box>}
                    {entry.weight === 0 && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> × {entry.reps} reps × {entry.sets} sets</Box>}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {entry.date}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#00d4ff' }}>
                    {entry.e1rm?.toFixed(0) ?? '—'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                    e1RM
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}