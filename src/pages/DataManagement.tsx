import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/database';
import Papa from 'papaparse';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Alert, 
  AlertTitle,
  Divider,
  LinearProgress,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  CardHeader
} from '@mui/material';
import { CloudUpload, CloudDownload, Warning as WarningIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

type ImportResult = {
  success: boolean;
  message: string;
  importedCount?: number;
  errorCount?: number;
};

const DataManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      setProgress(0);
      
      // Fetch all data from IndexedDB
      const [lifts, exercises, subCategories, mainCategories] = await Promise.all([
        db.lifts.toArray(),
        db.exercises.toArray(),
        db.subCategories.toArray(),
        db.mainCategories.toArray(),
      ]);
      
      setProgress(25);
      
      // Enrich lift data with exercise and category names
      const enrichedLifts = lifts.map(lift => {
        const exercise = exercises.find(e => e.id === lift.exerciseId);
        const subCategory = exercise ? subCategories.find(sc => sc.id === exercise.subCategoryId) : null;
        const mainCategory = subCategory ? mainCategories.find(mc => mc.id === subCategory.mainCategoryId) : null;
        
        return {
          ...lift,
          exerciseName: exercise?.name || 'Unknown',
          subCategoryName: subCategory?.name || 'Unknown',
          mainCategoryName: mainCategory?.name || 'Unknown',
          date: lift.date ? new Date(lift.date).toISOString().split('T')[0] : '',
          isEachSide: lift.isEachSide ? 'true' : 'false',
          createdAt: lift.createdAt ? new Date(lift.createdAt).toISOString() : '',
          updatedAt: lift.updatedAt ? new Date(lift.updatedAt).toISOString() : '',
        };
      });
      
      setProgress(75);
      
      // Convert to CSV
      const csv = Papa.unparse(enrichedLifts, {
        quotes: true,
        header: true,
        skipEmptyLines: true,
      });
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `liftlog_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setProgress(100);
      setImportResult({
        success: true,
        message: `Successfully exported ${enrichedLifts.length} lifts`,
        importedCount: enrichedLifts.length,
      });
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error exporting data:', error);
      setImportResult({
        success: false,
        message: 'Failed to export data. Please try again.',
      });
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setProgress(0);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const { data } = results;
          if (!data || data.length === 0) {
            throw new Error('No data found in the file');
          }
          
          setProgress(20);
          
          // Process in chunks to avoid blocking the UI
          const chunkSize = 50;
          let successCount = 0;
          let errorCount = 0;
          
          for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async (row: any) => {
              try {
                // Map CSV row to lift data structure
                const liftData = {
                  id: row.id || undefined,
                  exerciseId: row.exerciseId,
                  sets: parseInt(row.sets, 10) || 0,
                  reps: parseInt(row.reps, 10) || 0,
                  weight: parseFloat(row.weight) || 0,
                  weightUnit: row.weightUnit || 'kg',
                  date: row.date ? new Date(row.date) : new Date(),
                  notes: row.notes || '',
                  isEachSide: row.isEachSide === 'true',
                  createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
                  updatedAt: new Date(),
                };
                
                // Save to IndexedDB
                await db.lifts.put(liftData);
                successCount++;
              } catch (error) {
                console.error('Error importing row:', row, error);
                errorCount++;
              }
            });
            
            await Promise.all(chunkPromises);
            setProgress(20 + (i / data.length) * 70);
          }
          
          setProgress(95);
          
          // Update the result
          setImportResult({
            success: errorCount === 0,
            message: `Imported ${successCount} lifts${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
            importedCount: successCount,
            errorCount,
          });
          
          setSnackbarOpen(true);
        } catch (error) {
          console.error('Error importing data:', error);
          setImportResult({
            success: false,
            message: `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errorCount: 1,
          });
          setSnackbarOpen(true);
        } finally {
          setIsLoading(false);
          setProgress(100);
          // Reset file input
          if (event.target) {
            event.target.value = '';
          }
          setTimeout(() => setProgress(0), 1000);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        setImportResult({
          success: false,
          message: `Error parsing CSV file: ${error.message}`,
        });
        setSnackbarOpen(true);
        setIsLoading(false);
        setProgress(0);
      },
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Data Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Export your workout data to a CSV file or import data from a previous export.
      </Typography>
      
      <Divider sx={{ my: 4 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Export Card */}
        <Card variant="outlined">
          <CardHeader 
            title="Export Data" 
            subheader="Export your workout history to a CSV file"
            avatar={<CloudDownload color="primary" />}
          />
          <CardContent>
            <Typography variant="body1" paragraph>
              Download a CSV file containing all your workout data. This file can be used for backup or analysis in other applications.
            </Typography>
            {isLoading && progress > 0 && progress < 100 && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" color="text.secondary">
                  Exporting... {Math.round(progress)}%
                </Typography>
              </Box>
            )}
          </CardContent>
          <CardActions sx={{ p: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleExportData}
              disabled={isLoading}
              startIcon={<CloudDownload />}
            >
              Export All Lifts
            </Button>
          </CardActions>
        </Card>
        
        {/* Import Card */}
        <Card variant="outlined">
          <CardHeader 
            title="Import Data" 
            subheader="Import workout data from a CSV file"
            avatar={<CloudUpload color="primary" />}
          />
          <CardContent>
            <Typography variant="body1" paragraph>
              Import workout data from a previously exported CSV file. Existing records with the same ID will be updated.
            </Typography>
            {importResult && !importResult.success && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Import Error</AlertTitle>
                {importResult.message}
              </Alert>
            )}
            {isLoading && progress > 0 && progress < 100 && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="caption" color="text.secondary">
                  Importing... {Math.round(progress)}%
                </Typography>
              </Box>
            )}
          </CardContent>
          <CardActions sx={{ p: 2 }}>
            <Button 
              component="label" 
              variant="outlined" 
              color="primary"
              disabled={isLoading}
              startIcon={<CloudUpload />}
            >
              Import Lifts
              <VisuallyHiddenInput 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </Button>
          </CardActions>
        </Card>
        
        <Alert severity="warning" icon={<WarningIcon />}>
          <AlertTitle>Important Notice</AlertTitle>
          <Typography variant="body2">
            When importing data, please ensure the CSV file follows the expected format. 
            Only CSV files exported from this application are guaranteed to work correctly.
          </Typography>
        </Alert>
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={importResult?.success ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {importResult?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DataManagement;
