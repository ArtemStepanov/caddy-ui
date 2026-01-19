import { useState } from 'preact/hooks';
import { HeaderConfig } from '../../lib/api';

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
        delete: (config.delete || []).filter((k: string) => k !== key),
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
              <span class="font-mono text-slate-400 flex-1 truncate">{value as string}</span>
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
              <span class="font-mono text-slate-400 flex-1 truncate">{value as string}</span>
              <button
                type="button"
                onClick={() => removeHeader('add', key)}
                class="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          {(config.delete || []).map((key: string) => (
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
