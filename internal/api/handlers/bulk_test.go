package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestBulkHandler(t *testing.T) (*BulkHandler, *caddy.Manager, *storage.SQLiteStorage, func()) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)

	manager := caddy.NewManager(db)
	handler := NewBulkHandler(manager)

	cleanup := func() {
		db.Close()
		os.Remove(tmpFile.Name())
	}

	return handler, manager, db, cleanup
}

func TestBulkConfigUpdate_Success(t *testing.T) {
	handler, _, db, cleanup := setupTestBulkHandler(t)
	defer cleanup()

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer mockServer.Close()

	instances := []string{}
	for i := 0; i < 2; i++ {
		instance := &storage.CaddyInstance{
			ID:       uuid.New().String(),
			Name:     "Test Instance",
			AdminURL: mockServer.URL,
			AuthType: "none",
			Status:   "unknown",
		}
		err := db.CreateInstance(instance)
		require.NoError(t, err)
		instances = append(instances, instance.ID)
	}

	request := map[string]any{
		"instance_ids": instances,
		"path":         "",
		"config":       map[string]any{"test": "value"},
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/bulk/config-update", handler.BulkConfigUpdate)

	req, _ := http.NewRequest("POST", "/bulk/config-update", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestBulkConfigUpdate_PartialFailure(t *testing.T) {
	handler, _, db, cleanup := setupTestBulkHandler(t)
	defer cleanup()

	successServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer successServer.Close()

	instances := []string{}

	// Success instance
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

	// Fail instance
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

	request := map[string]any{
		"instance_ids": instances,
		"path":         "",
		"config":       map[string]any{"test": "value"},
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/bulk/config-update", handler.BulkConfigUpdate)

	req, _ := http.NewRequest("POST", "/bulk/config-update", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusMultiStatus, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.False(t, response.Success)

	results := response.Data.(map[string]any)
	assert.Len(t, results, 2)
}

func TestBulkConfigUpdate_InvalidRequest(t *testing.T) {
	handler, _, _, cleanup := setupTestBulkHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/bulk/config-update", handler.BulkConfigUpdate)

	req, _ := http.NewRequest("POST", "/bulk/config-update", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBulkConfigUpdate_MissingConfig(t *testing.T) {
	handler, _, _, cleanup := setupTestBulkHandler(t)
	defer cleanup()

	request := map[string]any{
		"instance_ids": []string{"id1", "id2"},
		"path":         "",
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/bulk/config-update", handler.BulkConfigUpdate)

	req, _ := http.NewRequest("POST", "/bulk/config-update", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBulkTemplateApply_NotImplemented(t *testing.T) {
	handler, _, _, cleanup := setupTestBulkHandler(t)
	defer cleanup()

	request := map[string]any{
		"instance_ids": []string{"id1"},
		"template_id":  "template1",
		"variables":    map[string]any{"test": "value"},
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/bulk/template-apply", handler.BulkTemplateApply)

	req, _ := http.NewRequest("POST", "/bulk/template-apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotImplemented, w.Code)

	var response storage.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.False(t, response.Success)
}
