/**
 * API-related type definitions
 * Types for API requests, responses, and data models
 */

/**
 * Standard API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: {
    timestamp: string;
    request_id?: string;
  };
}

/**
 * API error structure
 */
export interface APIError {
  code: string;
  message: string;
  details?: string;
  rollback?: boolean;
}

/**
 * Caddy instance model
 */
export interface CaddyInstance {
  id: string;
  name: string;
  admin_url: string;
  auth_type: 'none' | 'bearer' | 'mtls' | 'basic';
  credentials?: Record<string, string>;
  status: 'online' | 'offline' | 'unknown' | 'error';
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  instance_id: string;
  healthy: boolean;
  message?: string;
  timestamp: string;
  latency_ms: number;
}

/**
 * Configuration template model
 */
export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: Record<string, any>;
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  default_value?: any;
  description: string;
}
