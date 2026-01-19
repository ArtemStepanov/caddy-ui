# Task 13: Status Health Check

## Objective
Implement a proper Caddy health status indicator with connection testing.

## Prerequisites
- Backend Caddy client working (Task 02)
- Frontend layout with status badge (Task 05)

## Features
- Real-time status indicator in header
- Detailed status page with connection info
- Auto-refresh every 30 seconds
- Manual refresh button

## Steps

### 13.1 Enhance Backend Status Endpoint

Update `internal/api/handlers.go`:

```go
// GetStatus returns detailed Caddy health status
func (h *Handler) GetStatus(c *gin.Context) {
    start := time.Now()
    
    // Try to get config from Caddy
    config, err := h.caddy.GetConfig("")
    latency := time.Since(start)

    if err != nil {
        c.JSON(http.StatusOK, gin.H{
            "status":  "offline",
            "error":   err.Error(),
            "latency": latency.Milliseconds(),
        })
        return
    }

    // Parse config to get some basic info
    var caddyConfig map[string]any
    json.Unmarshal(config, &caddyConfig)

    // Count configured routes
    routeCount := 0
    if apps, ok := caddyConfig["apps"].(map[string]any); ok {
        if http, ok := apps["http"].(map[string]any); ok {
            if servers, ok := http["servers"].(map[string]any); ok {
                for _, server := range servers {
                    if srv, ok := server.(map[string]any); ok {
                        if routes, ok := srv["routes"].([]any); ok {
                            routeCount += len(routes)
                        }
                    }
                }
            }
        }
    }

    // Get global config for URL
    globalCfg, _ := h.store.GetGlobalConfig()

    c.JSON(http.StatusOK, gin.H{
        "status":      "online",
        "latency":     latency.Milliseconds(),
        "admin_url":   globalCfg.CaddyAdminURL,
        "route_count": routeCount,
    })
}

// TestConnection tests connection to a specific Caddy URL
func (h *Handler) TestConnection(c *gin.Context) {
    var req struct {
        URL string `json:"url" binding:"required"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Create temporary client
    testClient := caddy.NewClient(req.URL)

    start := time.Now()
    err := testClient.Health()
    latency := time.Since(start)

    if err != nil {
        c.JSON(http.StatusOK, gin.H{
            "success": false,
            "error":   err.Error(),
            "latency": latency.Milliseconds(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "latency": latency.Milliseconds(),
    })
}
```

Add the route in `internal/api/routes.go`:

```go
api.POST("/test-connection", h.TestConnection)
```

### 13.2 Update API Client

Add to `web/src/lib/api.ts`:

```typescript
export interface StatusResponse {
  status: 'online' | 'offline';
  latency?: number;
  error?: string;
  admin_url?: string;
  route_count?: number;
}

export interface TestConnectionResponse {
  success: boolean;
  latency?: number;
  error?: string;
}

// In ApiClient class:
async getStatus(): Promise<StatusResponse> {
  return this.request('/status');
}

async testConnection(url: string): Promise<TestConnectionResponse> {
  return this.request('/test-connection', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}
```

### 13.3 Enhance Status Badge Component

Update `web/src/components/StatusBadge.tsx`:

```tsx
import { useState } from 'preact/hooks';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'loading';
  latency?: number;
  onClick?: () => void;
}

export function StatusBadge({ status, latency, onClick }: StatusBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const colors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    loading: 'bg-yellow-500 animate-pulse',
  };

  const labels = {
    online: 'Caddy Online',
    offline: 'Caddy Offline',
    loading: 'Checking...',
  };

  return (
    <div class="relative">
      <button
        onClick={() => onClick?.() || setShowDetails(!showDetails)}
        class="flex items-center gap-2 text-sm hover:bg-slate-700/50 px-2 py-1 rounded transition-colors"
      >
        <span class={`w-2 h-2 rounded-full ${colors[status]}`} />
        <span class="text-slate-400">{labels[status]}</span>
        {latency !== undefined && status === 'online' && (
          <span class="text-xs text-slate-500">{latency}ms</span>
        )}
      </button>

      {showDetails && (
        <div class="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 z-50">
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium">Caddy Status</span>
            <button
              onClick={() => setShowDetails(false)}
              class="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-400">Status</span>
              <span class={status === 'online' ? 'text-green-400' : 'text-red-400'}>
                {status === 'online' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {latency !== undefined && (
              <div class="flex justify-between">
                <span class="text-slate-400">Latency</span>
                <span>{latency}ms</span>
              </div>
            )}
          </div>

          <a
            href="/settings"
            class="block text-center text-sm text-primary-400 hover:text-primary-300 mt-3 pt-3 border-t border-slate-700"
          >
            Connection Settings →
          </a>
        </div>
      )}
    </div>
  );
}
```

### 13.4 Update Layout with Enhanced Status

Update `web/src/components/Layout.tsx`:

```tsx
import { ComponentChildren } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api, StatusResponse } from '../lib/api';
import { StatusBadge } from './StatusBadge';

interface LayoutProps {
  children: ComponentChildren;
}

export function Layout({ children }: LayoutProps) {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkStatus() {
    setChecking(true);
    try {
      const data = await api.getStatus();
      setStatusData(data);
    } catch {
      setStatusData({ status: 'offline', error: 'Failed to check status' });
    } finally {
      setChecking(false);
    }
  }

  const status = checking && !statusData ? 'loading' : (statusData?.status || 'offline');

  return (
    <div class="min-h-screen flex flex-col">
      {/* Header */}
      <header class="bg-slate-800 border-b border-slate-700">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" class="text-xl font-bold text-white flex items-center gap-2">
            <svg class="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Caddy Lite
          </a>
          
          <div class="flex items-center gap-4">
            <StatusBadge 
              status={status}
              latency={statusData?.latency}
              onClick={checkStatus}
            />
            <nav class="flex gap-4">
              <a href="/" class="text-slate-300 hover:text-white">Dashboard</a>
              <a href="/settings" class="text-slate-300 hover:text-white">Settings</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Offline Warning Banner */}
      {status === 'offline' && (
        <div class="bg-red-900/50 border-b border-red-700 px-4 py-2 text-center text-sm text-red-300">
          Unable to connect to Caddy server. 
          <a href="/settings" class="underline ml-1">Check settings</a>
        </div>
      )}

      {/* Main Content */}
      <main class="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer class="bg-slate-800 border-t border-slate-700 py-4 text-center text-sm text-slate-500">
        Caddy Orchestrator Lite
      </footer>
    </div>
  );
}
```

### 13.5 Add Connection Test to Settings

In `web/src/pages/Settings.tsx`, add a test connection button:

```tsx
const [testing, setTesting] = useState(false);
const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; error?: string } | null>(null);

async function testConnection() {
  setTesting(true);
  setTestResult(null);
  try {
    const result = await api.testConnection(config.caddy_admin_url);
    setTestResult(result);
  } catch (err: any) {
    setTestResult({ success: false, error: err.message });
  } finally {
    setTesting(false);
  }
}

// In the Caddy Connection card, add:
<div class="flex gap-2 mt-4">
  <button
    type="button"
    onClick={testConnection}
    disabled={testing}
    class="btn btn-secondary"
  >
    {testing ? 'Testing...' : 'Test Connection'}
  </button>
  
  {testResult && (
    <div class={`flex items-center gap-2 text-sm ${
      testResult.success ? 'text-green-400' : 'text-red-400'
    }`}>
      {testResult.success ? (
        <>✓ Connected ({testResult.latency}ms)</>
      ) : (
        <>✗ {testResult.error}</>
      )}
    </div>
  )}
</div>
```

## Verification
- [ ] Status badge shows correct state (online/offline)
- [ ] Latency is displayed when connected
- [ ] Click on status badge shows details popup
- [ ] Auto-refresh works every 30 seconds
- [ ] Offline warning banner appears when disconnected
- [ ] Test connection button works in settings
- [ ] Test result shows success/failure with latency

## Files Created/Modified
- `internal/api/handlers.go` (add TestConnection)
- `internal/api/routes.go` (add route)
- `web/src/lib/api.ts` (add types and methods)
- `web/src/components/StatusBadge.tsx` (enhance)
- `web/src/components/Layout.tsx` (enhance)
- `web/src/pages/Settings.tsx` (add test button)

## Estimated Time
1-2 hours
