// src/components/InstallScreen.tsx
import React, { useState } from 'react';
import { Box, Typography, Paper, Button, IconButton, Chip } from '@mui/material';
import AppleIcon from '@mui/icons-material/Apple';
import AndroidIcon from '@mui/icons-material/Android';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CheckIcon from '@mui/icons-material/Check';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';

const Step = ({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
    <Box sx={{ color: '#00d4ff', mt: 0.2 }}>{icon}</Box>
    <Typography sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.4 }}>
      {text}
    </Typography>
  </Box>
);

const DeviceCard = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRadius: 3,
      cursor: 'pointer',
      bgcolor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.2s ease',
      '&:hover': {
        bgcolor: 'rgba(0, 212, 255, 0.05)',
        borderColor: 'rgba(0, 212, 255, 0.4)',
        transform: 'translateY(-2px)'
      },
      '&:active': { transform: 'scale(0.98)' }
    }}
  >
    <Box sx={{ color: '#f0f0f0', display: 'flex', alignItems: 'center' }}>{icon}</Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#f0f0f0' }}>{label}</Typography>
  </Paper>
);

export const InstallScreen = ({ onBypass }: { onBypass: () => void }) => {
  const [device, setDevice] = useState<'ios' | 'android' | null>(null);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'radial-gradient(ellipse at top, #12141a 0%, #0d0d0f 60%)', 
        px: 3, 
        py: 6, 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {!device ? (
        <Box sx={{ maxWidth: 360, width: '100%', textAlign: 'center', zIndex: 10, animation: 'fadeIn 0.4s ease-out' }}>
          
          <Box sx={{ 
            width: 80, height: 80, mx: 'auto', mb: 4, borderRadius: '50%', 
            background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.3)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.15)' 
          }}>
            <InstallMobileIcon sx={{ fontSize: 40, color: '#00d4ff' }} />
          </Box>
          
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, lineHeight: 1.1 }}>
            Install<br/>
            <Box component="span" sx={{ color: '#00d4ff' }}>Protocol</Box>
          </Typography>
          
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', mb: 5, px: 1, lineHeight: 1.6 }}>
            To ensure maximum reliability offline and preserve your session, this tool must be installed directly to your device.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <DeviceCard icon={<AppleIcon sx={{ fontSize: 26 }} />} label="I have an iPhone" onClick={() => setDevice('ios')} />
            <DeviceCard icon={<AndroidIcon sx={{ fontSize: 26 }} />} label="I have an Android" onClick={() => setDevice('android')} />
          </Box>

        </Box>
      ) : (
        <Paper 
          sx={{ 
            maxWidth: 380, width: '100%', p: { xs: 3, sm: 4 }, borderRadius: 4, 
            position: 'relative', bgcolor: '#16171a', border: '1px solid rgba(255,255,255,0.08)', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 10, animation: 'slideUp 0.3s ease-out' 
          }}
        >
          <IconButton 
            onClick={() => setDevice(null)} 
            sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary', bgcolor: 'rgba(255,255,255,0.03)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, pr: 4 }}>
            {device === 'ios' ? 'iOS Installation' : 'Android Installation'}
          </Typography>
          
          {device === 'ios' ? (
            <Chip 
              label="Must be in Safari Browser" size="small" 
              sx={{ bgcolor: 'rgba(255, 77, 109, 0.15)', color: '#ff4d6d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 4, border: '1px solid rgba(255, 77, 109, 0.3)', borderRadius: 2 }} 
            />
          ) : (
            <Chip 
              label="Must be in Chrome Browser" size="small" 
              sx={{ bgcolor: 'rgba(0, 224, 150, 0.15)', color: '#00e096', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 4, border: '1px solid rgba(0, 224, 150, 0.3)', borderRadius: 2 }} 
            />
          )}

          <Box sx={{ mb: 4 }}>
            {device === 'ios' ? (
              <>
                <Step icon={<MoreHorizIcon />} text={<>Tap the <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>3-dot menu</Box>.</>} />
                <Step icon={<IosShareIcon />} text={<>Tap the <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>Share icon</Box>.</>} />
                <Step icon={<AddBoxIcon />} text={<>Scroll down and tap <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>Add to Home Screen</Box>.</>} />
                <Step icon={<CheckIcon />} text={<>Tap <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>Add</Box> in the top right corner.</>} />
              </>
            ) : (
              <>
                <Step icon={<MoreVertIcon />} text={<>Tap the <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>3-dot menu</Box> in the top right corner.</>} />
                <Step icon={<AddBoxIcon />} text={<>Scroll down and tap <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>Add to Home screen</Box>.</>} />
                <Step icon={<CheckIcon />} text={<>Tap <Box component="span" sx={{ color: '#fff', fontWeight: 700 }}>Install</Box> on the popup.</>} />
              </>
            )}
          </Box>

          <Button 
            fullWidth onClick={() => setDevice(null)} 
            sx={{ py: 1.5, bgcolor: 'rgba(255,255,255,0.05)', color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', borderRadius: 3, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' } }}
          >
            Back
          </Button>
        </Paper>
      )}

      <Button 
        disableRipple 
        onClick={onBypass} 
        sx={{ mt: 6, color: 'text.secondary', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', textDecoration: 'underline', textUnderlineOffset: 4, zIndex: 10, '&:hover': { color: '#00d4ff', bgcolor: 'transparent' } }}
      >
        Continue in browser (Not Recommended)
      </Button>

      {/* Simple inline CSS animations for smooth transitions */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Box>
  );
};