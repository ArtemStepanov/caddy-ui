# Test Coverage Improvement Plan

## Current Status: 74.1% → Target: 90%+

## Coverage Gaps Analysis

### Critical Missing Coverage (0% - Priority 1)

#### 1. **internal/caddy/client.go: configureMTLS** (0%)
**Impact:** +2-3% coverage

Missing test for mTLS configuration. Add test with mock certificates:

```go
// Add to internal/caddy/client_test.go

func TestConfigureMTLS_MissingCertFile(t *testing.T) {
	credentials := map[string]string{
		"key_file": "key.pem",
	}
	
	_, err := configureMTLS(credentials)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cert_file not provided")
}

func TestConfigureMTLS_MissingKeyFile(t *testing.T) {
	credentials := map[string]string{
		"cert_file": "cert.pem",
	}
	
	_, err := configureMTLS(credentials)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "key_file not provided")
}

func TestConfigureMTLS_InvalidCertificate(t *testing.T) {
	credentials := map[string]string{
		"cert_file": "/nonexistent/cert.pem",
		"key_file":  "/nonexistent/key.pem",
	}
	
	_, err := configureMTLS(credentials)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to load client certificate")
}

func TestNewClient_MTLSError(t *testing.T) {
	config := ClientConfig{
		BaseURL:  "http://localhost:2019",
		AuthType: "mtls",
		Credentials: map[string]string{
			// Missing cert_file to trigger error
			"key_file": "key.pem",
		},
	}

	client, err := NewClient(config)
	assert.Error(t, err)
	assert.Nil(t, client)
	assert.Contains(t, err.Error(), "failed to configure mTLS")
}
```

#### 2. **internal/caddy/manager.go: StartHealthChecks** (0%)
**Impact:** +1-2% coverage

Test the health check goroutine:

```go
// Add to internal/caddy/manager_test.go

func TestStartHealthChecks(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	// Create instance
	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: server.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	// Start health checks with short interval
	manager.StartHealthChecks(100 * time.Millisecond)

	// Wait for at least one health check cycle
	time.Sleep(200 * time.Millisecond)

	// Verify instance status was updated
	updated, err := manager.GetInstance(instance.ID)
	require.NoError(t, err)
	assert.Contains(t, []string{"online", "offline"}, updated.Status)
}
```

#### 3. **internal/api/middleware/ratelimit.go: Cleanup** (0%)
**Impact:** +0.5% coverage

Test the cleanup goroutine:

```go
// Add to internal/api/middleware/middleware_test.go

func TestRateLimiter_Cleanup(t *testing.T) {
	limiter := NewRateLimiter(rate.Limit(10), 20)
	
	// Add many limiters to trigger cleanup threshold
	limiter.mu.Lock()
	for i := 0; i < 10001; i++ {
		key := fmt.Sprintf("192.168.1.%d", i)
		limiter.limiters[key] = rate.NewLimiter(rate.Limit(10), 20)
	}
	initialCount := len(limiter.limiters)
	limiter.mu.Unlock()
	
	assert.Greater(t, initialCount, 10000)
	
	// Start cleanup
	limiter.Cleanup()
	
	// Wait for cleanup cycle
	time.Sleep(1100 * time.Millisecond)
	
	// Verify cleanup occurred
	limiter.mu.Lock()
	finalCount := len(limiter.limiters)
	limiter.mu.Unlock()
	
	// Should be cleaned up since > 10000
	assert.Equal(t, 0, finalCount)
}
```

### Medium Coverage Gaps (44-75% - Priority 2)

#### 4. **internal/caddy/manager.go: SetConfig backup logic** (44.4%)
**Impact:** +1-2% coverage

Test the config backup creation:

```go
// Add to internal/caddy/manager_test.go

func TestSetConfig_WithBackup(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	mockConfig := map[string]any{"apps": map[string]any{}}
	
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			w.Header().Set("ETag", "original-etag")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(mockConfig)
		} else if r.Method == "POST" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]any{})
		}
	}))
	defer server.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: server.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	newConfig := map[string]any{"apps": map[string]any{"http": "new"}}
	
	// Set config with etag to trigger backup
	err = manager.SetConfig(instance.ID, "", newConfig, "original-etag")
	require.NoError(t, err)

	// Verify backup was created
	backups, err := db.GetConfigBackups(instance.ID, 10)
	require.NoError(t, err)
	assert.Len(t, backups, 1)
	assert.Equal(t, "original-etag", backups[0].ETag)
}
```

#### 5. **Handler Error Paths** (60-75%)
**Impact:** +3-4% coverage

Add error scenario tests:

```go
// Add to internal/api/handlers/instances_test.go

func TestGetInstance_Error(t *testing.T) {
	handler, _, cleanup := setupTestHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/instances/:id", handler.GetInstance)

	req, _ := http.NewRequest("GET", "/instances/non-existent-id", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
	
	var response storage.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.False(t, response.Success)
	assert.NotNil(t, response.Error)
}

// Add to internal/api/handlers/config_test.go

func TestSetConfig_Error(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/instances/:id/config", handler.SetConfig)

	req, _ := http.NewRequest("POST", "/instances/non-existent/config", 
		bytes.NewBufferString(`{"apps":{}}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestDeleteConfig_Error(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/instances/:id/config/*path", handler.DeleteConfig)

	req, _ := http.NewRequest("DELETE", "/instances/non-existent/config/apps", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
```

#### 6. **Client Error Paths** (60-75%)
**Impact:** +2-3% coverage

```go
// Add to internal/caddy/client_test.go

func TestStop_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("stop failed"))
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.Stop()
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to stop server")
}

func TestGetUpstreams_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("not found"))
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	_, err = client.GetUpstreams()
	assert.Error(t, err)
}

func TestGetPKICA_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	_, err = client.GetPKICA("nonexistent")
	assert.Error(t, err)
}

func TestDeleteConfig_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("invalid path"))
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.DeleteConfig("invalid/path")
	assert.Error(t, err)
}
```

### Low Priority (Diminishing Returns - Priority 3)

#### 7. **cmd/server/main.go** (0%)
**Note:** Main functions are typically NOT unit tested. Use integration/e2e tests instead.

**Reasoning:**
- Requires full application startup
- Better tested in containerized environment
- Hard to test signal handling, graceful shutdown
- Not counted towards "business logic" coverage

#### 8. **internal/docker/integration.go** (0%)
**Note:** Requires Docker daemon running.

Create Docker integration tests (run separately):

```go
// internal/docker/integration_test.go
// +build integration

package docker

import (
	"context"
	"testing"
	
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}
	
	integration, err := NewIntegration()
	require.NoError(t, err)
	assert.NotNil(t, integration)
	
	assert.True(t, integration.IsEnabled())
}

func TestDiscoverContainers(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}
	
	integration, err := NewIntegration()
	require.NoError(t, err)
	
	containers, err := integration.DiscoverContainers(context.Background())
	require.NoError(t, err)
	assert.NotNil(t, containers)
}
```

Run with: `go test -tags=integration ./internal/docker/...`

## Implementation Plan

### Phase 1: Quick Wins (1-2 hours) → +8-10% coverage

1. Add mTLS error tests (client_test.go)
2. Add handler error paths (all handler tests)
3. Add client error scenarios (client_test.go)

**Expected: 74% → 82-84%**

### Phase 2: Moderate Complexity (2-3 hours) → +4-6% coverage

1. Test StartHealthChecks with timing
2. Test SetConfig backup logic
3. Test Cleanup goroutine
4. Add remaining error paths

**Expected: 82-84% → 88-90%**

### Phase 3: Integration Tests (Optional) → +2-3% coverage

1. Docker integration tests (requires Docker)
2. E2E tests for main.go (requires full setup)

**Expected: 88-90% → 92-93%**

## Quick Start Implementation

### Step 1: Add to client_test.go

```bash
# Add approximately 150 lines of mTLS and error tests
```

### Step 2: Add to manager_test.go

```bash
# Add approximately 100 lines for health checks and backup tests
```

### Step 3: Add to handler tests

```bash
# Add approximately 200 lines across all handler test files
```

### Step 4: Run and verify

```bash
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out | grep total
# Should show ~85-90% coverage
```

## Expected Final Result

```
Package                          Coverage
---------------------------------------
cmd/server                       0.0%    (excluded - main function)
config                          94.4%    ✅
internal/api                   100.0%    ✅
internal/api/handlers           92.0%    ⬆️ from 86.3%
internal/api/middleware         92.0%    ⬆️ from 87.1%
internal/caddy                  85.0%    ⬆️ from 72.5%
internal/storage                82.1%    ✅
internal/templates              79.7%    ✅
internal/docker                  0.0%    (excluded - requires Docker)
---------------------------------------
TOTAL                           88-90%   ⬆️ from 74.1%
```

## Exclusions from Coverage Target

Standard industry practice excludes:
1. Main entry points (`main()` functions)
2. External service integrations requiring infrastructure (Docker)
3. Generated code
4. Vendor dependencies

**Effective Coverage Target:** 90%+ of testable business logic ✅

## Files to Modify

1. `internal/caddy/client_test.go` - Add ~150 lines
2. `internal/caddy/manager_test.go` - Add ~100 lines
3. `internal/api/handlers/instances_test.go` - Add ~50 lines
4. `internal/api/handlers/config_test.go` - Add ~100 lines
5. `internal/api/handlers/templates_test.go` - Add ~30 lines
6. `internal/api/middleware/middleware_test.go` - Add ~30 lines

**Total New Test Code:** ~460 lines
**Time Estimate:** 3-4 hours
**Coverage Gain:** +14-16% (74% → 88-90%)
