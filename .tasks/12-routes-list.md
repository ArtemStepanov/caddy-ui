# Task 12: Routes List Dashboard

## Objective
Create the main dashboard showing all routes with ability to enable/disable, edit, and delete.

## Prerequisites
- API routes working (Task 03)
- Route forms working (Tasks 06-08)

## Features
- List all routes with status indicators
- Quick enable/disable toggle
- Edit and delete buttons
- Filter by domain or handler type
- Sort by domain, type, or status

## Steps

### 12.1 Create Route Card Component (`web/src/components/RouteCard.tsx`)

```tsx
import { Route } from '../lib/api';

interface RouteCardProps {
  route: Route;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const HANDLER_ICONS: Record<string, string> = {
  reverse_proxy: '🔄',
  file_server: '📁',
  redir: '↗️',
};

const HANDLER_LABELS: Record<string, string> = {
  reverse_proxy: 'Reverse Proxy',
  file_server: 'File Server',
  redir: 'Redirect',
};

export function RouteCard({ route, onToggle, onDelete }: RouteCardProps) {
  const getConfigSummary = () => {
    try {
      const config = typeof route.config === 'string' 
        ? JSON.parse(route.config) 
        : route.config;
      
      switch (route.handler_type) {
        case 'reverse_proxy':
          const upstreams = config.upstreams || [];
          return upstreams.length > 0 
            ? `→ ${upstreams[0]}${upstreams.length > 1 ? ` (+${upstreams.length - 1})` : ''}`
            : 'No upstreams';
        case 'file_server':
          return config.root || 'No root set';
        case 'redir':
          return `→ ${config.to || 'No destination'}`;
        default:
          return '';
      }
    } catch {
      return '';
    }
  };

  return (
    <div class={`card transition-opacity ${!route.enabled ? 'opacity-60' : ''}`}>
      <div class="flex items-start gap-4">
        {/* Icon */}
        <div class="text-2xl">
          {HANDLER_ICONS[route.handler_type] || '⚙️'}
        </div>

        {/* Content */}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-semibold text-lg truncate">{route.domain}</h3>
            {route.path && (
              <span class="text-slate-400 text-sm font-mono">{route.path}</span>
            )}
          </div>
          
          <div class="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <span class="bg-slate-700 px-2 py-0.5 rounded">
              {HANDLER_LABELS[route.handler_type] || route.handler_type}
            </span>
            <span class="truncate">{getConfigSummary()}</span>
          </div>

          <div class="text-xs text-slate-500">
            Updated {new Date(route.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div class="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={() => onToggle(route.id)}
            class={`w-12 h-6 rounded-full relative transition-colors ${
              route.enabled ? 'bg-green-600' : 'bg-slate-600'
            }`}
            title={route.enabled ? 'Disable route' : 'Enable route'}
          >
            <span
              class={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                route.enabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>

          {/* Edit */}
          <a
            href={`/routes/${route.id}`}
            class="btn btn-secondary text-sm"
          >
            Edit
          </a>

          {/* Delete */}
          <button
            onClick={() => onDelete(route.id)}
            class="btn btn-danger text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 12.2 Create Empty State Component (`web/src/components/EmptyState.tsx`)

```tsx
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div class="text-center py-16">
      <div class="text-6xl mb-4">🌐</div>
      <h2 class="text-xl font-semibold mb-2">{title}</h2>
      <p class="text-slate-400 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <a href={action.href} class="btn btn-primary">
          {action.label}
        </a>
      )}
    </div>
  );
}
```

### 12.3 Update Dashboard Page (`web/src/pages/Dashboard.tsx`)

```tsx
import { useState, useEffect } from 'preact/hooks';
import { api, Route } from '../lib/api';
import { RouteCard } from '../components/RouteCard';
import { EmptyState } from '../components/EmptyState';

export function Dashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    try {
      const { routes } = await api.listRoutes();
      setRoutes(routes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      const { route } = await api.toggleRoute(id);
      setRoutes(routes.map((r) => (r.id === id ? route : r)));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this route?')) return;

    try {
      await api.deleteRoute(id);
      setRoutes(routes.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await api.sync();
      // Show success briefly
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  // Filter routes
  const filteredRoutes = routes.filter((route) => {
    const matchesSearch =
      filter === '' ||
      route.domain.toLowerCase().includes(filter.toLowerCase()) ||
      (route.path || '').toLowerCase().includes(filter.toLowerCase());

    const matchesType = typeFilter === 'all' || route.handler_type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Group by enabled/disabled
  const enabledRoutes = filteredRoutes.filter((r) => r.enabled);
  const disabledRoutes = filteredRoutes.filter((r) => !r.enabled);

  if (loading) {
    return (
      <div class="text-center py-8">
        <div class="text-slate-400">Loading routes...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">Routes</h1>
          <p class="text-slate-400">
            {routes.length} route{routes.length !== 1 ? 's' : ''} configured
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            class="btn btn-secondary"
          >
            {syncing ? 'Syncing...' : 'Sync to Caddy'}
          </button>
          <a href="/routes/new" class="btn btn-primary">
            + Add Route
          </a>
        </div>
      </div>

      {error && (
        <div class="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
          {error}
          <button
            onClick={() => setError(null)}
            class="float-right text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {routes.length === 0 ? (
        <EmptyState
          title="No routes configured"
          description="Add your first route to start managing your Caddy server configuration."
          action={{ label: 'Add Route', href: '/routes/new' }}
        />
      ) : (
        <>
          {/* Filters */}
          <div class="flex gap-4 mb-6">
            <input
              type="text"
              value={filter}
              onInput={(e) => setFilter((e.target as HTMLInputElement).value)}
              placeholder="Filter by domain..."
              class="input flex-1 max-w-xs"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter((e.target as HTMLSelectElement).value)}
              class="input w-40"
            >
              <option value="all">All Types</option>
              <option value="reverse_proxy">Reverse Proxy</option>
              <option value="file_server">File Server</option>
              <option value="redir">Redirect</option>
            </select>
          </div>

          {/* Routes List */}
          <div class="space-y-4">
            {enabledRoutes.length > 0 && (
              <div class="space-y-3">
                {enabledRoutes.map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {disabledRoutes.length > 0 && (
              <div class="mt-8">
                <h2 class="text-lg font-semibold text-slate-400 mb-3">
                  Disabled Routes ({disabledRoutes.length})
                </h2>
                <div class="space-y-3">
                  {disabledRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {filteredRoutes.length === 0 && routes.length > 0 && (
            <div class="text-center py-8 text-slate-400">
              No routes match your filters
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### 12.4 Add Stats Summary (Optional Enhancement)

```tsx
// Add above the filters section:
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <div class="card text-center">
    <div class="text-2xl font-bold">{routes.length}</div>
    <div class="text-sm text-slate-400">Total Routes</div>
  </div>
  <div class="card text-center">
    <div class="text-2xl font-bold text-green-400">
      {routes.filter((r) => r.enabled).length}
    </div>
    <div class="text-sm text-slate-400">Enabled</div>
  </div>
  <div class="card text-center">
    <div class="text-2xl font-bold">
      {routes.filter((r) => r.handler_type === 'reverse_proxy').length}
    </div>
    <div class="text-sm text-slate-400">Proxies</div>
  </div>
  <div class="card text-center">
    <div class="text-2xl font-bold">
      {new Set(routes.map((r) => r.domain)).size}
    </div>
    <div class="text-sm text-slate-400">Domains</div>
  </div>
</div>
```

## Verification
- [ ] Dashboard loads and displays routes
- [ ] Empty state shows when no routes exist
- [ ] Route cards show correct information
- [ ] Enable/disable toggle works
- [ ] Edit button navigates to edit form
- [ ] Delete button removes route (with confirmation)
- [ ] Search filter works
- [ ] Type filter works
- [ ] Sync button triggers re-sync to Caddy
- [ ] Error messages display properly

## Files Created/Modified
- `web/src/components/RouteCard.tsx` (new)
- `web/src/components/EmptyState.tsx` (new)
- `web/src/pages/Dashboard.tsx` (rewrite)

## Estimated Time
2-3 hours
