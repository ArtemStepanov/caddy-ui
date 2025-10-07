import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '@/types';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

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

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await apiClient.getSettings();
        if (response.success && response.data) {
          const backendSettings: Settings = {
            ...DEFAULT_SETTINGS,
            appearance: {
              theme: response.data.appearance.theme as Settings['appearance']['theme'],
              useSystemTheme: response.data.appearance.theme === 'auto',
              language: response.data.appearance.language,
              dateFormat: response.data.appearance.dateFormat as Settings['appearance']['dateFormat'],
              timeFormat: response.data.appearance.timeFormat as Settings['appearance']['timeFormat'],
              showRelativeTimestamps: response.data.appearance.showRelativeTimestamps,
            },
            dashboard: {
              defaultView: response.data.dashboard.defaultView as Settings['dashboard']['defaultView'],
              refreshInterval: response.data.dashboard.refreshInterval,
            },
          };
          setSettings(backendSettings);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backendSettings));
        }
      } catch (error) {
        console.error('Failed to load settings from backend:', error);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
          } catch {
            setSettings(DEFAULT_SETTINGS);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = useCallback(async (settingsToSave: Settings) => {
    setIsSaving(true);
    try {
      const response = await apiClient.updateSettings({
        appearance: {
          theme: settingsToSave.appearance.theme,
          language: settingsToSave.appearance.language,
          dateFormat: settingsToSave.appearance.dateFormat,
          timeFormat: settingsToSave.appearance.timeFormat,
          showRelativeTimestamps: settingsToSave.appearance.showRelativeTimestamps,
        },
        dashboard: {
          defaultView: settingsToSave.dashboard.defaultView,
          refreshInterval: settingsToSave.dashboard.refreshInterval,
        },
      });

      if (response.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
        setLastSaved(new Date());
        toast.success('Settings saved', {
          description: 'Your changes have been applied successfully',
          duration: 2000,
        });
        return true;
      } else {
        console.error('Failed to save settings:', response.error);
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : response.error?.message || 'Please try again';
        toast.error('Failed to save settings', {
          description: errorMessage,
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
      toast.error('Failed to save settings', {
        description: 'Changes saved locally only',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

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

      saveSettings(newSettings);

      return newSettings;
    });
  }, [saveSettings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
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

  return {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    isSaving,
    isLoading,
    lastSaved,
  };
};
