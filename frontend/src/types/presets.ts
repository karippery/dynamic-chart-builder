// src/types/presets.ts
import { AggregationFilters } from './filters';
import { CloseCallFilters } from './closeCall';
import { SafetyFilters } from './safety'; // You might need to create this type

export type PageType = 'main' | 'close-call' | 'safety';

export interface BasePreset {
  id: string;
  name: string;
  description?: string;
  pageType: PageType;
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

export interface MainDashboardPreset extends BasePreset {
  pageType: 'main';
  filters: AggregationFilters;
}

export interface CloseCallPreset extends BasePreset {
  pageType: 'close-call';
  filters: CloseCallFilters;
}

export interface SafetyPreset extends BasePreset {
  pageType: 'safety';
  filters: any; // Replace with your actual SafetyFilters type
}

export type KPIPreset = MainDashboardPreset | CloseCallPreset | SafetyPreset;

export interface PresetStorage {
  presets: KPIPreset[];
  version: string;
}