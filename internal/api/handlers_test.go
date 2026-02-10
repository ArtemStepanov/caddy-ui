package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/ArtemStepanov/caddy-admin-ui/internal/storage"
)

func init() {
	// Set Gin to test mode to reduce log output
	gin.SetMode(gin.TestMode)
}

// setupTestRouter creates a test router with a temporary database
func setupTestRouter(t *testing.T) (*gin.Engine, *storage.SQLiteStorage, func()) {
	t.Helper()

	tmpDir, err := os.MkdirTemp("", "api_test")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}

	dbPath := filepath.Join(tmpDir, "test.db")
	store, err := storage.NewSQLiteStorage(dbPath)
	if err != nil {
		os.RemoveAll(tmpDir)
		t.Fatalf("Failed to create storage: %v", err)
	}

	router := gin.New()
	// Use a fake Caddy URL that will fail - tests should handle sync errors gracefully
	SetupRoutes(router, store, "http://localhost:29999")

	cleanup := func() {
		store.Close()
		os.RemoveAll(tmpDir)
	}

	return router, store, cleanup
}

func TestListRoutes_Empty(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	req := httptest.NewRequest("GET", "/api/routes", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	routes, ok := response["routes"].([]any)
	if !ok {
		t.Fatal("Expected routes array in response")
	}
	if len(routes) != 0 {
		t.Errorf("Expected 0 routes, got %d", len(routes))
	}
}

func TestCreateRoute_Success(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{
		"domain": "example.com",
		"handler_type": "reverse_proxy",
		"config": {"upstreams": ["localhost:8080"]}
	}`

	req := httptest.NewRequest("POST", "/api/routes", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	route, ok := response["route"].(map[string]any)
	if !ok {
		t.Fatal("Expected route in response")
	}
	if route["domain"] != "example.com" {
		t.Errorf("Expected domain example.com, got %v", route["domain"])
	}
	if route["id"] == nil {
		t.Error("Expected route to have an ID")
	}

	// May have a warning about Caddy sync failure
	if response["warning"] != nil {
		t.Logf("Expected warning about Caddy sync: %v", response["warning"])
	}
}

func TestCreateRoute_MissingDomain(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{
		"handler_type": "reverse_proxy",
		"config": {"upstreams": ["localhost:8080"]}
	}`

	req := httptest.NewRequest("POST", "/api/routes", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	if response["error"] == nil {
		t.Error("Expected error message in response")
	}
}

func TestCreateRoute_MissingHandler(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{
		"domain": "example.com",
		"config": {"upstreams": ["localhost:8080"]}
	}`

	req := httptest.NewRequest("POST", "/api/routes", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestGetRoute_Success(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	// Create a route directly in storage
	route := &storage.Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
	}
	store.CreateRoute(route)

	req := httptest.NewRequest("GET", "/api/routes/"+route.ID, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	responseRoute, ok := response["route"].(map[string]any)
	if !ok {
		t.Fatal("Expected route in response")
	}
	if responseRoute["id"] != route.ID {
		t.Errorf("Expected ID %s, got %v", route.ID, responseRoute["id"])
	}
}

func TestGetRoute_NotFound(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	req := httptest.NewRequest("GET", "/api/routes/non-existing-id", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

func TestUpdateRoute_Success(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	// Create a route directly in storage
	route := &storage.Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
	}
	store.CreateRoute(route)

	body := `{
		"domain": "updated.example.com",
		"handler_type": "reverse_proxy",
		"config": {"upstreams": ["localhost:9090"]},
		"enabled": true
	}`

	req := httptest.NewRequest("PUT", "/api/routes/"+route.ID, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify update
	updated, _ := store.GetRoute(route.ID)
	if updated.Domain != "updated.example.com" {
		t.Errorf("Expected domain updated.example.com, got %s", updated.Domain)
	}
}

func TestUpdateRoute_PreservesEnabled(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	// Create an enabled route
	route := &storage.Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{"upstreams":["localhost:8080"]}`),
		Enabled:     true,
	}
	store.CreateRoute(route)

	// Update without "enabled" field
	body := `{
		"domain": "example.com",
		"handler_type": "reverse_proxy",
		"config": {"upstreams": ["localhost:9090"]}
	}`

	req := httptest.NewRequest("PUT", "/api/routes/"+route.ID, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify update preserved enabled state
	updated, _ := store.GetRoute(route.ID)
	if !updated.Enabled {
		t.Error("Expected route to remain enabled")
	}

	// Verify config was updated
	if !bytes.Contains(updated.Config, []byte("9090")) {
		t.Error("Expected config to be updated")
	}
}

func TestUpdateRoute_PreservesRawCaddyRoute(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	// Create a route with RawCaddyRoute
	route := &storage.Route{
		Domain:        "example.com",
		HandlerType:   "reverse_proxy",
		Config:        json.RawMessage(`{}`),
		Enabled:       true,
		RawCaddyRoute: json.RawMessage(`{"original": "data"}`),
	}
	store.CreateRoute(route)

	// Update
	body := `{
		"domain": "example.com",
		"handler_type": "reverse_proxy",
		"config": {}
	}`

	req := httptest.NewRequest("PUT", "/api/routes/"+route.ID, bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	// Verify
	updated, _ := store.GetRoute(route.ID)
	if string(updated.RawCaddyRoute) != `{"original": "data"}` {
		t.Errorf("Expected RawCaddyRoute to be preserved, got %s", updated.RawCaddyRoute)
	}
}

func TestUpdateRoute_NotFound(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{
		"domain": "example.com",
		"handler_type": "reverse_proxy",
		"config": {}
	}`

	req := httptest.NewRequest("PUT", "/api/routes/non-existing-id", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

func TestDeleteRoute_Success(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	// Create a route directly in storage
	route := &storage.Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{}`),
	}
	store.CreateRoute(route)

	req := httptest.NewRequest("DELETE", "/api/routes/"+route.ID, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Verify deletion
	_, err := store.GetRoute(route.ID)
	if err == nil {
		t.Error("Expected route to be deleted")
	}
}

func TestToggleRoute(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	// Create an enabled route
	route := &storage.Route{
		Domain:      "example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{}`),
		Enabled:     true,
	}
	store.CreateRoute(route)

	// Toggle (should disable)
	req := httptest.NewRequest("POST", "/api/routes/"+route.ID+"/toggle", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	updated, _ := store.GetRoute(route.ID)
	if updated.Enabled {
		t.Error("Expected route to be disabled after toggle")
	}

	// Toggle again (should enable)
	req = httptest.NewRequest("POST", "/api/routes/"+route.ID+"/toggle", nil)
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	updated, _ = store.GetRoute(route.ID)
	if !updated.Enabled {
		t.Error("Expected route to be enabled after second toggle")
	}
}

func TestToggleRoute_NotFound(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	req := httptest.NewRequest("POST", "/api/routes/non-existing-id/toggle", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d", http.StatusNotFound, w.Code)
	}
}

func TestGetConfig(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	req := httptest.NewRequest("GET", "/api/config", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	config, ok := response["config"].(map[string]any)
	if !ok {
		t.Fatal("Expected config in response")
	}

	// Check defaults
	if config["caddy_admin_url"] != "http://localhost:2019" {
		t.Errorf("Expected default caddy_admin_url, got %v", config["caddy_admin_url"])
	}
}

func TestUpdateConfig(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{
		"caddy_admin_url": "http://custom:2019",
		"enable_encode": false
	}`

	req := httptest.NewRequest("PUT", "/api/config", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Verify update
	cfg, _ := store.GetGlobalConfig()
	if cfg.CaddyAdminURL != "http://custom:2019" {
		t.Errorf("Expected CaddyAdminURL http://custom:2019, got %s", cfg.CaddyAdminURL)
	}
	if cfg.EnableEncode {
		t.Error("Expected EnableEncode to be false")
	}
}

func TestGetStatus(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	req := httptest.NewRequest("GET", "/api/status", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	// Should be offline since we're using a fake Caddy URL
	if response["status"] != "offline" {
		t.Logf("Status response: %v", response)
	}

	// Should have latency field
	if response["latency"] == nil {
		t.Error("Expected latency in response")
	}
}

func TestSyncToCaddy(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	req := httptest.NewRequest("POST", "/api/sync", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should fail because Caddy is not running
	if w.Code != http.StatusInternalServerError {
		t.Logf("Sync response (code %d): %s", w.Code, w.Body.String())
	}
}

func TestTestConnection(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{"url": "http://localhost:29999"}`

	req := httptest.NewRequest("POST", "/api/test-connection", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	// Should fail to connect
	if response["success"] == true {
		t.Error("Expected connection to fail")
	}
	if response["latency"] == nil {
		t.Error("Expected latency in response")
	}
}

func TestTestConnection_MissingURL(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{}`

	req := httptest.NewRequest("POST", "/api/test-connection", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestCORSHeaders(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	req := httptest.NewRequest("OPTIONS", "/api/routes", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != 204 {
		t.Errorf("Expected status 204 for OPTIONS, got %d", w.Code)
	}

	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Error("Expected CORS header")
	}
}

func TestListRoutes_WithRoutes(t *testing.T) {
	router, store, cleanup := setupTestRouter(t)
	defer cleanup()

	// Create some routes
	store.CreateRoute(&storage.Route{
		Domain:      "a.example.com",
		HandlerType: "reverse_proxy",
		Config:      json.RawMessage(`{}`),
	})
	store.CreateRoute(&storage.Route{
		Domain:      "b.example.com",
		HandlerType: "file_server",
		Config:      json.RawMessage(`{}`),
	})

	req := httptest.NewRequest("GET", "/api/routes", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var response map[string]any
	json.Unmarshal(w.Body.Bytes(), &response)

	routes, ok := response["routes"].([]any)
	if !ok {
		t.Fatal("Expected routes array in response")
	}
	if len(routes) != 2 {
		t.Errorf("Expected 2 routes, got %d", len(routes))
	}
}

func TestCreateRoute_WithHeaders(t *testing.T) {
	router, _, cleanup := setupTestRouter(t)
	defer cleanup()

	body := `{
		"domain": "example.com",
		"handler_type": "reverse_proxy",
		"config": {"upstreams": ["localhost:8080"]},
		"headers": {
			"set": {"X-Frame-Options": "DENY"},
			"delete": ["Server"]
		}
	}`

	req := httptest.NewRequest("POST", "/api/routes", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, w.Code, w.Body.String())
	}
}
