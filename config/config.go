package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

// Config represents the application configuration
type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Storage  StorageConfig  `yaml:"storage"`
	Security SecurityConfig `yaml:"security"`
	Caddy    CaddyConfig    `yaml:"caddy"`
	Templates TemplatesConfig `yaml:"templates"`
	Logging  LoggingConfig  `yaml:"logging"`
}

// ServerConfig represents server configuration
type ServerConfig struct {
	Host         string        `yaml:"host"`
	Port         int           `yaml:"port"`
	ReadTimeout  time.Duration `yaml:"read_timeout"`
	WriteTimeout time.Duration `yaml:"write_timeout"`
}

// StorageConfig represents storage configuration
type StorageConfig struct {
	Type string `yaml:"type"`
	Path string `yaml:"path"`
}

// SecurityConfig represents security configuration
type SecurityConfig struct {
	JWTSecret   string   `yaml:"jwt_secret"`
	CORSOrigins []string `yaml:"cors_origins"`
}

// CaddyConfig represents Caddy-specific configuration
type CaddyConfig struct {
	DefaultTimeout      time.Duration `yaml:"default_timeout"`
	HealthCheckInterval time.Duration `yaml:"health_check_interval"`
	ConfigBackupCount   int           `yaml:"config_backup_count"`
}

// TemplatesConfig represents templates configuration
type TemplatesConfig struct {
	BuiltinEnabled bool   `yaml:"builtin_enabled"`
	CustomPath     string `yaml:"custom_path"`
}

// LoggingConfig represents logging configuration
type LoggingConfig struct {
	Level        string `yaml:"level"`
	Format       string `yaml:"format"`
	AuditEnabled bool   `yaml:"audit_enabled"`
}

// LoadConfig loads configuration from a YAML file
func LoadConfig(path string) (*Config, error) {
	// Set defaults
	config := &Config{
		Server: ServerConfig{
			Host:         "0.0.0.0",
			Port:         3000,
			ReadTimeout:  30 * time.Second,
			WriteTimeout: 30 * time.Second,
		},
		Storage: StorageConfig{
			Type: "sqlite",
			Path: "./data/orchestrator.db",
		},
		Security: SecurityConfig{
			JWTSecret:   "change-me-in-production",
			CORSOrigins: []string{"*"},
		},
		Caddy: CaddyConfig{
			DefaultTimeout:      10 * time.Second,
			HealthCheckInterval: 30 * time.Second,
			ConfigBackupCount:   5,
		},
		Templates: TemplatesConfig{
			BuiltinEnabled: true,
			CustomPath:     "./templates",
		},
		Logging: LoggingConfig{
			Level:        "info",
			Format:       "json",
			AuditEnabled: true,
		},
	}

	// Read config file if it exists
	if _, err := os.Stat(path); err == nil {
		data, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}

		if err := yaml.Unmarshal(data, config); err != nil {
			return nil, fmt.Errorf("failed to parse config file: %w", err)
		}
	}

	// Override with environment variables
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		config.Security.JWTSecret = jwtSecret
	}

	if logLevel := os.Getenv("LOG_LEVEL"); logLevel != "" {
		config.Logging.Level = logLevel
	}

	if dbPath := os.Getenv("DB_PATH"); dbPath != "" {
		config.Storage.Path = dbPath
	}

	return config, nil
}
