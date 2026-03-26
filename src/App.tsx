// src/App.tsx
import React, { useEffect, type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Container,
  Button,
  // Avatar,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  Logout as LogoutIcon,
  Home as HomeIcon,
  FitnessCenter as FitnessCenterIcon,
  DirectionsRun as CardioIcon,
  Menu as MenuIcon,
  AccountCircle as AccountCircleIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { InstallButton } from './components/InstallButton';
import Home from './pages/Home';
import Settings from './pages/Settings';
import CategoryManager from './pages/CategoryManager';
import ExerciseDetail from './pages/ExerciseDetail';
import ExerciseSelection from './pages/ExerciseSelection';
import CardioLog from './pages/CardioLog';
import Login from './pages/Login';
import DataManagement from './pages/DataManagement';
import { AppProviders, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Navigation component
function Navigation() {
  const { currentUser, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    await signOut();
    handleClose();
  };
  
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 700,
            }}
          >
            LiftLog
          </Typography>
          {currentUser ? (
            <>
              <InstallButton />
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/" 
                  startIcon={<HomeIcon />}
                  sx={{ mr: 1 }}
                >
                  Home
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/cardio"
                  startIcon={<CardioIcon />}
                  sx={{ mr: 1 }}
                >
                  Cardio
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/categories"
                  startIcon={<FitnessCenterIcon />}
                  sx={{ mr: 1 }}
                >
                  Categories
                </Button>
                <IconButton
                  size="large"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <AccountCircleIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: { xs: 'flex', sm: 'none' } }}>
                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMenu}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
              
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem component={Link} to="/" onClick={handleClose}>
                  <ListItemIcon>
                    <HomeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Home</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to="/cardio" onClick={handleClose}>
                  <ListItemIcon>
                    <CardioIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Cardio</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to="/categories" onClick={handleClose}>
                  <ListItemIcon>
                    <FitnessCenterIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Categories</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem component={Link} to="/settings" onClick={handleClose}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem component={Link} to="/data-management" onClick={handleClose}>
                  <ListItemIcon>
                    <CloudUploadIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Data Management</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sign Out</ListItemText>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Sign In
            </Button>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
}

// Main App component
function AppContent(): JSX.Element {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Navigation />
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/log-lift" element={<ExerciseSelection />} />
            <Route path="/cardio" element={<CardioLog />} />
            <Route path="/categories" element={<CategoryManager />} />
            <Route path="/exercise/:id" element={<ExerciseDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/data-management" element={<DataManagement />} />
          </Route>
          
          {/* Redirect any unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App(): JSX.Element {
  useEffect(() => {
    // Check if the app is running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running in standalone mode');
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProviders>
        <Router>
          <AppContent />
        </Router>
      </AppProviders>
    </ThemeProvider>
  );
}

export default App;