import { describe, it, expect, vi, beforeEach } from 'vitest';
import APIClient from './api-client';
import type { CaddyInstance, HealthCheckResult } from '@/types';

describe('APIClient', () => {
  let client: APIClient;
  const mockBaseURL = 'http://test-api.com/api';

  beforeEach(() => {
    client = new APIClient(mockBaseURL);
    global.fetch = vi.fn();
  });

  describe('listInstances', () => {
    it('should fetch instances successfully', async () => {
      const mockInstances: CaddyInstance[] = [
        { id: '1', name: 'Test', admin_url: 'http://test', status: 'online' } as CaddyInstance,
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockInstances }),
      });

      const response = await client.listInstances();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockInstances);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/instances`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: { message: 'Error' } }),
      });

      await expect(client.listInstances()).rejects.toThrow('Error');
    });
  });

  describe('createInstance', () => {
    it('should create instance successfully', async () => {
      const newInstance: Partial<CaddyInstance> = {
        name: 'New Instance',
        admin_url: 'http://new',
      };

      const createdInstance: CaddyInstance = {
        id: '1',
        ...newInstance,
        status: 'online',
      } as CaddyInstance;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: createdInstance }),
      });

      const response = await client.createInstance(newInstance);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(createdInstance);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/instances`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newInstance),
        })
      );
    });
  });

  describe('updateInstance', () => {
    it('should update instance successfully', async () => {
      const instanceId = '1';
      const updates: Partial<CaddyInstance> = { name: 'Updated' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: updates }),
      });

      const response = await client.updateInstance(instanceId, updates);
      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/instances/${instanceId}`,
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('deleteInstance', () => {
    it('should delete instance successfully', async () => {
      const instanceId = '1';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Deleted' } }),
      });

      const response = await client.deleteInstance(instanceId);
      expect(response.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/instances/${instanceId}`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const instanceId = '1';
      const healthCheck: HealthCheckResult = {
        healthy: true,
        latency_ms: 50,
        message: 'OK',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: healthCheck }),
      });

      const response = await client.testConnection(instanceId);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(healthCheck);
    });
  });

  describe('getConfig', () => {
    it('should fetch config successfully', async () => {
      const instanceId = '1';
      const config = { apps: {} };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: config }),
      });

      const response = await client.getConfig(instanceId);
      expect(response.success).toBe(true);
      expect(response.data).toEqual(config);
    });

    it('should fetch config with path', async () => {
      const instanceId = '1';
      const path = 'apps/http';
      const config = { servers: {} };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: config }),
      });

      await client.getConfig(instanceId, path);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/instances/${instanceId}/config/${path}`,
        expect.any(Object)
      );
    });
  });

  describe('setConfig', () => {
    it('should set config successfully', async () => {
      const instanceId = '1';
      const config = { apps: {} };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Updated' } }),
      });

      const response = await client.setConfig(instanceId, config);
      expect(response.success).toBe(true);
    });

    it('should include ETag header when provided', async () => {
      const instanceId = '1';
      const config = { apps: {} };
      const etag = '"abc123"';

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Updated' } }),
      });

      await client.setConfig(instanceId, config, undefined, etag);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-Match': etag,
          }),
        })
      );
    });
  });

  describe('healthCheck', () => {
    it('should check API health successfully', async () => {
      const health = { status: 'ok', service: 'caddy-orchestrator' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: health }),
      });

      const response = await client.healthCheck();
      expect(response.success).toBe(true);
      expect(response.data).toEqual(health);
    });
  });
});
