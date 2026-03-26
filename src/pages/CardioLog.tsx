import React, { useState, useEffect } from 'react';
import type { CardioSession, TimeGoal } from '../types/database';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  LinearProgress, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { dbService } from '../services/database';

const CARDIO_ACTIVITIES = [
  'Running',
  'Cycling',
  'Swimming',
  'Rowing',
  'Elliptical',
  'Stair Climber',
  'Jump Rope',
  'Hiking',
  'Walking',
  'Other',
];

const CardioLog: React.FC = () => {
  const [activityType, setActivityType] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState('30');
  const [distance, setDistance] = useState('');
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const [cardioType, setCardioType] = useState<'zone2' | 'anaerobic'>('zone2');
  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [timeGoals, setTimeGoals] = useState<Record<string, TimeGoal>>({
    zone2: { id: 'zone2', weeklyGoal: 150, currentWeekProgress: 0, lastUpdated: new Date() },
    anaerobic: { id: 'anaerobic', weeklyGoal: 75, currentWeekProgress: 0, lastUpdated: new Date() }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Load sessions and time goals on component mount
  useEffect(() => {
    loadSessions();
    loadTimeGoals();
  }, []);

  const loadSessions = async () => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Load last 30 days
      const sessions = await dbService.getCardioSessions(startDate);
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    }
  };

  const loadTimeGoals = async () => {
    try {
      const goals = await dbService.getTimeGoals();
      setTimeGoals(goals);
    } catch (error) {
      console.error('Error loading time goals:', error);
      // Set default goals if loading fails
      setTimeGoals({
        zone2: { id: 'zone2', weeklyGoal: 150, currentWeekProgress: 0, lastReset: new Date().toISOString() },
        anaerobic: { id: 'anaerobic', weeklyGoal: 75, currentWeekProgress: 0, lastReset: new Date().toISOString() }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityType || !time || !date) return;
    
    const timeNum = parseInt(time, 10);
    if (isNaN(timeNum) || timeNum <= 0) {
      // Handle invalid time input
      return;
    }
    
    const distanceNum = distance ? parseFloat(distance) : undefined;
    const rpeNum = rpe ? parseInt(rpe, 10) : undefined;

    setIsSubmitting(true);
    try {
      // Create the cardio session
      const cardioSessionData = {
        activityType,
        date: date,
        time: timeNum,
        distance: distanceNum,
        rpe: rpeNum,
        notes: notes || undefined,
        cardioType, // Include the cardio type
      };
      
      await dbService.createCardioSession(cardioSessionData);

      // Update the time goal progress
      const currentTimeGoal = timeGoals[cardioType];
      if (currentTimeGoal) {
        await dbService.updateTimeGoal(cardioType, {
          currentWeekProgress: (currentTimeGoal.currentWeekProgress || 0) + timeNum,
          lastUpdated: new Date(),
        });
      }

      // Reset form
      setActivityType('');
      setTime('30');
      setDistance('');
      setRpe('');
      setNotes('');
      setCardioType('zone2'); // Reset to default
      
      // Refresh data
      await Promise.all([loadSessions(), loadTimeGoals()]);
    } catch (error) {
      console.error('Error saving cardio session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSessionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    
    try {
      await dbService.deleteCardioSession(sessionToDelete);
      await loadSessions();
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const calculateProgress = (current: number, goal: number): number => {
    if (goal <= 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  };
  
  const formatDate = (dateString: string | Date): string => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Cardio Log
      </Typography>

      {/* Time Goal Progress */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
        {Object.entries(timeGoals).map(([id, goal]) => {
          const progress = calculateProgress(goal.currentWeekProgress, goal.weeklyGoal);
          return (
            <Box key={id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {id === 'zone2' ? 'Zone 2 Cardio' : 'Anaerobic'} Weekly Goal
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {goal.currentWeekProgress} / {goal.weeklyGoal} minutes
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={progress >= 100 ? 'success.main' : 'text.secondary'}
                    fontWeight={progress >= 100 ? 'bold' : 'normal'}
                  >
                    {progress}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  color={progress >= 100 ? 'success' : 'primary'}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    backgroundColor: 'action.disabledBackground',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                    }
                  }}
                />
              </Paper>
            </Box>
          );
        })}
      </Box>

      {/* Log Cardio Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Log Cardio Session
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel id="activity-type-label">Activity Type</InputLabel>
              <Select
                labelId="activity-type-label"
                value={activityType}
                label="Activity Type"
                onChange={(e: SelectChangeEvent) => setActivityType(e.target.value)}
                fullWidth
              >
                {CARDIO_ACTIVITIES.map((activity) => (
                  <MenuItem key={activity} value={activity}>
                    {activity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth required>
              <InputLabel id="cardio-type-label">Cardio Type</InputLabel>
              <Select
                labelId="cardio-type-label"
                value={cardioType}
                label="Cardio Type"
                onChange={(e: SelectChangeEvent) => setCardioType(e.target.value as 'zone2' | 'anaerobic')}
                fullWidth
              >
                <MenuItem value="zone2">Zone 2 (Aerobic)</MenuItem>
                <MenuItem value="anaerobic">Anaerobic</MenuItem>
              </Select>
            </FormControl>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </LocalizationProvider>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mt: 2 }}>
            <TextField
              label="Time (minutes)"
              type="number"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 1, step: 1 }}
            />
            <TextField
              label="Distance (miles)"
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
            />
            <TextField
              label="RPE (1-10)"
              type="number"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              fullWidth
              inputProps={{ min: 1, max: 10, step: 1 }}
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              disabled={isSubmitting || !activityType || !time}
              fullWidth
            >
              {isSubmitting ? 'Saving...' : 'Log Session'}
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Recent Sessions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Sessions
        </Typography>
        {sessions.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
            No cardio sessions logged yet. Add your first session above!
          </Typography>
        ) : (
          <List>
            {sessions.map((session) => (
              <React.Fragment key={session.id}>
                <ListItem sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ mr: 2, mt: 0.5 }}>
                    <FitnessCenterIcon color="primary" />
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" component="span">
                          {session.activityType} - {session.time} min
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(session.date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        {session.distance && (
                          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                            <Typography variant="body2" component="span" color="text.secondary">
                              Distance: {session.distance} mi
                            </Typography>
                          </Box>
                        )}
                        {session.rpe && (
                          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                            <Typography variant="body2" component="span" color="text.secondary">
                              RPE: {session.rpe}/10
                            </Typography>
                          </Box>
                        )}
                        {session.notes && (
                          <Box component="span" sx={{ display: 'block', mt: 1 }}>
                            <Typography variant="body2" component="span" color="text.secondary">
                              {session.notes}
                            </Typography>
                          </Box>
                        )}
                      </>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDeleteClick(session.id)}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this session? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CardioLog;
