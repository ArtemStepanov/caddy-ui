import { useState, useEffect } from 'preact/hooks';
import { api, Route } from '../lib/api';

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

function RouteCard({ route, onToggle, onDelete }: { 
  route: Route; 
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
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
        <div class="text-2xl">
          {HANDLER_ICONS[route.handler_type] || '⚙️'}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-semibold text-lg truncate">{route.domain}</h3>
            {route.path && (
              <span class="text-slate-400 text-sm font-mono">{route.path}</span>
            )}
            {route.strip_path_prefix && (
              <span class="bg-primary-600/30 text-primary-300 text-xs px-1.5 py-0.5 rounded" title={`Strips "${route.strip_path_prefix}" from path before forwarding`}>
                strips {route.strip_path_prefix}
              </span>
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

        <div class="flex items-center gap-2">
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

          <a href={`/routes/${route.id}`} class="btn btn-secondary text-sm">
            Edit
          </a>

          <button onClick={() => onDelete(route.id)} class="btn btn-danger text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  const filteredRoutes = routes.filter((route) => {
    const matchesSearch = filter === '' ||
      route.domain.toLowerCase().includes(filter.toLowerCase()) ||
      (route.path || '').toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === 'all' || route.handler_type === typeFilter;
    return matchesSearch && matchesType;
  });

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
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">Routes</h1>
          <p class="text-slate-400">
            {routes.length} route{routes.length !== 1 ? 's' : ''} configured
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button onClick={handleSync} disabled={syncing} class="btn btn-secondary">
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
          <button onClick={() => setError(null)} class="float-right text-red-400 hover:text-red-300">
            ×
          </button>
        </div>
      )}

      {routes.length === 0 ? (
        <div class="text-center py-16">
          <div class="text-6xl mb-4">🌐</div>
          <h2 class="text-xl font-semibold mb-2">No routes configured</h2>
          <p class="text-slate-400 mb-6 max-w-md mx-auto">
            Add your first route to start managing your Caddy server configuration.
          </p>
          <a href="/routes/new" class="btn btn-primary">Add Route</a>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
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
              No routes match your filter
            </div>
          )}
        </>
      )}
    </div>
  );
}
