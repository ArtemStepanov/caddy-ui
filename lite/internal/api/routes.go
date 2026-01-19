package api

import (
	"github.com/gin-gonic/gin"

	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/storage"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine, store *storage.SQLiteStorage, caddyClient *caddy.Client) {
	h := NewHandler(store, caddyClient)

	// Enable CORS
	r.Use(corsMiddleware())

	api := r.Group("/api")
	{
		// Routes CRUD
		api.GET("/routes", h.ListRoutes)
		api.POST("/routes", h.CreateRoute)
		api.GET("/routes/:id", h.GetRoute)
		api.PUT("/routes/:id", h.UpdateRoute)
		api.DELETE("/routes/:id", h.DeleteRoute)
		api.POST("/routes/:id/toggle", h.ToggleRoute)

		// Global config
		api.GET("/config", h.GetConfig)
		api.PUT("/config", h.UpdateConfig)

		// Caddy status
		api.GET("/status", h.GetStatus)
		api.POST("/sync", h.SyncToCaddy)
		api.POST("/test-connection", h.TestConnection)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
