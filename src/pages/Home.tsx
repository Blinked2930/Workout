// src/pages/Home.tsx
import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, IconButton, Snackbar, Alert,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Core'];

const SUBCATEGORIES: Record<string, string[]> = {
  Push: ['Chest', 'Shoulders', 'Triceps'],
  Pull: ['Back', 'Upper Traps', 'Biceps', 'Lats'],
  Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  Core: ['Core'],
};

const CATEGORY_EMOJI: Record<string, string> = {
  Push: '🫸', Pull: '🫷', Legs: '🦵', Core: '🎯',
};

function StatCard({ label, value, sub, color = '#00d4ff' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, flex: 1 }}>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </Typography>
      {sub && (
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.5 }}>
          {sub}
        </Typography>
      )}
    </Paper>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [weight, setWeight] = useState('0');
  const [addedWeight, setAddedWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('1');
  const [rir, setRir] = useState('');
  const [notes, setNotes] = useState('');
  const [isBodyweight, setIsBodyweight] = useState(true);
  const [success, setSuccess] = useState(false);
  const [exerciseMode, setExerciseMode] = useState<'select' | 'type'>('select');

  const exercises = useQuery(api.exercises.getExercises,
    category ? { category } : { category: '' }
  );
  const filteredExercises = exercises?.filter(e =>
    !subcategory || e.subcategory === subcategory
  ) ?? [];

  const thisWeeksLifts = useQuery(api.lifts.getThisWeeksLifts);
  const logSet = useMutation(api.lifts.logSet);
  const addExercise = useMutation(api.exercises.addExercise);

  // Weekly stats
  const totalSets = thisWeeksLifts?.reduce((acc, l) => acc + l.sets, 0) ?? 0;
  const totalVolume = thisWeeksLifts?.reduce((acc, l) => acc + l.volume, 0) ?? 0;
  const uniqueExercises = new Set(thisWeeksLifts?.map(l => l.exerciseName) ?? []).size;

  const todayLifts = thisWeeksLifts?.filter(l => {
    const d = new Date(l.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }) ?? [];

  const handleOpen = () => {
    setCategory(''); setSubcategory(''); setExerciseName('');
    setWeight('0'); setAddedWeight(''); setReps(''); setSets('1');
    setRir(''); setNotes(''); setIsBodyweight(true);
    setOpen(true);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSubcategory('');
    setExerciseName('');
  };

  const handleExerciseSelect = (name: string) => {
    setExerciseName(name);
    const ex = exercises?.find(e => e.name === name);
    if (ex) setIsBodyweight(ex.isBodyweight);
  };

  const handleSubmit = async () => {
    if (!exerciseName || !reps || !category) return;

    // Find or get exercise muscle weights
    const ex = exercises?.find(e => e.name === exerciseName);

    if (!ex) {
      // New exercise — add it with empty muscle weights
      await addExercise({
        name: exerciseName,
        category,
        subcategory: subcategory || undefined,
        isBodyweight,
        muscleWeights: {},
      });
    }

    await logSet({
      exerciseName,
      category,
      subcategory: subcategory || undefined,
      weight: parseFloat(weight) || 0,
      addedWeight: addedWeight ? parseFloat(addedWeight) : undefined,
      reps: parseInt(reps),
      sets: parseInt(sets) || 1,
      rir: rir ? parseInt(rir) : undefined,
      notes: notes || undefined,
    });

    setOpen(false);
    setSuccess(true);
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff',
          textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5,
        }}>
          LiftLog
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Let's get<br />
          <Box component="span" sx={{ color: '#00d4ff' }}>to work 💪</Box>
        </Typography>
      </Box>

      {/* Big Log Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleOpen}
        startIcon={<AddIcon sx={{ fontSize: '1.5rem !important' }} />}
        sx={{
          py: 2.5,
          fontSize: '1.2rem',
          fontWeight: 800,
          borderRadius: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #00d4ff 0%, #0077aa 100%)',
          boxShadow: '0 8px 32px rgba(0,212,255,0.35)',
          letterSpacing: '0.02em',
        }}
      >
        Log a Set
      </Button>

      {/* This Week Stats */}
      <Typography sx={{
        fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
        textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5,
      }}>
        This Week
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
        <StatCard label="Sets" value={totalSets} />
        <StatCard label="Volume" value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume} sub="lbs" color="#00e096" />
        <StatCard label="Exercises" value={uniqueExercises} color="#ffb800" />
      </Box>

      {/* Today's Log */}
      {todayLifts.length > 0 && (
        <>
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
            textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5,
          }}>
            Today
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {todayLifts.map((lift) => (
              <Paper key={lift._id} sx={{
                px: 2, py: 1.5, borderRadius: 3,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {lift.exerciseName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                    {lift.sets} set{lift.sets > 1 ? 's' : ''} · {lift.reps} reps
                    {lift.weight > 0 ? ` · ${lift.weight}lbs` : ' · BW'}
                    {lift.rir !== undefined ? ` · RIR ${lift.rir}` : ''}
                  </Typography>
                </Box>
                <Chip
                  label={CATEGORY_EMOJI[lift.category] ?? lift.category}
                  size="small"
                  sx={{ bgcolor: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontWeight: 700 }}
                />
              </Paper>
            ))}
          </Box>
        </>
      )}

      {todayLifts.length === 0 && (
        <Paper sx={{
          p: 3, borderRadius: 3, textAlign: 'center',
          border: '1px dashed rgba(255,255,255,0.1)',
          bgcolor: 'transparent',
        }}>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>🏋️</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Nothing logged today yet.<br />Hit that button above!
          </Typography>
        </Paper>
      )}

      {/* Log Set Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Log a Set 💪</Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Category */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Category
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <Chip
                  key={cat}
                  label={`${CATEGORY_EMOJI[cat]} ${cat}`}
                  onClick={() => handleCategoryChange(cat)}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: 700,
                    bgcolor: category === cat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: category === cat ? '#00d4ff' : 'text.secondary',
                    border: category === cat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                    '&:hover': { bgcolor: 'rgba(0,212,255,0.1)' },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Subcategory */}
          {category && SUBCATEGORIES[category] && (
            <Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Muscle Group
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {SUBCATEGORIES[category].map(sub => (
                  <Chip
                    key={sub}
                    label={sub}
                    onClick={() => setSubcategory(sub === subcategory ? '' : sub)}
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      bgcolor: subcategory === sub ? 'rgba(0,224,150,0.15)' : 'rgba(255,255,255,0.05)',
                      color: subcategory === sub ? '#00e096' : 'text.secondary',
                      border: subcategory === sub ? '1px solid rgba(0,224,150,0.4)' : '1px solid transparent',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Exercise */}
          {category && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Exercise
                </Typography>
                <ToggleButtonGroup
                  value={exerciseMode}
                  exclusive
                  onChange={(_, v) => v && setExerciseMode(v)}
                  size="small"
                  sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: '0.7rem', fontWeight: 600, borderRadius: '8px !important', border: '1px solid rgba(255,255,255,0.1)' } }}
                >
                  <ToggleButton value="select">List</ToggleButton>
                  <ToggleButton value="type">Type</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {exerciseMode === 'select' ? (
                <FormControl fullWidth size="small">
                  <Select
                    value={exerciseName}
                    onChange={e => handleExerciseSelect(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 3 }}
                  >
                    <MenuItem value="" disabled>
                      <Typography sx={{ color: 'text.secondary' }}>Select exercise...</Typography>
                    </MenuItem>
                    {filteredExercises.map(ex => (
                      <MenuItem key={ex._id} value={ex.name}>{ex.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type exercise name..."
                  value={exerciseName}
                  onChange={e => setExerciseName(e.target.value)}
                />
              )}
            </Box>
          )}

          {/* Bodyweight toggle */}
          {exerciseName && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="🏋️ Weighted"
                onClick={() => setIsBodyweight(false)}
                sx={{
                  cursor: 'pointer', fontWeight: 700,
                  bgcolor: !isBodyweight ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.05)',
                  color: !isBodyweight ? '#ff6b35' : 'text.secondary',
                  border: !isBodyweight ? '1px solid rgba(255,107,53,0.4)' : '1px solid transparent',
                }}
              />
              <Chip
                label="🤸 Bodyweight"
                onClick={() => setIsBodyweight(true)}
                sx={{
                  cursor: 'pointer', fontWeight: 700,
                  bgcolor: isBodyweight ? 'rgba(0,224,150,0.15)' : 'rgba(255,255,255,0.05)',
                  color: isBodyweight ? '#00e096' : 'text.secondary',
                  border: isBodyweight ? '1px solid rgba(0,224,150,0.4)' : '1px solid transparent',
                }}
              />
            </Box>
          )}

          {/* Weight fields */}
          {exerciseName && !isBodyweight && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Weight (lbs)"
                type="number"
                size="small"
                fullWidth
                value={weight}
                onChange={e => setWeight(e.target.value)}
                inputProps={{ min: 0, step: 2.5 }}
              />
              <TextField
                label="Added weight"
                type="number"
                size="small"
                fullWidth
                value={addedWeight}
                onChange={e => setAddedWeight(e.target.value)}
                placeholder="Vest/bands"
                inputProps={{ min: 0, step: 2.5 }}
              />
            </Box>
          )}

          {exerciseName && isBodyweight && (
            <TextField
              label="Added weight (vest/bands)"
              type="number"
              size="small"
              fullWidth
              value={addedWeight}
              onChange={e => setAddedWeight(e.target.value)}
              placeholder="0 = pure bodyweight"
              inputProps={{ min: 0, step: 2.5 }}
            />
          )}

          {/* Reps / Sets / RIR */}
          {exerciseName && (
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                label="Reps"
                type="number"
                size="small"
                fullWidth
                value={reps}
                onChange={e => setReps(e.target.value)}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Sets"
                type="number"
                size="small"
                fullWidth
                value={sets}
                onChange={e => setSets(e.target.value)}
                inputProps={{ min: 1 }}
              />
              <TextField
                label="RIR"
                type="number"
                size="small"
                fullWidth
                value={rir}
                onChange={e => setRir(e.target.value)}
                placeholder="Optional"
                inputProps={{ min: 0, max: 10 }}
              />
            </Box>
          )}

          {/* Notes */}
          {exerciseName && (
            <TextField
              label="Notes (optional)"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!exerciseName || !reps || !category}
            sx={{ flex: 1, py: 1.5 }}
          >
            Save Set ✅
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={2500} onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: '80px !important' }}
      >
        <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 700 }}>
          Set logged! 🔥
        </Alert>
      </Snackbar>
    </Box>
  );
}