import { useState, useEffect, useCallback } from 'react';
import { apiClient, CaddyInstance, HealthCheckResult } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function useInstances() {
  const [instances, setInstances] = useState<CaddyInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInstances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listInstances();
      
      if (response.success) {
        // Empty array is a valid response - means no instances yet
        setInstances(response.data || []);
      } else if (response.error) {
        // Only throw error if there's an actual error, not for empty results
        throw new Error(response.error.message || 'Failed to fetch instances');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch instances';
      setError(message);
      // Only show toast for actual errors, not for empty lists
      if (!message.includes('not found') && !message.includes('empty')) {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createInstance = useCallback(async (instance: Partial<CaddyInstance>) => {
    try {
      const response = await apiClient.createInstance(instance);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: `Instance "${response.data.name}" created successfully`,
        });
        await fetchInstances();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create instance');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create instance';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, fetchInstances]);

  const updateInstance = useCallback(async (id: string, instance: Partial<CaddyInstance>) => {
    try {
      const response = await apiClient.updateInstance(id, instance);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Instance updated successfully',
        });
        await fetchInstances();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update instance');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update instance';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, fetchInstances]);

  const deleteInstance = useCallback(async (id: string) => {
    try {
      const response = await apiClient.deleteInstance(id);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Instance deleted successfully',
        });
        await fetchInstances();
      } else {
        throw new Error(response.error?.message || 'Failed to delete instance');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete instance';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, fetchInstances]);

  const testConnection = useCallback(async (id: string): Promise<HealthCheckResult | null> => {
    try {
      const response = await apiClient.testConnection(id);
      
      if (response.data) {
        if (response.data.healthy) {
          toast({
            title: 'Connection Successful',
            description: `Connected in ${response.data.latency_ms}ms`,
          });
        } else {
          toast({
            title: 'Connection Failed',
            description: response.data.message || 'Unable to connect to instance',
            variant: 'destructive',
          });
        }
        await fetchInstances(); // Refresh to update status
        return response.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast, fetchInstances]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return {
    instances,
    loading,
    error,
    fetchInstances,
    createInstance,
    updateInstance,
    deleteInstance,
    testConnection,
  };
}
