/**
 * Caddy Admin API Types
 * Based on Caddy v2 Admin API documentation and backend Go models
 */

// === Caddy Config Structure ===

export interface CaddyConfig {
  apps?: {
    http?: CaddyHttpApp;
    tls?: Record<string, unknown>;
    pki?: Record<string, unknown>;
  };
  admin?: {
    listen?: string;
    enforce_origin?: boolean;
    origins?: string[];
  };
  logging?: Record<string, unknown>;
  storage?: Record<string, unknown>;
}

export interface CaddyHttpApp {
  servers?: Record<string, CaddyServer>;
  grace_period?: string;
}

export interface CaddyServer {
  listen?: string[];
  routes?: CaddyRoute[];
  errors?: unknown;
  tls_connection_policies?: unknown[];
  automatic_https?: {
    disable?: boolean;
    skip?: string[];
  };
}

export interface CaddyRoute {
  match?: CaddyMatcher[];
  handle?: CaddyHandler[];
  terminal?: boolean;
}

export interface CaddyMatcher {
  host?: string[];
  path?: string[];
  method?: string[];
  query?: Record<string, string[]>;
  header?: Record<string, string[]>;
  not?: CaddyMatcher[];
}

export interface CaddyHandler {
  handler: string;
  [key: string]: unknown;
}

// === Reverse Proxy Handler ===

export interface CaddyReverseProxyHandler extends CaddyHandler {
  handler: 'reverse_proxy';
  upstreams?: CaddyUpstreamConfig[];
  load_balancing?: CaddyLoadBalancing;
  health_checks?: CaddyHealthChecks;
  headers?: {
    request?: CaddyHeaderOps;
    response?: CaddyHeaderOps;
  };
  transport?: {
    protocol?: string;
    tls?: CaddyTLSConfig;
  };
  flush_interval?: string;
  buffer_requests?: boolean;
  buffer_responses?: boolean;
  max_buffer_size?: number;
  trusted_proxies?: string[];
  handle_response?: CaddyHandler[];
}

export interface CaddyUpstreamConfig {
  dial: string;
  max_requests?: number;
  tls?: CaddyTLSConfig | boolean;
}

export interface CaddyLoadBalancing {
  selection_policy?: {
    policy?: 'round_robin' | 'least_conn' | 'first' | 'random' | 'ip_hash' | 'header' | 'uri_hash' | 'cookie';
  };
  try_duration?: string;
  try_interval?: string;
  retries?: number;
}

export interface CaddyHealthChecks {
  active?: CaddyActiveHealthCheck;
  passive?: CaddyPassiveHealthCheck;
}

export interface CaddyActiveHealthCheck {
  uri?: string;
  port?: number;
  headers?: Record<string, string[]>;
  interval?: string;
  timeout?: string;
  max_size?: number;
  expect_status?: number;
  expect_body?: string;
}

export interface CaddyPassiveHealthCheck {
  max_fails?: number;
  fail_duration?: string;
  unhealthy_status?: number[];
  unhealthy_latency?: string;
  unhealthy_request_count?: number;
}

export interface CaddyHeaderOps {
  add?: Record<string, string[]>;
  set?: Record<string, string[]>;
  delete?: string[];
}

export interface CaddyTLSConfig {
  insecure_skip_verify?: boolean;
  server_name?: string;
  root_ca_pool?: string[];
  client_certificate_file?: string;
  client_certificate_key_file?: string;
}

// === Runtime Upstream Status (from /reverse_proxy/upstreams) ===

export interface CaddyUpstreamStatus {
  address: string;
  dial?: string;
  num_requests?: number;
  fails?: number;
  healthy?: boolean;
  max_requests?: number;
  health_checks?: CaddyHealthChecks;
}

// === Parsed Pool Data (Frontend) ===

export interface ParsedUpstream {
  address: string;
  dial?: string;
  max_requests?: number;
  health_checks?: CaddyHealthChecks;
  healthy: boolean;
  num_requests: number;
  fails: number;
  response_time?: number;
  last_check?: string;
  status?: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
}

export interface ParsedUpstreamPool {
  id: string;
  name: string;
  lb_policy?: string;
  upstreams: ParsedUpstream[];
  total_upstreams?: number;
  healthy_count?: number;
  unhealthy_count?: number;
  avg_response_time?: number;
}

