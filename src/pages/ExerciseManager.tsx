// src/pages/ExerciseManager.tsx
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, IconButton,
  Snackbar, Alert, InputAdornment, List, ListItemButton,
  ListItemText, Divider, Slider,
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { format } from 'date-fns';

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = ['Push', 'Pull', 'Legs', 'Extra'];

const SUBCATEGORIES: Record<string, string[]> = {
  Push: ['Chest', 'Shoulders', 'Triceps'],
  Pull: ['Back', 'Upper Traps', 'Biceps'],
  Legs: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Other'],
  Extra: ['Forearms', 'Neck', 'Core'],
};

const CATEGORY_EMOJI: Record<string, string> = {
  Push: '🫸', Pull: '🫷', Legs: '🦵', Extra: '⚡',
};

const MUSCLE_GROUPS = [
  { key: 'chest',      label: 'Chest',       emoji: '🫁' },
  { key: 'shoulders',  label: 'Shoulders',   emoji: '🏔️' },
  { key: 'triceps',    label: 'Triceps',     emoji: '💪' },
  { key: 'back',       label: 'Back',        emoji: '🔙' },
  { key: 'upperTraps', label: 'Upper Traps', emoji: '🦬' },
  { key: 'biceps',     label: 'Biceps',      emoji: '🦾' },
  { key: 'glutes',     label: 'Glutes',      emoji: '🍑' },
  { key: 'quads',      label: 'Quads',       emoji: '🦵' },
  { key: 'hamstrings', label: 'Hamstrings',  emoji: '🦿' },
  { key: 'calves',     label: 'Calves',      emoji: '⬇️' },
  { key: 'forearms',   label: 'Forearms',    emoji: '🤜' },
  { key: 'neck',       label: 'Neck',        emoji: '🦒' },
  { key: 'core',       label: 'Core',        emoji: '🎯' },
];

const WEIGHT_LABELS: Record<number, string> = {
  0: 'None', 0.25: '¼ set', 0.5: '½ set', 0.75: '¾ set', 1: 'Full set',
};

type MuscleWeights = Record<string, number>;
const emptyWeights = (): MuscleWeights =>
  Object.fromEntries(MUSCLE_GROUPS.map(m => [m.key, 0]));

// ── Sub-components ─────────────────────────────────────────────────────────
function MuscleWeightRow({ muscle, value, onChange }: {
  muscle: typeof MUSCLE_GROUPS[0]; value: number; onChange: (v: number) => void;
}) {
  const color = value === 0 ? '#444' : value < 0.5 ? '#ffb800' : value < 1 ? '#00d4ff' : '#00e096';
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
          {muscle.emoji} {muscle.label}
        </Typography>
        <Chip label={WEIGHT_LABELS[value] ?? `${value}×`} size="small"
          sx={{ fontSize: '0.68rem', height: 20, fontWeight: 700, bgcolor: `${color}22`, color }} />
      </Box>
      <Slider
        value={value} onChange={(_, v) => onChange(v as number)}
        min={0} max={1} step={0.25}
        marks={[{ value: 0 }, { value: 0.25 }, { value: 0.5 }, { value: 0.75 }, { value: 1 }]}
        sx={{
          color, height: 4,
          '& .MuiSlider-thumb': { width: 14, height: 14 },
          '& .MuiSlider-mark': { bgcolor: 'rgba(255,255,255,0.2)', width: 2, height: 2 },
        }}
      />
    </Box>
  );
}

function ExerciseDialog({ exercise, open, onClose, onSave }: {
  exercise?: any; open: boolean; onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [weights, setWeights] = useState<MuscleWeights>(emptyWeights());

  React.useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setCategory(exercise.category);
      setSubcategory(exercise.subcategory ?? '');
      setWeights({ ...emptyWeights(), ...(exercise.muscleWeights ?? {}) });
    } else {
      setName(''); setCategory(''); setSubcategory('');
      setWeights(emptyWeights());
    }
  }, [exercise, open]);

  // Subcategory is now required
  const isValid = name.trim() && category && subcategory;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSubcategory(''); // reset subcategory when category changes
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {exercise ? 'Edit Exercise ✏️' : 'Add Exercise ➕'}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        <TextField
          label="Exercise name" size="small" fullWidth
          value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Lunge"
        />

        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Category <Box component="span" sx={{ color: '#00d4ff' }}>*</Box>
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <Chip key={cat} label={`${CATEGORY_EMOJI[cat]} ${cat}`}
                onClick={() => handleCategoryChange(cat)}
                sx={{
                  cursor: 'pointer', fontWeight: 700,
                  bgcolor: category === cat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color: category === cat ? '#00d4ff' : 'text.secondary',
                  border: category === cat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                }}
              />
            ))}
          </Box>
        </Box>

        {category && (
          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Muscle Group <Box component="span" sx={{ color: '#00d4ff' }}>*</Box>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(SUBCATEGORIES[category] ?? []).map(sub => (
                <Chip key={sub} label={sub} size="small"
                  onClick={() => setSubcategory(sub === subcategory ? '' : sub)}
                  sx={{
                    cursor: 'pointer', fontWeight: 600,
                    bgcolor: subcategory === sub ? 'rgba(0,224,150,0.15)' : 'rgba(255,255,255,0.05)',
                    color: subcategory === sub ? '#00e096' : 'text.secondary',
                    border: subcategory === sub ? '1px solid rgba(0,224,150,0.4)' : '1px solid transparent',
                  }}
                />
              ))}
            </Box>
            {!subcategory && (
              <Typography sx={{ fontSize: '0.68rem', color: '#ffb800', mt: 0.5 }}>
                Please select a muscle group
              </Typography>
            )}
          </Box>
        )}

        <Box>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Muscle Group Contributions
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 1.5 }}>
            How much does each muscle group count per set? Full = 1 set, Half = 0.5, etc.
          </Typography>
          {MUSCLE_GROUPS.map(muscle => (
            <MuscleWeightRow key={muscle.key} muscle={muscle}
              value={weights[muscle.key] ?? 0}
              onChange={v => setWeights(prev => ({ ...prev, [muscle.key]: v }))}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained"
          onClick={() => onSave({ name: name.trim(), category, subcategory, muscleWeights: weights })}
          disabled={!isValid}
          sx={{ flex: 1, py: 1.5 }}
        >
          {exercise ? 'Save Changes ✅' : 'Add Exercise ✅'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ExerciseManager() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<any | null>(null);
  
  // Dialog states
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [logsConfirmOpen, setLogsConfirmOpen] = useState(false);
  const [nukeConfirmOpen, setNukeConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const exercises = useQuery(api.exercises.getExercises, { category: '' });
  const addExercise = useMutation(api.exercises.addExercise);
  const updateExercise = useMutation(api.exercises.updateExercise);
  const archiveExercise = useMutation(api.exercises.archiveExercise);
  
  // Admin mutations
  const wipeLogsOnly = useMutation(api.admin.wipeLogsOnly);
  const wipeAllData = useMutation(api.admin.wipeAllData);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(ex => {
      const matchesCat = !filterCat || ex.category === filterCat;
      const matchesSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [exercises, search, filterCat]);

  const handleAdd = async (data: any) => {
    await addExercise({ ...data, isBodyweight: false }); 
    setAddOpen(false);
    setSuccessMsg('Exercise added! ✅');
  };

  const handleEdit = async (data: any) => {
    if (!editExercise) return;
    await updateExercise({ id: editExercise._id, ...data, isBodyweight: editExercise.isBodyweight });
    setEditExercise(null);
    setSuccessMsg('Exercise updated! 🔄');
  };

  const confirmArchive = async () => {
    if (!archiveConfirmId) return;
    try {
      await archiveExercise({ id: archiveConfirmId as any });
      setSuccessMsg('Exercise archived! 🗄️');
    } catch { setSuccessMsg('Error archiving exercise.'); }
    finally { setArchiveConfirmId(null); }
  };

  const handleWipeLogs = async () => {
    await wipeLogsOnly();
    setLogsConfirmOpen(false);
    setSuccessMsg('All logs deleted! 🧹');
  };

  const handleWipeEverything = async () => {
    await wipeAllData();
    setNukeConfirmOpen(false);
    setSuccessMsg('Database annihilated! ☢️');
  };

  const exportToCSV = () => {
    if (!exercises?.length) return;
    const muscleKeys = MUSCLE_GROUPS.map(m => m.key);
    const headers = ['Exercise Name', 'Category', 'Subcategory', ...MUSCLE_GROUPS.map(m => m.label)];
    const rows = [...exercises].sort((a, b) => a.name.localeCompare(b.name)).map(ex => [
      `"${ex.name}"`, ex.category, ex.subcategory ?? '',
      ...muscleKeys.map(k => (ex.muscleWeights as any)?.[k] ?? 0),
    ].join(','));
    const uri = 'data:text/csv;charset=utf-8,' + encodeURI([headers.join(','), ...rows].join('\n'));
    const a = document.createElement('a');
    a.href = uri;
    a.download = `LiftLog_Exercises_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 4, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
            Database
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Exercise<br />
            <Box component="span" sx={{ color: '#00d4ff' }}>Manager 🗂️</Box>
          </Typography>
        </Box>
        <Button variant="outlined" size="small" onClick={exportToCSV}
          sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', fontSize: '0.75rem', py: 0.5,
            '&:hover': { borderColor: '#00d4ff', color: '#00d4ff', bgcolor: 'rgba(0,212,255,0.05)' } }}>
          Export CSV 📥
        </Button>
      </Box>

      <Button fullWidth variant="contained" size="large" onClick={() => setAddOpen(true)}
        startIcon={<AddIcon />}
        sx={{ py: 2, fontSize: '1rem', fontWeight: 800, borderRadius: 4, mb: 3,
          background: 'linear-gradient(135deg, #b06aff 0%, #7b35cc 100%)',
          boxShadow: '0 8px 32px rgba(176,106,255,0.3)' }}>
        Add New Exercise
      </Button>

      {/* Search */}
      <TextField fullWidth size="small" placeholder="Search exercises..."
        value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} /></InputAdornment> }}
        sx={{ mb: 1.5 }}
      />

      {/* Category filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label="All" onClick={() => setFilterCat('')} size="small"
          sx={{ cursor: 'pointer', fontWeight: 700,
            bgcolor: !filterCat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
            color: !filterCat ? '#00d4ff' : 'text.secondary',
            border: !filterCat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent' }} />
        {CATEGORIES.map(cat => (
          <Chip key={cat} label={`${CATEGORY_EMOJI[cat]} ${cat}`} size="small"
            onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
            sx={{ cursor: 'pointer', fontWeight: 700,
              bgcolor: filterCat === cat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: filterCat === cat ? '#00d4ff' : 'text.secondary',
              border: filterCat === cat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent' }} />
        ))}
      </Box>

      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 1.5 }}>
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <List dense disablePadding>
          {filtered.map((ex, i) => (
            <React.Fragment key={ex._id}>
              {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
              <ListItemButton onClick={() => setEditExercise(ex)}
                sx={{ py: 1.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                <ListItemText
                  primary={ex.name}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.25, flexWrap: 'wrap' }}>
                      <Chip label={`${CATEGORY_EMOJI[ex.category] ?? ''} ${ex.category}`} size="small"
                        sx={{ fontSize: '0.6rem', height: 16, bgcolor: 'rgba(0,212,255,0.1)', color: '#00d4ff' }} />
                      {ex.subcategory && (
                        <Chip label={ex.subcategory} size="small"
                          sx={{ fontSize: '0.6rem', height: 16, bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary' }} />
                      )}
                      {Object.entries((ex.muscleWeights as any) ?? {}).filter(([, v]) => (v as number) > 0).slice(0, 2).map(([k, v]) => (
                        <Chip key={k} label={`${k} ×${v}`} size="small"
                          sx={{ fontSize: '0.6rem', height: 16, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary' }} />
                      ))}
                    </Box>
                  }
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }}
                />
                <IconButton size="small"
                  onClick={e => { e.stopPropagation(); setArchiveConfirmId(ex._id); }}
                  sx={{ opacity: 0.35, '&:hover': { opacity: 1, color: '#ffb800' } }}>
                  <ArchiveIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </ListItemButton>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* ─── DANGER ZONE ──────────────────────────────────────────────────────── */}
      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 77, 109, 0.2)' }}>
        <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.85rem', fontWeight: 800, color: '#ff4d6d', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
          <WarningAmberIcon fontSize="small" /> Danger Zone
        </Typography>

        <Button 
          fullWidth variant="outlined" color="warning" 
          onClick={() => setLogsConfirmOpen(true)}
          sx={{ mb: 2, py: 1.5, fontWeight: 700, borderRadius: 2, borderColor: 'rgba(255, 184, 0, 0.3)', color: '#ffb800', '&:hover': { borderColor: '#ffb800', bgcolor: 'rgba(255, 184, 0, 0.05)' } }}
        >
          Clear Workout Logs (Keep Exercises)
        </Button>

        <Button 
          fullWidth variant="contained" color="error" 
          onClick={() => setNukeConfirmOpen(true)}
          startIcon={<DeleteForeverIcon />}
          sx={{ py: 1.5, fontWeight: 800, borderRadius: 2, background: '#ff4d6d', '&:hover': { background: '#e63950' } }}
        >
          Factory Reset (Delete EVERYTHING)
        </Button>
      </Box>

      {/* Dialogs */}
      <ExerciseDialog open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} />
      <ExerciseDialog open={!!editExercise} exercise={editExercise} onClose={() => setEditExercise(null)} onSave={handleEdit} />

      {/* Archive confirm */}
      <Dialog open={!!archiveConfirmId} onClose={() => setArchiveConfirmId(null)}
        PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: 320, textAlign: 'center', border: '1px solid rgba(255, 184, 0, 0.3)', background: 'linear-gradient(180deg, #1a1b1f 0%, #12141a 100%)' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#ffb800', pb: 1 }}>Archive Exercise?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            This will hide it from your logging searches, but keep your past sets and charts perfectly intact.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1.5, pb: 2, px: 3 }}>
          <Button onClick={() => setArchiveConfirmId(null)} sx={{ color: 'text.secondary', flex: 1 }}>Cancel</Button>
          <Button variant="contained" onClick={confirmArchive}
            sx={{ flex: 1, fontWeight: 800, background: '#ffb800', color: '#000', '&:hover': { background: '#e0a300' } }}>
            Archive 🗄️
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Logs Confirm */}
      <Dialog open={logsConfirmOpen} onClose={() => setLogsConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: 320, textAlign: 'center', border: '1px solid rgba(255, 184, 0, 0.5)', background: 'linear-gradient(180deg, #1a1b1f 0%, #12141a 100%)' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#ffb800', pb: 1 }}>Wipe All Logs?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            This will permanently delete all your logged sets and cardio history, but your master exercise list will remain intact.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1.5, pb: 2, px: 3 }}>
          <Button onClick={() => setLogsConfirmOpen(false)} sx={{ color: 'text.secondary', flex: 1 }}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleWipeLogs} sx={{ flex: 1, fontWeight: 800 }}>
            Wipe Logs
          </Button>
        </DialogActions>
      </Dialog>

      {/* Nuke Everything Confirm */}
      <Dialog open={nukeConfirmOpen} onClose={() => setNukeConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: 320, textAlign: 'center', border: '1px solid rgba(255, 77, 109, 0.5)', background: 'linear-gradient(180deg, #1a1b1f 0%, #12141a 100%)' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#ff4d6d', pb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <WarningAmberIcon sx={{ fontSize: 40, mb: 1 }} />
          NUKE DATABASE?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            This will permanently delete absolutely everything: exercises, goals, sets, and cardio. Your app will return to a completely blank slate.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 1.5, pb: 2, px: 3 }}>
          <Button onClick={() => setNukeConfirmOpen(false)} sx={{ color: 'text.secondary', flex: 1, fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleWipeEverything} sx={{ flex: 1, fontWeight: 800, background: '#ff4d6d' }}>
            DESTROY 💥
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