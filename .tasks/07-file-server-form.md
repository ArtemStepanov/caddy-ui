# Task 07: File Server Form

## Objective
Create the form component for configuring file server routes.

## Prerequisites
- Task 06 completed (RouteForm page with handler type selector)

## File Server Configuration Options

Based on Caddy's file_server directive:

| Option | Description | Default |
|--------|-------------|---------|
| `root` | Root directory to serve files from | required |
| `browse` | Enable directory listing | false |
| `index` | Index file names | ["index.html", "index.txt"] |
| `hide` | Files/patterns to hide | [] |
| `precompressed` | Serve precompressed files | false |

## Steps

### 7.1 Create File Server Form (`web/src/components/forms/FileServerForm.tsx`)

```tsx
import { useState } from 'preact/hooks';

interface FileServerConfig {
  root: string;
  browse: boolean;
  index?: string[];
  hide?: string[];
  precompressed?: boolean;
}

interface FileServerFormProps {
  config: FileServerConfig;
  onChange: (config: FileServerConfig) => void;
}

export function FileServerForm({ config, onChange }: FileServerFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newIndexFile, setNewIndexFile] = useState('');
  const [newHidePattern, setNewHidePattern] = useState('');

  const addIndexFile = () => {
    if (!newIndexFile.trim()) return;
    const current = config.index || ['index.html', 'index.txt'];
    onChange({
      ...config,
      index: [...current, newIndexFile.trim()],
    });
    setNewIndexFile('');
  };

  const removeIndexFile = (index: number) => {
    const current = config.index || [];
    onChange({
      ...config,
      index: current.filter((_, i) => i !== index),
    });
  };

  const addHidePattern = () => {
    if (!newHidePattern.trim()) return;
    const current = config.hide || [];
    onChange({
      ...config,
      hide: [...current, newHidePattern.trim()],
    });
    setNewHidePattern('');
  };

  const removeHidePattern = (index: number) => {
    const current = config.hide || [];
    onChange({
      ...config,
      hide: current.filter((_, i) => i !== index),
    });
  };

  return (
    <div class="space-y-6">
      {/* Root Directory */}
      <div>
        <label class="label">Root Directory *</label>
        <input
          type="text"
          value={config.root}
          onInput={(e) => onChange({ ...config, root: (e.target as HTMLInputElement).value })}
          placeholder="/var/www/html"
          class="input"
          required
        />
        <p class="text-sm text-slate-500 mt-1">
          The directory from which to serve files. Must be an absolute path.
        </p>
        
        {/* Common paths suggestions */}
        <div class="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={() => onChange({ ...config, root: '/srv' })}
            class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
          >
            /srv
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, root: '/var/www/html' })}
            class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
          >
            /var/www/html
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, root: '/home/user/public' })}
            class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
          >
            /home/user/public
          </button>
        </div>
      </div>

      {/* Browse (Directory Listing) */}
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.browse}
            onChange={(e) =>
              onChange({ ...config, browse: (e.target as HTMLInputElement).checked })
            }
            class="w-5 h-5 rounded bg-slate-900 border-slate-700"
          />
          <div>
            <div class="font-medium">Enable Directory Listing</div>
            <div class="text-sm text-slate-500">
              Show a list of files when visiting a directory without an index file
            </div>
          </div>
        </label>
      </div>

      {/* Precompressed */}
      <div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.precompressed || false}
            onChange={(e) =>
              onChange({ ...config, precompressed: (e.target as HTMLInputElement).checked })
            }
            class="w-5 h-5 rounded bg-slate-900 border-slate-700"
          />
          <div>
            <div class="font-medium">Serve Precompressed Files</div>
            <div class="text-sm text-slate-500">
              Serve .gz, .br, or .zst files if they exist alongside the original
            </div>
          </div>
        </label>
      </div>

      {/* Advanced Options Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          class="text-primary-500 hover:text-primary-400 text-sm font-medium"
        >
          {showAdvanced ? '▼ Hide Advanced Options' : '▶ Show Advanced Options'}
        </button>
      </div>

      {showAdvanced && (
        <div class="space-y-6 pl-4 border-l-2 border-slate-700">
          {/* Index Files */}
          <div>
            <label class="label">Index Files</label>
            <p class="text-sm text-slate-500 mb-2">
              Files to look for when a directory is requested (in order of priority)
            </p>

            <div class="space-y-2 mb-2">
              {(config.index || ['index.html', 'index.txt']).map((file, index) => (
                <div key={index} class="flex items-center gap-2">
                  <input
                    type="text"
                    value={file}
                    class="input flex-1"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => removeIndexFile(index)}
                    class="btn btn-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div class="flex gap-2">
              <input
                type="text"
                value={newIndexFile}
                onInput={(e) => setNewIndexFile((e.target as HTMLInputElement).value)}
                placeholder="default.html"
                class="input flex-1"
              />
              <button type="button" onClick={addIndexFile} class="btn btn-secondary">
                Add
              </button>
            </div>
          </div>

          {/* Hidden Files */}
          <div>
            <label class="label">Hidden Files/Patterns</label>
            <p class="text-sm text-slate-500 mb-2">
              Files or patterns to hide from requests (e.g., .git, *.log)
            </p>

            <div class="space-y-2 mb-2">
              {(config.hide || []).map((pattern, index) => (
                <div key={index} class="flex items-center gap-2">
                  <input
                    type="text"
                    value={pattern}
                    class="input flex-1"
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => removeHidePattern(index)}
                    class="btn btn-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div class="flex gap-2">
              <input
                type="text"
                value={newHidePattern}
                onInput={(e) => setNewHidePattern((e.target as HTMLInputElement).value)}
                placeholder=".git"
                class="input flex-1"
              />
              <button type="button" onClick={addHidePattern} class="btn btn-secondary">
                Add
              </button>
            </div>

            {/* Common hide patterns */}
            <div class="flex flex-wrap gap-2 mt-2">
              <button
                type="button"
                onClick={() => onChange({ ...config, hide: [...(config.hide || []), '.git'] })}
                class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
              >
                + .git
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, hide: [...(config.hide || []), '.env'] })}
                class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
              >
                + .env
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, hide: [...(config.hide || []), '*.log'] })}
                class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
              >
                + *.log
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...config, hide: [...(config.hide || []), 'node_modules'] })}
                class="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded"
              >
                + node_modules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function getDefaultFileServerConfig(): FileServerConfig {
  return {
    root: '',
    browse: false,
    index: ['index.html', 'index.txt'],
    hide: [],
    precompressed: false,
  };
}
```

### 7.2 Update RouteForm to Include File Server Form

In `web/src/pages/RouteForm.tsx`, update the imports and handler type change:

```tsx
import { FileServerForm, getDefaultFileServerConfig } from '../components/forms/FileServerForm';

// In handleHandlerTypeChange:
case 'file_server':
  setConfig(getDefaultFileServerConfig());
  break;

// In the form JSX, replace the placeholder:
{handlerType === 'file_server' && (
  <FileServerForm config={config} onChange={setConfig} />
)}
```

### 7.3 Update Config Builder for File Server

In `internal/config/builder.go`, update `buildFileServerHandler`:

```go
func buildFileServerHandler(configJSON json.RawMessage) Handler {
    var cfg struct {
        Root          string   `json:"root"`
        Browse        bool     `json:"browse"`
        Index         []string `json:"index,omitempty"`
        Hide          []string `json:"hide,omitempty"`
        Precompressed bool     `json:"precompressed,omitempty"`
    }
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    handler := Handler{
        "handler": "file_server",
        "root":    cfg.Root,
    }

    if cfg.Browse {
        handler["browse"] = map[string]any{}
    }

    if len(cfg.Index) > 0 {
        handler["index_names"] = cfg.Index
    }

    if len(cfg.Hide) > 0 {
        handler["hide"] = cfg.Hide
    }

    if cfg.Precompressed {
        handler["precompressed"] = map[string]any{
            "gzip": map[string]any{},
            "zstd": map[string]any{},
            "br":   map[string]any{},
        }
    }

    return handler
}
```

## Verification
- [ ] File server form renders correctly
- [ ] Root directory input works
- [ ] Browse toggle works
- [ ] Precompressed toggle works
- [ ] Can add/remove index files
- [ ] Can add/remove hide patterns
- [ ] Advanced options toggle works
- [ ] Quick-add buttons for common paths work
- [ ] Config builder generates correct Caddy JSON

## Files Created/Modified
- `web/src/components/forms/FileServerForm.tsx` (new)
- `web/src/pages/RouteForm.tsx` (modified)
- `internal/config/builder.go` (modified)

## Estimated Time
1-2 hours
