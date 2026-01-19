# Task 10: Basic Auth

## Objective
Add HTTP Basic Authentication support to protect routes.

## Prerequisites
- Task 09 completed (header handling working)

## Basic Auth Configuration

Based on Caddy's basic_auth directive:

| Option | Description |
|--------|-------------|
| `users` | List of username/password pairs |
| `realm` | Authentication realm name (optional) |

Important: Passwords must be hashed with bcrypt before storage.

## Implementation Notes

- Passwords will be hashed on the backend before storage
- Frontend will send plaintext passwords
- Backend will use bcrypt for hashing
- The hash will be stored, never the plaintext

## Steps

### 10.1 Add Password Hashing to Backend

Create `internal/api/auth.go`:

```go
package api

import (
    "golang.org/x/crypto/bcrypt"
)

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
    return string(bytes), err
}

// CheckPasswordHash verifies a password against a hash
func CheckPasswordHash(password, hash string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil
}
```

Add dependency:
```bash
go get golang.org/x/crypto/bcrypt
```

### 10.2 Create Basic Auth Editor (`web/src/components/forms/BasicAuthEditor.tsx`)

```tsx
import { useState } from 'preact/hooks';

interface BasicAuthUser {
  username: string;
  password: string; // Plaintext in form, will be hashed on backend
}

interface BasicAuthConfig {
  enabled: boolean;
  users: BasicAuthUser[];
  realm?: string;
}

interface BasicAuthEditorProps {
  config: BasicAuthConfig;
  onChange: (config: BasicAuthConfig) => void;
}

export function BasicAuthEditor({ config, onChange }: BasicAuthEditorProps) {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const addUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) return;

    // Check for duplicate username
    if (config.users.some((u) => u.username === newUsername.trim())) {
      alert('Username already exists');
      return;
    }

    onChange({
      ...config,
      users: [
        ...config.users,
        { username: newUsername.trim(), password: newPassword },
      ],
    });
    setNewUsername('');
    setNewPassword('');
  };

  const removeUser = (username: string) => {
    onChange({
      ...config,
      users: config.users.filter((u) => u.username !== username),
    });
  };

  return (
    <div class="space-y-4">
      {/* Enable toggle */}
      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) =>
            onChange({ ...config, enabled: (e.target as HTMLInputElement).checked })
          }
          class="w-5 h-5 rounded bg-slate-900 border-slate-700"
        />
        <div>
          <div class="font-medium">Enable Basic Authentication</div>
          <div class="text-sm text-slate-500">
            Require username and password to access this route
          </div>
        </div>
      </label>

      {config.enabled && (
        <div class="pl-8 space-y-4 border-l-2 border-slate-700">
          {/* Realm */}
          <div>
            <label class="label">Realm (Optional)</label>
            <input
              type="text"
              value={config.realm || ''}
              onInput={(e) =>
                onChange({ ...config, realm: (e.target as HTMLInputElement).value || undefined })
              }
              placeholder="Protected Area"
              class="input"
            />
            <p class="text-sm text-slate-500 mt-1">
              Displayed in the browser's login dialog
            </p>
          </div>

          {/* Existing users */}
          <div>
            <label class="label">Authorized Users</label>
            {config.users.length === 0 ? (
              <p class="text-sm text-slate-500">No users configured yet</p>
            ) : (
              <div class="space-y-2 mb-4">
                {config.users.map((user) => (
                  <div
                    key={user.username}
                    class="flex items-center gap-2 bg-slate-800 p-2 rounded"
                  >
                    <span class="flex-1 font-mono">{user.username}</span>
                    <span class="text-slate-500 text-sm">••••••••</span>
                    <button
                      type="button"
                      onClick={() => removeUser(user.username)}
                      class="text-red-400 hover:text-red-300 px-2"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new user */}
          <div>
            <div class="text-sm font-medium text-slate-400 mb-2">Add User</div>
            <div class="flex gap-2">
              <input
                type="text"
                value={newUsername}
                onInput={(e) => setNewUsername((e.target as HTMLInputElement).value)}
                placeholder="Username"
                class="input flex-1"
                autoComplete="off"
              />
              <div class="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
                  placeholder="Password"
                  class="input w-full pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <button type="button" onClick={addUser} class="btn btn-secondary">
                Add
              </button>
            </div>
          </div>

          {/* Security note */}
          <div class="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 text-sm">
            <div class="font-medium text-yellow-400 mb-1">Security Note</div>
            <div class="text-yellow-300/70">
              Basic authentication transmits credentials in base64 encoding.
              Always use HTTPS (which Caddy provides by default) to protect passwords in transit.
              Passwords are hashed with bcrypt before storage.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function getDefaultBasicAuthConfig(): BasicAuthConfig {
  return {
    enabled: false,
    users: [],
    realm: undefined,
  };
}
```

### 10.3 Update API Handler for Password Hashing

In `internal/api/handlers.go`, add password hashing when creating/updating routes:

```go
func (h *Handler) processRouteConfig(route *storage.Route) error {
    // Parse config to check for basic_auth
    var cfg struct {
        BasicAuth *struct {
            Enabled bool `json:"enabled"`
            Users   []struct {
                Username string `json:"username"`
                Password string `json:"password"`
            } `json:"users"`
            Realm string `json:"realm,omitempty"`
        } `json:"basic_auth,omitempty"`
    }

    if err := json.Unmarshal(route.Config, &cfg); err != nil {
        return nil // Not an error, just no basic_auth config
    }

    if cfg.BasicAuth == nil || !cfg.BasicAuth.Enabled {
        return nil
    }

    // Hash passwords that aren't already hashed
    for i, user := range cfg.BasicAuth.Users {
        // Check if password is already a bcrypt hash (starts with $2a$ or $2b$)
        if len(user.Password) > 4 && (user.Password[:4] == "$2a$" || user.Password[:4] == "$2b$") {
            continue // Already hashed
        }

        hash, err := HashPassword(user.Password)
        if err != nil {
            return fmt.Errorf("failed to hash password for user %s: %w", user.Username, err)
        }
        cfg.BasicAuth.Users[i].Password = hash
    }

    // Re-serialize the config
    var fullConfig map[string]any
    json.Unmarshal(route.Config, &fullConfig)
    fullConfig["basic_auth"] = cfg.BasicAuth

    newConfig, err := json.Marshal(fullConfig)
    if err != nil {
        return err
    }
    route.Config = newConfig

    return nil
}

// Call this in CreateRoute and UpdateRoute before saving:
if err := h.processRouteConfig(&route); err != nil {
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    return
}
```

### 10.4 Update Config Builder for Basic Auth

In `internal/config/builder.go`:

```go
func buildBasicAuthHandler(cfg *BasicAuthConfig) Handler {
    if cfg == nil || !cfg.Enabled || len(cfg.Users) == 0 {
        return nil
    }

    accounts := make([]map[string]any, len(cfg.Users))
    for i, user := range cfg.Users {
        accounts[i] = map[string]any{
            "username": user.Username,
            "password": user.Password, // Already hashed
        }
    }

    provider := map[string]any{
        "accounts": accounts,
        "hash": map[string]any{
            "algorithm": "bcrypt",
        },
    }

    if cfg.Realm != "" {
        provider["realm"] = cfg.Realm
    }

    return Handler{
        "handler": "authentication",
        "providers": map[string]any{
            "http_basic": provider,
        },
    }
}
```

### 10.5 Add Basic Auth Section to RouteForm

```tsx
import { BasicAuthEditor, getDefaultBasicAuthConfig } from '../components/forms/BasicAuthEditor';

// Add state
const [basicAuth, setBasicAuth] = useState(getDefaultBasicAuthConfig());
const [showBasicAuth, setShowBasicAuth] = useState(false);

// Add to form after headers section:
<div class="card">
  <button
    type="button"
    onClick={() => setShowBasicAuth(!showBasicAuth)}
    class="w-full text-left flex items-center justify-between"
  >
    <h2 class="text-lg font-semibold">Password Protection (Optional)</h2>
    <span class="text-slate-400">{showBasicAuth ? '▼' : '▶'}</span>
  </button>
  
  {showBasicAuth && (
    <div class="mt-4">
      <BasicAuthEditor config={basicAuth} onChange={setBasicAuth} />
    </div>
  )}
</div>
```

## Verification
- [ ] Basic auth editor renders correctly
- [ ] Can enable/disable basic auth
- [ ] Can add users with username/password
- [ ] Can remove users
- [ ] Password visibility toggle works
- [ ] Realm field works
- [ ] Backend hashes passwords correctly
- [ ] Hashed passwords are stored in database
- [ ] Config builder generates correct Caddy JSON
- [ ] Authentication actually works on protected routes

## Files Created/Modified
- `internal/api/auth.go` (new)
- `web/src/components/forms/BasicAuthEditor.tsx` (new)
- `internal/api/handlers.go` (modified)
- `internal/config/builder.go` (modified)
- `web/src/pages/RouteForm.tsx` (modified)
- `go.mod` (add bcrypt dependency)

## Estimated Time
2-3 hours
