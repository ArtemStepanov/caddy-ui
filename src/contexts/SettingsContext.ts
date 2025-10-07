import { createContext } from 'react';
import type { Settings, SettingsSection, UnsavedChange } from '@/types';

export interface SettingsContextType {
  settings: Settings;
  updateSettings: <K extends keyof Settings>(
    section: K,
    updates: Partial<Settings[K]>
  ) => void;
  saveSettings: () => Promise<boolean>;
  resetSettings: () => void;
  discardChanges: () => void;
  exportSettings: (format?: 'json' | 'yaml') => void;
  importSettings: (data: string, merge?: boolean) => boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  unsavedChanges: UnsavedChange[];
  getChangedSections: () => SettingsSection[];
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

