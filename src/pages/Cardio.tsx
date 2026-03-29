// src/pages/Cardio.tsx
import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, IconButton,
  Snackbar, Alert, LinearProgress,
} from '@mui/material';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const MOVEMENT_TYPES = [
  { value: 'Run', emoji: '🏃' },
  { value: 'Walk', emoji: '🚶' },
  { value: 'Bike', emoji: '🚴' },
  { value: 'Swim', emoji: '🏊' },
  { value: 'Row', emoji: '🚣' },
  { value: 'Jump Rope', emoji: '🪢' },
  { value: 'Hike', emoji: '🥾' },
  { value: 'Elliptical', emoji: '⚙️' },
  { value: 'Stair Climb', emoji: '🪜' },
  { value: 'Martial Arts', emoji: '🥋' },
  { value: 'Sport', emoji: '⚽' },
  { value: 'Other', emoji: '⚡' },
];

const ZONES = [
  { value: 'Zone 2', emoji: '💚', desc: 'Aerobic · conversational pace', color: '#00e096' },
  { value: 'Anaerobic', emoji: '🔴', desc: 'High intensity · breathless', color: '#ff4d6d' },
];

const emptyForm = () => ({
  movementType: 'Run',
  duration: '',
  distance: '',
  rpe: '',
  zone: 'Zone 2',
  notes: '',
  timestamp: Date.now(),
});

type FormState = ReturnType<typeof emptyForm>;

function CardioForm({
  form, onChange,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
}) {
  const set = (key: keyof FormState, val: string | number) => onChange({ ...form, [key]: val });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          label="Date & Time"
          value={new Date(form.timestamp)}
          onChange={(newValue) => {
            if (newValue) set('timestamp', newValue.getTime());
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
                  color: '#00e096',
                },
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(0, 224, 150, 0.04)',
                  '& fieldset': { borderColor: 'rgba(0, 224, 150, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(0, 224, 150, 0.4)' },
                }
              } 
            }
          }}
        />
      </LocalizationProvider>

      {/* Zone */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Zone <Box component="span" sx={{ color: '#00d4ff' }}>*</Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {ZONES.map(z => (
            <Paper
              key={z.value}
              onClick={() => set('zone', z.value)}
              sx={{
                flex: 1, p: 1.5, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                border: form.zone === z.value ? `2px solid ${z.color}` : '2px solid transparent',
                bgcolor: form.zone === z.value ? `${z.color}11` : 'rgba(255,255,255,0.03)',
                transition: 'all 0.15s',
              }}
            >
              <Typography sx={{ fontSize: '1.4rem' }}>{z.emoji}</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: form.zone === z.value ? z.color : 'text.primary' }}>
                {z.value}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1.2 }}>{z.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Activity type */}
      <Box>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Activity <Box component="span" sx={{ color: '#00d4ff' }}>*</Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {MOVEMENT_TYPES.map(t => (
            <Chip
              key={t.value}
              label={`${t.emoji} ${t.value}`}
              onClick={() => set('movementType', t.value)}
              sx={{
                cursor: 'pointer', fontWeight: 700,
                bgcolor: form.movementType === t.value ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                color: form.movementType === t.value ? '#00d4ff' : 'text.secondary',
                border: form.movementType === t.value ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Duration — required */}
      <TextField
        label="Duration (minutes)"
        type="number" size="small" fullWidth
        value={form.duration}
        onChange={e => set('duration', e.target.value)}
        inputProps={{ min: 1 }}
        required
        helperText="Required"
        FormHelperTextProps={{ sx: { color: '#00d4ff', fontWeight: 700 } }}
      />

      {/* Distance + RPE — optional */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <TextField
          label="Distance (mi)" type="number" size="small" fullWidth
          value={form.distance} onChange={e => set('distance', e.target.value)}
          placeholder="optional" inputProps={{ min: 0, step: 0.1 }}
          helperText="Optional"
        />
        <TextField
          label="RPE (1–10)" type="number" size="small" fullWidth
          value={form.rpe} onChange={e => set('rpe', e.target.value)}
          placeholder="optional" inputProps={{ min: 1, max: 10 }}
          helperText="Optional"
        />
      </Box>

      {/* Notes */}
      <TextField
        label="Notes" size="small" fullWidth multiline rows={2}
        value={form.notes} onChange={e => set('notes', e.target.value)}
        placeholder="optional"
        helperText="Optional"
      />
    </Box>
  );
}

function GoalEditDialog({ open, zone2Goal, anaerobicGoal, onClose, onSave }: {
  open: boolean; zone2Goal: number; anaerobicGoal: number;
  onClose: () => void;
  onSave: (z2: number, an: number) => void;
}) {
  const [z2, setZ2] = useState(zone2Goal.toString());
  const [an, setAn] = useState(anaerobicGoal.toString());
  React.useEffect(() => { setZ2(zone2Goal.toString()); setAn(anaerobicGoal.toString()); }, [zone2Goal, anaerobicGoal]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 800 }}>Edit Weekly Cardio Goals</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField sx={{ mt: 1 }} label="💚 Zone 2 goal (min/week)" type="number" size="small" fullWidth value={z2} onChange={e => setZ2(e.target.value)} />
        <TextField sx={{ mt: 1 }} label="🔴 Anaerobic goal (min/week)" type="number" size="small" fullWidth value={an} onChange={e => setAn(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={() => onSave(parseInt(z2), parseInt(an))} sx={{ flex: 1 }}>
          Save Goals ✅
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Cardio() {
  const [open, setOpen] = useState(false);
  const [editSession, setEditSession] = useState<any | null>(null);
  const [editGoalsOpen, setEditGoalsOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [zone2Goal, setZone2Goal] = useState(150);
  const [anaerobicGoal, setAnaerobicGoal] = useState(30);
  const [successMsg, setSuccessMsg] = useState('');

  const sessions = useQuery(api.cardio.getCardioSessions, {});
  const thisWeek = useQuery(api.cardio.getThisWeeksCardio);
  const logCardio = useMutation(api.cardio.logCardio);
  const updateCardio = useMutation(api.cardio.updateCardio);
  const deleteCardio = useMutation(api.cardio.deleteCardio);

  const zone2Minutes = thisWeek?.filter(s => s.zone === 'Zone 2').reduce((a, s) => a + s.duration, 0) ?? 0;
  const anaerobicMinutes = thisWeek?.filter(s => s.zone === 'Anaerobic').reduce((a, s) => a + s.duration, 0) ?? 0;

  const handleOpen = () => { setForm(emptyForm()); setOpen(true); };

  const handleEditOpen = (session: any) => {
    setEditSession(session);
    setForm({
      movementType: session.movementType,
      duration: session.duration.toString(),
      distance: session.distance?.toString() ?? '',
      rpe: session.rpe?.toString() ?? '',
      zone: session.zone,
      notes: session.notes ?? '',
      timestamp: session.timestamp,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.duration) return;
    
    if (editSession) {
      await updateCardio({
        id: editSession._id,
        movementType: form.movementType,
        duration: parseFloat(form.duration),
        distance: form.distance ? parseFloat(form.distance) : undefined,
        rpe: form.rpe ? parseFloat(form.rpe) : undefined,
        zone: form.zone,
        notes: form.notes || undefined,
        timestamp: form.timestamp,
      });
      setSuccessMsg('Session updated! 🔄');
    } else {
      await logCardio({
        movementType: form.movementType,
        duration: parseFloat(form.duration),
        distance: form.distance ? parseFloat(form.distance) : undefined,
        rpe: form.rpe ? parseFloat(form.rpe) : undefined,
        zone: form.zone,
        notes: form.notes || undefined,
        timestamp: form.timestamp,
      });
      setSuccessMsg('Cardio logged! 🔥');
    }
    setOpen(false);
    setEditSession(null);
  };

  const handleDeleteClick = (id: any) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteCardio({ id: deleteConfirmId as any });
      setSuccessMsg('Session deleted! 🗑️');
    } catch (err) {
      console.error("Failed to delete session:", err);
      setSuccessMsg('Error deleting session.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const exportToCSV = () => {
    if (!sessions || sessions.length === 0) return;
    
    const headers = ["Date", "Time", "Movement Type", "Duration (min)", "Distance (mi)", "RPE", "Zone", "Notes"];
    const rows = [...sessions].sort((a,b) => a.timestamp - b.timestamp).map(s => {
      const d = new Date(s.timestamp);
      return [
        format(d, 'yyyy-MM-dd'),
        format(d, 'HH:mm:ss'),
        s.movementType,
        s.duration,
        s.distance || '',
        s.rpe || '',
        s.zone || '',
        `"${s.notes || ''}"`
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LiftLog_Cardio_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
            Cardio
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            Keep it<br />
            <Box component="span" sx={{ color: '#00d4ff' }}>moving 🏃</Box>
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          size="small"
          onClick={exportToCSV}
          sx={{ 
            borderColor: 'rgba(255,255,255,0.1)', 
            color: 'text.secondary',
            fontSize: '0.75rem',
            py: 0.5,
            '&:hover': { borderColor: '#00d4ff', color: '#00d4ff', bgcolor: 'rgba(0,212,255,0.05)' }
          }}
        >
          Export CSV 📥
        </Button>
      </Box>

      <Button
        fullWidth variant="contained" size="large" onClick={handleOpen}
        startIcon={<AddIcon />}
        sx={{
          py: 2, fontSize: '1.1rem', fontWeight: 800, borderRadius: 4, mb: 3,
          background: 'linear-gradient(135deg, #00e096 0%, #00a860 100%)',
          color: '#0d0d0f', boxShadow: '0 8px 32px rgba(0,224,150,0.3)',
        }}
      >
        Log Cardio
      </Button>

      {/* Weekly goals */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          This Week's Goals
        </Typography>
        <IconButton size="small" onClick={() => setEditGoalsOpen(true)} sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: '#00d4ff' } }}>
          <EditIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        {[
          { label: 'Zone 2', emoji: '💚', minutes: zone2Minutes, goal: zone2Goal, color: '#00e096' },
          { label: 'Anaerobic', emoji: '🔴', minutes: anaerobicMinutes, goal: anaerobicGoal, color: '#ff4d6d' },
        ].map(({ label, emoji, minutes, goal, color }) => {
          const pct = Math.min((minutes / goal) * 100, 100);
          return (
            <Paper key={label} sx={{ p: 2, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '1.1rem' }}>{emoji}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{label}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color }}>
                  {minutes} <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 400 }}>/ {goal} min</Box>
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate" value={pct}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: color },
                }}
              />
              <Typography sx={{ fontSize: '0.7rem', mt: 0.5, color: pct >= 100 ? color : 'text.secondary', fontWeight: pct >= 100 ? 700 : 400 }}>
                {pct >= 100 ? '✅ Goal smashed!' : `${Math.max(goal - minutes, 0)} min to go`}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Recent sessions */}
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
        Recent Sessions
      </Typography>

      {sessions?.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🏃</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>No cardio logged yet. Get moving!</Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {sessions?.slice(0, 20).map(session => {
            const mt = MOVEMENT_TYPES.find(m => m.value === session.movementType);
            return (
              <Paper key={session._id} sx={{ px: 2, py: 1.5, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '1.3rem' }}>{mt?.emoji ?? '⚡'}</Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {session.movementType}
                      {session.distance ? ` · ${session.distance} mi` : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                      {format(new Date(session.timestamp), "MMM d, h:mm a")}
                      {session.rpe ? ` · RPE ${session.rpe}` : ''}
                    </Typography>
                    {session.notes && (
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontStyle: 'italic', mt: 0.5, borderLeft: '2px solid rgba(255,255,255,0.1)', pl: 1 }}>
                        {session.notes}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ textAlign: 'right', mr: 0.5 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: session.zone === 'Zone 2' ? '#00e096' : '#ff4d6d' }}>
                      {session.duration}m
                    </Typography>
                    <Chip
                      label={session.zone}
                      size="small"
                      sx={{
                        fontSize: '0.6rem', height: 18, fontWeight: 700,
                        bgcolor: session.zone === 'Zone 2' ? 'rgba(0,224,150,0.1)' : 'rgba(255,77,109,0.1)',
                        color: session.zone === 'Zone 2' ? '#00e096' : '#ff4d6d',
                      }}
                    />
                  </Box>
                  <IconButton size="small" onClick={() => handleEditOpen(session)} sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: '#00d4ff' } }}>
                    <EditIcon sx={{ fontSize: '0.85rem' }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteClick(session._id)} sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: '#ff4d6d' } }}>
                    <DeleteIcon sx={{ fontSize: '0.85rem' }} />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Log / Edit Dialog */}
      <Dialog open={open} onClose={() => { setOpen(false); setEditSession(null); }} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {editSession ? 'Edit Session ✏️' : 'Log Cardio 🏃'}
          </Typography>
          <IconButton onClick={() => { setOpen(false); setEditSession(null); }} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <CardioForm form={form} onChange={setForm} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setOpen(false); setEditSession(null); }} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSubmit}
            disabled={!form.duration}
            sx={{
              flex: 1, py: 1.5,
              background: 'linear-gradient(135deg, #00e096 0%, #00a860 100%)',
              color: '#0d0d0f',
            }}
          >
            {editSession ? 'Update ✅' : 'Save Cardio ✅'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit goals dialog */}
      <GoalEditDialog
        open={editGoalsOpen}
        zone2Goal={zone2Goal}
        anaerobicGoal={anaerobicGoal}
        onClose={() => setEditGoalsOpen(false)}
        onSave={(z2, an) => { setZone2Goal(z2); setAnaerobicGoal(an); setEditGoalsOpen(false); }}
      />

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
          Delete Session?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            Are you sure you want to delete this cardio session? This cannot be undone.
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: '80px !important' }}
      >
        <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 700 }}>{successMsg}</Alert>
      </Snackbar>
    </Box>
  );
}