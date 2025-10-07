import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSettings } from './useSettings';
import { apiClient } from '@/lib/api-client';
import type { Settings } from '@/types';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default settings', async () => {
    vi.mocked(apiClient.getSettings).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings.dashboard.defaultView).toBe('dashboard');
    expect(result.current.settings.dashboard.refreshInterval).toBe(30);
  });

  it('should not include pauseRefreshOnInactive in dashboard settings', async () => {
    vi.mocked(apiClient.getSettings).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings.dashboard).not.toHaveProperty('pauseRefreshOnInactive');
  });

  it('should not include density in dashboard settings', async () => {
    vi.mocked(apiClient.getSettings).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings.dashboard).not.toHaveProperty('density');
  });

  describe('Load Settings from Backend', () => {
    it('should load settings from backend successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          appearance: {
            theme: 'light',
            language: 'en',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '12h',
            showRelativeTimestamps: false,
          },
          dashboard: {
            defaultView: 'instances',
            refreshInterval: 60,
          },
        },
      };

      vi.mocked(apiClient.getSettings).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.dashboard.defaultView).toBe('instances');
      expect(result.current.settings.dashboard.refreshInterval).toBe(60);
    });

    it('should handle backend settings with only dashboard fields', async () => {
      const mockResponse = {
        success: true,
        data: {
          appearance: {
            theme: 'dark',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            showRelativeTimestamps: true,
          },
          dashboard: {
            defaultView: 'last-visited',
            refreshInterval: 120,
          },
        },
      };

      vi.mocked(apiClient.getSettings).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.dashboard).toEqual({
        defaultView: 'last-visited',
        refreshInterval: 120,
      });
    });

    it('should fallback to localStorage when backend fails', async () => {
      const savedSettings: Settings = {
        appearance: {
          theme: 'dark',
          useSystemTheme: false,
          language: 'en',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
          showRelativeTimestamps: true,
        },
        dashboard: {
          defaultView: 'instances',
          refreshInterval: 90,
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
          featureFlags: {},
        },
      };

      localStorage.setItem('caddy-orchestrator-settings', JSON.stringify(savedSettings));
      vi.mocked(apiClient.getSettings).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.settings.dashboard.defaultView).toBe('instances');
      expect(result.current.settings.dashboard.refreshInterval).toBe(90);
    });
  });

  describe('Update Dashboard Settings', () => {
    it('should update defaultView setting', async () => {
      const mockGetResponse = {
        success: true,
        data: {
          appearance: {
            theme: 'dark',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            showRelativeTimestamps: true,
          },
          dashboard: {
            defaultView: 'dashboard',
            refreshInterval: 30,
          },
        },
      };

      const mockUpdateResponse = {
        success: true,
        data: mockGetResponse.data,
      };

      vi.mocked(apiClient.getSettings).mockResolvedValue(mockGetResponse);
      vi.mocked(apiClient.updateSettings).mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateSettings('dashboard', { defaultView: 'instances' });

      await waitFor(() => {
        expect(result.current.settings.dashboard.defaultView).toBe('instances');
      });

      expect(apiClient.updateSettings).toHaveBeenCalledWith({
        appearance: expect.any(Object),
        dashboard: {
          defaultView: 'instances',
          refreshInterval: 30,
        },
      });
    });

    it('should update refreshInterval setting', async () => {
      const mockGetResponse = {
        success: true,
        data: {
          appearance: {
            theme: 'dark',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            showRelativeTimestamps: true,
          },
          dashboard: {
            defaultView: 'dashboard',
            refreshInterval: 30,
          },
        },
      };

      const mockUpdateResponse = {
        success: true,
        data: mockGetResponse.data,
      };

      vi.mocked(apiClient.getSettings).mockResolvedValue(mockGetResponse);
      vi.mocked(apiClient.updateSettings).mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateSettings('dashboard', { refreshInterval: 120 });

      await waitFor(() => {
        expect(result.current.settings.dashboard.refreshInterval).toBe(120);
      });

      expect(apiClient.updateSettings).toHaveBeenCalledWith({
        appearance: expect.any(Object),
        dashboard: {
          defaultView: 'dashboard',
          refreshInterval: 120,
        },
      });
    });

    it('should not send removed fields when updating dashboard settings', async () => {
      const mockGetResponse = {
        success: true,
        data: {
          appearance: {
            theme: 'dark',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            showRelativeTimestamps: true,
          },
          dashboard: {
            defaultView: 'dashboard',
            refreshInterval: 30,
          },
        },
      };

      const mockUpdateResponse = {
        success: true,
        data: mockGetResponse.data,
      };

      vi.mocked(apiClient.getSettings).mockResolvedValue(mockGetResponse);
      vi.mocked(apiClient.updateSettings).mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateSettings('dashboard', { defaultView: 'instances' });

      await waitFor(() => {
        expect(apiClient.updateSettings).toHaveBeenCalled();
      });

      const updateCall = vi.mocked(apiClient.updateSettings).mock.calls[0][0];
      expect(updateCall.dashboard).not.toHaveProperty('pauseRefreshOnInactive');
      expect(updateCall.dashboard).not.toHaveProperty('density');
    });

    it('should save updated settings to localStorage', async () => {
      const mockGetResponse = {
        success: true,
        data: {
          appearance: {
            theme: 'dark',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            showRelativeTimestamps: true,
          },
          dashboard: {
            defaultView: 'dashboard',
            refreshInterval: 30,
          },
        },
      };

      const mockUpdateResponse = {
        success: true,
        data: mockGetResponse.data,
      };

      vi.mocked(apiClient.getSettings).mockResolvedValue(mockGetResponse);
      vi.mocked(apiClient.updateSettings).mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateSettings('dashboard', { refreshInterval: 60 });

      await waitFor(() => {
        expect(result.current.settings.dashboard.refreshInterval).toBe(60);
      });

      const saved = localStorage.getItem('caddy-orchestrator-settings');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.dashboard.refreshInterval).toBe(60);
    });
  });

  describe('Reset Settings', () => {
    it('should reset dashboard settings to defaults', async () => {
      const mockUpdateResponse = {
        success: true,
        data: {
          appearance: {
            theme: 'dark',
            language: 'en',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            showRelativeTimestamps: true,
          },
          dashboard: {
            defaultView: 'dashboard',
            refreshInterval: 30,
          },
        },
      };

      vi.mocked(apiClient.getSettings).mockRejectedValue(new Error('Network error'));
      vi.mocked(apiClient.updateSettings).mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.updateSettings('dashboard', { defaultView: 'instances', refreshInterval: 120 });

      await waitFor(() => {
        expect(result.current.settings.dashboard.defaultView).toBe('instances');
      });

      result.current.resetSettings();

      await waitFor(() => {
        expect(result.current.settings.dashboard.defaultView).toBe('dashboard');
      });
      
      expect(result.current.settings.dashboard.refreshInterval).toBe(30);
    });

    it('should clear localStorage on reset', async () => {
      vi.mocked(apiClient.getSettings).mockRejectedValue(new Error('Network error'));

      localStorage.setItem('caddy-orchestrator-settings', JSON.stringify({ test: 'data' }));

      const { result } = renderHook(() => useSettings());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.resetSettings();

      expect(localStorage.getItem('caddy-orchestrator-settings')).toBeNull();
    });
  });
});
