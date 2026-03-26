import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  TextField, 
  InputAdornment,
  CircularProgress,
  Button,
  useTheme,
  Paper
} from '@mui/material';
import { 
  FitnessCenter as FitnessCenterIcon, 
  Search as SearchIcon, 
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { dbService } from '../services/database';
import { Exercise } from '../types/database';
import AddExerciseDialog from '../components/AddExerciseDialog';

const ExerciseSelection: React.FC = () => {
  const theme = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialExerciseName, setInitialExerciseName] = useState('');
  const navigate = useNavigate();

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      const allExercises = await dbService.getAllExercises();
      setExercises(allExercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  }, [setExercises, setLoading]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [exercises, searchTerm]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const handleOpenAddDialog = (initialName = '') => {
    setInitialExerciseName(initialName);
    setIsAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
    setInitialExerciseName('');
  };

  const handleExerciseAdded = async () => {
    // Refresh the exercises list
    await loadExercises();
    handleCloseAddDialog();
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Exercises
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select an exercise to log or add a new one
        </Typography>
      </Box>
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 3,
          borderRadius: 2,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenAddDialog(searchTerm)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Add New
          </Button>
        </Box>
      
        <List sx={{ maxHeight: '60vh', overflowY: 'auto', borderRadius: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <React.Fragment key={exercise.id}>
                <ListItem disablePadding>
                  <ListItemButton 
                    onClick={() => navigate(`/exercise/${exercise.id}`)}
                    sx={{ py: 1.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <FitnessCenterIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={exercise.name} 
                      primaryTypographyProps={{ 
                        variant: 'body1',
                        sx: { fontWeight: 500 }
                      }}
                    />
                    <ArrowForwardIcon color="action" />
                  </ListItemButton>
                </ListItem>
                <Divider component="li" sx={{ my: 0.5 }} />
              </React.Fragment>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {searchTerm 
                  ? `No exercises found matching "${searchTerm}"`
                  : 'No exercises found. Add your first exercise to get started!'
                }
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenAddDialog(searchTerm)}
                size="large"
                sx={{ mt: 2 }}
              >
                {searchTerm ? `Add "${searchTerm}"` : 'Add New Exercise'}
              </Button>
            </Box>
          )}
        </List>
      </Paper>
      
      {/* Add Exercise Dialog */}
      <AddExerciseDialog
        open={isAddDialogOpen}
        onClose={handleCloseAddDialog}
        initialName={initialExerciseName}
        onExerciseAdded={handleExerciseAdded}
      />
    </Box>
  );
};

export default ExerciseSelection;
