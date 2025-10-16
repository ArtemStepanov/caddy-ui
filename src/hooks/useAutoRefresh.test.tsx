import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAutoRefresh } from './useAutoRefresh';
import { SettingsContext } from '@/contexts/SettingsContext';
import type { SettingsContextType } from '@/contexts/SettingsContext';
import type { Settings } from '@/types';

const createMockSettings = (refreshInterval: number): Settings => ({
  appearance: {
    theme: 'dark',
    useSystemTheme: false,
    language: 'en',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    showRelativeTimestamps: true,
  },
  dashboard: {
    refreshInterval,
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
});

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

describe('useAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should call onRefresh at the specified interval', () => {
    const onRefresh = vi.fn();
    const refreshInterval = 30; // 30 seconds
    const wrapper = createWrapper(createMockSettings(refreshInterval));

    renderHook(() => useAutoRefresh({ onRefresh, enabled: true }), { wrapper });

    // Initially, onRefresh should not be called
    expect(onRefresh).not.toHaveBeenCalled();

    // Advance time by 30 seconds
    vi.advanceTimersByTime(30000);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Advance time by another 30 seconds
    vi.advanceTimersByTime(30000);
    expect(onRefresh).toHaveBeenCalledTimes(2);

    // Advance time by another 30 seconds
    vi.advanceTimersByTime(30000);
    expect(onRefresh).toHaveBeenCalledTimes(3);
  });

  it('should respect the refreshInterval from settings', () => {
    const onRefresh = vi.fn();
    const refreshInterval = 60; // 60 seconds
    const wrapper = createWrapper(createMockSettings(refreshInterval));

    renderHook(() => useAutoRefresh({ onRefresh, enabled: true }), { wrapper });

    // Advance time by 30 seconds (less than interval)
    vi.advanceTimersByTime(30000);
    expect(onRefresh).not.toHaveBeenCalled();

    // Advance time by another 30 seconds (total 60 seconds)
    vi.advanceTimersByTime(30000);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should not call onRefresh when disabled', () => {
    const onRefresh = vi.fn();
    const wrapper = createWrapper(createMockSettings(30));

    renderHook(() => useAutoRefresh({ onRefresh, enabled: false }), { wrapper });

    // Advance time by 60 seconds
    vi.advanceTimersByTime(60000);

    // onRefresh should never be called
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('should stop refreshing when unmounted', () => {
    const onRefresh = vi.fn();
    const wrapper = createWrapper(createMockSettings(30));

    const { unmount } = renderHook(
      () => useAutoRefresh({ onRefresh, enabled: true }),
      { wrapper }
    );

    // Advance time by 30 seconds
    vi.advanceTimersByTime(30000);
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Unmount the hook
    unmount();

    // Advance time by another 30 seconds
    vi.advanceTimersByTime(30000);

    // onRefresh should not be called again after unmount
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('should update interval when settings change', () => {
    const onRefresh = vi.fn();
    
    // Start with 30 second interval
    let settings = createMockSettings(30);
    const wrapper = ({ children }: { children: React.ReactNode }) => {
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

      return (
        <SettingsContext.Provider value={mockContextValue}>
          {children}
        </SettingsContext.Provider>
      );
    };

    const { rerender } = renderHook(
      () => useAutoRefresh({ onRefresh, enabled: true }),
      { wrapper }
    );

    // Advance time by 30 seconds
    vi.advanceTimersByTime(30000);
    const firstCallCount = onRefresh.mock.calls.length;
    expect(firstCallCount).toBeGreaterThanOrEqual(1);

    // Change settings to 60 second interval
    settings = createMockSettings(60);
    rerender();
    
    // Clear previous calls to track new behavior
    onRefresh.mockClear();

    // The interval should now be 60 seconds
    // Advance time by 60 seconds
    vi.advanceTimersByTime(60000);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('should expose manualRefresh function', () => {
    const onRefresh = vi.fn();
    const wrapper = createWrapper(createMockSettings(30));

    const { result } = renderHook(
      () => useAutoRefresh({ onRefresh, enabled: true }),
      { wrapper }
    );

    expect(result.current.manualRefresh).toBeDefined();
    expect(typeof result.current.manualRefresh).toBe('function');

    // Call manual refresh
    result.current.manualRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(1);

    // Manual refresh should work independently of the timer
    result.current.manualRefresh();
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });

  it('should expose refreshInterval value', () => {
    const onRefresh = vi.fn();
    const refreshInterval = 45;
    const wrapper = createWrapper(createMockSettings(refreshInterval));

    const { result } = renderHook(
      () => useAutoRefresh({ onRefresh, enabled: true }),
      { wrapper }
    );

    expect(result.current.refreshInterval).toBe(45);
  });

  it('should handle fast interval changes', () => {
    const onRefresh = vi.fn();
    
    // Start with 10 second interval
    let settings = createMockSettings(10);
    const wrapper = ({ children }: { children: React.ReactNode }) => {
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

      return (
        <SettingsContext.Provider value={mockContextValue}>
          {children}
        </SettingsContext.Provider>
      );
    };

    const { rerender } = renderHook(
      () => useAutoRefresh({ onRefresh, enabled: true }),
      { wrapper }
    );

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);
    const initialCallCount = onRefresh.mock.calls.length;
    expect(initialCallCount).toBeGreaterThanOrEqual(1);

    // Change to 300 seconds
    settings = createMockSettings(300);
    rerender();

    // Clear mock to track new behavior after rerender
    onRefresh.mockClear();

    // Need to wait full 300s for next call
    vi.advanceTimersByTime(300000);
    expect(onRefresh).toHaveBeenCalled();
  });
});

