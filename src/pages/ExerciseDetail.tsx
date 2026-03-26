import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Button,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
// Remove unused styled import
import { ArrowBack, Add, Close } from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { dbService } from '../services/database';
import { calculateVolume, calculateE1RM, findBestVolumeSet, findHeaviestLift } from '../utils/calculations';
import { Lift, Exercise } from '../types/database';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type RepRange = 'strength' | 'hypertrophy' | 'all';

const ExerciseDetail: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [lifts, setLifts] = useState<Lift[]>([]);
  const [loading, setLoading] = useState(true);
  const [repRange, setRepRange] = useState<RepRange>('all');
  const [showLogLiftForm, setShowLogLiftForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [notes, setNotes] = useState('');
  const [isEachSide, setIsEachSide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!exerciseId) return;
      
      setLoading(true);
      try {
        // Load exercise details
        const ex = await dbService.getExercise(exerciseId);
        if (ex) {
          setExercise(ex);
        } else {
          console.error('Exercise not found');
          return;
        }
        
        // Load lifts for this exercise
        const liftsData = await dbService.getLiftsForExercise(exerciseId);
        setLifts(liftsData);
      } catch (error) {
        console.error('Error loading exercise data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [exerciseId]);

  // Filter lifts based on selected rep range
  const filteredLifts = lifts.filter(lift => {
    if (repRange === 'strength') return lift.reps <= 5;
    if (repRange === 'hypertrophy') return lift.reps > 5;
    return true; // 'all' rep ranges
  });

  // Calculate PRs
  const { weight: heaviestWeight, set: heaviestLift } = findHeaviestLift(filteredLifts);
  const { volume: bestVolume, set: bestVolumeLift } = findBestVolumeSet(filteredLifts);
  const bestE1RMLift = filteredLifts.reduce((best, current) => {
    const currentE1RM = calculateE1RM(current.weight, current.reps);
    const bestE1RM = best ? calculateE1RM(best.weight, best.reps) : 0;
    return currentE1RM > bestE1RM ? current : (best || current);
  }, filteredLifts[0]);
  const bestE1RM = bestE1RMLift ? calculateE1RM(bestE1RMLift.weight, bestE1RMLift.reps) : 0;

  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: filteredLifts.map((_, index) => `Set ${index + 1}`),
    datasets: [
      {
        label: 'Volume (weight × reps)',
        data: filteredLifts.map(lift => calculateVolume(lift.weight, lift.reps, lift.isEachSide)),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Estimated 1RM',
        data: filteredLifts.map(lift => calculateE1RM(lift.weight, lift.reps)),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Performance Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Weight / Volume',
        },
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const handleLogLift = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exercise) return;
    
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);
    const rirNum = rir ? parseFloat(rir) : undefined;
    
    if (isNaN(weightNum) || weightNum <= 0) {
      setError('Please enter a valid weight');
      return;
    }
    
    if (isNaN(repsNum) || repsNum <= 0) {
      setError('Please enter a valid number of reps');
      return;
    }
    
    if (rirNum !== undefined && (rirNum < 0 || rirNum > 10)) {
      setError('RIR must be between 0 and 10');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await dbService.createLift({
        exerciseId: exercise.id,
        weight: weightNum,
        reps: repsNum,
        rir: rirNum,
        isEachSide,
        date: new Date(),
        notes: notes.trim() || undefined,
      });
      
      // Refresh the lifts
      const updatedLifts = await dbService.getLiftsForExercise(exercise.id);
      setLifts(updatedLifts);
      
      // Reset form
      setWeight('');
      setReps('');
      setRir('');
      setNotes('');
      setIsEachSide(false);
      setShowLogLiftForm(false);
    } catch (err) {
      console.error('Error logging lift:', err);
      setError('Failed to log lift. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exercise) {
    return (
      <Box p={3}>
        <Typography variant="h6">Exercise not found</Typography>
        <Button onClick={() => navigate(-1)}>Go back</Button>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{exercise.name}</Typography>
      </Box>
      
      {/* PR Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Heaviest Lift</Typography>
              <Typography variant="h5">
                {heaviestWeight} lbs
              </Typography>
              {heaviestLift && (
                <Typography variant="body2" color="textSecondary">
                  {heaviestLift.reps} reps × {heaviestLift.weight} lbs
                  {heaviestLift.isEachSide ? ' (each side)' : ''}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Best Volume</Typography>
              <Typography variant="h5">{bestVolume} lbs</Typography>
              {bestVolumeLift && (
                <Typography variant="body2" color="textSecondary">
                  {bestVolumeLift.reps} reps × {bestVolumeLift.weight} lbs
                  {bestVolumeLift.isEachSide ? ' (each side)' : ''}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Estimated 1RM</Typography>
              <Typography variant="h5">{bestE1RM.toFixed(1)} lbs</Typography>
              {bestE1RMLift && (
                <Typography variant="body2" color="textSecondary">
                  Based on {bestE1RMLift.reps} reps × {bestE1RMLift.weight} lbs
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      {/* Chart */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Performance Chart</Typography>
          <ToggleButtonGroup
            value={repRange}
            exclusive
            onChange={(_, newRange) => newRange && setRepRange(newRange)}
            size="small"
          >
            <ToggleButton value="strength">Strength (1-5)</ToggleButton>
            <ToggleButton value="hypertrophy">Hypertrophy (6+)</ToggleButton>
            <ToggleButton value="all">All</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box height={300}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      </Paper>
      
      {/* Lift History */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Lift History</Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setShowLogLiftForm(true)}
          >
            Log New Lift
          </Button>
        </Box>
        {filteredLifts.length === 0 ? (
          <Typography>No lift history found.</Typography>
        ) : (
          <Box>
            {filteredLifts.map((lift, index) => (
              <Box key={lift.id}>
                <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <div>
                    <Typography>
                      {lift.weight} lbs {lift.isEachSide ? 'each side' : ''} × {lift.reps} reps
                    </Typography>
                    {lift.notes && (
                      <Typography variant="body2" color="textSecondary">
                        Notes: {lift.notes}
                      </Typography>
                    )}
                  </div>
                  <Typography variant="body2" color="textSecondary">
                    {new Date(lift.date).toLocaleDateString()}
                  </Typography>
                </Box>
                {index < filteredLifts.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Log Lift Dialog */}
      <Dialog 
        open={showLogLiftForm} 
        onClose={() => !isSubmitting && setShowLogLiftForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleLogLift}>
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <span>Log New Lift</span>
              <IconButton 
                onClick={() => setShowLogLiftForm(false)}
                disabled={isSubmitting}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              {exercise?.name}
            </Typography>
            
            {error && (
              <Typography color="error" gutterBottom>
                {error}
              </Typography>
            )}
            
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
              <TextField
                label="Weight (lbs)"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.5 }}
                disabled={isSubmitting}
              />
              
              <TextField
                label="Reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                required
                fullWidth
                inputProps={{ min: 1 }}
                disabled={isSubmitting}
              />
            </Box>
            
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
              <TextField
                label="RIR (optional)"
                type="number"
                value={rir}
                onChange={(e) => setRir(e.target.value)}
                fullWidth
                inputProps={{ min: 0, max: 10, step: 0.5 }}
                disabled={isSubmitting}
                helperText="Reps in Reserve (0-10)"
              />
              
              <Box display="flex" alignItems="center">
                <input
                  type="checkbox"
                  id="eachSide"
                  checked={isEachSide}
                  onChange={(e) => setIsEachSide(e.target.checked)}
                  disabled={isSubmitting}
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="eachSide">Each Side</label>
              </Box>
            </Box>
            
            <TextField
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              disabled={isSubmitting}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowLogLiftForm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ExerciseDetail;
