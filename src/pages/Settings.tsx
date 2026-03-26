import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemIcon, 
  ListItemText, 
  Divider 
} from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import CategoryIcon from '@mui/icons-material/Category';
import SettingsIcon from '@mui/icons-material/Settings';

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

const Settings: React.FC = () => {
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { 
      text: 'Categories', 
      icon: <CategoryIcon />, 
      path: '/settings/categories',
      description: 'Manage exercise categories and subcategories'
    },
    // Add more settings items here as needed
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Sidebar */}
        <Paper sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0, mb: { xs: 3, md: 0 } }}>
          <List>
            <ListItem>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <Divider />
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              return (
                <ListItem 
                  key={item.path} 
                  disablePadding
                  sx={{
                    '& .MuiListItemButton-root': {
                      color: isSelected ? 'primary.main' : 'inherit',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'action.selected',
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        },
                      },
                    },
                  }}
                >
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    selected={isSelected}
                    sx={{
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        variant: 'body1',
                        color: isSelected ? 'primary' : 'text.primary',
                        fontWeight: isSelected ? 'medium' : 'regular'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Paper>
        
        {/* Main content */}
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Container>
  );
};

export default Settings;
