package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/api"
	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/storage"
)

func main() {
	// Get configuration from environment
	dbPath := getEnv("DB_PATH", "./data/routes.db")
	caddyURL := getEnv("CADDY_ADMIN_URL", "http://localhost:2019")
	listenAddr := getEnv("LISTEN_ADDR", ":3000")

	log.Printf("Starting Caddy Orchestrator Lite")
	log.Printf("  Database: %s", dbPath)
	log.Printf("  Default Caddy Admin URL: %s", caddyURL)
	log.Printf("  Listen Address: %s", listenAddr)

	// Initialize storage
	store, err := storage.NewSQLiteStorage(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}
	defer store.Close()

	// Initialize Gin router
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// Setup API routes (pass URL string, not client - handlers use dynamic URL from GlobalConfig)
	api.SetupRoutes(r, store, caddyURL)

	// Serve static files (frontend)
	webDir := getEnv("WEB_DIR", "./web/dist")
	if _, err := os.Stat(webDir); err == nil {
		// Assets with long-term caching (1 year)
		assets := r.Group("/assets")
		assets.Use(func(c *gin.Context) {
			c.Header("Cache-Control", "public, max-age=31536000, immutable")
		})
		assets.Static("/", filepath.Join(webDir, "assets"))

		// SPA entry point with no-cache (always validate)
		serveIndex := func(c *gin.Context) {
			c.Header("Cache-Control", "no-cache")
			c.File(filepath.Join(webDir, "index.html"))
		}

		r.GET("/", serveIndex)
		r.StaticFile("/favicon.svg", filepath.Join(webDir, "favicon.svg"))
		r.NoRoute(serveIndex)
	} else {
		log.Printf("Warning: Web directory not found at %s", webDir)
	}

	log.Printf("Server starting on %s", listenAddr)
	if err := r.Run(listenAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
