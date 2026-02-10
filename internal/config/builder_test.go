package config

import (
	"encoding/json"
	"testing"

	"github.com/ArtemStepanov/caddy-admin-ui/internal/storage"
)

func TestBuildCaddyConfig_Empty(t *testing.T) {
	cfg := BuildCaddyConfig(nil, nil)

	if cfg.Admin == nil || cfg.Admin.Listen != "0.0.0.0:2019" {
		t.Error("Expected admin listener on 0.0.0.0:2019")
	}
	if cfg.Apps != nil {
		t.Error("Expected no apps when no routes")
	}
}

func TestBuildCaddyConfig_EmptyRoutes(t *testing.T) {
	cfg := BuildCaddyConfig([]*storage.Route{}, nil)

	if cfg.Apps != nil {
		t.Error("Expected no apps when routes slice is empty")
	}
}

func TestBuildCaddyConfig_DisabledRoutes(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			Enabled:     false,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	if cfg.Apps != nil {
		t.Error("Expected no apps when all routes are disabled")
	}
}

func TestBuildCaddyConfig_ReverseProxy(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:8080","localhost:8081"]}`),
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	if cfg.Apps == nil || cfg.Apps.HTTP == nil {
		t.Fatal("Expected HTTP app")
	}

	server, ok := cfg.Apps.HTTP.Servers["srv0"]
	if !ok {
		t.Fatal("Expected server srv0")
	}

	if len(server.Listen) != 2 || server.Listen[0] != ":443" {
		t.Errorf("Expected listen [:443, :80], got %v", server.Listen)
	}

	if len(server.Routes) != 1 {
		t.Fatalf("Expected 1 route, got %d", len(server.Routes))
	}

	route := server.Routes[0]
	if len(route.Match) == 0 {
		t.Fatal("Expected route matcher")
	}

	if len(route.Match[0].Host) != 1 || route.Match[0].Host[0] != "example.com" {
		t.Errorf("Expected host matcher [example.com], got %v", route.Match[0].Host)
	}

	// Check handler
	if len(route.Handle) == 0 {
		t.Fatal("Expected at least one handler")
	}

	handler := route.Handle[0]
	if handler["handler"] != "reverse_proxy" {
		t.Errorf("Expected reverse_proxy handler, got %v", handler["handler"])
	}

	upstreams, ok := handler["upstreams"].([]map[string]any)
	if !ok || len(upstreams) != 2 {
		t.Errorf("Expected 2 upstreams, got %v", handler["upstreams"])
	}
}

func TestBuildCaddyConfig_FileServer(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "static.example.com",
			HandlerType: "file_server",
			Config:      json.RawMessage(`{"root":"/var/www","browse":true}`),
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]
	handler := route.Handle[0]

	if handler["handler"] != "file_server" {
		t.Errorf("Expected file_server handler, got %v", handler["handler"])
	}
	if handler["root"] != "/var/www" {
		t.Errorf("Expected root /var/www, got %v", handler["root"])
	}
	if _, ok := handler["browse"]; !ok {
		t.Error("Expected browse to be set")
	}
}

func TestBuildCaddyConfig_Redirect(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "old.example.com",
			HandlerType: "redir",
			Config:      json.RawMessage(`{"to":"https://new.example.com","code":301}`),
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]
	handler := route.Handle[0]

	if handler["handler"] != "static_response" {
		t.Errorf("Expected static_response handler for redirect, got %v", handler["handler"])
	}
	if handler["status_code"] != 301 {
		t.Errorf("Expected status_code 301, got %v", handler["status_code"])
	}

	headers, ok := handler["headers"].(map[string][]string)
	if !ok {
		t.Fatal("Expected headers map")
	}
	if len(headers["Location"]) == 0 || headers["Location"][0] != "https://new.example.com" {
		t.Errorf("Expected Location header, got %v", headers)
	}
}

func TestBuildCaddyConfig_WithPath(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "example.com",
			Path:        "/api/*",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]
	if len(route.Match[0].Path) != 1 || route.Match[0].Path[0] != "/api/*" {
		t.Errorf("Expected path matcher [/api/*], got %v", route.Match[0].Path)
	}
}

func TestBuildCaddyConfig_MultiDomain(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "example.com, www.example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]
	hosts := route.Match[0].Host

	if len(hosts) != 2 {
		t.Fatalf("Expected 2 hosts, got %d", len(hosts))
	}
	if hosts[0] != "example.com" || hosts[1] != "www.example.com" {
		t.Errorf("Expected [example.com, www.example.com], got %v", hosts)
	}
}

func TestBuildCaddyConfig_WildcardDomain(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "*",
			Path:        "/health",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]
	// Wildcard domain should not set host matcher
	if len(route.Match[0].Host) != 0 {
		t.Errorf("Expected no host matcher for wildcard, got %v", route.Match[0].Host)
	}
}

func TestBuildCaddyConfig_WithHeaders(t *testing.T) {
	headerCfg := &storage.HeaderConfig{
		Set:    map[string]string{"X-Frame-Options": "DENY"},
		Add:    map[string]string{"X-Custom": "value"},
		Delete: []string{"Server"},
	}

	routes := []*storage.Route{
		{
			Domain:      "example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			Headers:     headerCfg,
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]

	// First handler should be headers, last should be reverse_proxy
	if len(route.Handle) < 2 {
		t.Fatalf("Expected at least 2 handlers (headers + reverse_proxy), got %d", len(route.Handle))
	}

	headersHandler := route.Handle[0]
	if headersHandler["handler"] != "headers" {
		t.Errorf("Expected first handler to be headers, got %v", headersHandler["handler"])
	}
}

func TestBuildCaddyConfig_GlobalEncode(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			Enabled:     true,
		},
	}

	globalCfg := &storage.GlobalConfig{
		EnableEncode: true,
	}

	cfg := BuildCaddyConfig(routes, globalCfg)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]

	// First handler should be encode
	if len(route.Handle) == 0 {
		t.Fatal("Expected handlers")
	}

	encodeHandler := route.Handle[0]
	if encodeHandler["handler"] != "encode" {
		t.Errorf("Expected first handler to be encode when global encode is enabled, got %v", encodeHandler["handler"])
	}
}

func TestBuildCaddyConfig_SortsByDomain(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:      "z.example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:1"]}`),
			Enabled:     true,
		},
		{
			Domain:      "a.example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{"upstreams":["localhost:2"]}`),
			Enabled:     true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	caddyRoutes := cfg.Apps.HTTP.Servers["srv0"].Routes
	if len(caddyRoutes) != 2 {
		t.Fatalf("Expected 2 routes, got %d", len(caddyRoutes))
	}

	// Should be sorted by domain
	if caddyRoutes[0].Match[0].Host[0] != "a.example.com" {
		t.Errorf("Expected first route to be a.example.com, got %v", caddyRoutes[0].Match[0].Host)
	}
}

func TestBuildHeadersHandler(t *testing.T) {
	t.Run("nil config", func(t *testing.T) {
		h := buildHeadersHandler(nil)
		if h != nil {
			t.Error("Expected nil handler for nil config")
		}
	})

	t.Run("empty config", func(t *testing.T) {
		h := buildHeadersHandler(&storage.HeaderConfig{})
		if h != nil {
			t.Error("Expected nil handler for empty config")
		}
	})

	t.Run("with set headers", func(t *testing.T) {
		cfg := &storage.HeaderConfig{
			Set: map[string]string{"X-Custom": "value"},
		}
		h := buildHeadersHandler(cfg)
		if h == nil {
			t.Fatal("Expected handler")
		}
		if h["handler"] != "headers" {
			t.Errorf("Expected headers handler, got %v", h["handler"])
		}
	})
}

func TestBuildReverseProxyHandler_WithLoadBalancing(t *testing.T) {
	cfg := json.RawMessage(`{"upstreams":["localhost:8080","localhost:8081"],"load_balancing":"random"}`)

	h := buildReverseProxyHandler(cfg)
	if h == nil {
		t.Fatal("Expected handler")
	}

	lb, ok := h["load_balancing"].(map[string]any)
	if !ok {
		t.Fatal("Expected load_balancing config")
	}

	policy, ok := lb["selection_policy"].(map[string]any)
	if !ok || policy["policy"] != "random" {
		t.Errorf("Expected random load balancing policy, got %v", lb)
	}
}

func TestBuildFileServerHandler_WithOptions(t *testing.T) {
	cfg := json.RawMessage(`{"root":"/var/www","browse":true,"index":["index.html"],"hide":[".git"],"precompressed":true}`)

	h := buildFileServerHandler(cfg)
	if h == nil {
		t.Fatal("Expected handler")
	}

	if h["root"] != "/var/www" {
		t.Errorf("Expected root /var/www, got %v", h["root"])
	}
	if _, ok := h["browse"]; !ok {
		t.Error("Expected browse option")
	}
	if _, ok := h["precompressed"]; !ok {
		t.Error("Expected precompressed option")
	}
}

func TestBuildRedirectHandler_DefaultCode(t *testing.T) {
	cfg := json.RawMessage(`{"to":"https://example.com"}`)

	h := buildRedirectHandler(cfg)
	if h == nil {
		t.Fatal("Expected handler")
	}

	if h["status_code"] != 302 {
		t.Errorf("Expected default status_code 302, got %v", h["status_code"])
	}
}

func TestBuildCaddyConfig_WithStripPathPrefix(t *testing.T) {
	routes := []*storage.Route{
		{
			Domain:          "example.com",
			Path:            "/api/*",
			HandlerType:     "reverse_proxy",
			Config:          json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			StripPathPrefix: "/api",
			Enabled:         true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]

	// Should have rewrite handler before reverse_proxy handler
	if len(route.Handle) < 2 {
		t.Fatalf("Expected at least 2 handlers (rewrite + reverse_proxy), got %d", len(route.Handle))
	}

	rewriteHandler := route.Handle[0]
	if rewriteHandler["handler"] != "rewrite" {
		t.Errorf("Expected first handler to be rewrite, got %v", rewriteHandler["handler"])
	}
	if rewriteHandler["strip_path_prefix"] != "/api" {
		t.Errorf("Expected strip_path_prefix to be /api, got %v", rewriteHandler["strip_path_prefix"])
	}

	proxyHandler := route.Handle[1]
	if proxyHandler["handler"] != "reverse_proxy" {
		t.Errorf("Expected second handler to be reverse_proxy, got %v", proxyHandler["handler"])
	}
}

func TestBuildCaddyConfig_WithStripPathPrefixAndHeaders(t *testing.T) {
	headerCfg := &storage.HeaderConfig{
		Set: map[string]string{"X-Custom": "value"},
	}

	routes := []*storage.Route{
		{
			Domain:          "example.com",
			Path:            "/api/*",
			HandlerType:     "reverse_proxy",
			Config:          json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			Headers:         headerCfg,
			StripPathPrefix: "/api",
			Enabled:         true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]

	// Should have headers, rewrite, then reverse_proxy handlers
	if len(route.Handle) < 3 {
		t.Fatalf("Expected at least 3 handlers (headers + rewrite + reverse_proxy), got %d", len(route.Handle))
	}

	// Check handler order: headers -> rewrite -> reverse_proxy
	if route.Handle[0]["handler"] != "headers" {
		t.Errorf("Expected first handler to be headers, got %v", route.Handle[0]["handler"])
	}
	if route.Handle[1]["handler"] != "rewrite" {
		t.Errorf("Expected second handler to be rewrite, got %v", route.Handle[1]["handler"])
	}
	if route.Handle[2]["handler"] != "reverse_proxy" {
		t.Errorf("Expected third handler to be reverse_proxy, got %v", route.Handle[2]["handler"])
	}
}

func TestBuildCaddyConfig_NormalizesPathAndStripPrefix(t *testing.T) {
	// Test that paths without leading / are normalized
	routes := []*storage.Route{
		{
			Domain:          "example.com",
			Path:            "api/*", // Missing leading /
			HandlerType:     "reverse_proxy",
			Config:          json.RawMessage(`{"upstreams":["localhost:8080"]}`),
			StripPathPrefix: "api", // Missing leading /
			Enabled:         true,
		},
	}

	cfg := BuildCaddyConfig(routes, nil)

	route := cfg.Apps.HTTP.Servers["srv0"].Routes[0]

	// Check path is normalized
	if len(route.Match) == 0 || len(route.Match[0].Path) == 0 {
		t.Fatal("Expected path matcher")
	}
	if route.Match[0].Path[0] != "/api/*" {
		t.Errorf("Expected path to be normalized to /api/*, got %v", route.Match[0].Path[0])
	}

	// Check strip_path_prefix is normalized
	rewriteHandler := route.Handle[0]
	if rewriteHandler["handler"] != "rewrite" {
		t.Fatalf("Expected rewrite handler, got %v", rewriteHandler["handler"])
	}
	if rewriteHandler["strip_path_prefix"] != "/api" {
		t.Errorf("Expected strip_path_prefix to be normalized to /api, got %v", rewriteHandler["strip_path_prefix"])
	}
}
