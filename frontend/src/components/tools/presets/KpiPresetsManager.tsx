// src/components/presets/PresetManager.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Typography,
  Alert,
  Menu,
  MenuItem,
  Snackbar,
  ListItemButton, // Add this import
  Chip // Add this import
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { AggregationFilters } from '../../../types/filters';
import { useKPIPresets } from '../../../hooks/useKPIPresets';

interface PresetManagerProps {
  open: boolean;
  onClose: () => void;
  currentFilters: AggregationFilters;
  onPresetSelect: (filters: AggregationFilters) => void;
}

const PresetManager: React.FC<PresetManagerProps> = ({
  open,
  onClose,
  currentFilters,
  onPresetSelect
}) => {
  const {
    presets,
    selectedPresetId,
    createPreset,
    updatePreset,
    deletePreset,
    selectPreset,
    exportPresets,
    importPresets
  } = useKPIPresets();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMenuPresetId, setSelectedMenuPresetId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      showSnackbar('Preset name is required', 'error');
      return;
    }

    if (editingPresetId) {
      updatePreset(editingPresetId, {
        name: presetName,
        description: presetDescription,
        filters: currentFilters
      });
      showSnackbar('Preset updated successfully');
    } else {
      // cast currentFilters to any to satisfy the createPreset PageType parameter
      createPreset(presetName, currentFilters as unknown as any, presetDescription);
      showSnackbar('Preset saved successfully');
    }

    setShowSaveDialog(false);
    setPresetName('');
    setPresetDescription('');
    setEditingPresetId(null);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      selectPreset(presetId);
      onPresetSelect(preset.filters);
      onClose();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, presetId: string) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMenuPresetId(presetId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedMenuPresetId(null);
  };

  const handleEdit = () => {
    const preset = presets.find(p => p.id === selectedMenuPresetId);
    if (preset) {
      setPresetName(preset.name);
      setPresetDescription(preset.description || '');
      setEditingPresetId(preset.id);
      setShowSaveDialog(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedMenuPresetId) {
      deletePreset(selectedMenuPresetId);
      showSnackbar('Preset deleted successfully');
    }
    handleMenuClose();
  };

  const handleExport = () => {
    const data = exportPresets(selectedMenuPresetId ? [selectedMenuPresetId] : undefined);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpi-presets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar('Preset exported successfully');
    handleMenuClose();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const success = importPresets(content);
        if (success) {
          showSnackbar('Presets imported successfully');
        } else {
          showSnackbar('Error importing presets', 'error');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    event.target.value = '';
  };

  const startSaveNewPreset = () => {
    setPresetName('');
    setPresetDescription('');
    setEditingPresetId(null);
    setShowSaveDialog(true);
  };

  // Helper function to format time bucket for display
  const formatTimeBucket = (timeBucket: string): string => {
    const timeMap: Record<string, string> = {
      '1m': '1 Minute',
      '5m': '5 Minutes',
      '15m': '15 Minutes',
      '1h': '1 Hour',
      '6h': '6 Hours',
      '1d': '1 Day'
    };
    return timeMap[timeBucket] || timeBucket;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Manage KPI Presets</Typography>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={startSaveNewPreset}
            >
              Save Current
            </Button>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <List>
            {presets.map((preset) => (
              <ListItem
                key={preset.id}
                secondaryAction={
                  !preset.isDefault && (
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, preset.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )
                }
                disablePadding
              >
                <ListItemButton
                  selected={selectedPresetId === preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  sx={{ py: 1.5 }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight="medium">
                          {preset.name}
                        </Typography>
                        {preset.isDefault && (
                          <Chip 
                            label="Default" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {preset.description && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {preset.description}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block">
                          Metric: {preset.filters.metric} • Bucket: {formatTimeBucket(preset.filters.time_bucket)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Updated: {preset.updatedAt.toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {presets.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No presets saved yet. Save your current filter configuration as a preset for quick access.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
            <Button
              startIcon={<UploadIcon />}
              component="label"
              variant="outlined"
            >
              Import
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleImport}
              />
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => {
                const data = exportPresets();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kpi-presets-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showSnackbar('All presets exported successfully');
              }}
              variant="outlined"
              disabled={presets.filter(p => !p.isDefault).length === 0}
            >
              Export All
            </Button>
          </Box>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Save/Edit Preset Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPresetId ? 'Edit Preset' : 'Save Current Filters as Preset'}
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
          {!editingPresetId && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Current filters will be saved: {formatTimeBucket(currentFilters.time_bucket)} {currentFilters.metric} metric
              {(currentFilters.object_class ?? []).length > 0 && ` • ${(currentFilters.object_class ?? []).length} object classes`}
              {currentFilters.group_by?.length > 0 && ` • Grouped by ${currentFilters.group_by.join(', ')}`}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePreset} variant="contained">
            {editingPresetId ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preset Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleExport}>
          <DownloadIcon sx={{ mr: 1 }} />
          Export
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

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

export default PresetManager;