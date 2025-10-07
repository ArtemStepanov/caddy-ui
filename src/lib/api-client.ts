/**
 * API Client for Caddy Orchestrator Backend
 * Provides type-safe methods to interact with the Go backend
 */

import type {
  APIResponse,
  APIError,
  CaddyInstance,
  HealthCheckResult,
  ConfigTemplate,
  TemplateVariable,
  CaddyConfigValue,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Re-export types for backward compatibility
export type {
  APIResponse,
  APIError,
  CaddyInstance,
  HealthCheckResult,
  ConfigTemplate,
  TemplateVariable,
};

// API Client Class
class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok && !data.success) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Instance Management
  async listInstances(): Promise<APIResponse<CaddyInstance[]>> {
    return this.request<CaddyInstance[]>('/instances');
  }

  async getInstance(id: string): Promise<APIResponse<CaddyInstance>> {
    return this.request<CaddyInstance>(`/instances/${id}`);
  }

  async createInstance(instance: Partial<CaddyInstance>): Promise<APIResponse<CaddyInstance>> {
    return this.request<CaddyInstance>('/instances', {
      method: 'POST',
      body: JSON.stringify(instance),
    });
  }

  async updateInstance(id: string, instance: Partial<CaddyInstance>): Promise<APIResponse<CaddyInstance>> {
    return this.request<CaddyInstance>(`/instances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(instance),
    });
  }

  async deleteInstance(id: string): Promise<APIResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/instances/${id}`, {
      method: 'DELETE',
    });
  }

  async testConnection(id: string): Promise<APIResponse<HealthCheckResult>> {
    return this.request<HealthCheckResult>(`/instances/${id}/test-connection`, {
      method: 'POST',
    });
  }

  // Configuration Management
  async getConfig(instanceId: string, path?: string): Promise<APIResponse<CaddyConfigValue>> {
    const endpoint = path 
      ? `/instances/${instanceId}/config/${path}`
      : `/instances/${instanceId}/config`;
    return this.request<CaddyConfigValue>(endpoint);
  }

  async setConfig(
    instanceId: string,
    config: CaddyConfigValue,
    path?: string,
    etag?: string
  ): Promise<APIResponse<{ message: string }>> {
    const endpoint = path
      ? `/instances/${instanceId}/config/${path}`
      : `/instances/${instanceId}/config`;
    
    const headers: HeadersInit = {};
    if (etag) {
      headers['If-Match'] = etag;
    }

    return this.request<{ message: string }>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(config),
    });
  }

  async patchConfig(
    instanceId: string,
    config: CaddyConfigValue,
    path?: string
  ): Promise<APIResponse<{ message: string }>> {
    const endpoint = path
      ? `/instances/${instanceId}/config/${path}`
      : `/instances/${instanceId}/config`;
    
    return this.request<{ message: string }>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(config),
    });
  }

  async deleteConfig(instanceId: string, path: string): Promise<APIResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/instances/${instanceId}/config/${path}`, {
      method: 'DELETE',
    });
  }

  async adaptConfig(
    instanceId: string,
    caddyfile: string,
    adapter?: string
  ): Promise<APIResponse<CaddyConfigValue>> {
    return this.request<CaddyConfigValue>(`/instances/${instanceId}/adapt`, {
      method: 'POST',
      body: JSON.stringify({ caddyfile, adapter }),
    });
  }

  async getUpstreams(instanceId: string): Promise<APIResponse<unknown[]>> {
    return this.request<unknown[]>(`/instances/${instanceId}/upstreams`);
  }

  async getPKICA(instanceId: string, caId: string): Promise<APIResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>(`/instances/${instanceId}/pki/ca/${caId}`);
  }

  // Template Management
  async listTemplates(): Promise<APIResponse<ConfigTemplate[]>> {
    return this.request<ConfigTemplate[]>('/templates');
  }

  async getTemplate(id: string): Promise<APIResponse<ConfigTemplate>> {
    return this.request<ConfigTemplate>(`/templates/${id}`);
  }

  async createTemplate(template: Partial<ConfigTemplate>): Promise<APIResponse<ConfigTemplate>> {
    return this.request<ConfigTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async generateConfig(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<APIResponse<CaddyConfigValue>> {
    return this.request<CaddyConfigValue>(`/templates/${templateId}/generate`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    });
  }

  // Bulk Operations
  async bulkConfigUpdate(
    instanceIds: string[],
    path: string,
    config: CaddyConfigValue
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>('/bulk/config-update', {
      method: 'POST',
      body: JSON.stringify({ instance_ids: instanceIds, path, config }),
    });
  }

  // Health Check
  async healthCheck(): Promise<APIResponse<{ status: string; service: string }>> {
    return this.request<{ status: string; service: string }>('/health');
  }

  // Settings Management
  async getSettings(): Promise<APIResponse<{
    appearance: {
      theme: string;
      language: string;
      dateFormat: string;
      timeFormat: string;
      showRelativeTimestamps: boolean;
    };
    dashboard: {
      defaultView: string;
      refreshInterval: number;
    };
  }>> {
    return this.request('/settings');
  }

  async updateSettings(settings: {
    appearance?: Partial<{
      theme: string;
      language: string;
      dateFormat: string;
      timeFormat: string;
      showRelativeTimestamps: boolean;
    }>;
    dashboard?: Partial<{
      defaultView: string;
      refreshInterval: number;
    }>;
  }): Promise<APIResponse<{
    appearance: {
      theme: string;
      language: string;
      dateFormat: string;
      timeFormat: string;
      showRelativeTimestamps: boolean;
    };
    dashboard: {
      defaultView: string;
      refreshInterval: number;
    };
  }>> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for custom instances
export default APIClient;
