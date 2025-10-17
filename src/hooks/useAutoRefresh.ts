import { useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/hooks/useSettingsContext';

interface UseAutoRefreshOptions {
  onRefresh: () => void | Promise<void>;
  enabled?: boolean;
}

export const useAutoRefresh = ({ onRefresh, enabled = true }: UseAutoRefreshOptions) => {
  const { settings } = useSettings();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Keep onRefresh ref up to date
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const startRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const refreshInterval = settings.dashboard.refreshInterval * 1000; // Convert seconds to milliseconds
    
    intervalRef.current = setInterval(() => {
      onRefreshRef.current();
    }, refreshInterval);
  }, [settings.dashboard.refreshInterval]);

  const stopRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const manualRefresh = useCallback(() => {
    onRefreshRef.current();
  }, []);

  useEffect(() => {
    if (enabled) {
      startRefresh();
    } else {
      stopRefresh();
    }

    return () => {
      stopRefresh();
    };
  }, [enabled, startRefresh, stopRefresh]);

  return {
    manualRefresh,
    refreshInterval: settings.dashboard.refreshInterval,
  };
};

