# Task 06: Reverse Proxy Form

## Objective
Create the form component for configuring reverse proxy routes.

## Prerequisites
- Task 05 completed (frontend core exists)

## Reverse Proxy Configuration Options

Based on Caddy's reverse_proxy directive, we'll support:

| Option | Description | Default |
|--------|-------------|---------|
| `upstreams` | Backend servers (required) | - |
| `websocket` | Enable WebSocket support | false |
| `headers` | Custom headers to add | {} |
| `load_balancing` | Load balancing policy | round_robin |
| `health_check` | Enable health checks | false |

## Steps

### 6.1 Create Handler Type Selector (`web/src/components/HandlerTypeSelector.tsx`)

```tsx
interface HandlerTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

const HANDLER_TYPES = [
  {
    id: 'reverse_proxy',
    name: 'Reverse Proxy',
    description: 'Forward requests to a backend service',
    icon: '🔄',
  },
  {
    id: 'file_server',
    name: 'File Server',
    description: 'Serve static files from a directory',
    icon: '📁',
  },
  {
    id: 'redir',
    name: 'Redirect',
    description: 'Redirect to another URL',
    icon: '↗️',
  },
];

export function HandlerTypeSelector({ value, onChange }: HandlerTypeSelectorProps) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {HANDLER_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onChange(type.id)}
          class={`card text-left transition-all ${
            value === type.id
              ? 'ring-2 ring-primary-500 border-primary-500'
              : 'hover:border-slate-600'
          }`}
        >
          <div class="text-2xl mb-2">{type.icon}</div>
          <div class="font-medium">{type.name}</div>
          <div class="text-sm text-slate-400">{type.description}</div>
        </button>
      ))}
    </div>
  );
}
```

### 6.2 Create Reverse Proxy Form (`web/src/components/forms/ReverseProxyForm.tsx`)

```tsx
import { useState } from 'preact/hooks';

interface ReverseProxyConfig {
  upstreams: string[];
  websocket: boolean;
  headers: Record<string, string>;
  load_balancing: string;
}

interface ReverseProxyFormProps {
  config: ReverseProxyConfig;
  onChange: (config: ReverseProxyConfig) => void;
}

export function ReverseProxyForm({ config, onChange }: ReverseProxyFormProps) {
  const [newUpstream, setNewUpstream] = useState('');
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  const addUpstream = () => {
    if (!newUpstream.trim()) return;
    onChange({
      ...config,
      upstreams: [...config.upstreams, newUpstream.trim()],
    });
    setNewUpstream('');
  };

  const removeUpstream = (index: number) => {
    onChange({
      ...config,
      upstreams: config.upstreams.filter((_, i) => i !== index),
    });
  };

  const addHeader = () => {
    if (!newHeaderKey.trim()) return;
    onChange({
      ...config,
      headers: { ...config.headers, [newHeaderKey]: newHeaderValue },
    });
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const removeHeader = (key: string) => {
    const { [key]: _, ...rest } = config.headers;
    onChange({ ...config, headers: rest });
  };

  return (
    <div class="space-y-6">
      {/* Upstreams */}
      <div>
        <label class="label">Backend Servers *</label>
        <p class="text-sm text-slate-500 mb-2">
          Enter the address of your backend service (e.g., localhost:8080, 10.0.0.5:3000)
        </p>
        
        {/* Existing upstreams */}
        <div class="space-y-2 mb-2">
          {config.upstreams.map((upstream, index) => (
            <div key={index} class="flex items-center gap-2">
              <input
                type="text"
                value={upstream}
                class="input flex-1"
                readOnly
              />
              <button
                type="button"
                onClick={() => removeUpstream(index)}
                class="btn btn-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add new upstream */}
        <div class="flex gap-2">
          <input
            type="text"
            value={newUpstream}
            onInput={(e) => setNewUpstream((e.target as HTMLInputElement).value)}
            placeholder="localhost:8080"
            class="input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUpstream())}
          />
          <button type="button" onClick={addUpstream} class="btn btn-secondary">
            Add
          </button>
        </div>
      </div>

      {/* WebSocket Support */}
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.websocket}
            onChange={(e) =>
              onChange({ ...config, websocket: (e.target as HTMLInputElement).checked })
            }
            class="w-5 h-5 rounded bg-slate-900 border-slate-700"
          />
          <div>
            <div class="font-medium">Enable WebSocket Support</div>
            <div class="text-sm text-slate-500">
              Allows WebSocket connections to pass through to the backend
            </div>
          </div>
        </label>
      </div>

      {/* Load Balancing */}
      {config.upstreams.length > 1 && (
        <div>
          <label class="label">Load Balancing Policy</label>
          <select
            value={config.load_balancing}
            onChange={(e) =>
              onChange({ ...config, load_balancing: (e.target as HTMLSelectElement).value })
            }
            class="input"
          >
            <option value="round_robin">Round Robin</option>
            <option value="random">Random</option>
            <option value="first">First Available</option>
            <option value="least_conn">Least Connections</option>
            <option value="ip_hash">IP Hash (Sticky)</option>
          </select>
        </div>
      )}

      {/* Custom Headers */}
      <div>
        <label class="label">Custom Headers (Optional)</label>
        <p class="text-sm text-slate-500 mb-2">
          Add headers to requests sent to the backend
        </p>

        {/* Existing headers */}
        <div class="space-y-2 mb-2">
          {Object.entries(config.headers || {}).map(([key, value]) => (
            <div key={key} class="flex items-center gap-2">
              <input type="text" value={key} class="input w-1/3" readOnly />
              <input type="text" value={value} class="input flex-1" readOnly />
              <button
                type="button"
                onClick={() => removeHeader(key)}
                class="btn btn-danger"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add new header */}
        <div class="flex gap-2">
          <input
            type="text"
            value={newHeaderKey}
            onInput={(e) => setNewHeaderKey((e.target as HTMLInputElement).value)}
            placeholder="Header-Name"
            class="input w-1/3"
          />
          <input
            type="text"
            value={newHeaderValue}
            onInput={(e) => setNewHeaderValue((e.target as HTMLInputElement).value)}
            placeholder="Header value"
            class="input flex-1"
          />
          <button type="button" onClick={addHeader} class="btn btn-secondary">
            Add
          </button>
        </div>
      </div>

      {/* Common header presets */}
      <div>
        <label class="label">Quick Header Presets</label>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({
              ...config,
              headers: { ...config.headers, 'X-Real-IP': '{http.request.remote.host}' }
            })}
            class="btn btn-secondary text-sm"
          >
            + X-Real-IP
          </button>
          <button
            type="button"
            onClick={() => onChange({
              ...config,
              headers: { ...config.headers, 'X-Forwarded-Proto': '{http.request.scheme}' }
            })}
            class="btn btn-secondary text-sm"
          >
            + X-Forwarded-Proto
          </button>
          <button
            type="button"
            onClick={() => onChange({
              ...config,
              headers: { ...config.headers, 'Host': '{http.reverse_proxy.upstream.hostport}' }
            })}
            class="btn btn-secondary text-sm"
          >
            + Preserve Host
          </button>
        </div>
      </div>
    </div>
  );
}

export function getDefaultReverseProxyConfig(): ReverseProxyConfig {
  return {
    upstreams: [],
    websocket: false,
    headers: {},
    load_balancing: 'round_robin',
  };
}
```

### 6.3 Update RouteForm Page (`web/src/pages/RouteForm.tsx`)

```tsx
import { useState, useEffect } from 'preact/hooks';
import { route as navigate } from 'preact-router';
import { api, Route } from '../lib/api';
import { HandlerTypeSelector } from '../components/HandlerTypeSelector';
import { ReverseProxyForm, getDefaultReverseProxyConfig } from '../components/forms/ReverseProxyForm';

interface RouteFormProps {
  id?: string;
}

export function RouteForm({ id }: RouteFormProps) {
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [domain, setDomain] = useState('');
  const [path, setPath] = useState('');
  const [handlerType, setHandlerType] = useState('reverse_proxy');
  const [config, setConfig] = useState<any>(getDefaultReverseProxyConfig());

  useEffect(() => {
    if (isEdit) {
      loadRoute();
    }
  }, [id]);

  async function loadRoute() {
    try {
      const { route } = await api.getRoute(id!);
      setDomain(route.domain);
      setPath(route.path || '');
      setHandlerType(route.handler_type);
      setConfig(route.config);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const routeData = {
        domain,
        path: path || undefined,
        handler_type: handlerType,
        config,
      };

      if (isEdit) {
        await api.updateRoute(id!, routeData);
      } else {
        await api.createRoute(routeData);
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleHandlerTypeChange(type: string) {
    setHandlerType(type);
    // Reset config when type changes
    switch (type) {
      case 'reverse_proxy':
        setConfig(getDefaultReverseProxyConfig());
        break;
      case 'file_server':
        setConfig({ root: '', browse: false });
        break;
      case 'redir':
        setConfig({ to: '', code: 302 });
        break;
    }
  }

  if (loading) {
    return (
      <div class="text-center py-8">
        <div class="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold">
          {isEdit ? 'Edit Route' : 'New Route'}
        </h1>
        <a href="/" class="btn btn-secondary">Cancel</a>
      </div>

      {error && (
        <div class="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} class="space-y-8">
        {/* Domain & Path */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Domain Configuration</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">Domain *</label>
              <input
                type="text"
                value={domain}
                onInput={(e) => setDomain((e.target as HTMLInputElement).value)}
                placeholder="example.com"
                class="input"
                required
              />
              <p class="text-sm text-slate-500 mt-1">
                The domain name for this route (without https://)
              </p>
            </div>
            
            <div>
              <label class="label">Path (Optional)</label>
              <input
                type="text"
                value={path}
                onInput={(e) => setPath((e.target as HTMLInputElement).value)}
                placeholder="/*"
                class="input"
              />
              <p class="text-sm text-slate-500 mt-1">
                Match specific paths (e.g., /api/*, /admin)
              </p>
            </div>
          </div>
        </div>

        {/* Handler Type Selection */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Handler Type</h2>
          <HandlerTypeSelector value={handlerType} onChange={handleHandlerTypeChange} />
        </div>

        {/* Handler-specific config */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Handler Configuration</h2>
          
          {handlerType === 'reverse_proxy' && (
            <ReverseProxyForm config={config} onChange={setConfig} />
          )}
          
          {handlerType === 'file_server' && (
            <div class="text-slate-400">File server form (Task 07)</div>
          )}
          
          {handlerType === 'redir' && (
            <div class="text-slate-400">Redirect form (Task 08)</div>
          )}
        </div>

        {/* Submit */}
        <div class="flex justify-end gap-4">
          <a href="/" class="btn btn-secondary">Cancel</a>
          <button type="submit" class="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update Route' : 'Create Route'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

## Verification
- [ ] Handler type selector renders correctly
- [ ] Reverse proxy form shows all fields
- [ ] Can add/remove upstreams
- [ ] Can add/remove custom headers
- [ ] Form validation works (domain required, at least one upstream)
- [ ] WebSocket toggle works
- [ ] Load balancing dropdown appears when multiple upstreams

## Files Created
- `web/src/components/HandlerTypeSelector.tsx`
- `web/src/components/forms/ReverseProxyForm.tsx`
- Updated `web/src/pages/RouteForm.tsx`

## Estimated Time
2-3 hours
