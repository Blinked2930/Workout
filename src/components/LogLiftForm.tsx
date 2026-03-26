import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Snackbar,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
// Import the GridLegacy component from @mui/material for MUI v7 compatibility
import Grid from '@mui/material/GridLegacy';
// Import the DatePicker components with proper types
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';
import { dbService } from '../services/database';
import { Exercise, Lift } from '../types/database';

interface LogLiftFormProps {
  initialExerciseId?: string;
  onLiftLogged?: (lift: Lift) => void;
  subCategoryId?: string;
}

export function LogLiftForm({ 
  initialExerciseId, 
  onLiftLogged,
  subCategoryId 
}: LogLiftFormProps) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [rir, setRir] = useState<string>('');
  const [isEachSide, setIsEachSide] = useState<boolean>(false);
  const [date, setDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  // Load initial exercise if exerciseId is provided
  useEffect(() => {
    const loadInitialExercise = async () => {
      if (initialExerciseId) {
        try {
          const ex = await dbService.getExercise(initialExerciseId);
          if (ex) setExercise(ex);
        } catch (err) {
          console.error('Error loading exercise:', err);
        }
      }
    };
    
    loadInitialExercise();
  }, [initialExerciseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!exercise) {
      setError('Please select an exercise');
      return;
    }
    
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps, 10);
    const rirNum = rir ? parseFloat(rir) : undefined;
    
    if (isNaN(weightNum) || isNaN(repsNum) || weightNum <= 0 || repsNum <= 0) {
      setError('Please enter valid weight and reps');
      return;
    }

    if (rirNum !== undefined && (rirNum < 0 || rirNum > 10)) {
      setError('RIR must be between 0 and 10');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const liftData = {
        exerciseId: exercise.id,
        weight: weightNum,
        reps: repsNum,
        ...(rirNum !== undefined && { rir: rirNum }), // Only include rir if it's defined
        isEachSide,
        date: date || new Date(),
        notes: notes.trim() || undefined,
      };
      
      const liftId = await dbService.createLift(liftData);
      const newLift = { ...liftData, id: liftId, createdAt: new Date(), updatedAt: new Date() };
      
      // Reset form
      if (!initialExerciseId) {
        setExercise(null);
      }
      setWeight('');
      setReps('');
      setRir('');
      setNotes('');
      
      setSuccessOpen(true);
      onLiftLogged?.(newLift);
    } catch (err) {
      console.error('Error logging lift:', err);
      let errorMessage = 'Failed to log lift. Please try again.';
      
      // Provide more specific error messages based on the error type
      if (err instanceof Error) {
        if (err.message.includes('ConstraintError')) {
          errorMessage = 'A lift with these details already exists.';
        } else if (err.message.includes('DataError')) {
          errorMessage = 'Invalid data provided. Please check your inputs.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Log New Lift
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2} component="div">
          <Grid item xs={12} component="div" sx={{ mt: 2 }}>
            <ExerciseAutocomplete
              value={exercise}
              onChange={setExercise}
              subCategoryId={subCategoryId}
              textFieldProps={{
                label: 'Exercise',
                required: true,
                fullWidth: true,
                margin: 'normal' as const
              }}
            />
          </Grid>
          
          <Grid item xs={6} sm={4} component="div" sx={{ mt: 2 }}>
            <TextField
              label="Weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
              margin="normal"
              InputProps={{
                endAdornment: (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    lbs
                  </Typography>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={6} sm={4} component="div" sx={{ mt: 2 }}>
            <TextField
              label="Reps"
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              required
              fullWidth
              inputProps={{ min: 1, step: 1 }}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={6} sm={4} sx={{ mt: 2 }}>
            <TextField
              label="RIR (optional)"
              type="number"
              value={rir}
              onChange={(e) => setRir(e.target.value)}
              fullWidth
              inputProps={{ min: 0, max: 10, step: 0.5 }}
              margin="normal"
              helperText="Reps in Reserve"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Weight Type</InputLabel>
              <Select
                value={isEachSide ? 'each' : 'total'}
                onChange={(e: SelectChangeEvent<string>) => 
                  setIsEachSide(e.target.value === 'each')
                }
                label="Weight Type"
              >
                <MenuItem value="total">Total Weight (e.g., barbell)</MenuItem>
                <MenuItem value="each">Per Side (e.g., dumbbell)</MenuItem>
              </Select>
              <FormHelperText>
                {isEachSide ? 'Weight is per side' : 'Weight is total'}
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} sm={4} component="div" sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newValue) => {
                  if (newValue) {
                    setDate(newValue);
                  }
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal' as const,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} component="div" sx={{ mt: 2 }}>
            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} component="div" sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={!exercise || !weight || !reps}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 'Log Lift'}
            </Button>
          </Grid>
          
          {error && (
            <Grid item xs={12} component="div" sx={{ mt: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
        </Grid>
      </form>
      
      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={handleSuccessClose}
        message="Lift logged successfully!"
      />
    </Paper>
  );
}
