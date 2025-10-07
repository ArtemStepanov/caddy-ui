import type { ReactNode } from 'react';
import { useSettings as useSettingsHook } from '@/hooks/useSettings';
import { SettingsContext } from './SettingsContext';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settingsHook = useSettingsHook();

  return (
    <SettingsContext.Provider value={settingsHook}>
      {children}
    </SettingsContext.Provider>
  );
}

