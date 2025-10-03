import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function useConfig(instanceId: string) {
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etag, setETag] = useState<string | undefined>();
  const { toast } = useToast();

  const fetchConfig = useCallback(async (path?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getConfig(instanceId, path);
      
      if (response.success && response.data) {
        setConfig(response.data);
        // Note: ETag should be extracted from response headers
        // This would require modifying the API client to return headers
      } else {
        throw new Error(response.error?.message || 'Failed to fetch configuration');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch configuration';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [instanceId, toast]);

  const updateConfig = useCallback(async (
    newConfig: Record<string, any>,
    path?: string,
    useETag?: boolean
  ) => {
    try {
      setLoading(true);
      const response = await apiClient.setConfig(
        instanceId,
        newConfig,
        path,
        useETag ? etag : undefined
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Configuration updated successfully',
        });
        await fetchConfig(path);
      } else {
        throw new Error(response.error?.message || 'Failed to update configuration');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update configuration';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [instanceId, etag, toast, fetchConfig]);

  const patchConfig = useCallback(async (
    configPatch: Record<string, any>,
    path?: string
  ) => {
    try {
      setLoading(true);
      const response = await apiClient.patchConfig(instanceId, configPatch, path);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Configuration patched successfully',
        });
        await fetchConfig(path);
      } else {
        throw new Error(response.error?.message || 'Failed to patch configuration');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to patch configuration';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [instanceId, toast, fetchConfig]);

  const deleteConfig = useCallback(async (path: string) => {
    try {
      setLoading(true);
      const response = await apiClient.deleteConfig(instanceId, path);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Configuration deleted successfully',
        });
        await fetchConfig();
      } else {
        throw new Error(response.error?.message || 'Failed to delete configuration');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete configuration';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [instanceId, toast, fetchConfig]);

  const adaptCaddyfile = useCallback(async (caddyfile: string, adapter?: string) => {
    try {
      setLoading(true);
      const response = await apiClient.adaptConfig(instanceId, caddyfile, adapter);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Caddyfile adapted successfully',
        });
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to adapt Caddyfile');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to adapt Caddyfile';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [instanceId, toast]);

  return {
    config,
    loading,
    error,
    fetchConfig,
    updateConfig,
    patchConfig,
    deleteConfig,
    adaptCaddyfile,
  };
}
