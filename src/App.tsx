// src/App.tsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import Home from './pages/Home';
import Volume from './pages/Volume';
import Progress from './pages/Progress';
import Cardio from './pages/Cardio';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00d4ff' },
    secondary: { main: '#ff6b35' },
    background: {
      default: '#0d0d0f',
      paper: '#16171a',
    },
    text: {
      primary: '#f0f0f0',
      secondary: '#8a8a9a',
    },
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
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 14,
          fontSize: '1rem',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
          color: '#0d0d0f',
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 28px rgba(0, 212, 255, 0.5)',
          },
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
          fontSize: '0.7rem',
          minWidth: 'unset',
        },
        label: {
          fontFamily: '"Barlow", sans-serif',
          fontWeight: 600,
          fontSize: '0.68rem !important',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          fontFamily: '"Barlow", sans-serif',
        },
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
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
});

const NAV_ITEMS = [
  { label: 'Log', emoji: '💪', path: '/' },
  { label: 'Volume', emoji: '📊', path: '/volume' },
  { label: 'Progress', emoji: '📈', path: '/progress' },
  { label: 'Cardio', emoji: '🏃', path: '/cardio' },
];

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = NAV_ITEMS.findIndex(item => item.path === location.pathname);

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #12141a 0%, #0d0d0f 60%)',
    }}>
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&display=swap');`}</style>

      {/* Page content */}
      <Box sx={{ flex: 1, overflowY: 'auto', pb: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/volume" element={<Volume />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/cardio" element={<Cardio />} />
        </Routes>
      </Box>

      {/* Bottom Nav */}
      <Paper
        elevation={0}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderRadius: 0,
        }}
      >
        <BottomNavigation
          value={currentTab === -1 ? 0 : currentTab}
          onChange={(_, newValue) => navigate(NAV_ITEMS[newValue].path)}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={
                <Box sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.emoji}</Box>
              }
            />
          ))}
        </BottomNavigation>
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
        <Router>
          <AppShell />
        </Router>
      </ThemeProvider>
    </ConvexProvider>
  );
}

export default App;