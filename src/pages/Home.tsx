import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SettingsIcon from '@mui/icons-material/Settings';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import AddIcon from '@mui/icons-material/Add';

const Home: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          py: 4
        }}
      >
        <FitnessCenterIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Lift Log
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph sx={{ maxWidth: 600, mb: 6 }}>
          Track your workouts, monitor your progress, and achieve your fitness goals with our simple and powerful workout tracker.
        </Typography>
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: 3, 
          width: '100%', 
          maxWidth: 900, 
          mb: 6 
        }}>
          <Paper 
            component={Link}
            to="/log-lift"
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              '&:hover': {
                boxShadow: 3,
              },
            }}
          >
            <AddIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>Log a Lift</Typography>
            <Typography variant="body2" color="text.secondary">
              Record your strength training
            </Typography>
          </Paper>
          
          <Paper 
            component={Link}
            to="/cardio"
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              '&:hover': {
                boxShadow: 3,
              },
            }}
          >
            <DirectionsRunIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>Log Cardio</Typography>
            <Typography variant="body2" color="text.secondary">
              Track your cardio sessions
            </Typography>
          </Paper>
          
          <Paper 
            component={Link}
            to="/categories"
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              textDecoration: 'none',
              '&:hover': {
                boxShadow: 3,
              },
            }}
          >
            <SettingsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" gutterBottom>Manage</Typography>
            <Typography variant="body2" color="text.secondary">
              Categories & Settings
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
