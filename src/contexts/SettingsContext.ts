import { createContext } from 'react';
import type { Settings } from '@/types';

export interface SettingsContextType {
  settings: Settings;
  updateSettings: <K extends keyof Settings>(
    section: K,
    updates: Partial<Settings[K]>
  ) => void;
  resetSettings: () => void;
  exportSettings: (format?: 'json' | 'yaml') => void;
  importSettings: (data: string, merge?: boolean) => boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

