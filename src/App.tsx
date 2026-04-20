// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, BottomNavigation, BottomNavigationAction, Paper, Typography, TextField, Button, Alert, IconButton, Dialog, DialogTitle, DialogContent, Drawer, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Home from './pages/Home';
import Volume from './pages/Volume';
import Progress from './pages/Progress';
import Cardio from './pages/Cardio';
import Coach from './pages/Coach';
import Manual from './pages/Manual'; 
import ExerciseManager from './pages/ExerciseManager';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { UnitProvider, useUnit } from './context/UnitContext'; 

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00d4ff' },
    secondary: { main: '#ff6b35' },
    background: { default: '#0d0d0f', paper: '#16171a' },
    text: { primary: '#f0f0f0', secondary: '#8a8a9a' },
    success: { main: '#00e096' },
    warning: { main: '#ffb800' },
    error: { main: '#ff4d6d' },
  },
  typography: {
    fontFamily: '"Barlow", "Barlow Condensed", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 700, borderRadius: 14, fontSize: '1rem' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
          color: '#0d0d0f',
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
          '&:hover': { boxShadow: '0 6px 28px rgba(0, 212, 255, 0.5)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#16171a',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#16171a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          height: 76, // Taller bottom bar
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#555566',
          '&.Mui-selected': { color: '#00d4ff' },
          minWidth: '50px',
          padding: '8px 0px',
        },
        label: {
          fontFamily: '"Barlow", sans-serif',
          fontWeight: 700,
          fontSize: '0.72rem !important', // Larger text
          marginTop: '4px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 600, fontFamily: '"Barlow", sans-serif' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.04)',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(0,212,255,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#00d4ff' },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          background: '#1a1b1f',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiSlider: {
      styleOverrides: {
        root: { padding: '10px 0' },
      },
    },
  },
});

// NEW 4-HUB NAVIGATION SYSTEM
const NAV_HUBS = [
  { label: 'Log', emoji: '💪', id: 'log_menu' },
  { label: 'Train', emoji: '🧠', id: 'train_menu' },
  { label: 'Stats', emoji: '📈', id: 'stats_menu' },
  { label: 'DB', emoji: '🗂️', path: '/exercises' },
];

function DemoModal() {
  const isDemo = import.meta.env.VITE_IS_DEMO === 'true';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only show if we are in demo mode AND the user hasn't seen it this session
    if (isDemo && sessionStorage.getItem('liftlog_demo_seen') !== 'true') {
      setOpen(true);
    }
  }, [isDemo]);

  const handleClose = () => {
    sessionStorage.setItem('liftlog_demo_seen', 'true');
    setOpen(false);
  };

  if (!isDemo) return null;

  return (
    <Dialog 
      open={open} 
      // Force them to interact with the button to close it
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          textAlign: 'center',
          maxWidth: 400,
          background: 'radial-gradient(ellipse at top, #1a1b1f 0%, #12141a 100%)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.15)',
        }
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '3rem', lineHeight: 1 }}>💪</Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
        LiftLog<Box component="span" sx={{ color: '#00d4ff' }}>PAW</Box>
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: 3 }}>
        A progressive web app built for deep focus and structured training.
      </Typography>
      
      <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#ffb800', fontWeight: 800, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Sandbox Environment
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          Feel free to log sets, create exercises, and explore. Sessions are isolated and the database is automatically wiped and re-seeded periodically.
        </Typography>
      </Box>

      <Button 
        fullWidth 
        variant="contained" 
        size="large" 
        onClick={handleClose}
        sx={{ 
          py: 1.5, 
          fontSize: '1.05rem',
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
          color: '#0d0d0f',
          mb: 2
        }}
      >
        Try the Live Demo ➔
      </Button>
      
      <Button 
        onClick={() => window.location.href = 'https://workout.emmettfrett.com'}
        sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600, '&:hover': { color: '#00d4ff', background: 'transparent' } }}
      >
        Are you the owner? Sign In
      </Button>
    </Dialog>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'log_menu' | 'train_menu' | 'stats_menu' | null>(null);
  const { unit, toggleUnit } = useUnit();

  // Determine which HUB is active based on the current URL
  const getActiveHubIndex = () => {
    const path = location.pathname;
    if (path === '/' || path === '/cardio') return 0;
    if (path === '/coach' || path === '/manual') return 1;
    if (path === '/progress' || path === '/volume') return 2;
    if (path === '/exercises') return 3;
    return 0;
  };

  const handleNavClick = (index: number) => {
    const hub = NAV_HUBS[index];
    if (hub.path) {
      navigate(hub.path);
    } else if (hub.id) {
      setActiveMenu(hub.id as any);
    }
  };

  const handleMenuSelect = (path: string) => {
    setActiveMenu(null);
    navigate(path);
  };

  // Uniform style for drawer items to prevent touch-ripple flickering
  const drawerItemStyle = {
    borderRadius: 3, 
    mb: 1, 
    bgcolor: 'rgba(255,255,255,0.03)', 
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'background-color 0.2s ease',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
    '&:active': { bgcolor: 'rgba(255,255,255,0.08)' }
  };

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #12141a 0%, #0d0d0f 60%)',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');`}</style>

      <DemoModal />

      {/* Global Settings Button */}
      <IconButton 
        onClick={() => setSettingsOpen(true)}
        sx={{ position: 'fixed', top: 16, right: 16, zIndex: 100, bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
      >
        <SettingsIcon sx={{ color: '#fff' }} />
      </IconButton>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} PaperProps={{ sx: { maxWidth: 350, width: '100%', p: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800, textAlign: 'center' }}>Global Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 600 }}>Weight Unit</Typography>
            <Button variant="contained" onClick={toggleUnit} sx={{ bgcolor: '#00d4ff', color: '#000', minWidth: 80 }}>
              {unit.toUpperCase()}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Box sx={{ flex: 1, overflowY: 'auto', pb: '96px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/volume" element={<Volume />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/cardio" element={<Cardio />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/exercises" element={<ExerciseManager />} />
        </Routes>
      </Box>

      {/* BOTTOM NAVIGATION (4 HUBS) */}
      <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, borderRadius: 0 }}>
        <BottomNavigation
          value={getActiveHubIndex()}
          onChange={(_, v) => handleNavClick(v)}
        >
          {NAV_HUBS.map(item => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              icon={<Box sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{item.emoji}</Box>}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {/* LOG DRAWER MENU */}
      <Drawer anchor="bottom" open={activeMenu === 'log_menu'} onClose={() => setActiveMenu(null)} PaperProps={{ sx: { bgcolor: '#16171a', borderRadius: '24px 24px 0 0', p: 2 } }}>
        <Typography sx={{ fontWeight: 800, textAlign: 'center', color: '#00d4ff', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Log Activity</Typography>
        <List>
          <ListItemButton onClick={() => handleMenuSelect('/')} sx={drawerItemStyle}>
            <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>💪</ListItemIcon>
            <ListItemText primary="Lift Logs" secondary="Record sets and reps" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
          <ListItemButton onClick={() => handleMenuSelect('/cardio')} sx={drawerItemStyle}>
            <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>🏃</ListItemIcon>
            <ListItemText primary="Cardio Logs" secondary="Record distance and duration" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        </List>
      </Drawer>

      {/* TRAIN DRAWER MENU */}
      <Drawer anchor="bottom" open={activeMenu === 'train_menu'} onClose={() => setActiveMenu(null)} PaperProps={{ sx: { bgcolor: '#16171a', borderRadius: '24px 24px 0 0', p: 2 } }}>
        <Typography sx={{ fontWeight: 800, textAlign: 'center', color: '#b06aff', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Select Training Mode</Typography>
        <List>
          <ListItemButton onClick={() => handleMenuSelect('/coach')} sx={drawerItemStyle}>
            <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>🧠</ListItemIcon>
            <ListItemText primary="AI Coach" secondary="Generates tailored workouts" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
          <ListItemButton onClick={() => handleMenuSelect('/manual')} sx={drawerItemStyle}>
            <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>🏗️</ListItemIcon>
            <ListItemText primary="Manual Builder" secondary="Select your own exercises" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        </List>
      </Drawer>

      {/* STATS DRAWER MENU */}
      <Drawer anchor="bottom" open={activeMenu === 'stats_menu'} onClose={() => setActiveMenu(null)} PaperProps={{ sx: { bgcolor: '#16171a', borderRadius: '24px 24px 0 0', p: 2 } }}>
        <Typography sx={{ fontWeight: 800, textAlign: 'center', color: '#00d4ff', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>View Statistics</Typography>
        <List>
          <ListItemButton onClick={() => handleMenuSelect('/progress')} sx={drawerItemStyle}>
            <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>📈</ListItemIcon>
            <ListItemText primary="Progress Charts" secondary="Analyze lift history over time" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
          <ListItemButton onClick={() => handleMenuSelect('/volume')} sx={drawerItemStyle}>
            <ListItemIcon sx={{ fontSize: '1.5rem', minWidth: 40 }}>📊</ListItemIcon>
            <ListItemText primary="Volume Tracker" secondary="Track weekly sets per muscle" primaryTypographyProps={{ fontWeight: 700 }} />
          </ListItemButton>
        </List>
      </Drawer>
    </Box>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // 🛑 DEMO MODE AUTO-BYPASS 🛑
    if (import.meta.env.VITE_IS_DEMO === 'true') {
      setIsAuthenticated(true);
      return;
    }

    if (localStorage.getItem('liftlog_auth') === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === import.meta.env.VITE_APP_USERNAME && password === import.meta.env.VITE_APP_PASSWORD) {
      localStorage.setItem('liftlog_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword(''); 
    }
  };

  if (isAuthenticated) return <>{children}</>;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at top, #12141a 0%, #0d0d0f 60%)', px: 3 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1 }}>LiftLog</Typography>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>Welcome back.</Typography>
      </Box>
      <Paper component="form" onSubmit={handleLogin} sx={{ p: 4, borderRadius: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} autoFocus />
        <TextField fullWidth type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} />
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>Incorrect credentials. Try again.</Alert>}
        <Button fullWidth type="submit" variant="contained" size="large" sx={{ py: 1.5, fontSize: '1.1rem' }}>Unlock</Button>
      </Paper>
    </Box>
  );
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UnitProvider> 
          <AuthGate>
            <Router>
              <AppShell />
            </Router>
          </AuthGate>
        </UnitProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}

export default App;