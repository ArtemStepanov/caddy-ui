package config

import (
	"encoding/json"
	"sort"
	"strings"

	"github.com/ArtemStepanov/caddy-admin-ui/internal/storage"
)

// normalizePath ensures a path starts with / if not empty
func normalizePath(path string) string {
	if path == "" {
		return ""
	}
	path = strings.TrimSpace(path)
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return path
}

// CaddyConfig represents the root Caddy configuration
type CaddyConfig struct {
	Admin *AdminConfig `json:"admin,omitempty"`
	Apps  *Apps        `json:"apps,omitempty"`
}

// AdminConfig is the admin endpoint configuration
type AdminConfig struct {
	Listen string `json:"listen,omitempty"`
}

// Apps contains Caddy applications
type Apps struct {
	HTTP *HTTPApp `json:"http,omitempty"`
}

// HTTPApp is the HTTP application config
type HTTPApp struct {
	Servers map[string]*Server `json:"servers,omitempty"`
}

// Server is an HTTP server config
type Server struct {
	Listen []string `json:"listen"`
	Routes []Route  `json:"routes"`
}

// Route is a Caddy route
type Route struct {
	Match    []Match   `json:"match,omitempty"`
	Handle   []Handler `json:"handle"`
	Terminal bool      `json:"terminal,omitempty"`
}

// Match is a request matcher
type Match struct {
	Host []string `json:"host,omitempty"`
	Path []string `json:"path,omitempty"`
}

// Handler is a generic handler
type Handler map[string]any

// BuildCaddyConfig converts stored routes to Caddy JSON config
func BuildCaddyConfig(routes []*storage.Route, global *storage.GlobalConfig) *CaddyConfig {
	// Always preserve admin listener on 0.0.0.0:2019 so we can continue managing Caddy
	config := &CaddyConfig{
		Admin: &AdminConfig{
			Listen: "0.0.0.0:2019",
		},
	}

	if len(routes) == 0 {
		return config
	}

	// Filter enabled routes only
	var enabledRoutes []*storage.Route
	for _, r := range routes {
		if r.Enabled {
			enabledRoutes = append(enabledRoutes, r)
		}
	}

	if len(enabledRoutes) == 0 {
		return config
	}

	// Sort routes by domain for consistent output
	sort.Slice(enabledRoutes, func(i, j int) bool {
		if enabledRoutes[i].Domain != enabledRoutes[j].Domain {
			return enabledRoutes[i].Domain < enabledRoutes[j].Domain
		}
		return enabledRoutes[i].Path < enabledRoutes[j].Path
	})

	// Build Caddy routes
	var caddyRoutes []Route
	for _, sr := range enabledRoutes {
		caddyRoute := buildRoute(sr, global)
		if caddyRoute != nil {
			caddyRoutes = append(caddyRoutes, *caddyRoute)
		}
	}

	config.Apps = &Apps{
		HTTP: &HTTPApp{
			Servers: map[string]*Server{
				"srv0": {
					Listen: []string{":443", ":80"},
					Routes: caddyRoutes,
				},
			},
		},
	}

	return config
}

// buildRoute converts a single stored route to a Caddy route
func buildRoute(r *storage.Route, global *storage.GlobalConfig) *Route {
	// If we have preserved raw Caddy route, use it as base
	if len(r.RawCaddyRoute) > 0 {
		return buildRouteMerged(r, global)
	}

	match := Match{}

	// Handle domains (support comma-separated or wildcard)
	if r.Domain != "*" && r.Domain != "" {
		parts := strings.Split(r.Domain, ",")
		var hosts []string
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				hosts = append(hosts, p)
			}
		}
		if len(hosts) > 0 {
			match.Host = hosts
		}
	}

	if r.Path != "" {
		match.Path = []string{normalizePath(r.Path)}
	}

	var handlers []Handler

	// Add encode handler if enabled globally
	if global != nil && global.EnableEncode {
		handlers = append(handlers, Handler{
			"handler": "encode",
			"encodings": map[string]any{
				"zstd": map[string]any{},
				"gzip": map[string]any{},
			},
		})
	}

	// Add headers handler if configured
	if r.Headers != nil {
		h := buildHeadersHandler(r.Headers)
		if h != nil {
			handlers = append(handlers, h)
		}
	}

	// Add rewrite handler for strip path prefix if configured
	if r.StripPathPrefix != "" {
		handlers = append(handlers, Handler{
			"handler":           "rewrite",
			"strip_path_prefix": normalizePath(r.StripPathPrefix),
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
	case "unknown":
		// For unknown type without RawCaddyRoute, we can't do much.
		// Just skip adding a handler.
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

// buildRouteMerged merges user changes with preserved Caddy route
func buildRouteMerged(r *storage.Route, global *storage.GlobalConfig) *Route {
	var original Route
	if err := json.Unmarshal(r.RawCaddyRoute, &original); err != nil {
		// Fallback to normal build if unmarshal fails
		return buildRoute(r, global)
	}

	// Update matchers from current state
	original.Match = nil
	if r.Domain != "*" && r.Domain != "" {
		parts := strings.Split(r.Domain, ",")
		var hosts []string
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				hosts = append(hosts, p)
			}
		}
		if len(hosts) > 0 {
			original.Match = append(original.Match, Match{Host: hosts})
		}
	} else if r.Path != "" {
		// Global route with path matcher
		// If domain is * but path exists
		original.Match = append(original.Match, Match{})
	} else {
		// Global route matching everything, usually Caddy uses [{}] or empty match list implies match all?
		// Actually if match is nil/empty, it matches everything.
	}

	// If we have paths, update the first matcher or add one
	if r.Path != "" {
		if len(original.Match) == 0 {
			original.Match = append(original.Match, Match{})
		}
		original.Match[0].Path = []string{normalizePath(r.Path)}
	}

	// Rebuild handlers
	// Strategy:
	// 1. Generate our managed handlers (headers, main handler)
	// 2. Filter original handlers to keep only "unknown" ones
	// 3. Reconstruct list: [encode (if global)] + [headers] + [unknown_before] + [main_handler] + [unknown_after]
	//    Actually, simple appending of unknown handlers might break things.
	//    Let's try: [encode] + [headers] + [unknowns] + [main_handler]
	//    Or better: iterate original, replace known types with ours.

	var newHandlers []Handler

	// 1. Encode (Global)
	if global != nil && global.EnableEncode {
		newHandlers = append(newHandlers, Handler{
			"handler": "encode",
			"encodings": map[string]any{
				"zstd": map[string]any{},
				"gzip": map[string]any{},
			},
		})
	}

	// 2. Headers (Local)
	if r.Headers != nil {
		h := buildHeadersHandler(r.Headers)
		if h != nil {
			newHandlers = append(newHandlers, h)
		}
	}

	// 2.5. Rewrite for strip path prefix (Local)
	if r.StripPathPrefix != "" {
		newHandlers = append(newHandlers, Handler{
			"handler":           "rewrite",
			"strip_path_prefix": normalizePath(r.StripPathPrefix),
		})
	}

	// 3. Main Handler (Local)
	var mainHandler Handler
	switch r.HandlerType {
	case "reverse_proxy":
		mainHandler = buildReverseProxyHandler(r.Config)
	case "file_server":
		mainHandler = buildFileServerHandler(r.Config)
	case "redir":
		mainHandler = buildRedirectHandler(r.Config)
	}

	// 4. Merge with unknowns
	// We iterate original handlers.
	// If we find a handler that we "manage" (even if it's different from current type), we skip it.
	// If we find an unknown handler, we add it.
	// We inject our Main Handler at the first position where a "managed" handler was, or at end.

	var unknownHandlers []Handler
	managedTypes := map[string]bool{
		"reverse_proxy":   true,
		"file_server":     true,
		"static_response": true, // could be redir or something else, but we treat it as managed if we are in redir mode
		"headers":         true,
		"encode":          true,
		"rewrite":         true,
	}

	for _, h := range original.Handle {
		hType, _ := h["handler"].(string)
		if !managedTypes[hType] {
			unknownHandlers = append(unknownHandlers, h)
		}
	}

	// Now construct final list:
	// [encode] + [headers] + [unknowns] + [mainHandler]
	// This puts unknown middlewares before the final handler (reverse_proxy is terminal usually).
	// If unknown handler is a terminal one (like `acme_server`), it might conflict if we also add reverse_proxy.
	// But usually we only have one terminal handler.

	newHandlers = append(newHandlers, unknownHandlers...)
	if mainHandler != nil {
		newHandlers = append(newHandlers, mainHandler)
	}

	original.Handle = newHandlers
	original.Terminal = true

	return &original
}

func buildReverseProxyHandler(configJSON json.RawMessage) Handler {
	var cfg storage.ReverseProxyConfig
	if err := json.Unmarshal(configJSON, &cfg); err != nil {
		return nil
	}

	if len(cfg.Upstreams) == 0 {
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
		setHeaders := make(map[string][]string)
		for k, v := range cfg.Headers {
			setHeaders[k] = []string{v}
		}

		handler["headers"] = map[string]any{
			"request": map[string]any{
				"set": setHeaders,
			},
		}
	}

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

func buildRedirectHandler(configJSON json.RawMessage) Handler {
	var cfg storage.RedirectConfig
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

	return Handler{
		"handler":     "static_response",
		"status_code": code,
		"headers": map[string][]string{
			"Location": {cfg.To},
		},
	}
}

func buildHeadersHandler(cfg *storage.HeaderConfig) Handler {
	if cfg == nil {
		return nil
	}

	// Check if empty
	if len(cfg.Set) == 0 && len(cfg.Add) == 0 && len(cfg.Delete) == 0 {
		return nil
	}

	response := make(map[string]any)

	if len(cfg.Set) > 0 {
		set := make(map[string][]string)
		for k, v := range cfg.Set {
			set[k] = []string{v}
		}
		response["set"] = set
	}

	if len(cfg.Add) > 0 {
		add := make(map[string][]string)
		for k, v := range cfg.Add {
			add[k] = []string{v}
		}
		response["add"] = add
	}

	if len(cfg.Delete) > 0 {
		response["delete"] = cfg.Delete
	}

	return Handler{
		"handler":  "headers",
		"response": response,
	}
}
