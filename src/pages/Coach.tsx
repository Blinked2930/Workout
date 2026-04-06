// src/pages/Coach.tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Slider, Select, MenuItem, FormControl, InputLabel, Checkbox, IconButton, Divider } from '@mui/material';
import { useAction } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

// Define the JSON structure we expect from the AI
interface WorkoutJSON {
  title: string;
  focus: string;
  warmup: { name: string; reps: string }[];
  mainBlock: { name: string; setsReps: string; rest: string; notes: string }[];
  cooldown: { name: string; reps: string }[];
}

export default function Coach() {
  const navigate = useNavigate();

  // Form State
  const [time, setTime] = useState<number>(45);
  const [equipment, setEquipment] = useState<string>('Floor Mode (Bodyweight Only)');
  const [style, setStyle] = useState<string>('Strength & Hypertrophy');
  
  // App State - Load from LocalStorage on mount
  const [workoutData, setWorkoutData] = useState<WorkoutJSON | null>(() => {
    const saved = localStorage.getItem('liftlog_active_workout');
    return saved ? JSON.parse(saved) : null;
  });
  
  // Checkbox State - Load from LocalStorage
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('liftlog_completed_exercises');
    return saved ? JSON.parse(saved) : {};
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const generateWorkout = useAction("ai:generateWorkout");

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (workoutData) {
      localStorage.setItem('liftlog_active_workout', JSON.stringify(workoutData));
    } else {
      localStorage.removeItem('liftlog_active_workout');
    }
  }, [workoutData]);

  useEffect(() => {
    localStorage.setItem('liftlog_completed_exercises', JSON.stringify(completedExercises));
  }, [completedExercises]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setWorkoutData(null); 
    setCompletedExercises({}); // Reset checkboxes for new workout

    try {
      const result = await generateWorkout({
        timeAvailable: time,
        equipment: equipment,
        style: style,
        localTime: new Date().toISOString(),
      });
      
      // Parse the JSON string from the AI into a real JavaScript object
      const parsedData = JSON.parse(result as string);
      setWorkoutData(parsedData);
    } catch (err) {
      console.error(err);
      alert("⚠️ Error generating workout. Check connection or API key.");
    }
    
    setIsGenerating(false);
  };

  const clearSession = () => {
    setWorkoutData(null);
    setCompletedExercises({});
  };

  const toggleComplete = (exerciseName: string) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseName]: !prev[exerciseName]
    }));
  };

  const navigateToLog = (exerciseName: string) => {
    // Send them to the Home page and pass the exercise name in the route state
    // You can intercept this on Home.tsx using useLocation() to auto-fill your dropdown!
    navigate('/', { state: { prefillExercise: exerciseName } });
  };

  return (
    <Box sx={{ px: 2, pt: 3, pb: 10, maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#b06aff', textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.5 }}>
            AI Integration
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 1 }}>
            Coach <AutoAwesomeIcon sx={{ color: '#b06aff', fontSize: '2rem' }} />
          </Typography>
        </Box>
        {workoutData && (
          <Button size="small" color="error" onClick={clearSession} startIcon={<DeleteSweepIcon />}>
            Clear Session
          </Button>
        )}
      </Box>

      {/* Control Panel (Hide if workout is active to save space) */}
      {!workoutData && (
        <Paper sx={{ p: 3, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* ... Control Panel Inputs (Unchanged from before) ... */}
          <Box>
            <Typography sx={{ fontWeight: 700, mb: 1, color: '#00d4ff' }}>Time Available: {time} Minutes</Typography>
            <Slider value={time} onChange={(_, newValue) => setTime(newValue as number)} step={15} marks min={15} max={120} sx={{ color: '#00d4ff' }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Environment</InputLabel>
              <Select value={equipment} label="Environment" onChange={(e) => setEquipment(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="Floor Mode (Bodyweight Only)">Floor Mode (No Gear)</MenuItem>
                <MenuItem value="Bar Mode (Pull-up & Dip Bars)">Bar Mode (Pull/Dip Bars)</MenuItem>
                <MenuItem value="Full Gym Access">Full Gym Access</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Workout Style</InputLabel>
              <Select value={style} label="Workout Style" onChange={(e) => setStyle(e.target.value)} sx={{ borderRadius: 2 }}>
                <MenuItem value="Strength & Hypertrophy">Strength & Muscle</MenuItem>
                <MenuItem value="High Intensity Interval Training (HIIT)">HIIT / Fast Paced</MenuItem>
                <MenuItem value="Calisthenics Circuit (Endurance)">Calisthenics Circuit</MenuItem>
                <MenuItem value="Active Recovery & Mobility">Mobility / Recovery</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Button variant="contained" onClick={handleGenerate} disabled={isGenerating} sx={{ py: 2, borderRadius: 3, fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg, #b06aff 0%, #7c3aed 100%)' }}>
            {isGenerating ? <CircularProgress size={28} sx={{ color: '#fff' }} /> : <><BoltIcon sx={{ mr: 1 }} /> Generate Session</>}
          </Button>
        </Paper>
      )}

      {/* Render the Workout UI natively */}
      {workoutData && (
        <Paper sx={{ p: 0, borderRadius: 4, bgcolor: 'rgba(176, 106, 255, 0.05)', border: '1px solid rgba(176, 106, 255, 0.2)', overflow: 'hidden' }}>
          
          <Box sx={{ p: 3, bgcolor: 'rgba(176, 106, 255, 0.1)' }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#b06aff', mb: 1 }}>{workoutData.title}</Typography>
            <Typography variant="body2" sx={{ color: '#d2a8ff' }}>{workoutData.focus}</Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            
            {/* Warmup */}
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 1.5 }}>1. Warm-up</Typography>
            {workoutData.warmup.map((ex, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>• {ex.name}</Typography>
                <Typography sx={{ color: '#8a8a9a' }}>{ex.reps}</Typography>
              </Box>
            ))}

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Main Block */}
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 2 }}>2. Main Block</Typography>
            {workoutData.mainBlock.map((ex, idx) => {
              const isDone = completedExercises[ex.name] || false;
              return (
                <Paper key={idx} sx={{ 
                  p: 2, mb: 2, borderRadius: 3, 
                  bgcolor: isDone ? 'rgba(0, 224, 150, 0.05)' : 'rgba(255,255,255,0.03)', 
                  border: isDone ? '1px solid rgba(0, 224, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isDone ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox 
                        checked={isDone} 
                        onChange={() => toggleComplete(ex.name)}
                        sx={{ color: '#b06aff', '&.Mui-checked': { color: '#00e096' }, p: 0 }}
                      />
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {ex.name}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={() => navigateToLog(ex.name)}
                      sx={{ bgcolor: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff' }}
                    >
                      <ArrowForwardIosIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ pl: 4 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#00d4ff', fontWeight: 600 }}>{ex.setsReps}</Typography>
                      <Typography variant="body2" sx={{ color: '#8a8a9a' }}>Rest: {ex.rest}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#d2a8ff', fontStyle: 'italic' }}>{ex.notes}</Typography>
                  </Box>
                </Paper>
              );
            })}

            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Cooldown */}
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', mb: 1.5 }}>3. Cooldown</Typography>
            {workoutData.cooldown.map((ex, idx) => (
              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>• {ex.name}</Typography>
                <Typography sx={{ color: '#8a8a9a' }}>{ex.reps}</Typography>
              </Box>
            ))}

          </Box>
        </Paper>
      )}

    </Box>
  );
}