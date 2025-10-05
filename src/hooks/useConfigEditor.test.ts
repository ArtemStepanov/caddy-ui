import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConfigEditor } from './useConfigEditor';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client');
vi.mock('./use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useConfigEditor', () => {
  const instanceId = 'test-instance-1';
  const mockConfig = { apps: { http: { servers: {} } } };
  const mockConfigString = JSON.stringify(mockConfig, null, 2);

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with empty config', () => {
    const { result } = renderHook(() => useConfigEditor(instanceId));

    expect(result.current.config).toBe('');
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch config successfully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ etag: '"abc123"' }),
      json: async () => ({ success: true, data: mockConfig }),
    });

    const { result } = renderHook(() => useConfigEditor(instanceId));

    await act(async () => {
      await result.current.fetchConfig();
    });

    await waitFor(() => {
      expect(result.current.config).toBe(mockConfigString);
    });

    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.etag).toBe('"abc123"');
  });

  it('should handle fetch error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Server error' } }),
    });

    const { result } = renderHook(() => useConfigEditor(instanceId));

    await act(async () => {
      await result.current.fetchConfig();
    });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });

  it('should track unsaved changes', () => {
    const { result } = renderHook(() => useConfigEditor(instanceId));

    act(() => {
      result.current.handleConfigChange('{}');
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('should validate config successfully', async () => {
    const { result } = renderHook(() => useConfigEditor(instanceId));

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateConfig(mockConfigString);
    });

    expect(isValid).toBe(true);
    expect(result.current.validationErrors).toHaveLength(0);
  });

  it('should detect invalid JSON in validation', async () => {
    const { result } = renderHook(() => useConfigEditor(instanceId));

    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateConfig('invalid json');
    });

    expect(isValid).toBe(false);
    expect(result.current.validationErrors.length).toBeGreaterThan(0);
  });

  it('should format config', () => {
    const { result } = renderHook(() => useConfigEditor(instanceId));

    const unformatted = '{"apps":{"http":{"servers":{}}}}';
    const formatted = result.current.formatConfig(unformatted);

    expect(formatted).toContain('\n');
    expect(formatted).toBe(mockConfigString);
  });

  it('should handle format error', () => {
    const { result } = renderHook(() => useConfigEditor(instanceId));

    const invalid = 'invalid json';
    const formatted = result.current.formatConfig(invalid);

    expect(formatted).toBe(invalid);
  });

  it('should adapt Caddyfile successfully', async () => {
    const caddyfile = 'localhost { respond "Hello" }';
    const adaptedConfig = { apps: { http: {} } };

    vi.mocked(apiClient.adaptConfig).mockResolvedValue({
      success: true,
      data: adaptedConfig,
    });

    const { result } = renderHook(() => useConfigEditor(instanceId));

    let adapted: string | null = null;
    await act(async () => {
      adapted = await result.current.adaptCaddyfile(caddyfile);
    });

    expect(adapted).toBeTruthy();
    expect(adapted).toContain('apps');
  });

  it('should handle adapt error', async () => {
    const caddyfile = 'invalid caddyfile';

    vi.mocked(apiClient.adaptConfig).mockResolvedValue({
      success: false,
      error: { message: 'Syntax error', code: 'ADAPT_ERROR' },
    });

    const { result } = renderHook(() => useConfigEditor(instanceId));

    let adapted: string | null = 'not null';
    await act(async () => {
      adapted = await result.current.adaptCaddyfile(caddyfile);
    });

    expect(adapted).toBeNull();
  });
});
