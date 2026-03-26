import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { dbService } from '../services/database';
import type { MainCategory, SubCategory } from '../types/database';

const CategoryManager: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<MainCategory & SubCategory> | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [selectedMainCategory, setSelectedMainCategory] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Check for new exercise query parameter
  const newExerciseName = searchParams.get('newExercise');

  const loadCategories = async () => {
    try {
      const [mains, subs] = await Promise.all([
        dbService.getAllMainCategories(),
        dbService.getAllSubCategories()
      ]);
      setMainCategories(mains);
      setSubCategories(subs);
    } catch (error) {
      console.error('Error loading categories:', error);
      showSnackbar('Error loading categories', 'error');
    }
  };

  useEffect(() => {
    loadCategories();
    
    // If there's a new exercise name in the URL, open the exercise creation dialog
    if (newExerciseName) {
      setCurrentTab(1); // Switch to subcategories tab
      // Wait for categories to load before opening dialog
      const timer = setTimeout(() => {
        setCategoryName(newExerciseName);
        setOpenDialog(true);
        // Remove the query parameter from the URL
        searchParams.delete('newExercise');
        setSearchParams(searchParams, { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [newExerciseName]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleOpenDialog = (category?: Partial<MainCategory & SubCategory>) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name || '');
      if ('mainCategoryId' in category && category.mainCategoryId) {
        setSelectedMainCategory(category.mainCategoryId);
      } else {
        setSelectedMainCategory('');
      }
    } else {
      setEditingCategory(null);
      setCategoryName('');
      setSelectedMainCategory('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setCategoryName('');
    setSelectedMainCategory('');
  };

  const handleSaveCategory = async () => {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      showSnackbar('Name cannot be empty', 'error');
      return;
    }
    
    // If we're creating a subcategory and no main category is selected
    if (currentTab === 1 && !selectedMainCategory) {
      showSnackbar('Please select a main category', 'error');
      return;
    }

    const now = new Date();
    
    try {
      if (currentTab === 0) {
        // Main category
        if (editingCategory) {
          // For updates, just send the fields that can change
          await dbService.updateMainCategory(editingCategory.id!, { 
            name: trimmedName,
            updatedAt: now
          });
          showSnackbar('Category updated successfully', 'success');
        } else {
          // For creates, just send the required fields
          await dbService.createMainCategory({ 
            name: trimmedName,
            updatedAt: now
          });
          showSnackbar('Category created successfully', 'success');
        }
      } else {
        // Subcategory
        if (!selectedMainCategory) {
          showSnackbar('Please select a main category', 'error');
          return;
        }

        if (editingCategory?.id) {
          // For updates, just send the fields that can change
          await dbService.updateSubCategory(editingCategory.id, { 
            name: trimmedName,
            updatedAt: now
          });
          showSnackbar('Subcategory updated successfully', 'success');
        } else {
          // For creates, just send the required fields
          await dbService.createSubCategory({ 
            name: trimmedName,
            mainCategoryId: selectedMainCategory,
            updatedAt: now
          });
          showSnackbar('Subcategory created successfully', 'success');
        }
      }
      await loadCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving category:', error);
      showSnackbar(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleDeleteCategory = async (category: Partial<MainCategory & SubCategory>) => {
    if (!category.id || !category.name) return;
    
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      if ('mainCategoryId' in category) {
        // Subcategory
        await dbService.deleteSubCategory(category.id);
        showSnackbar('Subcategory deleted successfully', 'success');
      } else {
        // Main category
        await dbService.deleteMainCategory(category.id);
        showSnackbar('Category deleted successfully', 'success');
      }
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showSnackbar(`Error: ${error instanceof Error ? error.message : 'Cannot delete category in use'}`, 'error');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Manage Categories
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add {currentTab === 0 ? 'Category' : 'Subcategory'}
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3, boxShadow: theme.shadows[2] }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Tab label="Main Categories" />
          <Tab label="Subcategories" />
        </Tabs>
        
        <List>
          {currentTab === 0 ? (
            mainCategories.length === 0 ? (
              <ListItem>
                <ListItemText primary="No categories found" />
              </ListItem>
            ) : (
              mainCategories.map((category) => (
                <ListItem key={category.id} divider disablePadding>
                  <ListItemButton>
                    <ListItemText 
                      primary={category.name}
                      secondary={`${subCategories.filter(sc => sc.mainCategoryId === category.id).length} subcategories`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="edit" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(category);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                </ListItem>
              ))
            )
          ) : (
            subCategories.length === 0 ? (
              <ListItem>
                <ListItemText primary="No subcategories found" />
              </ListItem>
            ) : (
              subCategories.map((subcategory) => {
                const mainCat = mainCategories.find(mc => mc.id === subcategory.mainCategoryId);
                return (
                  <ListItem key={subcategory.id} divider disablePadding>
                    <ListItemButton>
                      <ListItemText 
                        primary={subcategory.name}
                        secondary={mainCat ? `Under: ${mainCat.name}` : 'No parent category'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(subcategory);
                          }}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(subcategory);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  </ListItem>
                );
              })
            )
          )}
        </List>
      </Paper>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory?.id ? 'Edit' : 'Add New'} {currentTab === 0 ? 'Main Category' : 'Subcategory'}
        </DialogTitle>
        <DialogContent>
          {currentTab === 1 && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Main Category"
                value={selectedMainCategory}
                onChange={(e) => setSelectedMainCategory(e.target.value)}
                disabled={!!editingCategory?.id}
                variant="outlined"
                margin="normal"
              >
                {mainCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </TextField>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label={`${currentTab === 0 ? 'Main Category' : 'Subcategory'} Name`}
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCategory} 
            color="primary" 
            variant="contained"
            disabled={!categoryName.trim() || (currentTab === 1 && !selectedMainCategory)}
          >
            {editingCategory?.id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity as 'success' | 'error'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryManager;
