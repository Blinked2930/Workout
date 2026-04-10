// src/pages/ExerciseManager.tsx
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, IconButton,
  Snackbar, Alert, InputAdornment, List, ListItemButton,
  Divider, Slider,
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
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

// BULLETPROOF SEARCH: Added optional chaining (?.) so missing data won't crash the app
function matchesSearch(ex: any, query: string): boolean {
  if (ex?.isArchived) return false; 
  if (!query) return true;
  const q = query.toLowerCase();
  if (ex?.name?.toLowerCase().includes(q)) return true;
  if (ex?.subcategory?.toLowerCase().includes(q)) return true;
  if (ex?.category?.toLowerCase().includes(q)) return true;
  return false;
}

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

  const isValid = name.trim() && category && subcategory;

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSubcategory('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {exercise ? 'Edit Exercise ✏️' : 'Add Exercise ➕'}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Left Column: Basic Info */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
          </Box>

          {/* Right Column: Muscle Contributions */}
          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Muscle Group Contributions
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 1.5 }}>
              How much does each muscle group count per set? Full = 1 set, Half = 0.5, etc.
            </Typography>
            {/* Desktop Grid Layout for Sliders */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 3, rowGap: 0.5 }}>
              {MUSCLE_GROUPS.map(muscle => (
                <MuscleWeightRow key={muscle.key} muscle={muscle}
                  value={weights[muscle.key] ?? 0}
                  onChange={v => setWeights(prev => ({ ...prev, [muscle.key]: v }))}
                />
              ))}
            </Box>
          </Box>
        </Box>

      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained"
          onClick={() => onSave({ name: name.trim(), category, subcategory, muscleWeights: weights })}
          disabled={!isValid}
          sx={{ py: 1, px: 3, fontWeight: 800 }}
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
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);
  const [exportHubOpen, setExportHubOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Queries
  const exercises = useQuery(api.exercises.getExercises, { category: '' });
  const allLifts = useQuery(api.lifts.getLifts, {});
  const allCardio = useQuery(api.cardio.getCardioSessions, {});
  
  // Mutations
  const addExercise = useMutation(api.exercises.addExercise);
  const updateExercise = useMutation(api.exercises.updateExercise);
  const archiveExercise = useMutation(api.exercises.archiveExercise);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(ex => {
      const matchesCat = !filterCat || ex.category === filterCat;
      const matchesQuery = !search || ex.name.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesQuery;
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

  // ── CSV Export Helpers ───────────────────────────────────────────────────
  const downloadCSV = (headers: string[], rows: string[], filename: string) => {
    const uri = 'data:text/csv;charset=utf-8,' + encodeURI([headers.join(','), ...rows].join('\n'));
    const a = document.createElement('a');
    a.href = uri;
    a.download = filename;
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a);
  };

  const exportExercises = () => {
    if (!exercises?.length) return;
    const muscleKeys = MUSCLE_GROUPS.map(m => m.key);
    const headers = ['Exercise Name', 'Category', 'Subcategory', ...MUSCLE_GROUPS.map(m => m.label)];
    const rows = [...exercises].sort((a, b) => a.name.localeCompare(b.name)).map(ex => [
      `"${ex.name}"`, ex.category, ex.subcategory ?? '',
      ...muscleKeys.map(k => (ex.muscleWeights as any)?.[k] ?? 0),
    ].join(','));
    downloadCSV(headers, rows, `LiftLog_Exercises_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const exportLifts = () => {
    if (!allLifts?.length) return;
    const headers = ['Date', 'Time', 'Category', 'Subcategory', 'Exercise', 'Equipment', 'Weight (lbs)', 'Reps', 'Sets', 'Volume', 'e1RM', 'Notes'];
    const rows = [...allLifts].sort((a, b) => a.timestamp - b.timestamp).map(l => {
      const d = new Date(l.timestamp);
      return [
        format(d, 'yyyy-MM-dd'), format(d, 'HH:mm:ss'),
        l.category ?? '', l.subcategory ?? '', `"${l.exerciseName}"`, l.equipmentType || '',
        l.weight, l.reps, l.sets, l.volume,
        l.e1rm ? l.e1rm.toFixed(1) : '', `"${l.notes ?? ''}"`,
      ].join(',');
    });
    downloadCSV(headers, rows, `LiftLog_Lifts_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const exportCardio = () => {
    if (!allCardio?.length) return;
    const headers = ["Date", "Time", "Movement Type", "Duration (min)", "Distance (mi)", "RPE", "Zone", "Notes"];
    const rows = [...allCardio].sort((a,b) => a.timestamp - b.timestamp).map(s => {
      const d = new Date(s.timestamp);
      return [
        format(d, 'yyyy-MM-dd'), format(d, 'HH:mm:ss'),
        s.movementType, s.duration, s.distance || '',
        s.rpe || '', s.zone || '', `"${s.notes || ''}"`
      ].join(',');
    });
    downloadCSV(headers, rows, `LiftLog_Cardio_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  return (
    // DESKTOP FIX: Expanded maxWidth to 900 so it can breathe on larger screens.
    <Box sx={{ px: { xs: 2, md: 4 }, pt: { xs: 3, md: 5 }, pb: 10, maxWidth: { xs: 480, md: 900 }, mx: 'auto' }}>
      
      {/* DESKTOP FIX: Responsive Header Row */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 3 }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
            Database
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Exercise<br />
            <Box component="span" sx={{ color: '#00d4ff' }}>Manager 🗂️</Box>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="outlined" onClick={() => setExportHubOpen(true)}
            sx={{ flex: { xs: 1, sm: 'none' }, borderColor: 'rgba(255,255,255,0.1)', color: '#fff', py: 1.5, px: 3, fontWeight: 700,
              '&:hover': { borderColor: '#00d4ff', color: '#00d4ff', bgcolor: 'rgba(0,212,255,0.05)' } }}>
            Export 📥
          </Button>
          <Button variant="contained" onClick={() => setAddOpen(true)} startIcon={<AddIcon />}
            sx={{ flex: { xs: 1, sm: 'none' }, py: 1.5, px: 3, fontWeight: 800,
              background: 'linear-gradient(135deg, #b06aff 0%, #7b35cc 100%)', boxShadow: '0 8px 32px rgba(176,106,255,0.3)' }}>
            Add New
          </Button>
        </Box>
      </Box>

      {/* DESKTOP FIX: Responsive Search and Filters Row */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
        <TextField size="small" placeholder="Search exercises..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} /></InputAdornment> }}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.02)' } }}
        />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label="All" onClick={() => setFilterCat('')} size="small"
            sx={{ cursor: 'pointer', fontWeight: 700, py: 2, px: 1, borderRadius: 2,
              bgcolor: !filterCat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: !filterCat ? '#00d4ff' : 'text.secondary',
              border: !filterCat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent' }} />
          {CATEGORIES.map(cat => (
            <Chip key={cat} label={`${CATEGORY_EMOJI[cat]} ${cat}`} size="small"
              onClick={() => setFilterCat(cat === filterCat ? '' : cat)}
              sx={{ cursor: 'pointer', fontWeight: 700, py: 2, px: 1, borderRadius: 2,
                bgcolor: filterCat === cat ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: filterCat === cat ? '#00d4ff' : 'text.secondary',
                border: filterCat === cat ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent' }} />
          ))}
        </Box>
      </Box>

      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 1.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''} Database
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <List dense disablePadding>
          {filtered.map((ex, i) => (
            <React.Fragment key={ex._id}>
              {i > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
              <ListItemButton onClick={() => setEditExercise(ex)}
                sx={{ 
                  py: 2, px: 3, 
                  display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, 
                  alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 1.5, sm: 2 },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } 
                }}>
                
                {/* Left Side: Name and Categories */}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800 }}>{ex.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`${CATEGORY_EMOJI[ex.category] ?? ''} ${ex.category}`} size="small"
                      sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'rgba(0,212,255,0.1)', color: '#00d4ff', fontWeight: 700 }} />
                    {ex.subcategory && (
                      <Chip label={ex.subcategory} size="small"
                        sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary', fontWeight: 600 }} />
                    )}
                  </Box>
                </Box>

                {/* Right Side: Muscle Weights (Pushed right on desktop) */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, minWidth: { sm: '200px' } }}>
                   {Object.entries((ex.muscleWeights as any) ?? {}).filter(([, v]) => (v as number) > 0).slice(0, 3).map(([k, v]) => (
                     <Chip key={k} label={`${k} ×${v}`} size="small"
                       sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary', fontWeight: 600 }} />
                   ))}
                </Box>

                {/* Archive Button */}
                <IconButton size="small"
                  onClick={e => { e.stopPropagation(); setArchiveConfirmId(ex._id); }}
                  sx={{ position: { xs: 'absolute', sm: 'relative' }, top: { xs: 12, sm: 'auto' }, right: { xs: 12, sm: 'auto' }, opacity: 0.4, '&:hover': { opacity: 1, color: '#ffb800' } }}>
                  <ArchiveIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              </ListItemButton>
            </React.Fragment>
          ))}
        </List>
      </Paper>

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

      {/* Export Hub Dialog */}
      <Dialog open={exportHubOpen} onClose={() => setExportHubOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: 320, textAlign: 'center', border: '1px solid rgba(0, 212, 255, 0.3)', background: 'linear-gradient(180deg, #1a1b1f 0%, #12141a 100%)' } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#00d4ff', pb: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
          <DownloadIcon /> Export Data
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mb: 2 }}>
            Choose which records you'd like to download as a spreadsheet.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button variant="outlined" onClick={exportLifts} sx={{ py: 1.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              💪 Export Lift Logs
            </Button>
            <Button variant="outlined" onClick={exportCardio} sx={{ py: 1.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              🏃 Export Cardio Logs
            </Button>
            <Button variant="outlined" onClick={exportExercises} sx={{ py: 1.5, fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              🗂️ Export Master Exercise List
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button onClick={() => setExportHubOpen(false)} sx={{ color: 'text.secondary', fontWeight: 700 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMsg} autoHideDuration={2500} onClose={() => setSuccessMsg('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} sx={{ bottom: '80px !important' }}>
        <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 700 }}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}