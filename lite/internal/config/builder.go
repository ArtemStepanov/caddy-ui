package config

import (
	"encoding/json"
	"sort"

	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/storage"
)

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
