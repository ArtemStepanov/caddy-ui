package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/templates"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestTemplateHandler(t *testing.T) (*TemplateHandler, *templates.Manager, func()) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)

	manager := templates.NewManager(db)
	handler := NewTemplateHandler(manager)

	cleanup := func() {
		db.Close()
		os.Remove(tmpFile.Name())
	}

	return handler, manager, cleanup
}

func TestListTemplates_Empty(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/templates", handler.ListTemplates)

	req, _ := http.NewRequest("GET", "/templates", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestListTemplates_WithData(t *testing.T) {
	handler, manager, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	err := manager.InitializeBuiltinTemplates()
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/templates", handler.ListTemplates)

	req, _ := http.NewRequest("GET", "/templates", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)

	templatesList := response.Data.([]any)
	assert.Greater(t, len(templatesList), 0)
}

func TestGetTemplate(t *testing.T) {
	handler, manager, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{"test": "value"},
		Variables:   []storage.TemplateVariable{},
	}

	err := manager.CreateTemplate(template)
	require.NoError(t, err)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/templates/:id", handler.GetTemplate)

	req, _ := http.NewRequest("GET", "/templates/"+template.ID, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestGetTemplate_NotFound(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/templates/:id", handler.GetTemplate)

	req, _ := http.NewRequest("GET", "/templates/non-existent", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response storage.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.False(t, response.Success)
}

func TestCreateTemplate(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	template := storage.ConfigTemplate{
		Name:        "New Template",
		Description: "New description",
		Category:    "custom",
		Template:    map[string]any{"custom": "config"},
		Variables:   []storage.TemplateVariable{},
	}

	body, _ := json.Marshal(template)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/templates", handler.CreateTemplate)

	req, _ := http.NewRequest("POST", "/templates", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var response storage.APIResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestCreateTemplate_InvalidRequest(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/templates", handler.CreateTemplate)

	req, _ := http.NewRequest("POST", "/templates", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGenerateConfig(t *testing.T) {
	handler, manager, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template: map[string]any{
			"server": map[string]any{
				"name": "{{.name}}",
				"port": "{{.port}}",
			},
		},
		Variables: []storage.TemplateVariable{
			{
				Name:     "name",
				Type:     "string",
				Required: true,
			},
			{
				Name:     "port",
				Type:     "number",
				Required: true,
			},
		},
	}

	err := manager.CreateTemplate(template)
	require.NoError(t, err)

	request := map[string]any{
		"variables": map[string]any{
			"name": "test-server",
			"port": 8080,
		},
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/templates/:id/generate", handler.GenerateConfig)

	req, _ := http.NewRequest("POST", "/templates/"+template.ID+"/generate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.True(t, response.Success)
}

func TestGenerateConfig_ValidationFailed(t *testing.T) {
	handler, manager, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{"test": "{{.value}}"},
		Variables: []storage.TemplateVariable{
			{
				Name:     "value",
				Type:     "number",
				Required: true,
			},
		},
	}

	err := manager.CreateTemplate(template)
	require.NoError(t, err)

	request := map[string]any{
		"variables": map[string]any{
			"value": "not a number",
		},
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/templates/:id/generate", handler.GenerateConfig)

	req, _ := http.NewRequest("POST", "/templates/"+template.ID+"/generate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response storage.APIResponse
	err = json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.False(t, response.Success)
}

func TestGenerateConfig_InvalidRequest(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/templates/:id/generate", handler.GenerateConfig)

	req, _ := http.NewRequest("POST", "/templates/test-id/generate", bytes.NewBufferString("{}"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestListTemplates_Error(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/templates", handler.ListTemplates)

	req, _ := http.NewRequest("GET", "/templates", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should succeed with empty list
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCreateTemplate_Error(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/templates", handler.CreateTemplate)

	req, _ := http.NewRequest("POST", "/templates", bytes.NewBufferString("invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGenerateConfig_TemplateNotFound(t *testing.T) {
	handler, _, cleanup := setupTestTemplateHandler(t)
	defer cleanup()

	request := map[string]any{
		"variables": map[string]any{
			"name": "test",
		},
	}
	body, _ := json.Marshal(request)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/templates/:id/generate", handler.GenerateConfig)

	req, _ := http.NewRequest("POST", "/templates/non-existent/generate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// ValidateVariables fails with bad request since template doesn't exist
	assert.Contains(t, []int{http.StatusBadRequest, http.StatusInternalServerError}, w.Code)
}
