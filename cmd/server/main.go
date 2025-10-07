package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ArtemStepanov/caddy-orchestrator/config"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/api"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/templates"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig("./config/config.yaml")
	if err != nil {
		log.Printf("Warning: Failed to load config file, using defaults: %v", err)
		cfg, _ = config.LoadConfig("") // Use defaults
	}

	// Set logging level
	if cfg.Logging.Level == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	log.Printf("Starting Caddy Orchestrator...")
	log.Printf("Server: %s:%d", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Database: %s", cfg.Storage.Path)

	// Ensure data directory exists
	if err := os.MkdirAll("./data", 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Initialize storage
	db, err := storage.NewSQLiteStorage(cfg.Storage.Path)
	if err != nil {
		log.Fatalf("Failed to initialize storage: %v", err)
	}
	defer db.Close()

	log.Println("Database initialized successfully")

	// Initialize Caddy manager
	caddyManager := caddy.NewManager(db)

	// Start health checks
	caddyManager.StartHealthChecks(cfg.Caddy.HealthCheckInterval)
	log.Printf("Health checks started (interval: %v)", cfg.Caddy.HealthCheckInterval)

	// Initialize template manager
	templateManager := templates.NewManager(db)

	// Load built-in templates
	if cfg.Templates.BuiltinEnabled {
		if err := templateManager.InitializeBuiltinTemplates(); err != nil {
			log.Printf("Warning: Failed to initialize built-in templates: %v", err)
		} else {
			log.Println("Built-in templates loaded successfully")
		}
	}

	// Create Gin router
	router := gin.New()

	// Setup routes
	configPath := "./config/config.yaml"
	api.SetupRoutes(router, caddyManager, templateManager, cfg, configPath, cfg.Security.CORSOrigins)

	// Serve static files from web directory
	if _, err := os.Stat("./web"); err == nil {
		router.Static("/assets", "./web/assets")
		router.StaticFile("/", "./web/index.html")
		router.NoRoute(func(c *gin.Context) {
			c.File("./web/index.html")
		})
		log.Println("Serving static files from ./web")
	}

	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server listening on %s:%d", cfg.Server.Host, cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
