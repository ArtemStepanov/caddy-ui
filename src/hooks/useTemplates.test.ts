import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTemplates } from './useTemplates';
import { apiClient } from '@/lib/api-client';
import type { ConfigTemplate } from '@/types';

vi.mock('@/lib/api-client');

const mockToast = vi.fn();
vi.mock('./use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('useTemplates', () => {
  const mockTemplates: ConfigTemplate[] = [
    {
      id: '1',
      name: 'Basic Template',
      description: 'A basic config template',
      content: '{}',
      variables: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
  });

  it('should fetch templates on mount', async () => {
    vi.mocked(apiClient.listTemplates).mockResolvedValue({
      success: true,
      data: mockTemplates,
    });

    const { result } = renderHook(() => useTemplates());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toEqual(mockTemplates);
    expect(result.current.error).toBeNull();
  });

  it('should expose template management methods', () => {
    vi.mocked(apiClient.listTemplates).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useTemplates());

    expect(result.current.getTemplate).toBeInstanceOf(Function);
    expect(result.current.createTemplate).toBeInstanceOf(Function);
    expect(result.current.generateConfig).toBeInstanceOf(Function);
    expect(result.current.fetchTemplates).toBeInstanceOf(Function);
  });
});
