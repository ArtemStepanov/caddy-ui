package config

import (
	"log"
	"os"
	"strconv"
)

type Config struct {
	CaddyAPIURL string // URL for Caddy Admin API
	DBPath      string // Path for BadgerDB storage
	Port        int    // Port to run the backend service
}

// LoadConfig loads the application configuration from environment variables and returns a Config struct
func LoadConfig() Config {
	config := Config{
		CaddyAPIURL: getEnv("CADDY_API_URL", "http://localhost:2019"), // Default Caddy Admin API URL
		DBPath:      getEnv("DB_PATH", "./badger"),                    // Default BadgerDB path
		Port:        getEnvAsInt("PORT", 8080),                        // Default port is 8080
	}

	// If necessary, add validation for important config values
	if config.CaddyAPIURL == "" {
		log.Fatal("CADDY_API_URL environment variable is required")
	}

	return config
}

// getEnv reads an environment variable or returns a default value if not set
func getEnv(key string, defaultValue string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}
	return value
}

// getEnvAsInt reads an environment variable as an integer or returns a default value if not set
func getEnvAsInt(key string, defaultValue int) int {
	valueStr, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Printf("Invalid value for %s: %v. Using default: %d\n", key, err, defaultValue)
		return defaultValue
	}
	return value
}
