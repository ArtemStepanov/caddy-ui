import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useDateFormat } from './useDateFormat';
import { SettingsContext } from '@/contexts/SettingsContext';
import type { SettingsContextType } from '@/contexts/SettingsContext';
import type { Settings } from '@/types';

const mockSettings: Settings = {
  appearance: {
    theme: 'dark',
    useSystemTheme: false,
    language: 'en',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    showRelativeTimestamps: true,
  },
  dashboard: {
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

const createWrapper = (settings: Settings) => {
  const mockContextValue: SettingsContextType = {
    settings,
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
    isSaving: false,
    isLoading: false,
    lastSaved: null,
  };

  return ({ children }: { children: ReactNode }) => (
    <SettingsContext.Provider value={mockContextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

describe('useDateFormat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDate', () => {
    it('should use YYYY-MM-DD format from settings', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T10:30:00Z');
      expect(result.current.formatDate(date)).toBe('2024-03-15');
    });

    it('should use DD/MM/YYYY format from settings', () => {
      const customSettings = {
        ...mockSettings,
        appearance: {
          ...mockSettings.appearance,
          dateFormat: 'DD/MM/YYYY' as const,
        },
      };
      const wrapper = createWrapper(customSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T10:30:00Z');
      expect(result.current.formatDate(date)).toBe('15/03/2024');
    });

    it('should allow overriding format', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T10:30:00Z');
      expect(result.current.formatDate(date, 'MM/DD/YYYY')).toBe('03/15/2024');
    });
  });

  describe('formatTime', () => {
    it('should use 24h format from settings', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T14:30:45Z');
      expect(result.current.formatTime(date)).toBe('14:30:45');
    });

    it('should use 12h format from settings', () => {
      const customSettings = {
        ...mockSettings,
        appearance: {
          ...mockSettings.appearance,
          timeFormat: '12h' as const,
        },
      };
      const wrapper = createWrapper(customSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T14:30:45Z');
      expect(result.current.formatTime(date)).toBe('2:30:45 PM');
    });

    it('should allow overriding format', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T14:30:45Z');
      expect(result.current.formatTime(date, '12h')).toBe('2:30:45 PM');
    });
  });

  describe('formatDateTime', () => {
    it('should combine date and time from settings', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T14:30:45Z');
      expect(result.current.formatDateTime(date)).toBe('2024-03-15 14:30:45');
    });

    it('should use DD/MM/YYYY and 12h from settings', () => {
      const customSettings = {
        ...mockSettings,
        appearance: {
          ...mockSettings.appearance,
          dateFormat: 'DD/MM/YYYY' as const,
          timeFormat: '12h' as const,
        },
      };
      const wrapper = createWrapper(customSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T14:30:45Z');
      expect(result.current.formatDateTime(date)).toBe('15/03/2024 2:30:45 PM');
    });
  });

  describe('formatLastSeen', () => {
    it('should show relative time when enabled in settings', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);

      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T09:55:00Z');
      expect(result.current.formatLastSeen(date)).toBe('5 minutes ago');
    });

    it('should show absolute date when relative timestamps disabled', () => {
      const customSettings = {
        ...mockSettings,
        appearance: {
          ...mockSettings.appearance,
          showRelativeTimestamps: false,
        },
      };
      const wrapper = createWrapper(customSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-15T09:55:00Z');
      expect(result.current.formatLastSeen(date)).toBe('2024-03-15');
    });

    it('should respect date format setting for old dates', () => {
      const now = new Date('2024-03-15T10:00:00Z');
      vi.setSystemTime(now);

      const customSettings = {
        ...mockSettings,
        appearance: {
          ...mockSettings.appearance,
          dateFormat: 'DD/MM/YYYY' as const,
        },
      };
      const wrapper = createWrapper(customSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      const date = new Date('2024-03-01T10:00:00Z');
      expect(result.current.formatLastSeen(date)).toBe('01/03/2024');
    });
  });

  describe('settings exposure', () => {
    it('should expose dateFormat from settings', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.dateFormat).toBe('YYYY-MM-DD');
    });

    it('should expose timeFormat from settings', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.timeFormat).toBe('24h');
    });

    it('should expose showRelativeTimestamps from settings', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.showRelativeTimestamps).toBe(true);
    });
  });

  describe('utility functions', () => {
    it('should expose formatRelativeTime', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.formatRelativeTime).toBeDefined();
      expect(typeof result.current.formatRelativeTime).toBe('function');
    });

    it('should expose formatShortRelativeTime', () => {
      const wrapper = createWrapper(mockSettings);
      const { result } = renderHook(() => useDateFormat(), { wrapper });

      expect(result.current.formatShortRelativeTime).toBeDefined();
      expect(typeof result.current.formatShortRelativeTime).toBe('function');
    });
  });
});
