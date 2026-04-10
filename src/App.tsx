// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, BottomNavigation, BottomNavigationAction, Paper, Typography, TextField, Button, Alert, IconButton, Dialog, DialogTitle, DialogContent } from '@mui/material';
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
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#555566',
          '&.Mui-selected': { color: '#00d4ff' },
          minWidth: '40px', // Shrink for mobile
          padding: '6px 0px', // Tighten padding
        },
        label: {
          fontFamily: '"Barlow", sans-serif',
          fontWeight: 700,
          fontSize: '0.6rem !important', // Shrunk for mobile
          marginTop: '2px',
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

const NAV_ITEMS = [
  { label: 'Log', emoji: '💪', path: '/' },
  { label: 'Vol', emoji: '📊', path: '/volume' },
  { label: 'Prog', emoji: '📈', path: '/progress' },
  { label: 'Cardio', emoji: '🏃', path: '/cardio' },
  { label: 'Coach', emoji: '🧠', path: '/coach' },
  { label: 'Build', emoji: '🏗️', path: '/manual' }, 
  { label: 'DB', emoji: '🗂️', path: '/exercises' },
];

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = NAV_ITEMS.findIndex(item => item.path === location.pathname);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const { unit, toggleUnit } = useUnit();

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #12141a 0%, #0d0d0f 60%)',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');`}</style>

      <IconButton 
        onClick={() => setSettingsOpen(true)}
        sx={{ position: 'fixed', top: 16, right: 16, zIndex: 100, bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
      >
        <SettingsIcon sx={{ color: '#fff' }} />
      </IconButton>

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

      <Box sx={{ flex: 1, overflowY: 'auto', pb: '80px' }}>
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

      <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, borderRadius: 0 }}>
        <BottomNavigation
          value={currentTab === -1 ? 0 : currentTab}
          onChange={(_, v) => navigate(NAV_ITEMS[v].path)}
        >
          {NAV_ITEMS.map(item => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={<Box sx={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.emoji}</Box>}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const isAuthed = localStorage.getItem('liftlog_auth');
    if (isAuthed === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      username === import.meta.env.VITE_APP_USERNAME &&
      password === import.meta.env.VITE_APP_PASSWORD
    ) {
      localStorage.setItem('liftlog_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword(''); 
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at top, #12141a 0%, #0d0d0f 60%)',
      px: 3
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');`}</style>
      
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1 }}>
          LiftLog
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800 }}>
          Welcome back.
        </Typography>
      </Box>

      <Paper component="form" onSubmit={handleLogin} sx={{ p: 4, borderRadius: 4, width: '100%', maxWidth: 400, textAlign: 'center' }}>
        <TextField
          fullWidth
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
          autoFocus
        />
        
        <TextField
          fullWidth
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 600 }}>
            Incorrect credentials. Try again.
          </Alert>
        )}

        <Button 
          fullWidth 
          type="submit" 
          variant="contained" 
          size="large"
          sx={{ py: 1.5, fontSize: '1.1rem' }}
        >
          Unlock
        </Button>
      </Paper>
    </Box>
  );
}

function App() {
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running as PWA');
    }
  }, []);

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