package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

// setupTestDB creates a temporary SQLite database for testing
func setupTestDB(t *testing.T) (*SQLiteStorage, func()) {
	t.Helper()

	tmpDir, err := os.MkdirTemp("", "sqlite_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	dbPath := filepath.Join(tmpDir, "test.db")
	storage, err := NewSQLiteStorage(dbPath)
	if err != nil {
		os.RemoveAll(tmpDir)
		t.Fatalf("Failed to create storage: %v", err)
	}

	cleanup := func() {
		storage.Close()
		os.RemoveAll(tmpDir)
	}

	return storage, cleanup
}

func TestNewSQLiteStorage(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	if storage == nil {
		t.Error("Expected non-nil storage")
	}
}

func TestCreateRoute(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	route := &Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
		Enabled:     true,
	}

	err := storage.CreateRoute(route)
	if err != nil {
		t.Fatalf("Failed to create route: %v", err)
	}

	if route.ID == "" {
		t.Error("Expected route ID to be set")
	}

	if route.CreatedAt.IsZero() {
		t.Error("Expected CreatedAt to be set")
	}

	if route.UpdatedAt.IsZero() {
		t.Error("Expected UpdatedAt to be set")
	}
}

func TestGetRoute(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	// Create a route first
	route := &Route{
		Domain:      "example.com",
		Path:        "/api",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
		Enabled:     true,
	}
	storage.CreateRoute(route)

	t.Run("existing route", func(t *testing.T) {
		found, err := storage.GetRoute(route.ID)
		if err != nil {
			t.Fatalf("Failed to get route: %v", err)
		}

		if found.ID != route.ID {
			t.Errorf("Expected ID %s, got %s", route.ID, found.ID)
		}
		if found.Domain != "example.com" {
			t.Errorf("Expected domain example.com, got %s", found.Domain)
		}
		if found.Path != "/api" {
			t.Errorf("Expected path /api, got %s", found.Path)
		}
		if found.HandlerType != "reverse_proxy" {
			t.Errorf("Expected handler_type reverse_proxy, got %s", found.HandlerType)
		}
		if !found.Enabled {
			t.Error("Expected route to be enabled")
		}
	})

	t.Run("non-existing route", func(t *testing.T) {
		_, err := storage.GetRoute("non-existing-id")
		if err == nil {
			t.Error("Expected error for non-existing route")
		}
	})
}

func TestListRoutes(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	t.Run("empty list", func(t *testing.T) {
		routes, err := storage.ListRoutes()
		if err != nil {
			t.Fatalf("Failed to list routes: %v", err)
		}
		if len(routes) != 0 {
			t.Errorf("Expected 0 routes, got %d", len(routes))
		}
	})

	t.Run("with routes", func(t *testing.T) {
		route1 := &Route{
			Domain:      "a.example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{}`),
		}
		route2 := &Route{
			Domain:      "b.example.com",
			HandlerType: "file_server",
			Config:      json.RawMessage(`{}`),
		}
		storage.CreateRoute(route1)
		storage.CreateRoute(route2)

		routes, err := storage.ListRoutes()
		if err != nil {
			t.Fatalf("Failed to list routes: %v", err)
		}
		if len(routes) != 2 {
			t.Errorf("Expected 2 routes, got %d", len(routes))
		}

		// Routes should be ordered by domain
		if routes[0].Domain != "a.example.com" {
			t.Errorf("Expected first route to be a.example.com, got %s", routes[0].Domain)
		}
	})
}

func TestUpdateRoute(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	route := &Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
		Enabled:     true,
	}
	storage.CreateRoute(route)

	// Update the route
	route.Domain = "updated.example.com"
	route.Path = "/new-path"
	route.Enabled = false

	err := storage.UpdateRoute(route)
	if err != nil {
		t.Fatalf("Failed to update route: %v", err)
	}

	// Verify update
	updated, _ := storage.GetRoute(route.ID)
	if updated.Domain != "updated.example.com" {
		t.Errorf("Expected domain updated.example.com, got %s", updated.Domain)
	}
	if updated.Path != "/new-path" {
		t.Errorf("Expected path /new-path, got %s", updated.Path)
	}
	if updated.Enabled {
		t.Error("Expected route to be disabled")
	}
}

func TestDeleteRoute(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	route := &Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{}`),
	}
	storage.CreateRoute(route)

	err := storage.DeleteRoute(route.ID)
	if err != nil {
		t.Fatalf("Failed to delete route: %v", err)
	}

	// Verify deletion
	_, err = storage.GetRoute(route.ID)
	if err == nil {
		t.Error("Expected error when getting deleted route")
	}
}

func TestDeleteAllRoutes(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	// Create multiple routes
	for i := 0; i < 3; i++ {
		route := &Route{
			Domain:      "example.com",
			HandlerType: "reverse_proxy",
			Config:      json.RawMessage(`{}`),
		}
		storage.CreateRoute(route)
	}

	routes, _ := storage.ListRoutes()
	if len(routes) != 3 {
		t.Fatalf("Expected 3 routes, got %d", len(routes))
	}

	err := storage.DeleteAllRoutes()
	if err != nil {
		t.Fatalf("Failed to delete all routes: %v", err)
	}

	routes, _ = storage.ListRoutes()
	if len(routes) != 0 {
		t.Errorf("Expected 0 routes after deletion, got %d", len(routes))
	}
}

func TestGlobalConfig_Defaults(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	cfg, err := storage.GetGlobalConfig()
	if err != nil {
		t.Fatalf("Failed to get global config: %v", err)
	}

	if cfg.CaddyAdminURL != "http://localhost:2019" {
		t.Errorf("Expected default CaddyAdminURL, got %s", cfg.CaddyAdminURL)
	}
	if !cfg.EnableEncode {
		t.Error("Expected EnableEncode to be true by default")
	}
}

func TestGlobalConfig_SetAndGet(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	cfg := &GlobalConfig{
		CaddyAdminURL: "http://custom:2019",
		EnableEncode:  false,
	}

	err := storage.SetGlobalConfig(cfg)
	if err != nil {
		t.Fatalf("Failed to set global config: %v", err)
	}

	retrieved, err := storage.GetGlobalConfig()
	if err != nil {
		t.Fatalf("Failed to get global config: %v", err)
	}

	if retrieved.CaddyAdminURL != "http://custom:2019" {
		t.Errorf("Expected CaddyAdminURL http://custom:2019, got %s", retrieved.CaddyAdminURL)
	}
	if retrieved.EnableEncode {
		t.Error("Expected EnableEncode to be false")
	}
}

func TestRouteWithRawCaddyRoute(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	rawRoute := json.RawMessage(`{"match":[{"host":["example.com"]}],"handle":[{"handler":"custom"}]}`)

	route := &Route{
		Domain:        "example.com",
		HandlerType:   "unknown",
		Config:        json.RawMessage(`{}`),
		RawCaddyRoute: rawRoute,
	}

	err := storage.CreateRoute(route)
	if err != nil {
		t.Fatalf("Failed to create route with raw caddy route: %v", err)
	}

	retrieved, err := storage.GetRoute(route.ID)
	if err != nil {
		t.Fatalf("Failed to get route: %v", err)
	}

	if string(retrieved.RawCaddyRoute) != string(rawRoute) {
		t.Errorf("RawCaddyRoute mismatch:\nExpected: %s\nGot: %s", rawRoute, retrieved.RawCaddyRoute)
	}
}

func TestRouteWithHeaders(t *testing.T) {
	storage, cleanup := setupTestDB(t)
	defer cleanup()

	// Note: Headers are stored in the JSON config, not as a separate field in SQLite
	// This test verifies the struct works correctly with the Config field
	config := ReverseProxyConfig{
		Upstreams: []string{"localhost:8080"},
		Headers:   map[string]string{"X-Custom": "value"},
	}
	configJSON, _ := json.Marshal(config)

	route := &Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      configJSON,
	}

	err := storage.CreateRoute(route)
	if err != nil {
		t.Fatalf("Failed to create route: %v", err)
	}

	retrieved, _ := storage.GetRoute(route.ID)

	var retrievedConfig ReverseProxyConfig
	json.Unmarshal(retrieved.Config, &retrievedConfig)

	if retrievedConfig.Headers["X-Custom"] != "value" {
		t.Errorf("Expected header X-Custom=value, got %s", retrievedConfig.Headers["X-Custom"])
	}
}
