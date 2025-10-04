import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useConfig } from './useConfig';
import { apiClient } from '@/lib/api-client';
import type { CaddyConfigValue } from '@/types';

vi.mock('@/lib/api-client');
vi.mock('./use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useConfig', () => {
  const instanceId = 'test-instance-1';
  const mockConfig: CaddyConfigValue = {
    apps: {
      http: {
        servers: {},
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null config', () => {
    const { result } = renderHook(() => useConfig(instanceId));

    expect(result.current.config).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch config successfully', async () => {
    vi.mocked(apiClient.getConfig).mockResolvedValue({
      success: true,
      data: mockConfig,
    });

    const { result } = renderHook(() => useConfig(instanceId));

    await result.current.fetchConfig();

    await waitFor(() => {
      expect(result.current.config).toEqual(mockConfig);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch config with path', async () => {
    const path = 'apps/http';
    vi.mocked(apiClient.getConfig).mockResolvedValue({
      success: true,
      data: mockConfig,
    });

    const { result } = renderHook(() => useConfig(instanceId));

    await result.current.fetchConfig(path);

    expect(apiClient.getConfig).toHaveBeenCalledWith(instanceId, path);
  });

  it('should handle fetch error', async () => {
    vi.mocked(apiClient.getConfig).mockResolvedValue({
      success: false,
      error: { message: 'Failed to fetch config', code: 'FETCH_ERROR' },
    });

    const { result } = renderHook(() => useConfig(instanceId));

    await result.current.fetchConfig();

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch config');
    });

    expect(result.current.config).toBeNull();
  });

  it('should update config successfully', async () => {
    const newConfig: CaddyConfigValue = {
      apps: {
        http: {
          servers: { srv0: {} },
        },
      },
    };

    vi.mocked(apiClient.setConfig).mockResolvedValue({
      success: true,
      data: { message: 'Updated' },
    });

    vi.mocked(apiClient.getConfig).mockResolvedValue({
      success: true,
      data: newConfig,
    });

    const { result } = renderHook(() => useConfig(instanceId));

    await result.current.updateConfig(newConfig);

    await waitFor(() => {
      expect(result.current.config).toEqual(newConfig);
    });

    expect(apiClient.setConfig).toHaveBeenCalledWith(
      instanceId,
      newConfig,
      undefined,
      undefined
    );
  });

  it('should patch config successfully', async () => {
    const configPatch: CaddyConfigValue = {
      apps: {
        http: {
          servers: { srv1: {} },
        },
      },
    };

    vi.mocked(apiClient.patchConfig).mockResolvedValue({
      success: true,
      data: { message: 'Patched' },
    });

    vi.mocked(apiClient.getConfig).mockResolvedValue({
      success: true,
      data: mockConfig,
    });

    const { result } = renderHook(() => useConfig(instanceId));

    await result.current.patchConfig(configPatch);

    expect(apiClient.patchConfig).toHaveBeenCalledWith(
      instanceId,
      configPatch,
      undefined
    );
  });

  it('should delete config successfully', async () => {
    const path = 'apps/http/servers/srv0';

    vi.mocked(apiClient.deleteConfig).mockResolvedValue({
      success: true,
      data: { message: 'Deleted' },
    });

    vi.mocked(apiClient.getConfig).mockResolvedValue({
      success: true,
      data: mockConfig,
    });

    const { result } = renderHook(() => useConfig(instanceId));

    await result.current.deleteConfig(path);

    expect(apiClient.deleteConfig).toHaveBeenCalledWith(instanceId, path);
  });

  it('should adapt Caddyfile successfully', async () => {
    const caddyfile = 'localhost { respond "Hello" }';
    const adaptedConfig: CaddyConfigValue = {
      apps: {
        http: {
          servers: { srv0: {} },
        },
      },
    };

    vi.mocked(apiClient.adaptConfig).mockResolvedValue({
      success: true,
      data: adaptedConfig,
    });

    const { result } = renderHook(() => useConfig(instanceId));

    const result_data = await result.current.adaptCaddyfile(caddyfile);

    expect(result_data).toEqual(adaptedConfig);
    expect(apiClient.adaptConfig).toHaveBeenCalledWith(
      instanceId,
      caddyfile,
      undefined
    );
  });

  it('should handle adapt error', async () => {
    const caddyfile = 'invalid caddyfile';

    vi.mocked(apiClient.adaptConfig).mockResolvedValue({
      success: false,
      error: { message: 'Syntax error', code: 'ADAPT_ERROR' },
    });

    const { result } = renderHook(() => useConfig(instanceId));

    await expect(result.current.adaptCaddyfile(caddyfile)).rejects.toThrow('Syntax error');
  });
});
