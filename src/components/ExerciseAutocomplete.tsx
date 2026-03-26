import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { 
  TextField, 
  Autocomplete, 
  Box, 
  Typography, 
  TextFieldProps,
  CircularProgress,
  createFilterOptions,
} from '@mui/material';
import { dbService } from '../services/database';
import { Exercise } from '../types/database';

interface ExerciseOptionType {
  inputValue?: string;
  title: string;
  isNew?: boolean;
  exercise?: Exercise;
}

interface ExerciseAutocompleteProps {
  value: Exercise | null;
  onChange: (exercise: Exercise | null) => void;
  subCategoryId?: string;
  textFieldProps?: TextFieldProps;
}

const filter = createFilterOptions<ExerciseOptionType>();

export const ExerciseAutocomplete: React.FC<ExerciseAutocompleteProps> = ({
  value,
  onChange,
  subCategoryId,
  textFieldProps = {},
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ExerciseOptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let active = true;
    
    if (!open) {
      return undefined;
    }

    setLoading(true);
    
    const fetchExercises = async () => {
      try {
        let exercises: Exercise[] = [];
        
        if (inputValue.trim()) {
          // If there's search input, use searchExercises
          exercises = await dbService.searchExercises(inputValue, subCategoryId);
        } else if (subCategoryId) {
          // If no search input but we have a subcategory, get all exercises for that subcategory
          exercises = await dbService.getExercisesBySubCategory(subCategoryId);
        } else {
          // Otherwise get all exercises
          exercises = await dbService.getAllExercises();
        }

        if (active) {
          const exerciseOptions: ExerciseOptionType[] = exercises.map((ex: Exercise) => ({
            title: ex.name,
            exercise: ex
          }));
          setOptions(exerciseOptions);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchExercises();

    return () => {
      active = false;
    };
  }, [open, subCategoryId, inputValue]);

  // Fetch exercises based on current state
  const fetchExercises = useCallback(async () => {
    let active = true;
    setLoading(true);
    
    try {
      let exercises: Exercise[] = [];
      
      if (inputValue.trim()) {
        // If there's search input, use searchExercises
        exercises = await dbService.searchExercises(inputValue, subCategoryId);
      } else if (subCategoryId) {
        // If no search input but we have a subcategory, get all exercises for that subcategory
        exercises = await dbService.getExercisesBySubCategory(subCategoryId);
      } else {
        // Otherwise get all exercises
        exercises = await dbService.getAllExercises();
      }

      if (active) {
        const exerciseOptions: ExerciseOptionType[] = exercises.map((ex: Exercise) => ({
          title: ex.name,
          exercise: ex
        }));
        setOptions(exerciseOptions);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      if (active) {
        setLoading(false);
      }
    }

    return () => {
      active = false;
    };
  }, [inputValue, open, subCategoryId]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(() => {
      fetchExercises();
    }, 300),
    [fetchExercises]
  );

  // Trigger search when input changes
  useEffect(() => {
    if (open) {
      debouncedSearch();
    }
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [inputValue, open, debouncedSearch]);

  useEffect(() => {
    if (!open) {
      setOptions([]);
      setInputValue('');
    }
  }, [open]);

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: ExerciseOptionType | string | null
  ) => {
    if (typeof newValue === 'string') {
      // User is typing
      return;
    }

    if (newValue?.inputValue) {
      // User wants to create a new exercise
      const newExercise: Exercise = {
        id: '', // Will be set by the database
        name: newValue.inputValue,
        subCategoryId: subCategoryId || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Create the new exercise and call onChange with it
      const createAndSetExercise = async () => {
        try {
          const id = await dbService.createExercise(newExercise);
          onChange({ ...newExercise, id });
        } catch (error) {
          console.error('Error creating exercise:', error);
        }
      };
      
      createAndSetExercise();
    } else if (newValue?.exercise) {
      // User selected an existing exercise
      onChange(newValue.exercise);
    } else {
      // Clear the selection
      onChange(null);
    }
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      value={value ? { title: value.name, exercise: value } : null}
      onChange={handleChange}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);
        
        // Add "Create new" option if user has typed something
        if (params.inputValue !== '') {
          filtered.push({
            inputValue: params.inputValue,
            title: `Add "${params.inputValue}"`,
            isNew: true,
          });
        }
        
        return filtered;
      }}
      options={options}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === 'string') {
          return option;
        }
        // Add "New" label for new options
        if (option.isNew) {
          return option.title;
        }
        // Regular option
        return option.title;
      }}
      renderOption={(props, option) => {
        if (option.isNew) {
          return (
            <li {...props}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>+ Create "{option.inputValue}"</Typography>
              </Box>
            </li>
          );
        }
        return (
          <li {...props}>
            <Typography>{option.title}</Typography>
          </li>
        );
      }}
      loading={loading}
      renderInput={(params) => (
        <TextField
          {...params}
          {...textFieldProps}
          label={textFieldProps.label || 'Exercise'}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default ExerciseAutocomplete;
