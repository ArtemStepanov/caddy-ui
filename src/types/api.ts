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
  auth_type: "none" | "bearer" | "mtls" | "basic";
  credentials?: Record<string, string>;
  status: "online" | "offline" | "unknown" | "error";
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
  template: Record<string, unknown>;
  variables: TemplateVariable[];
  created_at: string;
  updated_at: string;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array";
  required: boolean;
  default_value?: string | number | boolean | unknown[];
  description: string;
}

/**
 * Upstream health status
 */
export type UpstreamStatus = "healthy" | "unhealthy" | "degraded" | "unknown";

/**
 * Health check configuration (active)
 */
export interface ActiveHealthCheck {
  uri?: string;
  port?: number;
  headers?: Record<string, string[]>;
  interval?: string;
  timeout?: string;
  max_size?: number;
  expect_status?: number;
  expect_body?: string;
}

/**
 * Health check configuration (passive)
 */
export interface PassiveHealthCheck {
  max_fails?: number;
  fail_duration?: string;
  unhealthy_status?: number[];
  unhealthy_latency?: string;
  unhealthy_request_count?: number;
}

/**
 * Combined health checks configuration
 */
export interface HealthChecks {
  active?: ActiveHealthCheck;
  passive?: PassiveHealthCheck;
}

/**
 * Individual upstream backend
 */
export interface Upstream {
  address: string;
  dial?: string;
  max_requests?: number;
  health_checks?: HealthChecks;

  // Runtime metrics (from Caddy API)
  healthy?: boolean;
  num_requests?: number;
  fails?: number;

  // Calculated/derived fields
  status?: UpstreamStatus;
  response_time?: number; // in ms
  last_check?: string;
  // Note: uptime_percentage removed - Caddy Admin API doesn't provide historical uptime data
}

/**
 * Reverse proxy pool containing upstreams
 */
export interface UpstreamPool {
  id: string;
  name?: string;
  upstreams: Upstream[];
  lb_policy?: string;
  lb_try_duration?: string;
  lb_try_interval?: string;
  health_checks?: HealthChecks;

  // Aggregate stats
  total_upstreams?: number;
  healthy_count?: number;
  unhealthy_count?: number;
  avg_response_time?: number;
}

/**
 * Upstreams response from backend
 */
export interface UpstreamsData {
  pools: UpstreamPool[];
  total_upstreams: number;
  healthy: number;
  unhealthy: number;
  degraded: number;
  avg_response_time: number;
}

/**
 * Health check test result
 */
export interface UpstreamHealthCheckResult {
  address: string;
  healthy: boolean;
  response_time?: number;
  status_code?: number;
  error?: string;
  timestamp: string;
}

/**
 * Performance metrics for an upstream
 */
export interface UpstreamMetrics {
  timestamp: string;
  response_time: number;
  status_code?: number;
  success: boolean;
}

/**
 * Historical health check entry
 */
export interface HealthCheckHistory {
  timestamp: string;
  result: "success" | "failed";
  response_time?: number;
  status_code?: number;
  error?: string;
}

/**
 * Prometheus metrics from Caddy's /metrics endpoint
 */
export interface PrometheusUpstreamMetrics {
  address: string;
  healthy: boolean;
}

export interface PrometheusHandlerMetrics {
  server: string;
  handler: string;
  requests_total: number;
  errors_total: number;
  requests_in_flight: number;
  duration_sum_seconds: number;
  duration_count: number;
  avg_duration_ms: number;
  duration_buckets?: Record<string, number>;
}

export interface PrometheusMetricsData {
  upstreams: Record<string, PrometheusUpstreamMetrics>;
  handlers: Record<string, PrometheusHandlerMetrics>;
  total_requests_in_flight: number;
  timestamp: string;
}

export interface MetricsResponse {
  metrics_available: boolean;
  reason?: string;
  metrics?: PrometheusMetricsData;
}
