# Caddy Types Documentation

## Overview

This document describes the TypeScript type system for Caddy Admin API integration, showing how frontend types map to backend Go types and Caddy's JSON configuration structure.

## Type Hierarchy

### 1. Backend Go Types → Frontend Types

#### Go: `[]any` (from Caddy Admin API)
```go
// internal/caddy/client.go:315
func (c *Client) GetUpstreams() ([]any, error)
```

**Maps to TypeScript:**
```typescript
CaddyUpstreamStatus[]
```

#### Go: `map[string]any` (Config)
```go
// internal/caddy/client.go:140
func (c *Client) GetConfig(path string) (map[string]any, string, error)
```

**Maps to TypeScript:**
```typescript
CaddyConfig
```

### 2. Caddy Admin API Response Structure

#### `/reverse_proxy/upstreams` Endpoint
Returns array of upstream status objects:

```typescript
interface CaddyUpstreamStatus {
  address: string;              // Upstream server address
  dial?: string;                // Address to dial
  num_requests?: number;        // Total requests sent
  fails?: number;               // Failed request count
  healthy?: boolean;            // Current health status
  max_requests?: number;        // Max concurrent requests
  health_checks?: CaddyHealthChecks;
}
```

**Example Response:**
```json
[
  {
    "address": "localhost:8080",
    "dial": "localhost:8080",
    "num_requests": 1234,
    "fails": 0,
    "healthy": true,
    "max_requests": 0
  }
]
```

#### `/config` Endpoint
Returns complete Caddy configuration:

```typescript
interface CaddyConfig {
  apps?: {
    http?: CaddyHttpApp;
    tls?: Record<string, unknown>;
    pki?: Record<string, unknown>;
  };
  admin?: { ... };
  logging?: { ... };
}
```

### 3. Configuration Parsing

#### Reverse Proxy Handler Structure

**JSON Config:**
```json
{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "routes": [
            {
              "match": [{ "host": ["api.example.com"] }],
              "handle": [
                {
                  "handler": "reverse_proxy",
                  "upstreams": [
                    { "dial": "backend1:8080" },
                    { "dial": "backend2:8080" }
                  ],
                  "load_balancing": {
                    "selection_policy": {
                      "policy": "round_robin"
                    }
                  },
                  "health_checks": {
                    "active": {
                      "uri": "/health",
                      "interval": "30s",
                      "timeout": "5s"
                    },
                    "passive": {
                      "max_fails": 3,
                      "fail_duration": "30s"
                    }
                  }
                }
              ]
            }
          ]
        }
      }
    }
  }
}
```

**TypeScript Type:**
```typescript
interface CaddyReverseProxyHandler extends CaddyHandler {
  handler: 'reverse_proxy';
  upstreams?: CaddyUpstreamConfig[];
  load_balancing?: CaddyLoadBalancing;
  health_checks?: CaddyHealthChecks;
  // ... other properties
}
```

### 4. Frontend Parsed Types

After processing raw Caddy data, we create frontend-friendly structures:

```typescript
interface ParsedUpstream {
  address: string;
  dial?: string;
  max_requests?: number;
  health_checks?: CaddyHealthChecks;
  healthy: boolean;
  num_requests: number;
  fails: number;
  response_time?: number;      // Calculated/mocked
  last_check?: string;          // ISO timestamp
  status?: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
}

interface ParsedUpstreamPool {
  id: string;                   // Generated: 'pool-1', 'pool-2', etc.
  name: string;                 // Extracted from route match or server name
  lb_policy?: string;           // Load balancing policy
  upstreams: ParsedUpstream[];
  total_upstreams?: number;     // Calculated
  healthy_count?: number;       // Calculated
  unhealthy_count?: number;     // Calculated
  avg_response_time?: number;   // Calculated
}
```

## Data Flow

### 1. Fetching Data
```typescript
// useUpstreams.ts
const [upstreamsResponse, configResponse] = await Promise.all([
  apiClient.getUpstreams(instanceId),      // → CaddyUpstreamStatus[]
  apiClient.getConfig(instanceId)          // → CaddyConfig
]);
```

### 2. Transformation
```typescript
function transformUpstreamsData(
  rawData: CaddyUpstreamStatus[] | UpstreamsData,
  config: CaddyConfig | null
): UpstreamsData
```

**Process:**
1. Parse config to find `reverse_proxy` handlers
2. Extract pool information (routes, matchers, upstreams)
3. Match runtime upstreams with configured pools
4. Calculate aggregated statistics
5. Determine health status for each upstream

### 3. Pool Grouping Logic

**Pool Name Priority:**
1. **Host matcher** (`match.host[0]`) → `"api.example.com"`
2. **Path matcher** (`match.path[0]`) → `"srv0/api/*"`
3. **Fallback** → `"srv0 - Route 1"`

**Upstream Matching:**
```typescript
const matches = upstreamAddr === configured || 
                upstreamAddr?.includes(configured) || 
                configured.includes(upstreamAddr || '');
```

## Health Status Determination

```typescript
function determineUpstreamStatus(upstream: ParsedUpstream) {
  // Unhealthy if explicitly marked
  if (upstream.healthy === false) return 'unhealthy';
  
  if (upstream.healthy === true) {
    // Degraded if slow response time
    if (upstream.response_time > 500) return 'degraded';
    
    // Degraded if has failures but not max
    const maxFails = upstream.health_checks?.passive?.max_fails || 5;
    if (upstream.fails > 0 && upstream.fails < maxFails) {
      return 'degraded';
    }
    
    return 'healthy';
  }
  
  return 'unknown';
}
```

## Load Balancing Policies

Supported policies from Caddy:
- `round_robin` - Distribute requests evenly
- `least_conn` - Route to backend with fewest connections
- `first` - Always use first available upstream
- `random` - Random selection
- `ip_hash` - Based on client IP
- `header` - Based on request header
- `uri_hash` - Based on request URI
- `cookie` - Based on cookie value

## Health Check Types

### Active Health Checks
Caddy periodically sends requests to check upstream health:

```typescript
interface CaddyActiveHealthCheck {
  uri?: string;           // Health check endpoint
  port?: number;          // Override port
  headers?: Record<string, string[]>;
  interval?: string;      // Check frequency (e.g., "30s")
  timeout?: string;       // Request timeout (e.g., "5s")
  max_size?: number;      // Max response body size
  expect_status?: number; // Expected HTTP status
  expect_body?: string;   // Expected body substring
}
```

### Passive Health Checks
Monitor regular traffic to determine health:

```typescript
interface CaddyPassiveHealthCheck {
  max_fails?: number;              // Failures before marking unhealthy
  fail_duration?: string;          // Time window for failures
  unhealthy_status?: number[];     // HTTP codes considered failures
  unhealthy_latency?: string;      // Latency threshold
  unhealthy_request_count?: number;
}
```

## Type Safety Benefits

### Before (using `any`)
```typescript
function groupUpstreamsToPools(upstreams: any[], config: any): any[] {
  // No type checking
  // No autocomplete
  // Runtime errors possible
}
```

### After (using proper types)
```typescript
function groupUpstreamsToPools(
  upstreams: CaddyUpstreamStatus[],
  config: CaddyConfig | null
): ParsedUpstreamPool[] {
  // Full type checking ✓
  // IDE autocomplete ✓
  // Compile-time error detection ✓
}
```

## Backend Validation

### Go Models Match TypeScript

**Go:**
```go
// internal/storage/models.go
type HealthCheckResult struct {
  InstanceID string    `json:"instance_id"`
  Healthy    bool      `json:"healthy"`
  Message    string    `json:"message,omitempty"`
  Timestamp  time.Time `json:"timestamp"`
  Latency    int64     `json:"latency_ms"`
}
```

**TypeScript:**
```typescript
// src/types/api.ts
export interface HealthCheckResult {
  instance_id: string;
  healthy: boolean;
  message?: string;
  timestamp: string;
  latency_ms: number;
}
```

## Usage Examples

### In Components
```typescript
import type { ParsedUpstreamPool } from '@/types';

function PoolSection({ pool }: { pool: ParsedUpstreamPool }) {
  // Full type safety
  const healthyCount = pool.healthy_count; // number | undefined
  const policy = pool.lb_policy; // string | undefined
  
  pool.upstreams.forEach(upstream => {
    console.log(upstream.address); // string
    console.log(upstream.status);  // 'healthy' | 'unhealthy' | 'degraded' | 'unknown' | undefined
  });
}
```

### In Hooks
```typescript
const { data } = useUpstreams(instanceId);
// data: UpstreamsData | null | undefined

if (data) {
  data.pools.forEach(pool => {
    // pool: ParsedUpstreamPool (from UpstreamPool type in api.ts)
  });
}
```

## Related Files

- **Types**: `src/types/caddy.ts`, `src/types/api.ts`
- **Hook**: `src/hooks/useUpstreams.ts`
- **Backend**: `internal/caddy/client.go`, `internal/storage/models.go`
- **Components**: `src/components/upstreams/*.tsx`
- **API Docs**: [Caddy Admin API](https://caddyserver.com/docs/api)

## References

- [Caddy JSON Config Structure](https://caddyserver.com/docs/json/)
- [Reverse Proxy Module](https://caddyserver.com/docs/json/apps/http/servers/routes/handle/reverse_proxy/)
- [Admin API Endpoints](https://caddyserver.com/docs/api)

