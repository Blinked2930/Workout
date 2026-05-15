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
  chest:      'chest',
  shoulders:  'shoulders',
  triceps:    'triceps',
  back:       'back',
  upperTraps: 'upperTraps',
  biceps:     'biceps',
  glutes:     'glutes',
  quads:      'quads',
  hamstrings: 'hamstrings',
  calves:     'calves',
  forearms:   'forearms',
  neck:       'neck',
  core:       'core',
};

const MUSCLE_EMOJI: Record<string, string> = {
  chest: '🫁', shoulders: '🏔️', triceps: '💪',
  back: '🔙', upperTraps: '🦬', biceps: '🦾',
  glutes: '🍑', quads: '🦵', hamstrings: '🦿', calves: '⬇️',
  forearms: '🤜', neck: '🦒', core: '🎯',
};

// UI mapping to show properly capitalized strings
const MUSCLE_SHORT: Record<string, string> = {
  chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps',
  back: 'Back', upperTraps: 'U. Traps', biceps: 'Biceps',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
  forearms: 'Forearms', neck: 'Neck', core: 'Core',
};

// Groups muscles into broader categories for cleaner layout
const MUSCLE_CATEGORY: Record<string, 'Push' | 'Pull' | 'Legs' | 'Extra'> = {
  chest: 'Push',
  shoulders: 'Push',
  triceps: 'Push',
  back: 'Pull',
  upperTraps: 'Pull',
  biceps: 'Pull',
  quads: 'Legs',
  hamstrings: 'Legs',
  glutes: 'Legs',
  calves: 'Legs',
  core: 'Extra',
  forearms: 'Extra',
  neck: 'Extra',
};

const CATEGORY_ORDER = ['Push', 'Pull', 'Legs', 'Extra'];

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
          {MUSCLE_EMOJI[goal?.muscleGroup ?? ''] ?? '💪'} {MUSCLE_SHORT[goal?.muscleGroup ?? ''] ?? goal?.muscleGroup}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', gap: 2, pt: 1 }}>
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
  const isZero = sets === 0;
  const isUnder = sets > 0 && sets < low;
  const isOptimal = sets >= low && sets <= high;
  const isOver = sets > high;

  let color = '#2a2a3a'; // Base empty
  let textColor = '#555566'; 
  let borderColor = 'rgba(255,255,255,0.06)';
  let bgColor = 'rgba(255,255,255,0.02)';

  if (isUnder) {
    color = '#8a8a9a'; 
    textColor = '#8a8a9a';
    borderColor = 'rgba(138, 138, 154, 0.2)';
  } else if (isOptimal) {
    color = '#00d4ff';
    textColor = '#00d4ff';
    borderColor = 'rgba(0, 212, 255, 0.4)';
  } else if (isOver) {
    color = '#b06aff'; // Achievement purple
    textColor = '#b06aff';
    borderColor = 'rgba(176, 106, 255, 0.6)';
    bgColor = 'rgba(176, 106, 255, 0.05)';
  }

  const fillPct = Math.min((sets / Math.max(high, 1)) * 100, 100);

  return (
    <Paper 
      onClick={onEdit}
      sx={{
        borderRadius: 3, position: 'relative', overflow: 'hidden',
        minHeight: 110, p: 1.5,
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        transition: 'transform 0.1s ease, border-color 0.3s ease',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        '&:active': { transform: 'scale(0.96)' }
      }}
    >
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: `${fillPct}%`,
        background: isZero ? 'transparent' : `linear-gradient(to top, ${color}35 0%, ${color}05 100%)`,
        transition: 'height 0.6s ease, background 0.4s ease',
        pointerEvents: 'none',
      }} />

      {/* OVER GOAL BADGE */}
      {isOver && (
        <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
          <Typography sx={{ 
            fontSize: '0.5rem', fontWeight: 800, color: '#b06aff', 
            bgcolor: 'rgba(176, 106, 255, 0.15)', px: 0.6, py: 0.2, 
            borderRadius: 1, letterSpacing: '0.05em' 
          }}>
            MAX
          </Typography>
        </Box>
      )}

      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <Typography sx={{ fontSize: '1.2rem', mb: 0.5, lineHeight: 1 }}>
          {MUSCLE_EMOJI[muscle] ?? '💪'}
        </Typography>

        <Typography sx={{
          fontSize: sets >= 10 ? '1.5rem' : '1.8rem',
          fontWeight: 800, color: textColor, lineHeight: 1, mb: 0.25,
          transition: 'color 0.3s ease'
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

  // Group goals by category (Push, Pull, Legs, Extra)
  const groupedGoals = useMemo(() => {
    if (!weeklyGoals) return {};
    const groups: Record<string, typeof weeklyGoals> = {
      Push: [], Pull: [], Legs: [], Extra: []
    };
    weeklyGoals.forEach(g => {
      const cat = MUSCLE_CATEGORY[g.muscleGroup] || 'Extra';
      if (groups[cat]) groups[cat].push(g);
    });
    return groups;
  }, [weeklyGoals]);

  const totalSets = thisWeeksLifts?.reduce((a, l) => a + l.sets, 0) ?? 0;
  const musclesHit = Object.values(muscleSetMap).filter(v => v > 0).length;
  
  const atGoal = weeklyGoals?.filter(g => {
    const setsDone = muscleSetMap[g.muscleGroup] ?? 0;
    return setsDone > 0 && setsDone >= g.lowGoal;
  }).length ?? 0;

  const handleSaveGoal = async (low: number, high: number) => {
    if (!editGoal) return;
    await updateGoal({ muscleGroup: editGoal.muscleGroup, lowGoal: low, highGoal: high });
    setEditGoal(null);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 3, md: 5 }, pb: 2, maxWidth: { xs: 480, md: 900 }, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
          This Week
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Volume<br />
          <Box component="span" sx={{ color: '#00d4ff' }}>Tracker 📊</Box>
        </Typography>
      </Box>

      {/* Top Stats - Responsive sizing */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: { xs: 1.5, md: 3 }, mb: { xs: 4, md: 5 } }}>
        {[
          { label: 'Total Sets', value: totalSets, color: '#00d4ff' },
          { label: 'Muscles Hit', value: musclesHit, color: '#00e096' },
          { label: 'At Goal', value: atGoal, color: '#ffb800' },
        ].map(s => (
          <Paper key={s.label} sx={{ px: 1.5, py: { xs: 1.5, md: 2.5 }, borderRadius: 3, textAlign: 'center', minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
            <Typography sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' }, color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mt: { xs: 0.25, md: 0.5 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {s.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Categorized Tiles */}
      {CATEGORY_ORDER.map(category => {
        const goals = groupedGoals[category];
        if (!goals || goals.length === 0) return null;

        return (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography sx={{ 
              fontSize: '0.75rem', fontWeight: 800, color: 'text.secondary', 
              textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5, 
              borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 0.5 
            }}>
              {category}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3,1fr)', sm: 'repeat(4,1fr)', md: 'repeat(5,1fr)' }, gap: { xs: 1.5, md: 2 } }}>
              {goals.map(goal => (
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
          </Box>
        );
      })}

      <GoalEditDialog
        goal={editGoal} open={!!editGoal}
        onClose={() => setEditGoal(null)}
        onSave={handleSaveGoal}
      />
    </Box>
  );
}