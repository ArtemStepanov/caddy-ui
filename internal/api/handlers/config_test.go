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

func setupTestConfigHandler(t *testing.T) (*ConfigHandler, *caddy.Manager, *storage.SQLiteStorage, func()) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)

	manager := caddy.NewManager(db)
	handler := NewConfigHandler(manager)

	cleanup := func() {
		db.Close()
		os.Remove(tmpFile.Name())
	}

	return handler, manager, db, cleanup
}

func TestGetConfig(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	mockConfig := map[string]any{"apps": map[string]any{}}

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/config" {
			w.Header().Set("ETag", "test-etag")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(mockConfig)
		}
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/instances/:id/config", handler.GetConfig)

	req, _ := http.NewRequest("GET", "/instances/"+instance.ID+"/config", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "test-etag", w.Header().Get("ETag"))

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestLoadConfig(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/load" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]any{})
		}
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	config := map[string]any{"apps": map[string]any{}}
	body, _ := json.Marshal(config)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/instances/:id/load", handler.LoadConfig)

	req, _ := http.NewRequest("POST", "/instances/"+instance.ID+"/load", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestSetConfig(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	config := map[string]any{"apps": map[string]any{}}
	body, _ := json.Marshal(config)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/instances/:id/config", handler.SetConfig)

	req, _ := http.NewRequest("POST", "/instances/"+instance.ID+"/config", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestPatchConfig(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	config := map[string]any{"test": "value"}
	body, _ := json.Marshal(config)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PATCH("/instances/:id/config", handler.PatchConfig)

	req, _ := http.NewRequest("PATCH", "/instances/"+instance.ID+"/config", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestDeleteConfig(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/instances/:id/config/*path", handler.DeleteConfig)

	req, _ := http.NewRequest("DELETE", "/instances/"+instance.ID+"/config/apps/http", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAdaptConfig(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	adaptedConfig := map[string]any{"apps": map[string]any{}}

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/adapt" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(adaptedConfig)
		}
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	request := map[string]any{
		"caddyfile": "example.com { reverse_proxy localhost:8080 }",
		"adapter":   "caddyfile",
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/instances/:id/adapt", handler.AdaptConfig)

	req, _ := http.NewRequest("POST", "/instances/"+instance.ID+"/adapt", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestAdaptConfig_InvalidRequest(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/instances/:id/adapt", handler.AdaptConfig)

	req, _ := http.NewRequest("POST", "/instances/test-id/adapt", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetUpstreams(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	upstreams := []any{map[string]any{"address": "localhost:8080"}}

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/reverse_proxy/upstreams" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(upstreams)
		}
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/instances/:id/upstreams", handler.GetUpstreams)

	req, _ := http.NewRequest("GET", "/instances/"+instance.ID+"/upstreams", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestGetPKICA(t *testing.T) {
	handler, _, db, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	caData := map[string]any{"id": "local", "name": "Caddy Local Authority"}

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/pki/ca/local" {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(caData)
		}
	}))
	defer mockServer.Close()

	instance := &storage.CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: mockServer.URL,
		AuthType: "none",
		Status:   "unknown",
	}
	err := db.CreateInstance(instance)
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/instances/:id/pki/ca/:ca_id", handler.GetPKICA)

	req, _ := http.NewRequest("GET", "/instances/"+instance.ID+"/pki/ca/local", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestGetConfig_Error(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/instances/:id/config", handler.GetConfig)

	req, _ := http.NewRequest("GET", "/instances/non-existent/config", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestLoadConfig_InvalidJSON(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/instances/:id/load", handler.LoadConfig)

	req, _ := http.NewRequest("POST", "/instances/some-id/load", bytes.NewBufferString("invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSetConfig_InvalidJSON(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/instances/:id/config", handler.SetConfig)

	req, _ := http.NewRequest("POST", "/instances/some-id/config", bytes.NewBufferString("invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestPatchConfig_InvalidJSON(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.PATCH("/instances/:id/config", handler.PatchConfig)

	req, _ := http.NewRequest("PATCH", "/instances/some-id/config", bytes.NewBufferString("invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetUpstreams_Error(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/instances/:id/upstreams", handler.GetUpstreams)

	req, _ := http.NewRequest("GET", "/instances/non-existent/upstreams", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestGetPKICA_Error(t *testing.T) {
	handler, _, _, cleanup := setupTestConfigHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/instances/:id/pki/ca/:ca_id", handler.GetPKICA)

	req, _ := http.NewRequest("GET", "/instances/non-existent/pki/ca/local", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
