// src/pages/Volume.tsx
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, IconButton,
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CloseIcon from '@mui/icons-material/Close';

// Maps exercise muscleWeights schema keys → weeklyGoals muscleGroup names
const SCHEMA_TO_GOAL: Record<string, string> = {
  chest:      'Chest',
  shoulders:  'Shoulders',
  triceps:    'Triceps - Isolation',
  back:       'Back',
  upperTraps: 'Upper Traps',
  biceps:     'Biceps - Isolation',
  glutes:     'Glute',
  quads:      'Quads',
  hamstrings: 'Hamstrings',
  calves:     'Calves',
  forearms:   'Forearms',
  neck:       'Neck',
  core:       'Core',
};

const MUSCLE_EMOJI: Record<string, string> = {
  Chest: '🫁', Shoulders: '🏔️', 'Triceps - Isolation': '💪',
  Back: '🔙', 'Upper Traps': '🦬', 'Biceps - Isolation': '🦾',
  Glute: '🍑', Quads: '🦵', Hamstrings: '🦿', Calves: '⬇️',
  Forearms: '🤜', Neck: '🦒', Core: '🎯',
};

const MUSCLE_SHORT: Record<string, string> = {
  'Triceps - Isolation': 'Triceps',
  'Biceps - Isolation': 'Biceps',
  'Upper Traps': 'U. Traps',
};

// Color thresholds for progress
function tileColor(sets: number, low: number, high: number): string {
  if (sets === 0)         return '#2a2a3a';
  if (sets < low * 0.5)   return '#ff4d6d'; // very low — red
  if (sets < low)         return '#ffb800'; // approaching min — amber
  if (sets <= high * 0.6) return '#00e096'; // lower half of range — green
  if (sets <= high)       return '#00d4ff'; // upper half of range — cyan
  return '#b06aff';                         // over max — achievement purple
}

function GoalEditDialog({ goal, open, onClose, onSave }: {
  goal: { muscleGroup: string; lowGoal: number; highGoal: number } | null;
  open: boolean; onClose: () => void;
  onSave: (low: number, high: number) => void;
}) {
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');

  React.useEffect(() => {
    if (goal) { setLow(goal.lowGoal.toString()); setHigh(goal.highGoal.toString()); }
  }, [goal]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 800 }}>
          {MUSCLE_EMOJI[goal?.muscleGroup ?? ''] ?? '💪'} {goal?.muscleGroup}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 2, pt: 1 }}>
        {/* Added mt: 1 to push the text fields down so the label isn't cut off */}
        <TextField sx={{ mt: 1 }} label="Min sets/week" type="number" size="small" fullWidth value={low} onChange={e => setLow(e.target.value)} inputProps={{ min: 0 }} />
        <TextField sx={{ mt: 1 }} label="Max sets/week" type="number" size="small" fullWidth value={high} onChange={e => setHigh(e.target.value)} inputProps={{ min: 0 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(parseInt(low), parseInt(high))} sx={{ flex: 1 }}>
          Save ✅
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MuscleTile({ muscle, sets, low, high, onEdit }: {
  muscle: string; sets: number; low: number; high: number; onEdit: () => void;
}) {
  const color = tileColor(sets, low, high);
  const fillPct = Math.min((sets / Math.max(high, 1)) * 100, 100);

  return (
    <Paper 
      onClick={onEdit}
      sx={{
        borderRadius: 3, position: 'relative', overflow: 'hidden',
        minHeight: 110, p: 1.5,
        border: `1px solid ${sets > 0 ? color + '55' : 'rgba(255,255,255,0.06)'}`,
        bgcolor: 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'transform 0.1s ease, border-color 0.3s ease',
        '&:active': { transform: 'scale(0.96)' }
      }}
    >
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${fillPct}%`,
        background: `linear-gradient(to top, ${color}35 0%, ${color}05 100%)`,
        transition: 'height 0.6s ease, background 0.4s ease',
        pointerEvents: 'none',
      }} />

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Typography sx={{ fontSize: '1.2rem', mb: 0.5, lineHeight: 1 }}>
          {MUSCLE_EMOJI[muscle] ?? '💪'}
        </Typography>

        <Typography sx={{
          fontSize: sets >= 10 ? '1.5rem' : '1.8rem',
          fontWeight: 800, color, lineHeight: 1, mb: 0.25,
        }}>
          {sets % 1 === 0 ? sets : sets.toFixed(1)}
        </Typography>

        <Typography sx={{ 
          fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', 
          lineHeight: 1.2, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' 
        }}>
          {MUSCLE_SHORT[muscle] ?? muscle}
        </Typography>

        <Typography sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.05em' }}>
          GOAL: {low}–{high}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function Volume() {
  const [editGoal, setEditGoal] = useState<{ muscleGroup: string; lowGoal: number; highGoal: number } | null>(null);

  const thisWeeksLifts = useQuery(api.lifts.getThisWeeksLifts);
  const weeklyGoals = useQuery(api.weeklyGoals.getWeeklyGoals);
  const allExercises = useQuery(api.exercises.getExercises, { category: '' });
  const updateGoal = useMutation(api.weeklyGoals.updateWeeklyGoal);

  const exerciseMuscleMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    allExercises?.forEach(ex => { map[ex.name] = (ex.muscleWeights as Record<string, number>) ?? {}; });
    return map;
  }, [allExercises]);

  const muscleSetMap = useMemo(() => {
    const map: Record<string, number> = {};
    thisWeeksLifts?.forEach(lift => {
      const weights = exerciseMuscleMap[lift.exerciseName] ?? {};
      Object.entries(weights).forEach(([schemaKey, w]) => {
        const goalKey = SCHEMA_TO_GOAL[schemaKey];
        if (goalKey && (w as number) > 0) {
          map[goalKey] = (map[goalKey] ?? 0) + lift.sets * (w as number);
        }
      });
    });
    return map;
  }, [thisWeeksLifts, exerciseMuscleMap]);

  const totalSets = thisWeeksLifts?.reduce((a, l) => a + l.sets, 0) ?? 0;
  const musclesHit = Object.values(muscleSetMap).filter(v => v > 0).length;
  const atGoal = weeklyGoals?.filter(g => (muscleSetMap[g.muscleGroup] ?? 0) >= g.lowGoal).length ?? 0;

  const handleSaveGoal = async (low: number, high: number) => {
    if (!editGoal) return;
    await updateGoal({ muscleGroup: editGoal.muscleGroup, lowGoal: low, highGoal: high });
    setEditGoal(null);
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
          This Week
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Volume<br />
          <Box component="span" sx={{ color: '#00d4ff' }}>Tracker 📊</Box>
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5, mb: 3 }}>
        {[
          { label: 'Total Sets', value: totalSets, color: '#00d4ff' },
          { label: 'Muscles Hit', value: musclesHit, color: '#00e096' },
          { label: 'At Goal', value: atGoal, color: '#ffb800' },
        ].map(s => (
          <Paper key={s.label} sx={{ px: 1.5, py: 1.5, borderRadius: 3, textAlign: 'center', minWidth: 0 }}>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5 }}>
        {weeklyGoals?.map(goal => (
          <MuscleTile
            key={goal.muscleGroup}
            muscle={goal.muscleGroup}
            sets={muscleSetMap[goal.muscleGroup] ?? 0}
            low={goal.lowGoal}
            high={goal.highGoal}
            onEdit={() => setEditGoal(goal)}
          />
        ))}
      </Box>

      <GoalEditDialog
        goal={editGoal} open={!!editGoal}
        onClose={() => setEditGoal(null)}
        onSave={handleSaveGoal}
      />
    </Box>
  );
}