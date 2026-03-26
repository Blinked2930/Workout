import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import { dbService } from '../services/database';
import type { MainCategory, SubCategory } from '../types/database';

interface AddExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onExerciseAdded: () => void;
}

const AddExerciseDialog: React.FC<AddExerciseDialogProps> = ({
  open,
  onClose,
  initialName = '',
  onExerciseAdded,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [exerciseType, setExerciseType] = useState('barbell');
  const [defaultRestTime, setDefaultRestTime] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load categories when dialog opens
  useEffect(() => {
    if (open) {
      loadCategories();
      if (initialName) {
        setName(initialName);
      }
    } else {
      // Reset form when dialog is closed
      setName('');
      setSelectedMainCategory('');
      setSelectedSubCategory('');
      setExerciseType('barbell');
      setDefaultRestTime(90);
      setError('');
    }
  }, [open, initialName]);

  const loadCategories = async () => {
    try {
      const [mains, subs] = await Promise.all([
        dbService.getAllMainCategories(),
        dbService.getAllSubCategories(),
      ]);
      setMainCategories(mains);
      setSubCategories(subs);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories. Please try again.');
    }
  };

  // Update subcategories when main category changes
  useEffect(() => {
    if (selectedMainCategory) {
      const filtered = subCategories.filter(
        (sub) => sub.mainCategoryId === selectedMainCategory
      );
      if (filtered.length > 0) {
        setSelectedSubCategory(filtered[0].id);
      } else {
        setSelectedSubCategory('');
      }
    } else {
      setSelectedSubCategory('');
    }
  }, [selectedMainCategory, subCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!name.trim()) {
      setError('Exercise name is required');
      return;
    }
    
    if (!selectedSubCategory) {
      setError('Please select a subcategory');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the exercise
      await dbService.createExercise({
        name: name.trim(),
        subCategoryId: selectedSubCategory,
        exerciseType,
        defaultRestTime,
      });
      
      // Notify parent component
      onExerciseAdded();
      
      // Close the dialog
      onClose();
    } catch (err) {
      console.error('Error creating exercise:', err);
      setError('Failed to create exercise. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Exercise</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Exercise Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
              required
              autoFocus
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="main-category-label">Main Category</InputLabel>
              <Select
                labelId="main-category-label"
                value={selectedMainCategory}
                label="Main Category"
                onChange={(e) => setSelectedMainCategory(e.target.value)}
                required
              >
                {mainCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl 
              fullWidth 
              margin="normal" 
              required
              disabled={!selectedMainCategory}
            >
              <InputLabel id="sub-category-label">Subcategory</InputLabel>
              <Select
                labelId="sub-category-label"
                value={selectedSubCategory}
                label="Subcategory"
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                required
              >
                {subCategories
                  .filter((sub) => sub.mainCategoryId === selectedMainCategory)
                  .map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="exercise-type-label">Exercise Type</InputLabel>
              <Select
                labelId="exercise-type-label"
                value={exerciseType}
                label="Exercise Type"
                onChange={(e) => setExerciseType(e.target.value)}
              >
                <MenuItem value="barbell">Barbell</MenuItem>
                <MenuItem value="dumbbell">Dumbbell</MenuItem>
                <MenuItem value="machine">Machine</MenuItem>
                <MenuItem value="bodyweight">Bodyweight</MenuItem>
                <MenuItem value="cable">Cable</MenuItem>
                <MenuItem value="kettlebell">Kettlebell</MenuItem>
                <MenuItem value="band">Resistance Band</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Default Rest Time (seconds)"
              type="number"
              value={defaultRestTime}
              onChange={(e) => setDefaultRestTime(Number(e.target.value) || 0)}
              fullWidth
              margin="normal"
              inputProps={{ min: 0, step: 5 }}
            />
            
            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Exercise'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddExerciseDialog;
