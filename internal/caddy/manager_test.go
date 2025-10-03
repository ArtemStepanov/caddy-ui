package caddy

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestManager(t *testing.T) (*Manager, *storage.SQLiteStorage, func()) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)

	manager := NewManager(db)

	cleanup := func() {
		db.Close()
		os.Remove(tmpFile.Name())
	}

	return manager, db, cleanup
}

func TestNewManager(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	assert.NotNil(t, manager)
	assert.NotNil(t, manager.storage)
	assert.NotNil(t, manager.clients)
}

func TestAddInstance(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	// Create a mock Caddy server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	instance := &storage.CaddyInstance{
		Name:     "Test Instance",
		AdminURL: server.URL,
		AuthType: "none",
	}

	err := manager.AddInstance(instance)
	require.NoError(t, err)
	assert.NotEmpty(t, instance.ID)
	assert.Equal(t, "unknown", instance.Status)

	// Wait a bit for goroutine to complete
	time.Sleep(100 * time.Millisecond)

	// Verify instance was stored
	retrieved, err := manager.GetInstance(instance.ID)
	require.NoError(t, err)
	assert.Equal(t, instance.Name, retrieved.Name)
}

func TestAddInstance_WithID(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	customID := uuid.New().String()
	instance := &storage.CaddyInstance{
		ID:       customID,
		Name:     "Test Instance",
		AdminURL: server.URL,
		AuthType: "none",
	}

	err := manager.AddInstance(instance)
	require.NoError(t, err)
	assert.Equal(t, customID, instance.ID)
}

func TestGetInstance(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	retrieved, err := manager.GetInstance(instance.ID)
	require.NoError(t, err)
	assert.Equal(t, instance.ID, retrieved.ID)
	assert.Equal(t, instance.Name, retrieved.Name)
}

func TestListInstances(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	instances := []*storage.CaddyInstance{
		{
			ID:       uuid.New().String(),
			Name:     "Instance 1",
			AdminURL: "http://localhost:2019",
			AuthType: "none",
			Status:   "unknown",
		},
		{
			ID:       uuid.New().String(),
			Name:     "Instance 2",
			AdminURL: "http://localhost:2020",
			AuthType: "none",
			Status:   "unknown",
		},
	}

	for _, inst := range instances {
		err := db.CreateInstance(inst)
		require.NoError(t, err)
	}

	list, err := manager.ListInstances()
	require.NoError(t, err)
	assert.Len(t, list, 2)
}

func TestUpdateInstance(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
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

	instance.Name = "Updated Instance"
	err = manager.UpdateInstance(instance)
	require.NoError(t, err)

	// Wait for goroutine
	time.Sleep(100 * time.Millisecond)

	retrieved, err := manager.GetInstance(instance.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Instance", retrieved.Name)
}

func TestDeleteInstance(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	// Add client to manager
	client, _ := NewClient(ClientConfig{
		BaseURL:  instance.AdminURL,
		AuthType: instance.AuthType,
	})
	manager.clientMutex.Lock()
	manager.clients[instance.ID] = client
	manager.clientMutex.Unlock()

	err = manager.DeleteInstance(instance.ID)
	require.NoError(t, err)

	// Verify instance was deleted
	_, err = manager.GetInstance(instance.ID)
	assert.Error(t, err)

	// Verify client was removed
	manager.clientMutex.RLock()
	_, exists := manager.clients[instance.ID]
	manager.clientMutex.RUnlock()
	assert.False(t, exists)
}

func TestGetClient(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	client, err := manager.GetClient(instance.ID)
	require.NoError(t, err)
	assert.NotNil(t, client)
	assert.Equal(t, instance.AdminURL, client.baseURL)
}

func TestGetClient_NotFound(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	_, err := manager.GetClient("non-existent-id")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "instance not found")
}

func TestTestConnection(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
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

	result, err := manager.TestConnection(instance.ID)
	require.NoError(t, err)
	assert.True(t, result.Healthy)
	assert.Equal(t, instance.ID, result.InstanceID)
	assert.Greater(t, result.Latency, int64(0))
}

func TestTestConnection_Failed(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://invalid-host:9999",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	result, err := manager.TestConnection(instance.ID)
	assert.Error(t, err)
	assert.False(t, result.Healthy)
	assert.NotEmpty(t, result.Message)
}

func TestManagerGetConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	mockConfig := map[string]any{"apps": map[string]any{}}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("ETag", "test-etag")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mockConfig)
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

	config, etag, err := manager.GetConfig(instance.ID, "")
	require.NoError(t, err)
	assert.NotNil(t, config)
	assert.Equal(t, "test-etag", etag)
}

func TestManagerLoadConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/load", r.URL.Path)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
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

	config := map[string]any{"apps": map[string]any{}}
	err = manager.LoadConfig(instance.ID, config)
	require.NoError(t, err)
}

func TestManagerSetConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
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

	config := map[string]any{"apps": map[string]any{}}
	err = manager.SetConfig(instance.ID, "", config, "")
	require.NoError(t, err)
}

func TestManagerAdaptConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	adaptedConfig := map[string]any{"apps": map[string]any{"http": "adapted"}}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/adapt" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(adaptedConfig)
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

	caddyfile := "example.com { reverse_proxy localhost:8080 }"
	config, err := manager.AdaptConfig(instance.ID, caddyfile, "caddyfile")
	require.NoError(t, err)
	assert.NotNil(t, config)
}

func TestManagerGetUpstreams(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	upstreams := []any{map[string]any{"address": "localhost:8080"}}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(upstreams)
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

	result, err := manager.GetUpstreams(instance.ID)
	require.NoError(t, err)
	assert.Len(t, result, 1)
}

func TestBulkConfigUpdate(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	instances := []string{}
	for i := 0; i < 3; i++ {
		instance := &storage.CaddyInstance{
			ID:       uuid.New().String(),
			Name:     "Test Instance",
			AdminURL: server.URL,
			AuthType: "none",
			Status:   "unknown",
		}
		err := db.CreateInstance(instance)
		require.NoError(t, err)
		instances = append(instances, instance.ID)
	}

	config := map[string]any{"test": "config"}
	results := manager.BulkConfigUpdate(instances, "", config)

	assert.Len(t, results, 3)
	for _, err := range results {
		assert.NoError(t, err)
	}
}

func TestBulkConfigUpdate_PartialFailure(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	successServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer successServer.Close()

	instances := []string{}

	// Add successful instance
	instance1 := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Success Instance",
		AdminURL: successServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance1)
	require.NoError(t, err)
	instances = append(instances, instance1.ID)

	// Add failing instance
	instance2 := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Fail Instance",
		AdminURL: "http://invalid-host:9999",
		AuthType: "none",
		Status:   "unknown",
	}
	err = db.CreateInstance(instance2)
	require.NoError(t, err)
	instances = append(instances, instance2.ID)

	config := map[string]any{"test": "config"}
	results := manager.BulkConfigUpdate(instances, "", config)

	assert.Len(t, results, 2)
	assert.NoError(t, results[instance1.ID])
	assert.Error(t, results[instance2.ID])
}

func TestManagerPatchConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "PATCH", r.Method)
		w.WriteHeader(http.StatusOK)
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

	config := map[string]any{"test": "value"}
	err = manager.PatchConfig(instance.ID, "", config)
	require.NoError(t, err)
}

func TestManagerDeleteConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "DELETE", r.Method)
		w.WriteHeader(http.StatusOK)
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

	err = manager.DeleteConfig(instance.ID, "apps/http")
	require.NoError(t, err)
}

func TestManagerGetPKICA(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	caData := map[string]any{"id": "local"}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(caData)
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

	ca, err := manager.GetPKICA(instance.ID, "local")
	require.NoError(t, err)
	assert.Equal(t, "local", ca["id"])
}

func TestRollbackConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
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

	// Create a backup
	backup := &storage.ConfigBackup{
		ID:         uuid.New().String(),
		InstanceID: instance.ID,
		Config:     map[string]any{"apps": map[string]any{}},
		ETag:       "test-etag",
		CreatedBy:  "test",
	}
	err = db.CreateConfigBackup(backup)
	require.NoError(t, err)

	// Rollback to the backup
	err = manager.RollbackConfig(instance.ID, backup.ID)
	require.NoError(t, err)
}

func TestRollbackConfig_BackupNotFound(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	err = manager.RollbackConfig(instance.ID, "non-existent-backup")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "backup not found")
}
