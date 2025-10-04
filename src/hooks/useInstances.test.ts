import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInstances } from './useInstances';
import { apiClient } from '@/lib/api-client';
import type { CaddyInstance, HealthCheckResult } from '@/types';

vi.mock('@/lib/api-client');
vi.mock('./use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('useInstances', () => {
  const mockInstances: CaddyInstance[] = [
    {
      id: '1',
      name: 'Test Instance',
      admin_url: 'http://localhost:2019',
      status: 'online',
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    vi.mocked(apiClient.listInstances).mockResolvedValue({
      success: true,
      data: mockInstances,
    });

    const { result } = renderHook(() => useInstances());

    expect(result.current.loading).toBe(true);
    expect(result.current.instances).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should initialize with loading state', () => {
    vi.mocked(apiClient.listInstances).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useInstances());

    expect(result.current.loading).toBe(true);
    expect(result.current.instances).toEqual([]);
  });

  it('should expose CRUD methods', () => {
    vi.mocked(apiClient.listInstances).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useInstances());

    expect(result.current.createInstance).toBeInstanceOf(Function);
    expect(result.current.updateInstance).toBeInstanceOf(Function);
    expect(result.current.deleteInstance).toBeInstanceOf(Function);
    expect(result.current.testConnection).toBeInstanceOf(Function);
    expect(result.current.fetchInstances).toBeInstanceOf(Function);
  });
});
