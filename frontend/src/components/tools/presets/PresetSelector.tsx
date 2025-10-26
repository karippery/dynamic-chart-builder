// src/components/presets/PresetSelector.tsx
import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ManageHistory as ManagePresetsIcon,
  SaveAs as SaveIcon
} from '@mui/icons-material';
import { AggregationFilters } from '../../../types/filters';
import { useKPIPresets } from '../../../hooks/useKPIPresets';
import PresetManager from './KpiPresetsManager';


interface PresetSelectorProps {
  currentFilters: AggregationFilters;
  onPresetSelect: (filters: AggregationFilters) => void;
  onSavePreset?: () => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentFilters,
  onPresetSelect,
  onSavePreset
}) => {
  const { presets, selectedPresetId, selectPreset } = useKPIPresets();
  const [managerOpen, setManagerOpen] = useState(false);

  const handlePresetChange = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      selectPreset(presetId);
      onPresetSelect(preset.filters);
    }
  };

  const handleSaveCurrent = () => {
    setManagerOpen(true);
  };

  const customPresets = presets.filter(preset => !preset.isDefault);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>KPI Presets</InputLabel>
          <Select
            value={selectedPresetId || ''}
            label="KPI Presets"
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            <MenuItem value="">
              <em>Custom Filters</em>
            </MenuItem>
            
            {/* Default presets */}
            {presets.filter(p => p.isDefault).map(preset => (
              <MenuItem key={preset.id} value={preset.id}>
                <Box>
                  <div>{preset.name}</div>
                  <Chip 
                    label="Default" 
                    size="small" 
                    variant="outlined" 
                    sx={{ height: 16, fontSize: '0.6rem' }}
                  />
                </Box>
              </MenuItem>
            ))}
            
            {/* Custom presets */}
            {customPresets.map(preset => (
              <MenuItem key={preset.id} value={preset.id}>
                {preset.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Save current filters as preset">
          <IconButton onClick={handleSaveCurrent} color="primary">
            <SaveIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Manage presets">
          <IconButton onClick={() => setManagerOpen(true)}>
            <ManagePresetsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <PresetManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        currentFilters={currentFilters}
        onPresetSelect={onPresetSelect}
      />
    </>
  );
};

export default PresetSelector;