package api

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/ArtemStepanov/caddy-orchestrator/config"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/templates"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSetupRoutes(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()
	defer os.Remove(tmpFile.Name())

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)
	defer db.Close()

	caddyManager := caddy.NewManager(db)
	templateManager := templates.NewManager(db)

	gin.SetMode(gin.TestMode)
	router := gin.New()

	cfg := &config.Config{}
	SetupRoutes(router, caddyManager, templateManager, cfg, "", []string{"*"})

	// Test health endpoint
	req, _ := http.NewRequest("GET", "/api/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "caddy-orchestrator")
}

func TestSetupRoutes_Instances(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()
	defer os.Remove(tmpFile.Name())

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)
	defer db.Close()

	caddyManager := caddy.NewManager(db)
	templateManager := templates.NewManager(db)

	gin.SetMode(gin.TestMode)
	router := gin.New()

	cfg := &config.Config{}
	SetupRoutes(router, caddyManager, templateManager, cfg, "", []string{"*"})

	// Test instances endpoint
	req, _ := http.NewRequest("GET", "/api/instances", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestSetupRoutes_Templates(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()
	defer os.Remove(tmpFile.Name())

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)
	defer db.Close()

	caddyManager := caddy.NewManager(db)
	templateManager := templates.NewManager(db)

	gin.SetMode(gin.TestMode)
	router := gin.New()

	cfg := &config.Config{}
	SetupRoutes(router, caddyManager, templateManager, cfg, "", []string{"*"})

	// Test templates endpoint
	req, _ := http.NewRequest("GET", "/api/templates", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
