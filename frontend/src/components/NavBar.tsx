import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Switch,
  FormControlLabel,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { NavBarProps, NavigationItem } from '../types/navigation';

const navigationItems: NavigationItem[] = [
  { label: 'Main', path: '/main' },
  { label: 'Close-call', path: '/close-call' },
  { label: 'Safety', path: '/safety' },
];

const NavBar: React.FC<NavBarProps> = ({
  onRefresh,
  onToggleChange,
  onNavigationChange,
  toggleValue = false,
  toggleLabel = 'Live Mode',
  activePath = '/main', // default active path
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavItemClick = (item: NavigationItem) => {
    onNavigationChange(item);
  };

  return (
    <AppBar 
      position="static" 
      elevation={1}
      sx={{ 
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: { xs: 56, md: 64 } }}>
        {/* Left Side - Logo/Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              mr: 4,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            KPI-Dashboard
          </Typography>

          {/* Navigation Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                onClick={() => handleNavItemClick(item)}
                sx={{
                  color: item.path === activePath ? 'primary.main' : 'text.secondary',
                  fontWeight: item.path === activePath ? 600 : 400,
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    color: 'primary.main',
                  },
                  '&::after': item.path === activePath ? {
                    content: '""',
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: 'primary.main',
                  } : {},
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Right Side - Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
          {/* Refresh Button */}
          <IconButton
            onClick={onRefresh}
            size="medium"
            sx={{
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
              },
              transition: 'all 0.2s ease-in-out',
            }}
            aria-label="Refresh data"
          >
            <RefreshIcon />
          </IconButton>

          {/* Toggle Switch */}
          <FormControlLabel
            control={
              <Switch
                checked={toggleValue}
                onChange={(e) => onToggleChange(e.target.checked)}
                size={isMobile ? 'small' : 'medium'}
                color="primary"
              />
            }
            label={
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  color: 'text.primary',
                  fontWeight: 500
                }}
              >
                {toggleLabel}
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
      </Toolbar>

      {/* Mobile Navigation */}
      {isMobile && (
        <Toolbar 
          variant="dense" 
          sx={{ 
            justifyContent: 'center',
            borderTop: `1px solid ${theme.palette.divider}`,
            display: { xs: 'flex', md: 'none' }
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                onClick={() => handleNavItemClick(item)}
                size="small"
                sx={{
                  color: item.path === activePath ? 'primary.main' : 'text.secondary',
                  fontWeight: item.path === activePath ? 600 : 400,
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  px: 2,
                  '&::after': item.path === activePath ? {
                    content: '""',
                    position: 'absolute',
                    bottom: -1,
                    left: 8,
                    right: 8,
                    height: 2,
                    backgroundColor: 'primary.main',
                  } : {},
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      )}
    </AppBar>
  );
};

export default NavBar;