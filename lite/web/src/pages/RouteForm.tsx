import { useState, useEffect } from 'preact/hooks';
import { route as navigate } from 'preact-router';
import { api } from '../lib/api';

interface RouteFormProps {
  id?: string;
}

const HANDLER_TYPES = [
  { id: 'reverse_proxy', name: 'Reverse Proxy', description: 'Forward requests to a backend service', icon: '🔄' },
  { id: 'file_server', name: 'File Server', description: 'Serve static files from a directory', icon: '📁' },
  { id: 'redir', name: 'Redirect', description: 'Redirect to another URL', icon: '↗️' },
];

export function RouteForm({ id }: RouteFormProps) {
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [domain, setDomain] = useState('');
  const [path, setPath] = useState('');
  const [handlerType, setHandlerType] = useState('reverse_proxy');
  const [config, setConfig] = useState<any>({ upstreams: [], websocket: false, headers: {}, load_balancing: 'round_robin' });

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
      setConfig(typeof route.config === 'string' ? JSON.parse(route.config) : route.config);
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
    switch (type) {
      case 'reverse_proxy':
        setConfig({ upstreams: [], websocket: false, headers: {}, load_balancing: 'round_robin' });
        break;
      case 'file_server':
        setConfig({ root: '', browse: false, index: [], hide: [], precompressed: false });
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
        <h1 class="text-2xl font-bold">{isEdit ? 'Edit Route' : 'New Route'}</h1>
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
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HANDLER_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => handleHandlerTypeChange(type.id)}
                class={`card text-left transition-all ${
                  handlerType === type.id
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
        </div>

        {/* Handler-specific config */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Handler Configuration</h2>
          
          {handlerType === 'reverse_proxy' && (
            <ReverseProxyConfig config={config} onChange={setConfig} />
          )}
          
          {handlerType === 'file_server' && (
            <FileServerConfig config={config} onChange={setConfig} />
          )}
          
          {handlerType === 'redir' && (
            <RedirectConfig config={config} onChange={setConfig} />
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

function ReverseProxyConfig({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const [newUpstream, setNewUpstream] = useState('');
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  const addUpstream = () => {
    if (!newUpstream.trim()) return;
    onChange({ ...config, upstreams: [...(config.upstreams || []), newUpstream.trim()] });
    setNewUpstream('');
  };

  const removeUpstream = (index: number) => {
    onChange({ ...config, upstreams: config.upstreams.filter((_: any, i: number) => i !== index) });
  };

  const addHeader = () => {
    if (!newHeaderKey.trim()) return;
    onChange({
      ...config,
      headers: { ...(config.headers || {}), [newHeaderKey.trim()]: newHeaderValue },
    });
    setNewHeaderKey('');
    setNewHeaderValue('');
  };

  const removeHeader = (key: string) => {
    const { [key]: _, ...rest } = config.headers || {};
    onChange({ ...config, headers: rest });
  };

  const addHeaderPreset = (key: string, value: string) => {
    onChange({
      ...config,
      headers: { ...(config.headers || {}), [key]: value },
    });
  };

  return (
    <div class="space-y-6">
      {/* Upstreams */}
      <div>
        <label class="label">Backend Servers *</label>
        <p class="text-sm text-slate-500 mb-2">
          Enter the address of your backend service (e.g., localhost:8080, 10.0.0.5:3000)
        </p>
        
        <div class="space-y-2 mb-2">
          {(config.upstreams || []).map((upstream: string, index: number) => (
            <div key={index} class="flex items-center gap-2">
              <input type="text" value={upstream} class="input flex-1" readOnly />
              <button type="button" onClick={() => removeUpstream(index)} class="btn btn-danger">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            value={newUpstream}
            onInput={(e) => setNewUpstream((e.target as HTMLInputElement).value)}
            placeholder="localhost:8080"
            class="input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUpstream())}
          />
          <button type="button" onClick={addUpstream} class="btn btn-secondary">Add</button>
        </div>
      </div>

      {/* WebSocket Support */}
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.websocket || false}
            onChange={(e) => onChange({ ...config, websocket: (e.target as HTMLInputElement).checked })}
            class="w-5 h-5 rounded bg-slate-900 border-slate-700"
          />
          <div>
            <div class="font-medium">Enable WebSocket Support</div>
            <div class="text-sm text-slate-500">Allows WebSocket connections to pass through</div>
          </div>
        </label>
      </div>

      {/* Load Balancing - only show when multiple upstreams */}
      {(config.upstreams || []).length > 1 && (
        <div>
          <label class="label">Load Balancing Policy</label>
          <select
            value={config.load_balancing || 'round_robin'}
            onChange={(e) => onChange({ ...config, load_balancing: (e.target as HTMLSelectElement).value })}
            class="input"
          >
            <option value="round_robin">Round Robin</option>
            <option value="random">Random</option>
            <option value="first">First Available</option>
            <option value="least_conn">Least Connections</option>
            <option value="ip_hash">IP Hash (Sticky)</option>
          </select>
          <p class="text-sm text-slate-500 mt-1">
            How to distribute requests between backend servers
          </p>
        </div>
      )}

      {/* Custom Headers */}
      <div>
        <label class="label">Custom Headers (Optional)</label>
        <p class="text-sm text-slate-500 mb-2">
          Add headers to requests sent to the backend
        </p>

        <div class="space-y-2 mb-2">
          {Object.entries(config.headers || {}).map(([key, value]) => (
            <div key={key} class="flex items-center gap-2">
              <input type="text" value={key} class="input w-1/3" readOnly />
              <input type="text" value={value as string} class="input flex-1" readOnly />
              <button type="button" onClick={() => removeHeader(key)} class="btn btn-danger">
                Remove
              </button>
            </div>
          ))}
        </div>

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
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHeader())}
          />
          <button type="button" onClick={addHeader} class="btn btn-secondary">Add</button>
        </div>
      </div>

      {/* Quick Header Presets */}
      <div>
        <label class="label">Quick Header Presets</label>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addHeaderPreset('X-Real-IP', '{http.request.remote.host}')}
            class="btn btn-secondary text-sm"
          >
            + X-Real-IP
          </button>
          <button
            type="button"
            onClick={() => addHeaderPreset('X-Forwarded-Proto', '{http.request.scheme}')}
            class="btn btn-secondary text-sm"
          >
            + X-Forwarded-Proto
          </button>
          <button
            type="button"
            onClick={() => addHeaderPreset('Host', '{http.reverse_proxy.upstream.hostport}')}
            class="btn btn-secondary text-sm"
          >
            + Preserve Host
          </button>
        </div>
      </div>
    </div>
  );
}

function FileServerConfig({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const [newIndex, setNewIndex] = useState('');
  const [newHide, setNewHide] = useState('');

  const addIndex = () => {
    if (!newIndex.trim()) return;
    onChange({ ...config, index: [...(config.index || []), newIndex.trim()] });
    setNewIndex('');
  };

  const removeIndex = (index: number) => {
    onChange({ ...config, index: config.index.filter((_: any, i: number) => i !== index) });
  };

  const addHide = () => {
    if (!newHide.trim()) return;
    onChange({ ...config, hide: [...(config.hide || []), newHide.trim()] });
    setNewHide('');
  };

  const removeHide = (index: number) => {
    onChange({ ...config, hide: config.hide.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div class="space-y-6">
      {/* Root Directory */}
      <div>
        <label class="label">Root Directory *</label>
        <input
          type="text"
          value={config.root || ''}
          onInput={(e) => onChange({ ...config, root: (e.target as HTMLInputElement).value })}
          placeholder="/var/www/html"
          class="input"
          required
        />
        <p class="text-sm text-slate-500 mt-1">
          The directory from which to serve files
        </p>
      </div>

      {/* Directory Listing */}
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.browse || false}
            onChange={(e) => onChange({ ...config, browse: (e.target as HTMLInputElement).checked })}
            class="w-5 h-5 rounded bg-slate-900 border-slate-700"
          />
          <div>
            <div class="font-medium">Enable Directory Listing</div>
            <div class="text-sm text-slate-500">Show a list of files when visiting a directory</div>
          </div>
        </label>
      </div>

      {/* Precompressed */}
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.precompressed || false}
            onChange={(e) => onChange({ ...config, precompressed: (e.target as HTMLInputElement).checked })}
            class="w-5 h-5 rounded bg-slate-900 border-slate-700"
          />
          <div>
            <div class="font-medium">Serve Precompressed Files</div>
            <div class="text-sm text-slate-500">Serve .gz/.br files if available (e.g., app.js.gz)</div>
          </div>
        </label>
      </div>

      {/* Index Files */}
      <div>
        <label class="label">Index Files (Optional)</label>
        <p class="text-sm text-slate-500 mb-2">
          Files to look for when a directory is requested (default: index.html)
        </p>
        
        <div class="space-y-2 mb-2">
          {(config.index || []).map((file: string, index: number) => (
            <div key={index} class="flex items-center gap-2">
              <input type="text" value={file} class="input flex-1" readOnly />
              <button type="button" onClick={() => removeIndex(index)} class="btn btn-danger">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            value={newIndex}
            onInput={(e) => setNewIndex((e.target as HTMLInputElement).value)}
            placeholder="index.html"
            class="input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndex())}
          />
          <button type="button" onClick={addIndex} class="btn btn-secondary">Add</button>
        </div>
      </div>

      {/* Hidden Files */}
      <div>
        <label class="label">Hidden Files/Patterns (Optional)</label>
        <p class="text-sm text-slate-500 mb-2">
          Files or patterns to hide from directory listings and direct access
        </p>
        
        <div class="space-y-2 mb-2">
          {(config.hide || []).map((pattern: string, index: number) => (
            <div key={index} class="flex items-center gap-2">
              <input type="text" value={pattern} class="input flex-1" readOnly />
              <button type="button" onClick={() => removeHide(index)} class="btn btn-danger">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            value={newHide}
            onInput={(e) => setNewHide((e.target as HTMLInputElement).value)}
            placeholder=".*"
            class="input flex-1"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHide())}
          />
          <button type="button" onClick={addHide} class="btn btn-secondary">Add</button>
        </div>

        {/* Quick hide presets */}
        <div class="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={() => onChange({ ...config, hide: [...(config.hide || []), '.*'] })}
            class="btn btn-secondary text-sm"
          >
            + Dotfiles (.*)
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, hide: [...(config.hide || []), '*.md'] })}
            class="btn btn-secondary text-sm"
          >
            + Markdown (*.md)
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, hide: [...(config.hide || []), 'node_modules'] })}
            class="btn btn-secondary text-sm"
          >
            + node_modules
          </button>
        </div>
      </div>
    </div>
  );
}

function RedirectConfig({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <div class="space-y-6">
      <div>
        <label class="label">Redirect To *</label>
        <input
          type="text"
          value={config.to || ''}
          onInput={(e) => onChange({ ...config, to: (e.target as HTMLInputElement).value })}
          placeholder="https://example.com{uri}"
          class="input"
          required
        />
        <p class="text-sm text-slate-500 mt-1">
          The destination URL for the redirect
        </p>
      </div>

      {/* Placeholders info */}
      <div class="bg-slate-800/50 rounded-lg p-4">
        <label class="label mb-2">Available Placeholders</label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <code class="text-primary-400">{'{uri}'}</code>
            <span class="text-slate-400 ml-2">Full path + query string</span>
          </div>
          <div>
            <code class="text-primary-400">{'{path}'}</code>
            <span class="text-slate-400 ml-2">Just the path</span>
          </div>
          <div>
            <code class="text-primary-400">{'{query}'}</code>
            <span class="text-slate-400 ml-2">Just the query string</span>
          </div>
          <div>
            <code class="text-primary-400">{'{host}'}</code>
            <span class="text-slate-400 ml-2">Original hostname</span>
          </div>
          <div>
            <code class="text-primary-400">{'{scheme}'}</code>
            <span class="text-slate-400 ml-2">http or https</span>
          </div>
          <div>
            <code class="text-primary-400">{'{port}'}</code>
            <span class="text-slate-400 ml-2">Server port</span>
          </div>
        </div>
      </div>

      {/* Quick redirect presets */}
      <div>
        <label class="label">Quick Presets</label>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...config, to: 'https://{host}{uri}' })}
            class="btn btn-secondary text-sm"
          >
            HTTP to HTTPS
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, to: 'https://www.{host}{uri}' })}
            class="btn btn-secondary text-sm"
          >
            Add www prefix
          </button>
          <button
            type="button"
            onClick={() => {
              const host = config.to?.match(/https?:\/\/([^/]+)/)?.[1] || 'example.com';
              onChange({ ...config, to: `https://${host.replace(/^www\./, '')}{uri}` });
            }}
            class="btn btn-secondary text-sm"
          >
            Remove www prefix
          </button>
        </div>
      </div>

      <div>
        <label class="label">Redirect Type</label>
        <select
          value={config.code || 302}
          onChange={(e) => onChange({ ...config, code: parseInt((e.target as HTMLSelectElement).value) })}
          class="input"
        >
          <option value={301}>301 - Permanent (cached by browsers)</option>
          <option value={302}>302 - Temporary (default)</option>
          <option value={307}>307 - Temporary (preserve POST/PUT method)</option>
          <option value={308}>308 - Permanent (preserve POST/PUT method)</option>
        </select>
        <p class="text-sm text-slate-500 mt-1">
          Use 301/308 for permanent moves, 302/307 for temporary redirects
        </p>
      </div>
    </div>
  );
}
