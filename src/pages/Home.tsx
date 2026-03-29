// src/pages/Home.tsx
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton,
  Snackbar, Alert, InputAdornment, List, ListItemButton,
  ListItemText, Divider, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, isToday, isYesterday } from 'date-fns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Extra'];
const CATEGORY_EMOJI: Record<string, string> = {
  Push: '🫸', Pull: '🫷', Legs: '🦵', Extra: '⚡',
};

function matchesSearch(
  ex: { name: string; subcategory?: string; category: string; isBodyweight: boolean },
  query: string
): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (ex.name.toLowerCase().includes(q)) return true;
  if ((ex.subcategory ?? '').toLowerCase().includes(q)) return true;
  if (ex.category.toLowerCase().includes(q)) return true;
  if ((q === 'bw' || q === 'bodyweight') && ex.isBodyweight) return true;
  const aliases: Record<string, string[]> = {
    Chest: ['chest','pec','bench'],
    Shoulders: ['shoulder','delt','lateral','raise'],
    Triceps: ['tricep','extension','pushdown'],
    Back: ['back','row','lat','pullup','chin'],
    'Upper Traps': ['trap','shrug'],
    Biceps: ['bicep','curl'],
    Glutes: ['glute','hip thrust','bridge'],
    Quads: ['quad','squat','lunge'],
    Hamstrings: ['hamstring','rdl','deadlift'],
    Calves: ['calf','toe raise'],
    Forearms: ['forearm','wrist','grip'],
    Neck: ['neck'],
    Core: ['core','ab','plank','crunch'],
  };
  const sub = ex.subcategory ?? '';
  return (aliases[sub] ?? []).some(a => q.includes(a) || a.includes(q));
}

function StatCard({ label, value, sub, color = '#00d4ff' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, minWidth: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{
        fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.25 }}>{sub}</Typography>}
    </Paper>
  );
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseCategory, setExerciseCategory] = useState('');
  const [exerciseSubcat, setExerciseSubcat] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showList, setShowList] = useState(false);
  const [weight, setWeight] = useState('');
  const [isEachSide, setIsEachSide] = useState(false);
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('1');
  const [rir, setRir] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  
  const [successMsg, setSuccessMsg] = useState('');

  const allExercises = useQuery(api.exercises.getExercises, { category: '' });
  
  // We keep thisWeeksLifts to power the top stats cards
  const thisWeeksLifts = useQuery(api.lifts.getThisWeeksLifts);
  
  // We pull allLifts to power the scrolling history feed
  const allLifts = useQuery(api.lifts.getLifts, {});
  
  const logSetMutation = useMutation(api.lifts.logSet);
  const updateSetMutation = useMutation(api.lifts.updateSet);
  const deleteSetMutation = useMutation(api.lifts.deleteSet);

  const filteredExercises = useMemo(() => {
    if (!allExercises) return [];
    return allExercises.filter(ex => {
      const matchesCat = !filterCat || ex.category === filterCat;
      return matchesCat && matchesSearch(ex, exerciseSearch);
    }).slice(0, 30);
  }, [allExercises, filterCat, exerciseSearch]);

  const totalSets = thisWeeksLifts?.reduce((a, l) => a + l.sets, 0) ?? 0;
  const totalVolume = thisWeeksLifts?.reduce((a, l) => a + l.volume, 0) ?? 0;
  const uniqueCount = new Set(thisWeeksLifts?.map(l => l.exerciseName) ?? []).size;

  // Group all lifts by date for the history feed
  const groupedLifts = useMemo(() => {
    if (!allLifts) return [];
    const groups: Record<string, typeof allLifts> = {};
    
    allLifts.forEach(lift => {
      const date = new Date(lift.timestamp);
      let label = '';
      if (isToday(date)) label = 'Today';
      else if (isYesterday(date)) label = 'Yesterday';
      else label = format(date, 'MMM d, yyyy'); // e.g., "Mar 27, 2026"

      if (!groups[label]) groups[label] = [];
      groups[label].push(lift);
    });

    // Sort labels by the actual date of the first item in the group (newest first)
    return Object.entries(groups).map(([label, lifts]) => ({
      label,
      lifts: lifts.sort((a, b) => b.timestamp - a.timestamp),
      firstTimestamp: lifts[0].timestamp
    })).sort((a, b) => b.firstTimestamp - a.firstTimestamp);
  }, [allLifts]);

  const resetForm = () => {
    setFilterCat(''); setExerciseName(''); setExerciseCategory('');
    setExerciseSubcat(''); setExerciseSearch(''); setShowList(false);
    setWeight(''); setIsEachSide(false); setReps(''); setSets('1'); setRir(''); setNotes('');
    setTimestamp(Date.now());
    setEditingId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setOpen(true);
  };

  const handleEdit = (lift: any) => {
    setEditingId(lift._id);
    setExerciseName(lift.exerciseName);
    setExerciseCategory(lift.category);
    setExerciseSubcat(lift.subcategory ?? '');
    setExerciseSearch(lift.exerciseName);
    setWeight(lift.weight.toString());
    setIsEachSide(false); 
    setReps(lift.reps.toString());
    setSets(lift.sets.toString());
    setRir(lift.rir?.toString() ?? '');
    setNotes(lift.notes ?? '');
    setTimestamp(lift.timestamp);
    setOpen(true);
  };

  const handleDeleteClick = (id: any) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteSetMutation({ id: deleteConfirmId as any });
      setSuccessMsg('Set deleted! 🗑️');
    } catch (err) {
      console.error("Failed to delete set:", err);
      setSuccessMsg('Error deleting set.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSelectExercise = (ex: { name: string; category: string; subcategory?: string }) => {
    setExerciseName(ex.name);
    setExerciseCategory(ex.category);
    setExerciseSubcat(ex.subcategory ?? '');
    setExerciseSearch(ex.name);
    setShowList(false);
  };

  const handleSubmit = async () => {
    if (!exerciseName || !reps) return;
    
    const parsedWeight = parseFloat(weight) || 0;
    const finalWeight = isEachSide ? parsedWeight * 2 : parsedWeight;
    const targetTimestamp = new Date(timestamp).getTime();

    if (editingId) {
      await updateSetMutation({
        id: editingId as any,
        weight: finalWeight,
        reps: parseInt(reps),
        sets: parseInt(sets) || 1,
        rir: rir ? parseInt(rir) : undefined,
        notes: notes || undefined,
        timestamp: targetTimestamp,
      });
      setSuccessMsg('Set updated! 🔄');
    } else {
      await logSetMutation({
        exerciseName,
        category: exerciseCategory || 'Other',
        subcategory: exerciseSubcat || undefined,
        weight: finalWeight,
        reps: parseInt(reps),
        sets: parseInt(sets) || 1,
        rir: rir ? parseInt(rir) : undefined,
        notes: notes || undefined,
        timestamp: targetTimestamp,
      });
      setSuccessMsg('Set logged! 🔥');
    }
    
    setOpen(false);
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
          LiftLog
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Let's get<br />
          <Box component="span" sx={{ color: '#00d4ff' }}>to work 💪</Box>
        </Typography>
      </Box>

      <Button
        fullWidth variant="contained" size="large" onClick={handleOpenNew}
        startIcon={<AddIcon sx={{ fontSize: '1.4rem !important' }} />}
        sx={{
          py: 2.5, fontSize: '1.15rem', fontWeight: 800, borderRadius: 4, mb: 3,
          background: 'linear-gradient(135deg, #00d4ff 0%, #0077aa 100%)',
          boxShadow: '0 8px 32px rgba(0,212,255,0.35)',
        }}
      >
        Log a Set
      </Button>

      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
        This Week
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5, mb: 3 }}>
        <StatCard label="Sets" value={totalSets} />
        <StatCard label="Volume" value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume} sub="lbs" color="#00e096" />
        <StatCard label="Exercises" value={uniqueCount} color="#ffb800" />
      </Box>

      {/* Grouped History Feed */}
      {groupedLifts.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groupedLifts.map(group => (
            <Box key={group.label}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
                {group.label}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.lifts.map(lift => (
                  <Paper key={lift._id} sx={{ px: 2, py: 1.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '1.1rem', flexShrink: 0 }}>
                      {CATEGORY_EMOJI[lift.category] ?? '💪'}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lift.exerciseName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        {lift.sets}×{lift.reps} reps
                        {lift.weight > 0 ? ` · ${lift.weight} lbs` : ' · BW'}
                        {lift.rir !== undefined ? ` · RIR ${lift.rir}` : ''}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', mt: 0.25 }}>
                        {format(new Date(lift.timestamp), "h:mm a")}
                      </Typography>
                      {lift.notes && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontStyle: 'italic', mt: 0.5, borderLeft: '2px solid rgba(255,255,255,0.1)', pl: 1 }}>
                          {lift.notes}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <IconButton size="small" onClick={() => handleEdit(lift)} sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: '#00d4ff' } }}>
                        <EditIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteClick(lift._id)} sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: '#ff4d6d' } }}>
                        <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', bgcolor: 'transparent' }}>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>🏋️</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Nothing logged yet.<br />Hit that button above!
          </Typography>
        </Paper>
      )}

      {/* ─── Log Set Dialog ───────────────────────────────────────────────── */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {editingId ? 'Edit Set ✏️' : 'Log a Set 💪'}
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Date & Time"
              value={new Date(timestamp)}
              onChange={(newValue) => {
                if (newValue) setTimestamp(newValue.getTime());
              }}
              format="MMM d, yyyy '·' h:mm a"
              slotProps={{
                textField: { 
                  size: 'small', 
                  fullWidth: true, 
                  sx: { 
                    mt: 1,
                    '& .MuiInputBase-input': { 
                      fontWeight: 700, 
                      color: '#00d4ff',
                    },
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(0, 212, 255, 0.04)',
                      '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.15)' },
                      '&:hover fieldset': { borderColor: 'rgba(0, 212, 255, 0.4)' },
                    }
                  } 
                }
              }}
            />
          </LocalizationProvider>

          {!editingId && (
            <Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Filter by category <Box component="span" sx={{ fontWeight: 400, textTransform: 'none' }}>(optional)</Box>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <Chip key={cat}
                    label={`${CATEGORY_EMOJI[cat]} ${cat}`}
                    onClick={() => { setFilterCat(cat === filterCat ? '' : cat); setExerciseName(''); setExerciseSearch(''); }}
                    sx={{
                      cursor: 'pointer', fontWeight: 700,
                      bgcolor: filterCat === cat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: filterCat === cat ? '#00d4ff' : 'text.secondary',
                      border: filterCat === cat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Exercise <Box component="span" sx={{ color: '#00d4ff' }}>*</Box>
            </Typography>
            <TextField
              fullWidth size="small"
              placeholder='Search by name or muscle (e.g. "chest", "curl", "bw")…'
              value={exerciseSearch}
              disabled={!!editingId}
              onChange={e => { setExerciseSearch(e.target.value); setExerciseName(''); setShowList(true); }}
              onFocus={() => !editingId && setShowList(true)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: exerciseName ? (
                  <InputAdornment position="end">
                    <Typography sx={{ fontSize: '0.75rem', color: '#00e096', fontWeight: 700 }}>✓</Typography>
                  </InputAdornment>
                ) : null,
              }}
            />
            {showList && !exerciseName && !editingId && (
              <Paper sx={{ mt: 0.5, borderRadius: 2, maxHeight: 220, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                {filteredExercises.length > 0 ? (
                  <List dense disablePadding>
                    {filteredExercises.map((ex, i) => (
                      <React.Fragment key={ex._id}>
                        {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                        <ListItemButton onClick={() => handleSelectExercise(ex)} sx={{ py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                          <ListItemText
                            primary={ex.name}
                            secondary={`${ex.category}${ex.subcategory ? ' · ' + ex.subcategory : ''}`}
                            primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
                            secondaryTypographyProps={{ fontSize: '0.7rem' }}
                          />
                          {ex.isBodyweight && (
                            <Chip label="BW" size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: 'rgba(0,224,150,0.1)', color: '#00e096', ml: 1, flexShrink: 0 }} />
                          )}
                        </ListItemButton>
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                      No results. Add it in the Exercises tab.
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Box>

          {exerciseName && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <ToggleButtonGroup
                value={isEachSide ? 'each' : 'total'}
                exclusive
                onChange={(e, val) => { if (val !== null) setIsEachSide(val === 'each') }}
                fullWidth
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.02)',
                  '& .MuiToggleButton-root': {
                    color: 'text.secondary',
                    fontWeight: 700,
                    textTransform: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(0,212,255,0.15)',
                      color: '#00d4ff',
                      border: '1px solid rgba(0,212,255,0.4)',
                    }
                  }
                }}
              >
                <ToggleButton value="total">Total Weight (Barbell)</ToggleButton>
                <ToggleButton value="each">Per Side (Dumbbells)</ToggleButton>
              </ToggleButtonGroup>

              <TextField
                label={isEachSide ? "Weight Per Side (lbs)" : "Total Weight (lbs)"} 
                type="number" size="small" fullWidth
                placeholder="0 = pure bodyweight"
                value={weight} onChange={e => setWeight(e.target.value)}
                inputProps={{ min: 0, step: 2.5 }}
                helperText="Optional — include vest/bands/plates. Leave blank for bodyweight."
                InputProps={{
                  endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>lbs</Typography></InputAdornment>,
                }}
              />
            </Box>
          )}

          {exerciseName && (
            <Box>
              <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap', alignItems: 'baseline' }}>
                {[
                  { label: 'Reps', required: true },
                  { label: 'Sets', required: false },
                  { label: 'RIR', required: false },
                ].map((f, i) => (
                  <React.Fragment key={f.label}>
                    {i > 0 && <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.15)', mx: 0.5 }}>·</Typography>}
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {f.label}{' '}
                      {f.required
                        ? <Box component="span" sx={{ color: '#00d4ff' }}>*</Box>
                        : <Box component="span" sx={{ fontWeight: 400, textTransform: 'none' }}>(opt)</Box>
                      }
                    </Typography>
                  </React.Fragment>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField label="Reps" type="number" size="small" fullWidth value={reps} onChange={e => setReps(e.target.value)} inputProps={{ min: 1 }} />
                <TextField label="Sets" type="number" size="small" fullWidth value={sets} onChange={e => setSets(e.target.value)} inputProps={{ min: 1 }} />
                <TextField label="RIR" type="number" size="small" fullWidth value={rir} onChange={e => setRir(e.target.value)} inputProps={{ min: 0, max: 10 }} />
              </Box>
            </Box>
          )}

          {exerciseName && (
            <TextField label="Notes (optional)" size="small" fullWidth multiline rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!exerciseName || !reps} sx={{ flex: 1, py: 1.5 }}>
            {editingId ? 'Update Set ✅' : 'Save Set ✅'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────── */}
      <Dialog 
        open={!!deleteConfirmId} 
        onClose={() => setDeleteConfirmId(null)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
            background: 'linear-gradient(180deg, #1a1b1f 0%, #12141a 100%)',
            border: '1px solid rgba(255, 77, 109, 0.3)',
            maxWidth: 320,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(255, 77, 109, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#ff4d6d', pb: 1 }}>
          Delete Set?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Are you sure you want to delete this set? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1.5, pb: 2, px: 3 }}>
          <Button 
            onClick={() => setDeleteConfirmId(null)} 
            sx={{ color: 'text.secondary', fontWeight: 700, flex: 1 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={confirmDelete}
            sx={{ 
              flex: 1,
              fontWeight: 800,
              borderRadius: 2,
              background: '#ff4d6d',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(255, 77, 109, 0.3)',
              '&:hover': { background: '#e63950' }
            }}
          >
            Delete 🗑️
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={2500} onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: '80px !important' }}>
        <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 700 }}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}