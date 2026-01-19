# Task 09: Header Handler

## Objective
Add header manipulation capabilities to routes (add, set, delete response headers).

## Prerequisites
- Tasks 06-08 completed (route forms working)

## Header Configuration Options

Based on Caddy's header directive:

| Operation | Description |
|-----------|-------------|
| `set` | Set a header (overwrites existing) |
| `add` | Add a header (can have multiple values) |
| `delete` | Remove a header |

Common use cases:
- Security headers (HSTS, CSP, X-Frame-Options)
- CORS headers
- Cache-Control headers
- Custom application headers

## Implementation Approach

Headers aren't a separate handler type - they're applied **alongside** other handlers.
So we need to add header configuration as an **optional section** in each route form.

## Steps

### 9.1 Create Header Editor Component (`web/src/components/forms/HeaderEditor.tsx`)

```tsx
import { useState } from 'preact/hooks';

interface HeaderConfig {
  set?: Record<string, string>;
  add?: Record<string, string>;
  delete?: string[];
}

interface HeaderEditorProps {
  config: HeaderConfig;
  onChange: (config: HeaderConfig) => void;
}

const SECURITY_PRESETS = [
  {
    name: 'Strict Transport Security',
    header: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    name: 'Content Security Policy',
    header: 'Content-Security-Policy',
    value: "default-src 'self'",
  },
  {
    name: 'X-Frame-Options',
    header: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    name: 'X-Content-Type-Options',
    header: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    name: 'Referrer-Policy',
    header: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    name: 'Permissions-Policy',
    header: 'Permissions-Policy',
    value: 'interest-cohort=()',
  },
];

const CORS_PRESETS = [
  {
    name: 'Allow All Origins',
    header: 'Access-Control-Allow-Origin',
    value: '*',
  },
  {
    name: 'Allow Credentials',
    header: 'Access-Control-Allow-Credentials',
    value: 'true',
  },
  {
    name: 'Allow Methods',
    header: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, DELETE, OPTIONS',
  },
  {
    name: 'Allow Headers',
    header: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization',
  },
];

export function HeaderEditor({ config, onChange }: HeaderEditorProps) {
  const [operation, setOperation] = useState<'set' | 'add' | 'delete'>('set');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addHeader = () => {
    if (!newKey.trim()) return;

    if (operation === 'delete') {
      onChange({
        ...config,
        delete: [...(config.delete || []), newKey.trim()],
      });
    } else {
      const current = config[operation] || {};
      onChange({
        ...config,
        [operation]: { ...current, [newKey.trim()]: newValue },
      });
    }

    setNewKey('');
    setNewValue('');
  };

  const removeHeader = (op: 'set' | 'add' | 'delete', key: string) => {
    if (op === 'delete') {
      onChange({
        ...config,
        delete: (config.delete || []).filter((k) => k !== key),
      });
    } else {
      const current = { ...(config[op] || {}) };
      delete current[key];
      onChange({ ...config, [op]: current });
    }
  };

  const applyPreset = (header: string, value: string) => {
    onChange({
      ...config,
      set: { ...(config.set || {}), [header]: value },
    });
  };

  const hasHeaders =
    Object.keys(config.set || {}).length > 0 ||
    Object.keys(config.add || {}).length > 0 ||
    (config.delete || []).length > 0;

  return (
    <div class="space-y-4">
      {/* Existing headers */}
      {hasHeaders && (
        <div class="space-y-2">
          {Object.entries(config.set || {}).map(([key, value]) => (
            <div key={`set-${key}`} class="flex items-center gap-2 text-sm">
              <span class="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-xs">SET</span>
              <span class="font-mono text-slate-300">{key}</span>
              <span class="text-slate-500">=</span>
              <span class="font-mono text-slate-400 flex-1 truncate">{value}</span>
              <button
                type="button"
                onClick={() => removeHeader('set', key)}
                class="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          {Object.entries(config.add || {}).map(([key, value]) => (
            <div key={`add-${key}`} class="flex items-center gap-2 text-sm">
              <span class="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-xs">ADD</span>
              <span class="font-mono text-slate-300">{key}</span>
              <span class="text-slate-500">=</span>
              <span class="font-mono text-slate-400 flex-1 truncate">{value}</span>
              <button
                type="button"
                onClick={() => removeHeader('add', key)}
                class="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          {(config.delete || []).map((key) => (
            <div key={`del-${key}`} class="flex items-center gap-2 text-sm">
              <span class="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-xs">DEL</span>
              <span class="font-mono text-slate-300 line-through">{key}</span>
              <button
                type="button"
                onClick={() => removeHeader('delete', key)}
                class="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new header */}
      <div class="flex gap-2">
        <select
          value={operation}
          onChange={(e) => setOperation((e.target as HTMLSelectElement).value as any)}
          class="input w-24"
        >
          <option value="set">Set</option>
          <option value="add">Add</option>
          <option value="delete">Delete</option>
        </select>
        <input
          type="text"
          value={newKey}
          onInput={(e) => setNewKey((e.target as HTMLInputElement).value)}
          placeholder="Header-Name"
          class="input flex-1"
        />
        {operation !== 'delete' && (
          <input
            type="text"
            value={newValue}
            onInput={(e) => setNewValue((e.target as HTMLInputElement).value)}
            placeholder="Header value"
            class="input flex-1"
          />
        )}
        <button type="button" onClick={addHeader} class="btn btn-secondary">
          Add
        </button>
      </div>

      {/* Presets */}
      <div class="space-y-3">
        <div>
          <div class="text-sm font-medium text-slate-400 mb-2">Security Headers</div>
          <div class="flex flex-wrap gap-2">
            {SECURITY_PRESETS.map((preset) => (
              <button
                key={preset.header}
                type="button"
                onClick={() => applyPreset(preset.header, preset.value)}
                class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
                title={`${preset.header}: ${preset.value}`}
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div class="text-sm font-medium text-slate-400 mb-2">CORS Headers</div>
          <div class="flex flex-wrap gap-2">
            {CORS_PRESETS.map((preset) => (
              <button
                key={preset.header}
                type="button"
                onClick={() => applyPreset(preset.header, preset.value)}
                class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
                title={`${preset.header}: ${preset.value}`}
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function getDefaultHeaderConfig(): HeaderConfig {
  return {
    set: {},
    add: {},
    delete: [],
  };
}
```

### 9.2 Update Storage Model

Add headers field to Route config in `internal/storage/models.go`:

```go
// RouteOptions contains optional settings for any route
type RouteOptions struct {
    Headers     *HeaderConfig    `json:"headers,omitempty"`
    BasicAuth   *BasicAuthConfig `json:"basic_auth,omitempty"`
    Compression bool             `json:"compression,omitempty"`
}
```

### 9.3 Add Header Section to RouteForm

Update `web/src/pages/RouteForm.tsx` to include headers as an optional section:

```tsx
import { HeaderEditor, getDefaultHeaderConfig } from '../components/forms/HeaderEditor';

// Add state for route options
const [headers, setHeaders] = useState(getDefaultHeaderConfig());
const [showHeaders, setShowHeaders] = useState(false);

// In the form, add after handler config section:
<div class="card">
  <button
    type="button"
    onClick={() => setShowHeaders(!showHeaders)}
    class="w-full text-left flex items-center justify-between"
  >
    <h2 class="text-lg font-semibold">Response Headers (Optional)</h2>
    <span class="text-slate-400">{showHeaders ? '▼' : '▶'}</span>
  </button>
  
  {showHeaders && (
    <div class="mt-4">
      <HeaderEditor config={headers} onChange={setHeaders} />
    </div>
  )}
</div>
```

### 9.4 Update Config Builder

In `internal/config/builder.go`, add headers handler before the main handler:

```go
func buildRoute(r *storage.Route, global *storage.GlobalConfig) *Route {
    // ... existing code ...

    // Add headers handler if configured
    var routeConfig struct {
        Headers *HeaderConfig `json:"headers,omitempty"`
        // ... other fields
    }
    json.Unmarshal(r.Config, &routeConfig)

    if routeConfig.Headers != nil && hasHeaderConfig(routeConfig.Headers) {
        h := buildHeadersHandler(routeConfig.Headers)
        if h != nil {
            handlers = append(handlers, h)
        }
    }

    // ... rest of handler building ...
}

func hasHeaderConfig(h *HeaderConfig) bool {
    return len(h.Set) > 0 || len(h.Add) > 0 || len(h.Delete) > 0
}

func buildHeadersHandler(cfg *HeaderConfig) Handler {
    response := make(map[string]any)

    if len(cfg.Set) > 0 {
        set := make(map[string][]string)
        for k, v := range cfg.Set {
            set[k] = []string{v}
        }
        response["set"] = set
    }

    if len(cfg.Add) > 0 {
        add := make(map[string][]string)
        for k, v := range cfg.Add {
            add[k] = []string{v}
        }
        response["add"] = add
    }

    if len(cfg.Delete) > 0 {
        response["delete"] = cfg.Delete
    }

    return Handler{
        "handler":  "headers",
        "response": response,
    }
}
```

## Verification
- [ ] Header editor renders in route form
- [ ] Can add/remove set headers
- [ ] Can add/remove add headers
- [ ] Can add/remove delete headers
- [ ] Security preset buttons work
- [ ] CORS preset buttons work
- [ ] Headers are included in route config
- [ ] Config builder generates correct Caddy JSON
- [ ] Headers actually appear in responses

## Files Created/Modified
- `web/src/components/forms/HeaderEditor.tsx` (new)
- `web/src/pages/RouteForm.tsx` (modified)
- `internal/storage/models.go` (modified)
- `internal/config/builder.go` (modified)

## Estimated Time
2 hours
