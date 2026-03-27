// src/pages/Volume.tsx
import React from 'react';
import { Box, Typography, Paper, LinearProgress, Chip } from '@mui/material';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const MUSCLE_EMOJI: Record<string, string> = {
  Chest: '🫁', Shoulders: '🏔️', 'Triceps - Isolation': '💪',
  Back: '🔙', 'Upper Traps': '🦬', 'Biceps - Isolation': '💪',
  Glute: '🍑', Quads: '🦵', Hamstrings: '🦿', Calves: '🦵',
  Forearms: '🦾', Neck: '🦒', Core: '🎯',
};

const MUSCLE_COLOR: Record<string, string> = {
  Chest: '#ff6b35', Shoulders: '#ffb800', 'Triceps - Isolation': '#ff4d6d',
  Back: '#00d4ff', 'Upper Traps': '#0099cc', 'Biceps - Isolation': '#00aaff',
  Glute: '#b06aff', Quads: '#00e096', Hamstrings: '#00c97a', Calves: '#00a860',
  Forearms: '#ff9500', Neck: '#ff6b6b', Core: '#ffcc00',
};

// ExerciseDB muscle weight mapping (from spreadsheet)
const EXERCISE_MUSCLE_MAP: Record<string, Record<string, number>> = {
  'Bench press': { Chest: 1, Shoulders: 0.5 },
  'Overhead press': { Shoulders: 1 },
  'Push-Ups': { Chest: 1, Shoulders: 0.5, Core: 0.5 },
  'Tricep pushdowns': { 'Triceps - Isolation': 1 },
  'Wide grip pull down': { Back: 1, 'Biceps - Isolation': 0.5 },
  'DB row': { Back: 1 },
  'Z bar curl': { 'Biceps - Isolation': 1 },
  'Inclined curls': { 'Biceps - Isolation': 1 },
  'Leg extensions': { Quads: 1 },
  'Leg press': { Quads: 1, Hamstrings: 0.5 },
  'Seated leg curls': { Hamstrings: 1 },
  'Laying Leg curls': { Hamstrings: 1 },
  'Barbell RDL': { Hamstrings: 1, Glute: 0.5 },
  'Seated toe raises': { Calves: 1 },
  'Cable crunch': { Core: 1 },
  'Barbell Glute bridges': { Glute: 1, Hamstrings: 0.5 },
  'Barbell Hip Thrust': { Glute: 1 },
};

function getMuscleContributions(exerciseName: string, muscleWeights?: Record<string, number>) {
  if (muscleWeights && Object.keys(muscleWeights).length > 0) return muscleWeights;
  return EXERCISE_MUSCLE_MAP[exerciseName] ?? {};
}

function VolumeBar({ muscle, sets, low, high, color }: {
  muscle: string; sets: number; low: number; high: number; color: string;
}) {
  const pct = Math.min((sets / high) * 100, 100);
  const lowPct = (low / high) * 100;
  const status = sets === 0 ? 'none' : sets < low ? 'low' : sets <= high ? 'good' : 'over';
  const statusColors = { none: '#555566', low: '#ffb800', good: '#00e096', over: '#00d4ff' };

  return (
    <Paper sx={{ p: 2, borderRadius: 3, mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1.1rem' }}>{MUSCLE_EMOJI[muscle] ?? '💪'}</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{muscle}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color }}>
            {sets.toFixed(1)}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            / {low}–{high}
          </Typography>
          <Chip
            label={status === 'none' ? 'Start' : status === 'low' ? 'Low' : status === 'good' ? '✓ Good' : '🔥 Max'}
            size="small"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 700,
              height: 20,
              bgcolor: `${statusColors[status]}22`,
              color: statusColors[status],
              border: `1px solid ${statusColors[status]}44`,
            }}
          />
        </Box>
      </Box>
      <Box sx={{ position: 'relative' }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.06)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: pct >= 100
                ? `linear-gradient(90deg, ${color}, #00d4ff)`
                : color,
            },
          }}
        />
        {/* Low goal marker */}
        <Box sx={{
          position: 'absolute',
          left: `${lowPct}%`,
          top: -2,
          width: 2,
          height: 12,
          bgcolor: 'rgba(255,255,255,0.2)',
          borderRadius: 1,
          transform: 'translateX(-50%)',
        }} />
      </Box>
      {sets < low && sets > 0 && (
        <Typography sx={{ fontSize: '0.7rem', color: '#ffb800', mt: 0.5 }}>
          {(low - sets).toFixed(1)} more sets to minimum
        </Typography>
      )}
    </Paper>
  );
}

export default function Volume() {
  const thisWeeksLifts = useQuery(api.lifts.getThisWeeksLifts);
  const weeklyGoals = useQuery(api.weeklyGoals.getWeeklyGoals);

  // Calculate sets per muscle group from this week's lifts
  const muscleSetMap: Record<string, number> = {};

  thisWeeksLifts?.forEach(lift => {
    const contributions = getMuscleContributions(lift.exerciseName, {});
    Object.entries(contributions).forEach(([muscle, weight]) => {
      muscleSetMap[muscle] = (muscleSetMap[muscle] ?? 0) + (lift.sets * weight);
    });
  });

  const totalSetsThisWeek = thisWeeksLifts?.reduce((a, l) => a + l.sets, 0) ?? 0;
  const musclesHit = Object.values(muscleSetMap).filter(v => v > 0).length;

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff',
          textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5,
        }}>
          This Week
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Volume<br />
          <Box component="span" sx={{ color: '#00d4ff' }}>Tracker 📊</Box>
        </Typography>
      </Box>

      {/* Summary pills */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <Paper sx={{ px: 2, py: 1.5, borderRadius: 3, flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#00d4ff' }}>
            {totalSetsThisWeek}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 700 }}>
            TOTAL SETS
          </Typography>
        </Paper>
        <Paper sx={{ px: 2, py: 1.5, borderRadius: 3, flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#00e096' }}>
            {musclesHit}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 700 }}>
            MUSCLES HIT
          </Typography>
        </Paper>
        <Paper sx={{ px: 2, py: 1.5, borderRadius: 3, flex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffb800' }}>
            {weeklyGoals?.filter(g => (muscleSetMap[g.muscleGroup] ?? 0) >= g.lowGoal).length ?? 0}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 700 }}>
            AT GOAL
          </Typography>
        </Paper>
      </Box>

      {/* Muscle bars */}
      {weeklyGoals ? (
        weeklyGoals.map(goal => (
          <VolumeBar
            key={goal.muscleGroup}
            muscle={goal.muscleGroup}
            sets={muscleSetMap[goal.muscleGroup] ?? 0}
            low={goal.lowGoal}
            high={goal.highGoal}
            color={MUSCLE_COLOR[goal.muscleGroup] ?? '#00d4ff'}
          />
        ))
      ) : (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center', mt: 4 }}>
          Loading goals...
        </Typography>
      )}
    </Box>
  );
}