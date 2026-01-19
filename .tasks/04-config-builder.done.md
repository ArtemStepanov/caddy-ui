# Task 04: Config Builder

## Objective
Create the module that converts stored routes into Caddy's JSON configuration format.

## Prerequisites
- Task 02 completed (storage models exist)
- Understanding of Caddy's JSON config structure

## Caddy JSON Structure Reference

Caddy's JSON config follows this structure for HTTP servers:

```json
{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [":443"],
          "routes": [
            {
              "match": [{"host": ["example.com"]}],
              "handle": [
                {"handler": "reverse_proxy", "upstreams": [{"dial": "localhost:8080"}]}
              ]
            }
          ]
        }
      }
    }
  }
}
```

## Steps

### 4.1 Create Config Builder (`internal/config/builder.go`)

```go
package config

import (
    "encoding/json"
    "sort"

    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/storage"
)

// CaddyConfig represents the root Caddy configuration
type CaddyConfig struct {
    Apps *Apps `json:"apps,omitempty"`
}

type Apps struct {
    HTTP *HTTPApp `json:"http,omitempty"`
}

type HTTPApp struct {
    Servers map[string]*Server `json:"servers,omitempty"`
}

type Server struct {
    Listen []string `json:"listen"`
    Routes []Route  `json:"routes"`
}

type Route struct {
    Match   []Match         `json:"match,omitempty"`
    Handle  []Handler       `json:"handle"`
    Terminal bool           `json:"terminal,omitempty"`
}

type Match struct {
    Host []string `json:"host,omitempty"`
    Path []string `json:"path,omitempty"`
}

// Handler is a generic interface for handler types
type Handler map[string]any

// BuildCaddyConfig converts stored routes to Caddy JSON config
func BuildCaddyConfig(routes []*storage.Route, global *storage.GlobalConfig) *CaddyConfig {
    if len(routes) == 0 {
        return &CaddyConfig{}
    }

    // Filter enabled routes only
    var enabledRoutes []*storage.Route
    for _, r := range routes {
        if r.Enabled {
            enabledRoutes = append(enabledRoutes, r)
        }
    }

    if len(enabledRoutes) == 0 {
        return &CaddyConfig{}
    }

    // Group routes by domain
    domainRoutes := make(map[string][]*storage.Route)
    for _, r := range enabledRoutes {
        domainRoutes[r.Domain] = append(domainRoutes[r.Domain], r)
    }

    // Build Caddy routes
    var caddyRoutes []Route
    
    // Sort domains for consistent output
    var domains []string
    for d := range domainRoutes {
        domains = append(domains, d)
    }
    sort.Strings(domains)

    for _, domain := range domains {
        storedRoutes := domainRoutes[domain]
        for _, sr := range storedRoutes {
            caddyRoute := buildRoute(sr, global)
            if caddyRoute != nil {
                caddyRoutes = append(caddyRoutes, *caddyRoute)
            }
        }
    }

    return &CaddyConfig{
        Apps: &Apps{
            HTTP: &HTTPApp{
                Servers: map[string]*Server{
                    "srv0": {
                        Listen: []string{":443", ":80"},
                        Routes: caddyRoutes,
                    },
                },
            },
        },
    }
}

// buildRoute converts a single stored route to a Caddy route
func buildRoute(r *storage.Route, global *storage.GlobalConfig) *Route {
    match := Match{
        Host: []string{r.Domain},
    }
    if r.Path != "" {
        match.Path = []string{r.Path}
    }

    var handlers []Handler

    // Add encode handler if enabled globally
    if global != nil && global.EnableEncode {
        handlers = append(handlers, Handler{
            "handler": "encode",
            "encodings": map[string]any{
                "gzip": map[string]any{},
                "zstd": map[string]any{},
            },
        })
    }

    // Build handler based on type
    switch r.HandlerType {
    case "reverse_proxy":
        h := buildReverseProxyHandler(r.Config)
        if h != nil {
            handlers = append(handlers, h)
        }
    case "file_server":
        h := buildFileServerHandler(r.Config)
        if h != nil {
            handlers = append(handlers, h)
        }
    case "redir":
        h := buildRedirectHandler(r.Config)
        if h != nil {
            handlers = append(handlers, h)
        }
    default:
        return nil
    }

    if len(handlers) == 0 {
        return nil
    }

    return &Route{
        Match:    []Match{match},
        Handle:   handlers,
        Terminal: true,
    }
}

func buildReverseProxyHandler(configJSON json.RawMessage) Handler {
    var cfg storage.ReverseProxyConfig
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    // Build upstreams
    var upstreams []map[string]any
    for _, u := range cfg.Upstreams {
        upstreams = append(upstreams, map[string]any{
            "dial": u,
        })
    }

    handler := Handler{
        "handler":   "reverse_proxy",
        "upstreams": upstreams,
    }

    // Add headers if specified
    if len(cfg.Headers) > 0 {
        headerOps := make(map[string]map[string][]string)
        headerOps["request"] = make(map[string][]string)
        headerOps["request"]["set"] = nil
        
        setHeaders := make(map[string][]string)
        for k, v := range cfg.Headers {
            setHeaders[k] = []string{v}
        }
        
        if len(setHeaders) > 0 {
            handler["headers"] = map[string]any{
                "request": map[string]any{
                    "set": setHeaders,
                },
            }
        }
    }

    // WebSocket support - Caddy handles this automatically for reverse_proxy
    // Just need to ensure proper headers aren't stripped

    // Load balancing
    if cfg.LoadBalancing != "" && cfg.LoadBalancing != "round_robin" {
        handler["load_balancing"] = map[string]any{
            "selection_policy": map[string]any{
                "policy": cfg.LoadBalancing,
            },
        }
    }

    return handler
}

func buildFileServerHandler(configJSON json.RawMessage) Handler {
    var cfg storage.FileServerConfig
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    handler := Handler{
        "handler": "file_server",
    }

    if cfg.Root != "" {
        handler["root"] = cfg.Root
    }

    if cfg.Browse {
        handler["browse"] = map[string]any{}
    }

    return handler
}

func buildRedirectHandler(configJSON json.RawMessage) Handler {
    var cfg storage.RedirectConfig
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    code := cfg.Code
    if code == 0 {
        code = 302 // Default to temporary redirect
    }

    return Handler{
        "handler":     "static_response",
        "status_code": code,
        "headers": map[string][]string{
            "Location": {cfg.To},
        },
    }
}
```

### 4.2 Add Header Handler Support (`internal/config/handlers.go`)

```go
package config

import (
    "encoding/json"

    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/storage"
)

// buildHeaderHandler creates a headers handler
func buildHeaderHandler(configJSON json.RawMessage) Handler {
    var cfg storage.HeaderConfig
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    response := make(map[string]any)

    // Set headers
    if len(cfg.Set) > 0 {
        set := make(map[string][]string)
        for k, v := range cfg.Set {
            set[k] = []string{v}
        }
        response["set"] = set
    }

    // Add headers
    if len(cfg.Add) > 0 {
        add := make(map[string][]string)
        for k, v := range cfg.Add {
            add[k] = []string{v}
        }
        response["add"] = add
    }

    // Delete headers
    if len(cfg.Delete) > 0 {
        response["delete"] = cfg.Delete
    }

    return Handler{
        "handler":  "headers",
        "response": response,
    }
}

// buildBasicAuthHandler creates a basic_auth handler
func buildBasicAuthHandler(configJSON json.RawMessage) Handler {
    var cfg storage.BasicAuthConfig
    if err := json.Unmarshal(configJSON, &cfg); err != nil {
        return nil
    }

    var accounts []map[string]any
    for _, user := range cfg.Users {
        accounts = append(accounts, map[string]any{
            "username": user.Username,
            "password": user.Password, // Should already be hashed
        })
    }

    handler := Handler{
        "handler":            "authentication",
        "providers": map[string]any{
            "http_basic": map[string]any{
                "accounts": accounts,
                "hash": map[string]any{
                    "algorithm": "bcrypt",
                },
            },
        },
    }

    return handler
}
```

### 4.3 Update buildRoute to Support Additional Handlers

Add these cases to the switch statement in `buildRoute`:

```go
case "header":
    h := buildHeaderHandler(r.Config)
    if h != nil {
        handlers = append(handlers, h)
    }
case "basic_auth":
    // Basic auth should come before the main handler
    h := buildBasicAuthHandler(r.Config)
    if h != nil {
        // Prepend to handlers list
        handlers = append([]Handler{h}, handlers...)
    }
```

## Testing the Config Builder

```go
// Test case
routes := []*storage.Route{
    {
        ID:          "1",
        Domain:      "app.example.com",
        HandlerType: "reverse_proxy",
        Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
        Enabled:     true,
    },
}

globalCfg := &storage.GlobalConfig{
    EnableEncode: true,
}

config := BuildCaddyConfig(routes, globalCfg)
output, _ := json.MarshalIndent(config, "", "  ")
fmt.Println(string(output))
```

Expected output:
```json
{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [":443", ":80"],
          "routes": [
            {
              "match": [{"host": ["app.example.com"]}],
              "handle": [
                {
                  "handler": "encode",
                  "encodings": {"gzip": {}, "zstd": {}}
                },
                {
                  "handler": "reverse_proxy",
                  "upstreams": [{"dial": "localhost:8080"}]
                }
              ],
              "terminal": true
            }
          ]
        }
      }
    }
  }
}
```

## Verification
- [ ] Config builder generates valid Caddy JSON
- [ ] Reverse proxy routes work correctly
- [ ] File server routes work correctly  
- [ ] Redirects work correctly
- [ ] Headers handler works correctly
- [ ] Disabled routes are excluded

## Files Created
- `internal/config/builder.go`
- `internal/config/handlers.go`

## Estimated Time
2-3 hours
