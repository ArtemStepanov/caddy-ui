package api

import (
	"github.com/ArtemStepanov/caddy-orchestrator/config"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/api/handlers"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/api/middleware"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/templates"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// SetupRoutes configures all API routes
func SetupRoutes(
	router *gin.Engine,
	caddyManager *caddy.Manager,
	templateManager *templates.Manager,
	cfg *config.Config,
	configPath string,
	corsOrigins []string,
) {
	// Create handlers
	instanceHandler := handlers.NewInstanceHandler(caddyManager)
	configHandler := handlers.NewConfigHandler(caddyManager)
	templateHandler := handlers.NewTemplateHandler(templateManager)
	bulkHandler := handlers.NewBulkHandler(caddyManager)
	settingsHandler := handlers.NewSettingsHandler(cfg, configPath)

	// Setup middleware
	router.Use(middleware.RecoveryMiddleware())
	router.Use(middleware.LoggingMiddleware())
	router.Use(middleware.CORSMiddleware(corsOrigins))

	// Rate limiting: 100 requests per second with burst of 200
	rateLimiter := middleware.NewRateLimiter(rate.Limit(100), 200)
	rateLimiter.Cleanup()
	router.Use(middleware.RateLimitMiddleware(rateLimiter))

	// API v1 routes
	api := router.Group("/api")
	{
		// Instance management
		instances := api.Group("/instances")
		{
			instances.GET("", instanceHandler.ListInstances)
			instances.POST("", instanceHandler.CreateInstance)
			instances.GET("/:id", instanceHandler.GetInstance)
			instances.PUT("/:id", instanceHandler.UpdateInstance)
			instances.DELETE("/:id", instanceHandler.DeleteInstance)
			instances.POST("/:id/test-connection", instanceHandler.TestConnection)

			// Configuration management
			instances.GET("/:id/config", configHandler.GetConfig)
			instances.GET("/:id/config/*path", configHandler.GetConfig)
			instances.POST("/:id/load", configHandler.LoadConfig) // Caddy's recommended endpoint
			instances.POST("/:id/config", configHandler.SetConfig)
			instances.POST("/:id/config/*path", configHandler.SetConfig)
			instances.PATCH("/:id/config", configHandler.PatchConfig)
			instances.PATCH("/:id/config/*path", configHandler.PatchConfig)
			instances.DELETE("/:id/config/*path", configHandler.DeleteConfig)

			// Utilities
			instances.POST("/:id/adapt", configHandler.AdaptConfig)
			instances.GET("/:id/upstreams", configHandler.GetUpstreams)
			instances.GET("/:id/pki/ca/:ca_id", configHandler.GetPKICA)
		}

		// Template management
		templates := api.Group("/templates")
		{
			templates.GET("", templateHandler.ListTemplates)
			templates.POST("", templateHandler.CreateTemplate)
			templates.GET("/:id", templateHandler.GetTemplate)
			templates.POST("/:id/generate", templateHandler.GenerateConfig)
		}

		// Bulk operations
		bulk := api.Group("/bulk")
		{
			bulk.POST("/config-update", bulkHandler.BulkConfigUpdate)
			bulk.POST("/template-apply", bulkHandler.BulkTemplateApply)
		}

		// Settings management
		api.GET("/settings", settingsHandler.GetSettings)
		api.PUT("/settings", settingsHandler.UpdateSettings)

		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "ok",
				"service": "caddy-orchestrator",
			})
		})
	}
}
