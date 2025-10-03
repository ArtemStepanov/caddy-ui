import { useState, useEffect, useCallback } from 'react';
import { apiClient, ConfigTemplate } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export function useTemplates() {
  const [templates, setTemplates] = useState<ConfigTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listTemplates();
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch templates');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch templates';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getTemplate = useCallback(async (id: string) => {
    try {
      const response = await apiClient.getTemplate(id);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch template');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch template';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const createTemplate = useCallback(async (template: Partial<ConfigTemplate>) => {
    try {
      const response = await apiClient.createTemplate(template);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: `Template "${response.data.name}" created successfully`,
        });
        await fetchTemplates();
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create template');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, fetchTemplates]);

  const generateConfig = useCallback(async (
    templateId: string,
    variables: Record<string, unknown>
  ) => {
    try {
      const response = await apiClient.generateConfig(templateId, variables);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Configuration generated successfully',
        });
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to generate configuration');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate configuration';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    getTemplate,
    createTemplate,
    generateConfig,
  };
}
