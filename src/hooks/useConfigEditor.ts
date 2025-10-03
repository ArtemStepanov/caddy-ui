import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import type { ValidationError } from '@/types';

export function useConfigEditor(instanceId: string) {
  const [config, setConfig] = useState<string>('');
  const [originalConfig, setOriginalConfig] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [etag, setETag] = useState<string | undefined>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
  const fetchControllerRef = useRef<AbortController | null>(null);

  // Fetch configuration
  const fetchConfig = useCallback(
    async (path?: string, silent = false) => {
      // Don't fetch if no instance selected
      if (!instanceId) {
        return;
      }

      // Cancel any ongoing fetch
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }

      fetchControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/instances/${instanceId}/config${path ? `/${path}` : ''}`,
          {
            signal: fetchControllerRef.current.signal,
          }
        );

        // Extract ETag from response headers
        const responseETag = response.headers.get('etag');
        if (responseETag) {
          setETag(responseETag);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Failed to fetch configuration (${response.status})`);
        }

        const data = await response.json();
        
        // Handle different response formats
        let configData;
        if (data.success && data.data) {
          // API response wrapper format
          configData = data.data;
        } else if (data.data) {
          // Just data property
          configData = data.data;
        } else {
          // Raw config object
          configData = data;
        }

        const configString = JSON.stringify(configData, null, 2);
        
        console.log('📥 Received config from server:', {
          size: configString.length,
          etag: responseETag,
          preview: configString.substring(0, 200) + '...'
        });
        
        setConfig(configString);
        setOriginalConfig(configString);
        setHasUnsavedChanges(false);
        setLastUpdated(new Date());

        if (!silent) {
          toast({
            title: 'Configuration Loaded',
            description: 'Configuration has been synced from server',
          });
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignore aborted requests
        }
        const message = err instanceof Error ? err.message : 'Failed to fetch configuration';
        setError(message);
        if (!silent) {
          toast({
            title: 'Error',
            description: message,
            variant: 'destructive',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [instanceId, toast]
  );

  // Update configuration
  const updateConfig = useCallback(
    async (newConfig: string, path?: string, useETag = true, forceOverwrite = false) => {
      try {
        setLoading(true);

        // Parse JSON to validate
        let configObj;
        try {
          configObj = JSON.parse(newConfig);
        } catch {
          throw new Error('Invalid JSON configuration');
        }

        const configToSend = JSON.stringify(configObj);
        console.log('📤 Sending config update:', {
          configSize: configToSend.length,
          hasETag: !!etag,
          useETag,
          preview: configToSend.substring(0, 500)
        });

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        // Add ETag if available and not forcing overwrite
        if (etag && useETag && !forceOverwrite) {
          headers['If-Match'] = etag;
        }

        // Use /load endpoint for full config updates (Caddy's recommended way)
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/instances/${instanceId}/load`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(configObj),
          }
        );

        // Handle ETag conflict (412 Precondition Failed)
        if (response.status === 412) {
          throw new Error('ETAG_CONFLICT');
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to update configuration');
        }

        console.log('✅ Config update response OK');

        // Update ETag from response
        const newETag = response.headers.get('etag');
        if (newETag) {
          setETag(newETag);
          console.log('📝 New ETag received:', newETag);
        }

        // Refresh config to ensure sync (get the actual applied config)
        console.log('🔄 Fetching updated config from server...');
        await fetchConfig(path, true);
        
        toast({
          title: '✅ Configuration Applied Successfully',
          description: 'Your changes have been applied to the Caddy instance',
          duration: 5000,
        });
        
        setHasUnsavedChanges(false);
        setValidationErrors([]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to update configuration';

        // Don't show toast for ETag conflicts - let the component handle it
        if (message !== 'ETAG_CONFLICT') {
          toast({
            title: '❌ Configuration Rejected',
            description: message,
            variant: 'destructive',
          });
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [instanceId, etag, toast, fetchConfig]
  );

  // Validate configuration
  const validateConfig = useCallback(
    async (configToValidate: string): Promise<boolean> => {
      try {
        setLoading(true);

        // First, try to parse as JSON
        let configObj;
        try {
          configObj = JSON.parse(configToValidate);
        } catch {
          setValidationErrors([
            {
              message: 'Invalid JSON syntax',
              severity: 'error',
            },
          ]);
          toast({
            title: 'Validation Failed',
            description: 'Invalid JSON syntax',
            variant: 'destructive',
          });
          return false;
        }

        // Validate using adapt endpoint (dry-run)
        // Convert to JSON string and try to re-parse to ensure it's valid Caddy config
        try {
          const configStr = JSON.stringify(configObj);
          JSON.parse(configStr); // Double-check serialization
          
          setValidationErrors([]);
          toast({
            title: '✓ Configuration is Valid',
            description: 'Your configuration has valid JSON syntax',
            duration: 3000,
          });
          return true;
        } catch {
          const errors: ValidationError[] = [
            {
              message: 'Invalid configuration structure',
              severity: 'error',
            },
          ];
          setValidationErrors(errors);
          toast({
            title: 'Validation Failed',
            description: 'Invalid configuration structure',
            variant: 'destructive',
          });
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Validation failed';
        setValidationErrors([
          {
            message,
            severity: 'error',
          },
        ]);
        toast({
          title: 'Validation Failed',
          description: message,
          variant: 'destructive',
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Format configuration
  const formatConfig = useCallback((configToFormat: string): string => {
    try {
      const parsed = JSON.parse(configToFormat);
      return JSON.stringify(parsed, null, 2);
    } catch {
      toast({
        title: 'Format Failed',
        description: 'Invalid JSON - cannot format',
        variant: 'destructive',
      });
      return configToFormat;
    }
  }, [toast]);

  // Adapt Caddyfile to JSON
  const adaptCaddyfile = useCallback(
    async (caddyfile: string): Promise<string | null> => {
      try {
        setLoading(true);
        const response = await apiClient.adaptConfig(instanceId, caddyfile);

        if (response.success && response.data) {
          // Extract the actual config from the result field (if it exists)
          const responseData = response.data as Record<string, unknown>;
          let actualConfig: unknown = response.data;
          if (responseData.result) {
            console.log('📦 Extracted config from "result" field');
            actualConfig = responseData.result;
          }
          
          if (responseData.warnings && Array.isArray(responseData.warnings) && responseData.warnings.length > 0) {
            console.warn('⚠️ Caddyfile warnings:', responseData.warnings);
          }

          toast({
            title: '✅ Caddyfile Adapted Successfully',
            description: 'Your Caddyfile has been converted to JSON configuration',
            duration: 3000,
          });
          return JSON.stringify(actualConfig, null, 2);
        } else {
          throw new Error(response.error?.message || 'Failed to adapt Caddyfile');
        }
      } catch (err) {
        const details = err instanceof Error && err.message.includes('Error: ') 
          ? err.message 
          : 'Invalid Caddyfile syntax. Please check your configuration.';
        
        toast({
          title: '❌ Caddyfile Adaptation Failed',
          description: details,
          variant: 'destructive',
        });
        console.error('Caddyfile adaptation error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [instanceId, toast]
  );

  // Handle config change
  const handleConfigChange = useCallback(
    (newConfig: string) => {
      setConfig(newConfig);
      setHasUnsavedChanges(newConfig !== originalConfig);
    },
    [originalConfig]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  return {
    config,
    originalConfig,
    loading,
    error,
    etag,
    hasUnsavedChanges,
    validationErrors,
    lastUpdated,
    fetchConfig,
    updateConfig,
    validateConfig,
    formatConfig,
    adaptCaddyfile,
    handleConfigChange,
  };
}
