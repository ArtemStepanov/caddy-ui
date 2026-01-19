import { useState, useEffect } from 'preact/hooks';
import { api, GlobalConfig } from '../lib/api';

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; error?: string } | null>(null);
  const [importing, setImporting] = useState(false);

  const [config, setConfig] = useState<GlobalConfig>({
    caddy_admin_url: 'http://localhost:2019',
    enable_encode: true,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { config: cfg } = await api.getConfig();
      setConfig(cfg);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.updateConfig(config);
      await api.sync();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const preview = await api.previewImport();
      if (confirm(`Found ${preview.count} routes in Caddy.\n\nWARNING: This will DELETE all local routes and replace them with the configuration from Caddy.\n\nAre you sure you want to proceed?`)) {
        const result = await api.importFromCaddy();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        alert(`Successfully imported ${result.imported} routes.`);
      }
    } catch (err: any) {
      setError("Import failed: " + err.message);
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div class="text-center py-8">
        <div class="text-slate-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Settings</h1>

      {error && (
        <div class="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6 text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div class="bg-green-900/50 border border-green-700 rounded-lg p-4 mb-6 text-green-300">
          Settings saved and applied successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} class="space-y-6">
        {/* Caddy Connection */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Caddy Connection</h2>
          
          <div>
            <label class="label">Caddy Admin API URL</label>
            <input
              type="url"
              value={config.caddy_admin_url}
              onInput={(e) => setConfig({ ...config, caddy_admin_url: (e.target as HTMLInputElement).value })}
              placeholder="http://localhost:2019"
              class="input"
              required
            />
            <p class="text-sm text-slate-500 mt-1">
              The URL of your Caddy server's admin API (default port is 2019)
            </p>
          </div>

          <div class="flex gap-2 mt-4">
            <button type="button" onClick={testConnection} disabled={testing} class="btn btn-secondary">
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            
            {testResult && (
              <div class={`flex items-center gap-2 text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.success ? (
                  <>✓ Connected ({testResult.latency}ms)</>
                ) : (
                  <>✗ {testResult.error}</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compression */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Response Compression</h2>
          
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enable_encode}
              onChange={(e) => setConfig({ ...config, enable_encode: (e.target as HTMLInputElement).checked })}
              class="w-5 h-5 rounded bg-slate-900 border-slate-700"
            />
            <div>
              <div class="font-medium">Enable Compression</div>
              <div class="text-sm text-slate-500">
                Compress responses with gzip and zstd for faster loading
              </div>
            </div>
          </label>

          <div class="mt-4 bg-slate-800/50 rounded-lg p-4 text-sm">
            <div class="font-medium text-slate-300 mb-2">About Compression</div>
            <ul class="space-y-1 text-slate-400">
              <li>• Reduces response size by 60-90% for text content</li>
              <li>• Supports gzip (universal) and zstd (faster, newer)</li>
              <li>• Automatically negotiates best format with browser</li>
            </ul>
          </div>
        </div>

        {/* Configuration Sync */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">Configuration Import</h2>
          
          <div class="mb-4 text-sm text-slate-400">
            Import configuration from the running Caddy instance. 
            <div class="mt-2 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-200">
              <strong>Warning:</strong> This will overwrite all local routes with the ones found in Caddy.
              Any routes in Caddy that are not fully supported by this UI will be preserved but may not be fully editable.
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleImport}
            disabled={importing}
            class="btn bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200"
          >
            {importing ? 'Importing...' : 'Import from Caddy'}
          </button>
        </div>

        {/* About */}
        <div class="card">
          <h2 class="text-lg font-semibold mb-4">About</h2>
          
          <div class="space-y-2 text-sm text-slate-400">
            <div>
              <span class="text-slate-300">Caddy Orchestrator Lite</span>
            </div>
            <div>
              A simple web UI for managing Caddy server routes.
            </div>
          </div>
        </div>

        {/* Submit */}
        <div class="flex justify-end">
          <button type="submit" class="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
