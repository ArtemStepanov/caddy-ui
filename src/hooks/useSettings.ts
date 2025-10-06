import { useState, useEffect, useCallback } from 'react';
import type { Settings, SettingsSection, UnsavedChange } from '@/types';

const DEFAULT_SETTINGS: Settings = {
  appearance: {
    theme: 'dark',
    useSystemTheme: false,
    language: 'en',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    showRelativeTimestamps: true,
  },
  dashboard: {
    defaultView: 'dashboard',
    refreshInterval: 30,
    pauseRefreshOnInactive: true,
    density: 'comfortable',
  },
  orchestrator: {
    backendUrl: 'http://localhost:3000',
    apiTimeout: 30,
    pollingStrategy: 'websocket',
    pollInterval: 30,
    enableAutoSave: true,
    autoSaveInterval: 30,
    restoreUnsavedChanges: true,
  },
  instances: {
    defaultTimeout: 10,
    defaultAuthType: 'none',
    enableHealthChecks: true,
    healthCheckInterval: 30,
    unhealthyThreshold: 3,
    showBulkConfirmation: true,
    requireDoubleConfirmation: true,
  },
  editor: {
    fontFamily: 'Fira Code',
    fontSize: 14,
    enableFontLigatures: true,
    enableAutoCompletion: true,
    enableCodeFolding: true,
    showMinimap: true,
    enableBracketMatching: true,
    wordWrap: false,
    tabSize: 2,
    useSpaces: true,
    enableLiveValidation: true,
    validationDebounce: 500,
    autoFormatOnSave: false,
    defaultFormat: 'json',
    showSideBySideDiff: true,
    highlightSyntaxInDiffs: true,
  },
  notifications: {
    enableBrowserNotifications: false,
    notifyInstanceStatusChanges: true,
    notifyConfigChanges: true,
    notifyUpstreamFailures: true,
    notifyConnectionLost: true,
    notifyNewVersion: false,
    toastDuration: 5,
    playSound: false,
    soundVolume: 50,
    enableEmailAlerts: false,
    emailAddress: '',
    emailVerified: false,
  },
  security: {
    enableAuditLogging: true,
    logRetentionDays: 90,
    sessionTimeout: 7,
  },
  advanced: {
    enableDeveloperMode: false,
    enableRequestLogging: false,
    maxConcurrentRequests: 6,
    enableAutoRetry: true,
    maxRetryAttempts: 3,
    cacheStrategy: 'balanced',
    featureFlags: {
      templatesLibrary: false,
      multiUserCollaboration: false,
      prometheusIntegration: false,
      dockerAutoDiscovery: false,
      aiConfigSuggestions: false,
    },
  },
};

const STORAGE_KEY = 'caddy-orchestrator-settings';
const UNSAVED_STORAGE_KEY = 'caddy-orchestrator-unsaved-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedChange[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load unsaved changes from localStorage on mount
  useEffect(() => {
    const savedUnsaved = localStorage.getItem(UNSAVED_STORAGE_KEY);
    if (savedUnsaved && settings.orchestrator.restoreUnsavedChanges) {
      try {
        setUnsavedChanges(JSON.parse(savedUnsaved));
      } catch {
        // Ignore errors
      }
    }
  }, [settings.orchestrator.restoreUnsavedChanges]);

  // Save unsaved changes to localStorage
  useEffect(() => {
    if (unsavedChanges.length > 0) {
      localStorage.setItem(UNSAVED_STORAGE_KEY, JSON.stringify(unsavedChanges));
    } else {
      localStorage.removeItem(UNSAVED_STORAGE_KEY);
    }
  }, [unsavedChanges]);

  const updateSettings = useCallback(<K extends keyof Settings>(
    section: K,
    updates: Partial<Settings[K]>
  ) => {
    setSettings((prev) => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          ...updates,
        },
      };

      // Track unsaved changes
      const changes: UnsavedChange[] = [];
      Object.keys(updates).forEach((key) => {
        const oldValue = prev[section][key as keyof Settings[K]];
        const newValue = updates[key as keyof Settings[K]];
        if (oldValue !== newValue) {
          changes.push({
            section: section as SettingsSection,
            field: key,
            oldValue,
            newValue,
          });
        }
      });

      if (changes.length > 0) {
        setUnsavedChanges((prev) => {
          // Remove old changes for the same fields
          const filtered = prev.filter(
            (change) =>
              !(
                change.section === section &&
                changes.some((c) => c.field === change.field)
              )
          );
          return [...filtered, ...changes];
        });
      }

      return newSettings;
    });
  }, []);

  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setLastSaved(new Date());
      setUnsavedChanges([]);
      localStorage.removeItem(UNSAVED_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setUnsavedChanges([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UNSAVED_STORAGE_KEY);
  }, []);

  const discardChanges = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }
    setUnsavedChanges([]);
    localStorage.removeItem(UNSAVED_STORAGE_KEY);
  }, []);

  const exportSettings = useCallback((format: 'json' | 'yaml' = 'json') => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orchestrator-settings-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback((data: string, merge = true) => {
    try {
      const imported = JSON.parse(data);
      if (merge) {
        setSettings((prev) => ({ ...prev, ...imported }));
      } else {
        setSettings(imported);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const hasUnsavedChanges = unsavedChanges.length > 0;

  const getChangedSections = useCallback(() => {
    const sections = new Set<SettingsSection>();
    unsavedChanges.forEach((change) => sections.add(change.section));
    return Array.from(sections);
  }, [unsavedChanges]);

  return {
    settings,
    updateSettings,
    saveSettings,
    resetSettings,
    discardChanges,
    exportSettings,
    importSettings,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    unsavedChanges,
    getChangedSections,
  };
};
