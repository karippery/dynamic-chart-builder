// src/components/NavBar.tsx
import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Chip,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import { NavBarProps, NavigationItem } from '../types/navigation';
import { useKPIPresets } from '../hooks/useKPIPresets';
import { AggregationFilters } from '../types/filters';
import { CloseCallFilters } from '../types/closeCall';

const navigationItems: NavigationItem[] = [
  { label: 'Main', path: '/main', icon: <DashboardIcon /> },
  { label: 'Close-call', path: '/close-call', icon: <WarningIcon /> },
  { label: 'Safety', path: '/safety', icon: <SecurityIcon /> },
];

interface NavBarWithPresetsProps extends NavBarProps {
  currentFilters?: any; // Can be AggregationFilters, CloseCallFilters, or SafetyFilters
  onPresetSelect?: (filters: any, pageType: string) => void;
}

const NavBar: React.FC<NavBarWithPresetsProps> = ({
  onRefresh,
  onToggleChange,
  onNavigationChange,
  toggleValue = false,
  toggleLabel = 'Live Mode',
  activePath = '/main',
  currentFilters,
  onPresetSelect,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Preset management
  const {
    presets,
    selectedPresetId,
    createPreset,
    selectPreset,
    getPreset,
    getPresetsByPage,
  } = useKPIPresets();

  // State for preset management
  const [presetMenuAnchor, setPresetMenuAnchor] = useState<null | HTMLElement>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Get current page type from active path
  const getCurrentPageType = (): 'main' | 'close-call' | 'safety' => {
    switch (activePath) {
      case '/close-call': return 'close-call';
      case '/safety': return 'safety';
      default: return 'main';
    }
  };

  const currentPageType = getCurrentPageType();

  const handleNavItemClick = (item: NavigationItem) => {
    onNavigationChange(item);
  };

  // Preset menu handlers
  const handlePresetMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPresetMenuAnchor(event.currentTarget);
  };

  const handlePresetMenuClose = () => {
    setPresetMenuAnchor(null);
  };

  const handleSavePresetClick = () => {
    setSaveDialogOpen(true);
    handlePresetMenuClose();
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      showSnackbar('Preset name is required', 'error');
      return;
    }

    if (currentFilters) {
      createPreset(presetName, currentPageType, currentFilters, presetDescription);
      showSnackbar(`${presetName} preset saved successfully`);
      setSaveDialogOpen(false);
      setPresetName('');
      setPresetDescription('');
    } else {
      showSnackbar('No current filters to save', 'error');
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = getPreset(presetId);
    if (preset && onPresetSelect) {
      selectPreset(presetId);
      onPresetSelect(preset.filters, preset.pageType);
    }
    handlePresetMenuClose();
  };

  const selectedPreset = selectedPresetId ? getPreset(selectedPresetId) : null;

  // Filter presets for current page and other pages
  const currentPagePresets = getPresetsByPage(currentPageType);
  const otherPresets = presets.filter(preset => preset.pageType !== currentPageType);

  // Helper function to get page icon
  const getPageIcon = (pageType: string) => {
    switch (pageType) {
      case 'main': return <DashboardIcon sx={{ fontSize: 16 }} />;
      case 'close-call': return <WarningIcon sx={{ fontSize: 16 }} />;
      case 'safety': return <SecurityIcon sx={{ fontSize: 16 }} />;
      default: return <DashboardIcon sx={{ fontSize: 16 }} />;
    }
  };

  // Helper function to format preset info for display
  const formatPresetInfo = (preset: any) => {
    switch (preset.pageType) {
      case 'main':
        return `Main • ${preset.filters.time_bucket} • ${preset.filters.metric}`;
      case 'close-call':
        return `Close-call • ${preset.filters.date_from} to ${preset.filters.date_to}`;
      case 'safety':
        return `Safety • ${Object.keys(preset.filters).length} filters`;
      default:
        return `${preset.pageType} preset`;
    }
  };

  return (
    <>
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
                  startIcon={item.icon}
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
            {/* Dashboard Configuration - Preset Management */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Current Preset Indicator */}
              {selectedPreset && selectedPreset.pageType === currentPageType && (
                <Chip 
                  label={selectedPreset.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    display: { xs: 'none', md: 'flex' },
                    fontWeight: 500,
                  }}
                />
              )}

              {/* Save Current Filters Button */}
              <IconButton
                onClick={handleSavePresetClick}
                size="medium"
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'success.main',
                    color: 'success.contrastText',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                aria-label="Save current filters as preset"
              >
                <SaveIcon />
              </IconButton>

              {/* Manage Presets Button */}
              <IconButton
                onClick={handlePresetMenuOpen}
                size="medium"
                sx={{
                  color: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                aria-label="Manage KPI presets"
              >
                <ManageHistoryIcon />
              </IconButton>

              {/* Presets Menu */}
              <Menu
                anchorEl={presetMenuAnchor}
                open={Boolean(presetMenuAnchor)}
                onClose={handlePresetMenuClose}
                PaperProps={{
                  sx: { 
                    minWidth: 280,
                    maxHeight: 500 
                  }
                }}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2" fontWeight="bold">
                    KPI Presets - {currentPageType.charAt(0).toUpperCase() + currentPageType.slice(1)}
                  </Typography>
                </MenuItem>
                
                {/* Current Page Presets */}
                {currentPagePresets.map(preset => (
                  <MenuItem 
                    key={preset.id} 
                    onClick={() => handlePresetSelect(preset.id)}
                    selected={selectedPresetId === preset.id}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getPageIcon(preset.pageType)}
                        <Typography variant="body2" fontWeight="medium">
                          {preset.name}
                        </Typography>
                        {preset.isDefault && (
                          <Chip 
                            label="Default" 
                            size="small" 
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatPresetInfo(preset)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
                
                {currentPagePresets.length === 0 && (
                  <MenuItem disabled>
                    <Typography variant="caption" color="text.secondary">
                      No presets for current page
                    </Typography>
                  </MenuItem>
                )}

                <Divider />

                {/* Other Pages Presets */}
                {otherPresets.length > 0 && (
                  <>
                    <MenuItem disabled>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Other Pages
                      </Typography>
                    </MenuItem>
                    {otherPresets.map(preset => (
                      <MenuItem 
                        key={preset.id} 
                        onClick={() => handlePresetSelect(preset.id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'start', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getPageIcon(preset.pageType)}
                            <Typography variant="body2">
                              {preset.name}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatPresetInfo(preset)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </>
                )}

                <Divider />
                <MenuItem onClick={handleSavePresetClick}>
                  <SaveIcon sx={{ mr: 1, fontSize: 18 }} />
                  <Typography variant="body2">Save Current as Preset</Typography>
                </MenuItem>
              </Menu>
            </Box>

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
                  startIcon={item.icon}
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

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Save Current {currentPageType.charAt(0).toUpperCase() + currentPageType.slice(1)} Filters as Preset
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            variant="outlined"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
            placeholder="Describe what this preset shows and when to use it..."
          />
          {currentFilters && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Current {currentPageType} filters will be saved
              {currentPageType === 'main' && currentFilters.time_bucket && (
                <>: {currentFilters.time_bucket} {currentFilters.metric} metric</>
              )}
              {currentPageType === 'close-call' && currentFilters.date_from && (
                <>: {currentFilters.date_from} to {currentFilters.date_to}</>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreset} variant="contained" startIcon={<SaveIcon />}>
            Save Preset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default NavBar;