# Task 08: Redirect Form

## Objective
Create the form component for configuring redirect routes.

## Prerequisites
- Task 06 completed (RouteForm page with handler type selector)

## Redirect Configuration Options

Based on Caddy's redir directive:

| Option | Description | Default |
|--------|-------------|---------|
| `to` | Destination URL (required) | - |
| `code` | HTTP status code | 302 |

Common redirect codes:
- 301 - Permanent redirect (cached by browsers)
- 302 - Temporary redirect (not cached)
- 303 - See Other (redirect after POST)
- 307 - Temporary (preserves method)
- 308 - Permanent (preserves method)

## Steps

### 8.1 Create Redirect Form (`web/src/components/forms/RedirectForm.tsx`)

```tsx
interface RedirectConfig {
  to: string;
  code: number;
}

interface RedirectFormProps {
  config: RedirectConfig;
  onChange: (config: RedirectConfig) => void;
}

const REDIRECT_CODES = [
  { code: 301, label: '301 - Permanent', description: 'Cached by browsers, SEO-friendly for permanent moves' },
  { code: 302, label: '302 - Temporary', description: 'Not cached, good for temporary redirects' },
  { code: 303, label: '303 - See Other', description: 'Redirect after POST, changes method to GET' },
  { code: 307, label: '307 - Temporary Redirect', description: 'Like 302 but preserves request method' },
  { code: 308, label: '308 - Permanent Redirect', description: 'Like 301 but preserves request method' },
];

export function RedirectForm({ config, onChange }: RedirectFormProps) {
  return (
    <div class="space-y-6">
      {/* Destination URL */}
      <div>
        <label class="label">Redirect To *</label>
        <input
          type="text"
          value={config.to}
          onInput={(e) => onChange({ ...config, to: (e.target as HTMLInputElement).value })}
          placeholder="https://example.com{uri}"
          class="input"
          required
        />
        <p class="text-sm text-slate-500 mt-1">
          The destination URL. Use <code class="bg-slate-800 px-1 rounded">{'{uri}'}</code> to 
          preserve the original path and query string.
        </p>

        {/* Common patterns */}
        <div class="mt-3 space-y-2">
          <div class="text-sm text-slate-400 font-medium">Common patterns:</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...config, to: 'https://{host}{uri}' })}
              class="text-left text-sm bg-slate-700 hover:bg-slate-600 p-2 rounded"
            >
              <div class="font-medium">HTTP → HTTPS</div>
              <div class="text-slate-400 text-xs">https://{'{host}{uri}'}</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, to: 'https://example.com{uri}' })}
              class="text-left text-sm bg-slate-700 hover:bg-slate-600 p-2 rounded"
            >
              <div class="font-medium">www → non-www</div>
              <div class="text-slate-400 text-xs">https://example.com{'{uri}'}</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, to: 'https://www.example.com{uri}' })}
              class="text-left text-sm bg-slate-700 hover:bg-slate-600 p-2 rounded"
            >
              <div class="font-medium">non-www → www</div>
              <div class="text-slate-400 text-xs">https://www.example.com{'{uri}'}</div>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, to: '/new-path' })}
              class="text-left text-sm bg-slate-700 hover:bg-slate-600 p-2 rounded"
            >
              <div class="font-medium">Path redirect</div>
              <div class="text-slate-400 text-xs">/new-path</div>
            </button>
          </div>
        </div>
      </div>

      {/* Available placeholders info */}
      <div class="bg-slate-800/50 rounded-lg p-4">
        <div class="text-sm font-medium text-slate-300 mb-2">Available Placeholders</div>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <code class="text-primary-400">{'{uri}'}</code>
            <span class="text-slate-500 ml-2">Full path + query</span>
          </div>
          <div>
            <code class="text-primary-400">{'{path}'}</code>
            <span class="text-slate-500 ml-2">Just the path</span>
          </div>
          <div>
            <code class="text-primary-400">{'{query}'}</code>
            <span class="text-slate-500 ml-2">Query string</span>
          </div>
          <div>
            <code class="text-primary-400">{'{host}'}</code>
            <span class="text-slate-500 ml-2">Request host</span>
          </div>
          <div>
            <code class="text-primary-400">{'{scheme}'}</code>
            <span class="text-slate-500 ml-2">http or https</span>
          </div>
          <div>
            <code class="text-primary-400">{'{hostport}'}</code>
            <span class="text-slate-500 ml-2">Host with port</span>
          </div>
        </div>
      </div>

      {/* Status Code */}
      <div>
        <label class="label">Redirect Type</label>
        <div class="space-y-2">
          {REDIRECT_CODES.map((item) => (
            <label
              key={item.code}
              class={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                config.code === item.code
                  ? 'bg-primary-900/30 border border-primary-700'
                  : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="redirect_code"
                value={item.code}
                checked={config.code === item.code}
                onChange={() => onChange({ ...config, code: item.code })}
                class="mt-1"
              />
              <div>
                <div class="font-medium">{item.label}</div>
                <div class="text-sm text-slate-400">{item.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Preview */}
      {config.to && (
        <div class="bg-slate-800/50 rounded-lg p-4">
          <div class="text-sm font-medium text-slate-300 mb-2">Preview</div>
          <div class="text-sm">
            <span class="text-slate-500">Requests to this domain will redirect to:</span>
            <div class="mt-1 font-mono text-primary-400 break-all">{config.to}</div>
            <div class="mt-1 text-slate-500">
              with status code <span class="text-white">{config.code}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function getDefaultRedirectConfig(): RedirectConfig {
  return {
    to: '',
    code: 302,
  };
}
```

### 8.2 Update RouteForm to Include Redirect Form

In `web/src/pages/RouteForm.tsx`, update the imports and handler type change:

```tsx
import { RedirectForm, getDefaultRedirectConfig } from '../components/forms/RedirectForm';

// In handleHandlerTypeChange:
case 'redir':
  setConfig(getDefaultRedirectConfig());
  break;

// In the form JSX, replace the placeholder:
{handlerType === 'redir' && (
  <RedirectForm config={config} onChange={setConfig} />
)}
```

### 8.3 Update Config Builder for Redirects

The redirect handler in Caddy uses `static_response` with a Location header.
Update `internal/config/builder.go`:

```go
func buildRedirectHandler(configJSON json.RawMessage) Handler {
    var cfg struct {
        To   string `json:"to"`
        Code int    `json:"code"`
    }
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    if cfg.To == "" {
        return nil
    }

    code := cfg.Code
    if code == 0 {
        code = 302
    }

    // Use static_response handler with Location header
    return Handler{
        "handler":     "static_response",
        "status_code": code,
        "headers": map[string][]string{
            "Location": {cfg.To},
        },
    }
}
```

### 8.4 Alternative: Use Caddy's Native Redir

Actually, Caddy has a built-in way to handle redirects more cleanly.
For the JSON API, we should use the `subroute` handler with `static_response`:

```go
func buildRedirectHandler(configJSON json.RawMessage) Handler {
    var cfg struct {
        To   string `json:"to"`
        Code int    `json:"code"`
    }
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    if cfg.To == "" {
        return nil
    }

    code := cfg.Code
    if code == 0 {
        code = 302
    }

    // For proper Caddy redirect
    return Handler{
        "handler":     "static_response",
        "status_code": strconv.Itoa(code),
        "headers": map[string][]string{
            "Location": {cfg.To},
        },
        "close": true,
    }
}
```

Note: Caddy's JSON API expects status_code as string in some versions.

## Verification
- [ ] Redirect form renders correctly
- [ ] Destination URL input works
- [ ] Common pattern buttons populate the field
- [ ] Status code radio buttons work
- [ ] Preview shows correct destination
- [ ] Placeholder documentation is visible
- [ ] Config builder generates correct Caddy JSON
- [ ] Redirect actually works when synced to Caddy

## Files Created/Modified
- `web/src/components/forms/RedirectForm.tsx` (new)
- `web/src/pages/RouteForm.tsx` (modified)
- `internal/config/builder.go` (modified)

## Estimated Time
1-2 hours
