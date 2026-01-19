package config

import (
	"encoding/json"
	"testing"

	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/storage"
)

func TestParseCaddyConfig_Empty(t *testing.T) {
	cfg := &CaddyConfig{} // Empty config, not nil
	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(routes) != 0 {
		t.Errorf("Expected 0 routes, got %d", len(routes))
	}
}

func TestParseCaddyConfig_NoApps(t *testing.T) {
	cfg := &CaddyConfig{}
	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(routes) != 0 {
		t.Errorf("Expected 0 routes, got %d", len(routes))
	}
}

func TestParseCaddyConfig_ReverseProxy(t *testing.T) {
	cfg := &CaddyConfig{
		Apps: &Apps{
			HTTP: &HTTPApp{
				Servers: map[string]*Server{
					"srv0": {
						Listen: []string{":443"},
						Routes: []Route{
							{
								Match: []Match{
									{Host: []string{"example.com"}},
								},
								Handle: []Handler{
									{
										"handler": "reverse_proxy",
										"upstreams": []any{
											map[string]any{"dial": "localhost:8080"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}
	if len(routes) != 1 {
		t.Fatalf("Expected 1 route, got %d", len(routes))
	}

	route := routes[0]
	if route.Domain != "example.com" {
		t.Errorf("Expected domain example.com, got %s", route.Domain)
	}
	if route.HandlerType != "reverse_proxy" {
		t.Errorf("Expected handler_type reverse_proxy, got %s", route.HandlerType)
	}
	if !route.Enabled {
		t.Error("Expected route to be enabled")
	}

	var cfg2 storage.ReverseProxyConfig
	json.Unmarshal(route.Config, &cfg2)
	if len(cfg2.Upstreams) != 1 || cfg2.Upstreams[0] != "localhost:8080" {
		t.Errorf("Expected upstreams [localhost:8080], got %v", cfg2.Upstreams)
	}
}

func TestParseCaddyConfig_FileServer(t *testing.T) {
	cfg := &CaddyConfig{
		Apps: &Apps{
			HTTP: &HTTPApp{
				Servers: map[string]*Server{
					"srv0": {
						Listen: []string{":443"},
						Routes: []Route{
							{
								Match: []Match{
									{Host: []string{"static.example.com"}},
								},
								Handle: []Handler{
									{
										"handler": "file_server",
										"root":    "/var/www",
										"browse":  map[string]any{},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	route := routes[0]
	if route.HandlerType != "file_server" {
		t.Errorf("Expected handler_type file_server, got %s", route.HandlerType)
	}

	var fsCfg storage.FileServerConfig
	json.Unmarshal(route.Config, &fsCfg)
	if fsCfg.Root != "/var/www" {
		t.Errorf("Expected root /var/www, got %s", fsCfg.Root)
	}
	if !fsCfg.Browse {
		t.Error("Expected browse to be true")
	}
}

func TestParseCaddyConfig_Redirect(t *testing.T) {
	cfg := &CaddyConfig{
		Apps: &Apps{
			HTTP: &HTTPApp{
				Servers: map[string]*Server{
					"srv0": {
						Listen: []string{":443"},
						Routes: []Route{
							{
								Match: []Match{
									{Host: []string{"old.example.com"}},
								},
								Handle: []Handler{
									{
										"handler":     "static_response",
										"status_code": float64(301), // JSON unmarshals to float64
										"headers": map[string]any{
											"Location": []any{"https://new.example.com"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	route := routes[0]
	if route.HandlerType != "redir" {
		t.Errorf("Expected handler_type redir, got %s", route.HandlerType)
	}

	var redirCfg storage.RedirectConfig
	json.Unmarshal(route.Config, &redirCfg)
	if redirCfg.To != "https://new.example.com" {
		t.Errorf("Expected to https://new.example.com, got %s", redirCfg.To)
	}
	if redirCfg.Code != 301 {
		t.Errorf("Expected code 301, got %d", redirCfg.Code)
	}
}

func TestParseCaddyConfig_Headers(t *testing.T) {
	cfg := &CaddyConfig{
		Apps: &Apps{
			HTTP: &HTTPApp{
				Servers: map[string]*Server{
					"srv0": {
						Listen: []string{":443"},
						Routes: []Route{
							{
								Match: []Match{
									{Host: []string{"example.com"}},
								},
								Handle: []Handler{
									{
										"handler": "headers",
										"response": map[string]any{
											"set": map[string]any{
												"X-Frame-Options": []any{"DENY"},
											},
											"add": map[string]any{
												"X-Custom": []any{"value"},
											},
											"delete": []any{"Server"},
										},
									},
									{
										"handler": "reverse_proxy",
										"upstreams": []any{
											map[string]any{"dial": "localhost:8080"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	route := routes[0]
	if route.Headers == nil {
		t.Fatal("Expected headers to be parsed")
	}
	if route.Headers.Set["X-Frame-Options"] != "DENY" {
		t.Errorf("Expected Set X-Frame-Options=DENY, got %v", route.Headers.Set)
	}
	if route.Headers.Add["X-Custom"] != "value" {
		t.Errorf("Expected Add X-Custom=value, got %v", route.Headers.Add)
	}
	if len(route.Headers.Delete) != 1 || route.Headers.Delete[0] != "Server" {
		t.Errorf("Expected Delete [Server], got %v", route.Headers.Delete)
	}
}

func TestParseCaddyConfig_UnknownHandler(t *testing.T) {
	cfg := &CaddyConfig{
		Apps: &Apps{
			HTTP: &HTTPApp{
				Servers: map[string]*Server{
					"srv0": {
						Listen: []string{":443"},
						Routes: []Route{
							{
								Match: []Match{
									{Host: []string{"example.com"}},
								},
								Handle: []Handler{
									{
										"handler": "acme_server",
										"ca":      "custom",
									},
								},
							},
						},
					},
				},
			},
		},
	}

	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	route := routes[0]
	if route.HandlerType != "unknown" {
		t.Errorf("Expected handler_type unknown, got %s", route.HandlerType)
	}
	// Should preserve raw route
	if len(route.RawCaddyRoute) == 0 {
		t.Error("Expected RawCaddyRoute to be preserved for unknown handler")
	}
}

func TestParseCaddyConfig_GlobalRoute(t *testing.T) {
	// Route without host matcher (matches all)
	cfg := &CaddyConfig{
		Apps: &Apps{
			HTTP: &HTTPApp{
				Servers: map[string]*Server{
					"srv0": {
						Listen: []string{":443"},
						Routes: []Route{
							{
								Match: []Match{
									{Path: []string{"/health"}},
								},
								Handle: []Handler{
									{
										"handler": "reverse_proxy",
										"upstreams": []any{
											map[string]any{"dial": "localhost:8080"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	route := routes[0]
	if route.Domain != "*" {
		t.Errorf("Expected domain *, got %s", route.Domain)
	}
	if route.Path != "/health" {
		t.Errorf("Expected path /health, got %s", route.Path)
	}
}

func TestParseCaddyConfig_MultiHost(t *testing.T) {
	cfg := &CaddyConfig{
		Apps: &Apps{
			HTTP: &HTTPApp{
				Servers: map[string]*Server{
					"srv0": {
						Listen: []string{":443"},
						Routes: []Route{
							{
								Match: []Match{
									{Host: []string{"example.com", "www.example.com"}},
								},
								Handle: []Handler{
									{
										"handler": "reverse_proxy",
										"upstreams": []any{
											map[string]any{"dial": "localhost:8080"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	routes, err := ParseCaddyConfig(cfg)
	if err != nil {
		t.Fatalf("Unexpected error: %v", err)
	}

	route := routes[0]
	if route.Domain != "example.com, www.example.com" {
		t.Errorf("Expected domain 'example.com, www.example.com', got %s", route.Domain)
	}
}

func TestRoundTrip_ReverseProxy(t *testing.T) {
	// Create a route, build Caddy config, parse it back
	original := &storage.Route{
		Domain:      "example.com",
		Path:        "/api",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
		Enabled:     true,
	}

	// Build Caddy config
	caddyConfig := BuildCaddyConfig([]*storage.Route{original}, nil)

	// Parse it back
	routes, err := ParseCaddyConfig(caddyConfig)
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	if len(routes) != 1 {
		t.Fatalf("Expected 1 route, got %d", len(routes))
	}

	parsed := routes[0]
	if parsed.Domain != original.Domain {
		t.Errorf("Domain mismatch: expected %s, got %s", original.Domain, parsed.Domain)
	}
	if parsed.Path != original.Path {
		t.Errorf("Path mismatch: expected %s, got %s", original.Path, parsed.Path)
	}
	if parsed.HandlerType != original.HandlerType {
		t.Errorf("HandlerType mismatch: expected %s, got %s", original.HandlerType, parsed.HandlerType)
	}
}

func TestRoundTrip_FileServer(t *testing.T) {
	original := &storage.Route{
		Domain:      "static.example.com",
		HandlerType: "file_server",
		Config:      json.RawMessage(`{"root":"/var/www","browse":true}`),
		Enabled:     true,
	}

	caddyConfig := BuildCaddyConfig([]*storage.Route{original}, nil)
	routes, err := ParseCaddyConfig(caddyConfig)
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	parsed := routes[0]
	if parsed.HandlerType != "file_server" {
		t.Errorf("Expected file_server, got %s", parsed.HandlerType)
	}

	var cfg storage.FileServerConfig
	json.Unmarshal(parsed.Config, &cfg)
	if cfg.Root != "/var/www" {
		t.Errorf("Expected root /var/www, got %s", cfg.Root)
	}
}

func TestRoundTrip_Redirect(t *testing.T) {
	original := &storage.Route{
		Domain:      "old.example.com",
		HandlerType: "redir",
		Config:      json.RawMessage(`{"to":"https://new.example.com","code":301}`),
		Enabled:     true,
	}

	// Build Caddy config
	caddyConfig := BuildCaddyConfig([]*storage.Route{original}, nil)

	// Simulate real round-trip through JSON (as it would happen with Caddy API)
	jsonBytes, err := json.Marshal(caddyConfig)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var parsedCaddyConfig CaddyConfig
	if err := json.Unmarshal(jsonBytes, &parsedCaddyConfig); err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	// Parse the JSON-roundtripped config
	routes, err := ParseCaddyConfig(&parsedCaddyConfig)
	if err != nil {
		t.Fatalf("Failed to parse: %v", err)
	}

	parsed := routes[0]
	if parsed.HandlerType != "redir" {
		t.Errorf("Expected redir, got %s", parsed.HandlerType)
	}

	var cfg storage.RedirectConfig
	json.Unmarshal(parsed.Config, &cfg)
	if cfg.To != "https://new.example.com" {
		t.Errorf("Expected to https://new.example.com, got %s", cfg.To)
	}
}
