// src/hooks/useKPIPresets.ts
import { useState, useEffect } from 'react';
import { KPIPreset, PresetStorage, PageType, MainDashboardPreset, CloseCallPreset, SafetyPreset } from '../types/presets';
import { AggregationFilters } from '../types/filters';
import { CloseCallFilters } from '../types/closeCall';
import { getDefaultCloseCallFilters } from '../utils/closeCallUtils';
import { DEFAULT_FILTERS } from '../components/aggregate/AggregateFilterConstants';

const PRESET_STORAGE_KEY = 'kpi-presets';
const STORAGE_VERSION = '1.0.0';

const defaultPresets: KPIPreset[] = [
  // Main Dashboard Presets
  {
    id: 'default-daily',
    name: 'Daily Overview',
    description: 'Default daily metrics overview',
    pageType: 'main',
    filters: {
        metric: 'count',
        time_bucket: '1d',
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        object_class: [],
        group_by: []
    } as unknown as AggregationFilters,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true
  } as MainDashboardPreset,
  {
    id: 'default-weekly',
    name: 'Weekly Summary',
    description: 'Weekly aggregated summary',
    pageType: 'main',
    filters: {
        metric: 'count',
        time_bucket: '1d',
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        date_to: new Date().toISOString().split('T')[0],
        object_class: [],
        group_by: []
    } as unknown as AggregationFilters,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true
  } as MainDashboardPreset,

  // Close-call Presets
  {
    id: 'closecall-default',
    name: 'Close-call Overview',
    description: 'Default close-call analysis',
    pageType: 'close-call',
    filters: getDefaultCloseCallFilters(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true
  } as CloseCallPreset,

  // Safety Presets (add your default safety filters here)
  {
    id: 'safety-default',
    name: 'Safety Overview',
    description: 'Default safety metrics',
    pageType: 'safety',
    filters: {}, // Add your safety filters structure
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: true
  } as SafetyPreset,
];

export const useKPIPresets = () => {
  const [presets, setPresets] = useState<KPIPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Load presets from localStorage on mount
  useEffect(() => {
    const loadPresets = () => {
      try {
        const stored = localStorage.getItem(PRESET_STORAGE_KEY);
        if (stored) {
          const storage: PresetStorage = JSON.parse(stored);
          if (storage.version === STORAGE_VERSION) {
            const loadedPresets = storage.presets.map(preset => ({
              ...preset,
              createdAt: new Date(preset.createdAt),
              updatedAt: new Date(preset.updatedAt)
            }));
            setPresets(loadedPresets);
            return;
          }
        }
        // If no stored presets or version mismatch, use defaults
        setPresets(defaultPresets);
        savePresets(defaultPresets);
      } catch (error) {
        console.error('Error loading presets:', error);
        setPresets(defaultPresets);
      }
    };

    loadPresets();
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: KPIPreset[]) => {
    const storage: PresetStorage = {
      presets: newPresets,
      version: STORAGE_VERSION
    };
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(storage));
  };

  // Create new preset for any page type
  const createPreset = (name: string, pageType: PageType, filters: any, description?: string) => {
    const newPreset: KPIPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      pageType,
      filters,
      createdAt: new Date(),
      updatedAt: new Date()
    } as KPIPreset;

    const newPresets = [...presets, newPreset];
    setPresets(newPresets);
    savePresets(newPresets);
    setSelectedPresetId(newPreset.id);

    return newPreset;
  };

  // Update existing preset
  const updatePreset = (id: string, updates: Partial<Omit<KPIPreset, 'id' | 'createdAt'>>) => {
    const newPresets = presets.map(preset => 
      preset.id === id 
        ? { ...preset, ...updates, updatedAt: new Date() }
        : preset
    );
    setPresets(newPresets);
    savePresets(newPresets);
  };

  // Delete preset
  const deletePreset = (id: string) => {
    const newPresets = presets.filter(preset => preset.id !== id && !preset.isDefault);
    setPresets(newPresets);
    savePresets(newPresets);
    
    if (selectedPresetId === id) {
      setSelectedPresetId(null);
    }
  };

  // Get preset by ID
  const getPreset = (id: string) => {
    return presets.find(preset => preset.id === id);
  };

  // Get presets by page type
  const getPresetsByPage = (pageType: PageType) => {
    return presets.filter(preset => preset.pageType === pageType);
  };

  // Select preset
  const selectPreset = (id: string | null) => {
    setSelectedPresetId(id);
  };

  // Get selected preset
  const selectedPreset = selectedPresetId ? getPreset(selectedPresetId) : null;

  // Export presets for sharing
  const exportPresets = (presetIds?: string[]) => {
    const presetsToExport = presetIds 
      ? presets.filter(preset => presetIds.includes(preset.id))
      : presets.filter(preset => !preset.isDefault);
    
    return JSON.stringify(presetsToExport, null, 2);
  };

  // Import presets
  const importPresets = (jsonData: string) => {
    try {
      const importedPresets: KPIPreset[] = JSON.parse(jsonData);
      
      // Validate imported presets
      const validPresets = importedPresets.filter(preset => 
        preset.name && preset.pageType && preset.filters
      );

      const newPresets = [
        ...presets.filter(preset => preset.isDefault), // Keep defaults
        ...validPresets.map(preset => ({
          ...preset,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDefault: false // Ensure imported presets are not marked as default
        }))
      ];
      
      setPresets(newPresets);
      savePresets(newPresets);
      return true;
    } catch (error) {
      console.error('Error importing presets:', error);
      return false;
    }
  };

  return {
    presets,
    selectedPreset,
    selectedPresetId,
    createPreset,
    updatePreset,
    deletePreset,
    selectPreset,
    getPreset,
    getPresetsByPage,
    exportPresets,
    importPresets
  };
};