// src/pages/Home.tsx
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton,
  Snackbar, Alert, InputAdornment, List, ListItemButton,
  Divider
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, isToday, isYesterday } from 'date-fns';
import { enGB } from 'date-fns/locale';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Extra'];
const CATEGORY_EMOJI: Record<string, string> = { Push: '🫸', Pull: '🫷', Legs: '🦵', Extra: '⚡' };
const EQUIPMENT_TYPES = [
  { value: 'Barbell', emoji: '🏋️' },
  { value: 'Dumbbell', emoji: '🫳' },
  { value: 'Kettlebell', emoji: '💣' },
  { value: 'Machine/Cable', emoji: '⚙️' },
  { value: 'Bodyweight', emoji: '🤸' },
  { value: 'Other', emoji: '⚡' },
];

function matchesSearch(ex: { name: string; subcategory?: string; category: string; isBodyweight: boolean; isArchived?: boolean }, query: string): boolean {
  if (ex.isArchived) return false; 
  if (!query) return true;
  const q = query.toLowerCase();
  if (ex.name.toLowerCase().includes(q)) return true;
  if ((ex.subcategory ?? '').toLowerCase().includes(q)) return true;
  if (ex.category.toLowerCase().includes(q)) return true;
  return false;
}

function StatCard({ label, value, sub, color = '#00d4ff' }: { label: string; value: string | number; sub?: string; color?: string; }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 3, minWidth: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</Typography>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
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
  const [equipment, setEquipment] = useState('Barbell');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [sets, setSets] = useState('1');
  const [rir, setRir] = useState('');
  const [notes, setNotes] = useState('');
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [successMsg, setSuccessMsg] = useState('');

  const allExercises = useQuery(api.exercises.getExercises, { category: '' });
  const thisWeeksLifts = useQuery(api.lifts.getThisWeeksLifts);
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

  // ─── DAILY WORKOUT CARD LOGIC ──────────────
  const groupedLifts = useMemo(() => {
    if (!allLifts) return [];
    const days: Record<string, { firstTimestamp: number; lifts: typeof allLifts }> = {};

    allLifts.forEach(lift => {
      const date = new Date(lift.timestamp);
      let dayLabel = '';
      if (isToday(date)) dayLabel = 'Today';
      else if (isYesterday(date)) dayLabel = 'Yesterday';
      else dayLabel = format(date, 'EEEE, MMM d'); // e.g. "Monday, Mar 30"

      if (!days[dayLabel]) {
        days[dayLabel] = { firstTimestamp: lift.timestamp, lifts: [] };
      }
      
      // Keep track of the most recent lift in the day to sort the days correctly
      if (lift.timestamp > days[dayLabel].firstTimestamp) {
        days[dayLabel].firstTimestamp = lift.timestamp;
      }

      days[dayLabel].lifts.push(lift);
    });

    return Object.entries(days).map(([label, dayData]) => ({
      label,
      // Sort lifts chronologically within the day (workout order)
      lifts: dayData.lifts.sort((a, b) => a.timestamp - b.timestamp),
      firstTimestamp: dayData.firstTimestamp
    })).sort((a, b) => b.firstTimestamp - a.firstTimestamp); // Sort days newest first
  }, [allLifts]);

  const resetForm = () => {
    setFilterCat(''); setExerciseName(''); setExerciseCategory('');
    setExerciseSubcat(''); setExerciseSearch(''); setShowList(false);
    setEquipment('Barbell'); setWeight(''); setReps(''); setSets('1'); setRir(''); setNotes('');
    setTimestamp(Date.now()); setEditingId(null);
  };

  const handleOpenNew = () => { resetForm(); setOpen(true); };

  const handleEdit = (lift: any) => {
    setEditingId(lift._id);
    setExerciseName(lift.exerciseName);
    setExerciseCategory(lift.category);
    setExerciseSubcat(lift.subcategory ?? '');
    setExerciseSearch(lift.exerciseName);
    setEquipment(lift.equipmentType || 'Barbell');
    setWeight(lift.weight.toString());
    setReps(lift.reps.toString());
    setSets(lift.sets.toString());
    setRir(lift.rir?.toString() ?? '');
    setNotes(lift.notes ?? '');
    setTimestamp(lift.timestamp);
    setOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteSetMutation({ id: deleteConfirmId as any });
    setSuccessMsg('Set deleted! 🗑️');
    setDeleteConfirmId(null);
    setOpen(false); // Close edit modal if it was open
  };

  const handleSelectExercise = (ex: any) => {
    setExerciseName(ex.name); setExerciseCategory(ex.category);
    setExerciseSubcat(ex.subcategory ?? ''); setExerciseSearch(ex.name);
    setShowList(false);
  };

  const handleSubmit = async () => {
    if (!exerciseName || !reps) return;
    const parsedWeight = parseFloat(weight) || 0;
    const targetTimestamp = new Date(timestamp).getTime();

    if (editingId) {
      await updateSetMutation({
        id: editingId as any,
        equipmentType: equipment,
        weight: parsedWeight,
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
        equipmentType: equipment,
        weight: parsedWeight,
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
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>LiftLog</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>Let's get<br /><Box component="span" sx={{ color: '#00d4ff' }}>to work 💪</Box></Typography>
      </Box>

      <Button fullWidth variant="contained" size="large" onClick={handleOpenNew} startIcon={<AddIcon sx={{ fontSize: '1.4rem !important' }} />} sx={{ py: 2.5, fontSize: '1.15rem', fontWeight: 800, borderRadius: 4, mb: 3, background: 'linear-gradient(135deg, #00d4ff 0%, #0077aa 100%)', boxShadow: '0 8px 32px rgba(0,212,255,0.35)' }}>
        Log a Set
      </Button>

      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>This Week</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.5, mb: 3 }}>
        <StatCard label="Sets" value={totalSets} />
        <StatCard label="Volume" value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume} sub="lbs" color="#00e096" />
        <StatCard label="Exercises" value={uniqueCount} color="#ffb800" />
      </Box>

      {/* DAILY WORKOUT CARDS */}
      {groupedLifts.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groupedLifts.map(day => (
            <Paper key={day.label} sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Card Header */}
              <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{day.label}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
                  {day.lifts.length} {day.lifts.length === 1 ? 'entry' : 'entries'}
                </Typography>
              </Box>
              
              {/* Card Body - Dense List */}
              <List disablePadding>
                {day.lifts.map((lift, i) => {
                  const eqEmoji = EQUIPMENT_TYPES.find(e => e.value === lift.equipmentType)?.emoji || '⚡';
                  return (
                    <React.Fragment key={lift._id}>
                      {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                      <ListItemButton 
                        onClick={() => handleEdit(lift)} 
                        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                      >
                        <Typography sx={{ fontSize: '1.2rem', mt: -0.2 }}>{CATEGORY_EMOJI[lift.category] ?? '💪'}</Typography>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                            {lift.exerciseName} 
                            <Box component="span" sx={{ opacity: 0.6, fontSize: '0.85rem', fontWeight: 400 }}>{eqEmoji}</Box>
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: '0.85rem', color: '#00d4ff', fontWeight: 700 }}>
                              {lift.sets} × {lift.reps}
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              @ {lift.weight > 0 ? `${lift.weight} lbs` : 'BW'}
                            </Typography>
                            {lift.rir !== undefined && (
                              <Chip label={`RIR ${lift.rir}`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }} />
                            )}
                          </Box>
                          
                          {lift.notes && (
                            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontStyle: 'italic', mt: 0.5 }}>
                              "{lift.notes}"
                            </Typography>
                          )}
                        </Box>
                      </ListItemButton>
                    </React.Fragment>
                  );
                })}
              </List>
            </Paper>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', bgcolor: 'transparent' }}>
          <Typography sx={{ fontSize: '2rem', mb: 1 }}>🏋️</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Nothing logged yet.<br />Hit that button above!</Typography>
        </Paper>
      )}

      {/* Log Set Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
          <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{editingId ? 'Edit Set ✏️' : 'Log a Set 💪'}</Typography>
            <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <DateTimePicker label="Date & Time" value={new Date(timestamp)} onChange={(v) => v && setTimestamp(v.getTime())} format="MMM d, yyyy '·' h:mm a" slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mt: 1 } } }} />
            
            {!editingId && (
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase' }}>Filter by category (optional)</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <Chip key={cat} label={`${CATEGORY_EMOJI[cat]} ${cat}`} onClick={() => { setFilterCat(cat === filterCat ? '' : cat); setExerciseName(''); setExerciseSearch(''); }} sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: filterCat === cat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', color: filterCat === cat ? '#00d4ff' : 'text.secondary', border: filterCat === cat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent' }} />
                  ))}
                </Box>
              </Box>
            )}

            <Box>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase' }}>Exercise *</Typography>
              <TextField fullWidth size="small" placeholder='Search by name or muscle...' value={exerciseSearch} disabled={!!editingId} onChange={e => { setExerciseSearch(e.target.value); setExerciseName(''); setShowList(true); }} onFocus={() => !editingId && setShowList(true)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} /></InputAdornment>), endAdornment: exerciseName ? (<InputAdornment position="end"><Typography sx={{ fontSize: '0.75rem', color: '#00e096', fontWeight: 700 }}>✓</Typography></InputAdornment>) : null }} />
              {showList && !exerciseName && !editingId && (
                <Paper sx={{ mt: 0.5, borderRadius: 2, maxHeight: 220, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {filteredExercises.length > 0 ? (
                    <List dense disablePadding>
                      {filteredExercises.map((ex, i) => (
                        <React.Fragment key={ex._id}>
                          {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                          <ListItemButton onClick={() => handleSelectExercise(ex)} sx={{ py: 0.75, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
                            <ListItemText primary={ex.name} secondary={`${ex.category}${ex.subcategory ? ' · ' + ex.subcategory : ''}`} primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} secondaryTypographyProps={{ fontSize: '0.7rem' }} />
                          </ListItemButton>
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}><Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>No results. Add it in the Exercises tab.</Typography></Box>
                  )}
                </Paper>
              )}
            </Box>

            {exerciseName && (
              <>
                <Box>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase' }}>Equipment</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {EQUIPMENT_TYPES.map(eq => (
                      <Chip key={eq.value} label={`${eq.emoji} ${eq.value}`} onClick={() => setEquipment(eq.value)} sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: equipment === eq.value ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)', color: equipment === eq.value ? '#00d4ff' : 'text.secondary', border: equipment === eq.value ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent' }} />
                    ))}
                  </Box>
                </Box>
                <TextField label="Weight (lbs)" type="number" size="small" fullWidth placeholder="0 = pure bodyweight" value={weight} onChange={e => setWeight(e.target.value)} helperText={equipment === 'Dumbbell' ? "Enter weight of ONE dumbbell (app calculates total volume automatically)." : "Enter total weight. Leave blank for bodyweight."} />
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField label="Reps *" type="number" size="small" fullWidth value={reps} onChange={e => setReps(e.target.value)} />
                  <TextField label="Sets" type="number" size="small" fullWidth value={sets} onChange={e => setSets(e.target.value)} />
                  <TextField label="RIR" type="number" size="small" fullWidth value={rir} onChange={e => setRir(e.target.value)} />
                </Box>
                <TextField label="Notes (optional)" size="small" fullWidth multiline rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </  >
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            {editingId && (
              <Button color="error" onClick={() => setDeleteConfirmId(editingId)} sx={{ fontWeight: 700, mr: 'auto' }}>
                Delete
              </Button>
            )}
            <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={!exerciseName || !reps} sx={{ px: 3, py: 1.5 }}>
              {editingId ? 'Update ✅' : 'Save Set ✅'}
            </Button>
          </DialogActions>
        </LocalizationProvider>
      </Dialog>
      
      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Set?</DialogTitle>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={2000} onClose={() => setSuccessMsg('')}><Alert severity="success">{successMsg}</Alert></Snackbar>
    </Box>
  );
}