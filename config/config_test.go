package config

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadConfig_Defaults(t *testing.T) {
	// Load config without file
	config, err := LoadConfig("")
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify default values
	assert.Equal(t, "0.0.0.0", config.Server.Host)
	assert.Equal(t, 3000, config.Server.Port)
	assert.Equal(t, 30*time.Second, config.Server.ReadTimeout)
	assert.Equal(t, 30*time.Second, config.Server.WriteTimeout)

	assert.Equal(t, "sqlite", config.Storage.Type)
	assert.Equal(t, "./data/orchestrator.db", config.Storage.Path)

	assert.Equal(t, []string{"*"}, config.Security.CORSOrigins)

	assert.Equal(t, 10*time.Second, config.Caddy.DefaultTimeout)
	assert.Equal(t, 30*time.Second, config.Caddy.HealthCheckInterval)
	assert.Equal(t, 5, config.Caddy.ConfigBackupCount)

	assert.True(t, config.Templates.BuiltinEnabled)
	assert.Equal(t, "./templates", config.Templates.CustomPath)

	assert.Equal(t, "info", config.Logging.Level)
	assert.Equal(t, "json", config.Logging.Format)
	assert.True(t, config.Logging.AuditEnabled)
}

func TestLoadConfig_FromFile(t *testing.T) {
	yamlContent := `
server:
  host: "127.0.0.1"
  port: 8080
  read_timeout: 60s
  write_timeout: 60s

storage:
  type: "sqlite"
  path: "/custom/path/db.sqlite"

security:
  cors_origins:
    - "http://localhost:3000"
    - "http://localhost:5173"

caddy:
  default_timeout: 15s
  health_check_interval: 60s
  config_backup_count: 10

templates:
  builtin_enabled: false
  custom_path: "/custom/templates"

logging:
  level: "debug"
  format: "text"
  audit_enabled: false
`

	tmpFile, err := os.CreateTemp("", "config-*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpFile.Name())

	_, err = tmpFile.WriteString(yamlContent)
	require.NoError(t, err)
	tmpFile.Close()

	config, err := LoadConfig(tmpFile.Name())
	require.NoError(t, err)

	assert.Equal(t, "127.0.0.1", config.Server.Host)
	assert.Equal(t, 8080, config.Server.Port)
	assert.Equal(t, 60*time.Second, config.Server.ReadTimeout)

	assert.Equal(t, "/custom/path/db.sqlite", config.Storage.Path)

	assert.Len(t, config.Security.CORSOrigins, 2)
	assert.Contains(t, config.Security.CORSOrigins, "http://localhost:3000")

	assert.Equal(t, 15*time.Second, config.Caddy.DefaultTimeout)
	assert.Equal(t, 60*time.Second, config.Caddy.HealthCheckInterval)
	assert.Equal(t, 10, config.Caddy.ConfigBackupCount)

	assert.False(t, config.Templates.BuiltinEnabled)
	assert.Equal(t, "/custom/templates", config.Templates.CustomPath)

	assert.Equal(t, "debug", config.Logging.Level)
	assert.Equal(t, "text", config.Logging.Format)
	assert.False(t, config.Logging.AuditEnabled)
}

func TestLoadConfig_EnvironmentOverrides(t *testing.T) {
	// Set environment variables
	os.Setenv("JWT_SECRET", "test-secret-123")
	os.Setenv("LOG_LEVEL", "debug")
	os.Setenv("DB_PATH", "/env/path/db.sqlite")
	defer func() {
		os.Unsetenv("JWT_SECRET")
		os.Unsetenv("LOG_LEVEL")
		os.Unsetenv("DB_PATH")
	}()

	config, err := LoadConfig("")
	require.NoError(t, err)

	assert.Equal(t, "test-secret-123", config.Security.JWTSecret)
	assert.Equal(t, "debug", config.Logging.Level)
	assert.Equal(t, "/env/path/db.sqlite", config.Storage.Path)
}

func TestLoadConfig_InvalidFile(t *testing.T) {
	_, err := LoadConfig("/non/existent/path/config.yaml")
	require.NoError(t, err) // Should not error, just use defaults
}

func TestLoadConfig_InvalidYAML(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "config-*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpFile.Name())

	_, err = tmpFile.WriteString("invalid: yaml: content: [")
	require.NoError(t, err)
	tmpFile.Close()

	_, err = LoadConfig(tmpFile.Name())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to parse config file")
}

func TestLoadConfig_JWTSecretWarning(t *testing.T) {
	// Ensure JWT_SECRET is not set
	os.Unsetenv("JWT_SECRET")

	config, err := LoadConfig("")
	require.NoError(t, err)

	// Should use insecure default with warning
	assert.Equal(t, "insecure-dev-secret-change-immediately", config.Security.JWTSecret)
}

func TestLoadConfig_PartialFile(t *testing.T) {
	yamlContent := `
server:
  port: 9000

logging:
  level: "warn"
`

	tmpFile, err := os.CreateTemp("", "config-*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpFile.Name())

	_, err = tmpFile.WriteString(yamlContent)
	require.NoError(t, err)
	tmpFile.Close()

	config, err := LoadConfig(tmpFile.Name())
	require.NoError(t, err)

	// Override values
	assert.Equal(t, 9000, config.Server.Port)
	assert.Equal(t, "warn", config.Logging.Level)

	// Default values for unspecified fields
	assert.Equal(t, "0.0.0.0", config.Server.Host)
	assert.Equal(t, "sqlite", config.Storage.Type)
}
