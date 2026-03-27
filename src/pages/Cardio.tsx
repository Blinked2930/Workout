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
import { format } from 'date-fns';

const MOVEMENT_TYPES = ['Run', 'Walk', 'Bike', 'Other'];
const ZONES = [
  { value: 'Zone 2', label: 'Zone 2', emoji: '💚', desc: 'Aerobic / conversational', color: '#00e096' },
  { value: 'Anaerobic', label: 'Anaerobic', emoji: '🔴', desc: 'High intensity / breathless', color: '#ff4d6d' },
];

const MOVEMENT_EMOJI: Record<string, string> = {
  Run: '🏃', Walk: '🚶', Bike: '🚴', Other: '⚡',
};

export default function Cardio() {
  const [open, setOpen] = useState(false);
  const [movementType, setMovementType] = useState('Run');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [rpe, setRpe] = useState('');
  const [zone, setZone] = useState('Zone 2');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const sessions = useQuery(api.cardio.getCardioSessions, {});
  const thisWeek = useQuery(api.cardio.getThisWeeksCardio);
  const logCardio = useMutation(api.cardio.logCardio);

  // Weekly totals
  const zone2Minutes = thisWeek?.filter(s => s.zone === 'Zone 2').reduce((a, s) => a + s.duration, 0) ?? 0;
  const anaerobicMinutes = thisWeek?.filter(s => s.zone === 'Anaerobic').reduce((a, s) => a + s.duration, 0) ?? 0;
  const zone2Goal = 150;
  const anaerobicGoal = 30;

  const handleOpen = () => {
    setMovementType('Run'); setDuration(''); setDistance('');
    setRpe(''); setZone('Zone 2'); setNotes('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!duration || !zone) return;
    await logCardio({
      movementType,
      duration: parseFloat(duration),
      distance: distance ? parseFloat(distance) : undefined,
      rpe: rpe ? parseFloat(rpe) : undefined,
      zone,
      notes: notes || undefined,
    });
    setOpen(false);
    setSuccess(true);
  };

  const recentSessions = sessions?.slice(0, 15) ?? [];

  return (
    <Box sx={{ px: 2, pt: 3, pb: 2, maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff',
          textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5,
        }}>
          Cardio
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          Keep it<br />
          <Box component="span" sx={{ color: '#00d4ff' }}>moving 🏃</Box>
        </Typography>
      </Box>

      {/* Log Cardio Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleOpen}
        startIcon={<AddIcon />}
        sx={{
          py: 2,
          fontSize: '1.1rem',
          fontWeight: 800,
          borderRadius: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #00e096 0%, #00a860 100%)',
          color: '#0d0d0f',
          boxShadow: '0 8px 32px rgba(0,224,150,0.3)',
        }}
      >
        Log Cardio
      </Button>

      {/* Weekly goals */}
      <Typography sx={{
        fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
        textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5,
      }}>
        This Week's Goals
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        {[
          { label: 'Zone 2', emoji: '💚', minutes: zone2Minutes, goal: zone2Goal, color: '#00e096' },
          { label: 'Anaerobic', emoji: '🔴', minutes: anaerobicMinutes, goal: anaerobicGoal, color: '#ff4d6d' },
        ].map(({ label, emoji, minutes, goal, color }) => {
          const pct = Math.min((minutes / goal) * 100, 100);
          const remaining = Math.max(goal - minutes, 0);
          return (
            <Paper key={label} sx={{ p: 2, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '1.1rem' }}>{emoji}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{label}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color }}>
                    {minutes} <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 400 }}>/ {goal} min</Box>
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    backgroundColor: color,
                  },
                }}
              />
              {remaining > 0 && (
                <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>
                  {remaining} min to go
                </Typography>
              )}
              {remaining === 0 && (
                <Typography sx={{ fontSize: '0.7rem', color, mt: 0.5, fontWeight: 700 }}>
                  ✅ Goal smashed!
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>

      {/* Recent sessions */}
      <Typography sx={{
        fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
        textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5,
      }}>
        Recent Sessions
      </Typography>

      {recentSessions.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>🏃</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            No cardio logged yet.<br />Get moving!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recentSessions.map(session => (
            <Paper key={session._id} sx={{ px: 2, py: 1.5, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: '1.3rem' }}>
                  {MOVEMENT_EMOJI[session.movementType] ?? '⚡'}
                </Typography>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {session.movementType}
                    {session.distance ? ` · ${session.distance} mi` : ''}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {format(new Date(session.timestamp), 'MMM d')}
                    {session.rpe ? ` · RPE ${session.rpe}` : ''}
                    {session.notes ? ` · ${session.notes}` : ''}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: session.zone === 'Zone 2' ? '#00e096' : '#ff4d6d' }}>
                  {session.duration}m
                </Typography>
                <Chip
                  label={session.zone}
                  size="small"
                  sx={{
                    fontSize: '0.6rem',
                    height: 18,
                    fontWeight: 700,
                    bgcolor: session.zone === 'Zone 2' ? 'rgba(0,224,150,0.1)' : 'rgba(255,77,109,0.1)',
                    color: session.zone === 'Zone 2' ? '#00e096' : '#ff4d6d',
                  }}
                />
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Log Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Log Cardio 🏃</Typography>
          <IconButton onClick={() => setOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Zone */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Zone
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {ZONES.map(z => (
                <Paper
                  key={z.value}
                  onClick={() => setZone(z.value)}
                  sx={{
                    flex: 1, p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                    border: zone === z.value ? `2px solid ${z.color}` : '2px solid transparent',
                    bgcolor: zone === z.value ? `${z.color}11` : 'rgba(255,255,255,0.03)',
                    transition: 'all 0.15s',
                  }}
                >
                  <Typography sx={{ fontSize: '1.5rem' }}>{z.emoji}</Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: zone === z.value ? z.color : 'text.primary' }}>
                    {z.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{z.desc}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* Movement type */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Activity
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {MOVEMENT_TYPES.map(t => (
                <Chip
                  key={t}
                  label={`${MOVEMENT_EMOJI[t]} ${t}`}
                  onClick={() => setMovementType(t)}
                  sx={{
                    cursor: 'pointer', fontWeight: 700,
                    bgcolor: movementType === t ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                    color: movementType === t ? '#00d4ff' : 'text.secondary',
                    border: movementType === t ? '1px solid rgba(0,212,255,0.4)' : '1px solid transparent',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Duration + Distance */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Duration (min)"
              type="number"
              size="small"
              fullWidth
              value={duration}
              onChange={e => setDuration(e.target.value)}
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Distance (mi)"
              type="number"
              size="small"
              fullWidth
              value={distance}
              onChange={e => setDistance(e.target.value)}
              placeholder="Optional"
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Box>

          {/* RPE */}
          <TextField
            label="RPE (1–10)"
            type="number"
            size="small"
            fullWidth
            value={rpe}
            onChange={e => setRpe(e.target.value)}
            placeholder="Optional — how hard was it?"
            inputProps={{ min: 1, max: 10 }}
          />

          {/* Notes */}
          <TextField
            label="Notes"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!duration}
            sx={{
              flex: 1, py: 1.5,
              background: 'linear-gradient(135deg, #00e096 0%, #00a860 100%)',
              color: '#0d0d0f',
            }}
          >
            Save Cardio ✅
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={success} autoHideDuration={2500} onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: '80px !important' }}
      >
        <Alert severity="success" sx={{ borderRadius: 3, fontWeight: 700 }}>
          Cardio logged! 🔥
        </Alert>
      </Snackbar>
    </Box>
  );
}