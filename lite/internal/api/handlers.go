package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/config"
	"github.com/ArtemStepanov/caddy-orchestrator/lite/internal/storage"
)

// Handler contains all HTTP handlers
type Handler struct {
	store *storage.SQLiteStorage
	caddy *caddy.Client
}

// NewHandler creates a new handler
func NewHandler(store *storage.SQLiteStorage, caddyClient *caddy.Client) *Handler {
	return &Handler{
		store: store,
		caddy: caddyClient,
	}
}

// ListRoutes returns all routes
func (h *Handler) ListRoutes(c *gin.Context) {
	routes, err := h.store.ListRoutes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if routes == nil {
		routes = []*storage.Route{}
	}
	c.JSON(http.StatusOK, gin.H{"routes": routes})
}

// CreateRoute creates a new route
func (h *Handler) CreateRoute(c *gin.Context) {
	var route storage.Route
	if err := c.ShouldBindJSON(&route); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if route.Domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "domain is required"})
		return
	}
	if route.HandlerType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "handler_type is required"})
		return
	}

	route.Enabled = true // New routes are enabled by default

	if err := h.store.CreateRoute(&route); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Auto-sync to Caddy
	if err := h.syncToCaddy(); err != nil {
		c.JSON(http.StatusCreated, gin.H{
			"route":   route,
			"warning": "Route created but sync to Caddy failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"route": route})
}

// GetRoute returns a single route
func (h *Handler) GetRoute(c *gin.Context) {
	id := c.Param("id")
	route, err := h.store.GetRoute(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"route": route})
}

// UpdateRoute updates an existing route
func (h *Handler) UpdateRoute(c *gin.Context) {
	id := c.Param("id")

	// Check if route exists
	existing, err := h.store.GetRoute(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}

	var route storage.Route
	if err := c.ShouldBindJSON(&route); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Preserve ID and timestamps
	route.ID = existing.ID
	route.CreatedAt = existing.CreatedAt

	if err := h.store.UpdateRoute(&route); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Auto-sync to Caddy
	if err := h.syncToCaddy(); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"route":   route,
			"warning": "Route updated but sync to Caddy failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"route": route})
}

// DeleteRoute deletes a route
func (h *Handler) DeleteRoute(c *gin.Context) {
	id := c.Param("id")

	if err := h.store.DeleteRoute(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Auto-sync to Caddy
	if err := h.syncToCaddy(); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": "Route deleted but sync to Caddy failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "route deleted"})
}

// ToggleRoute enables/disables a route
func (h *Handler) ToggleRoute(c *gin.Context) {
	id := c.Param("id")

	route, err := h.store.GetRoute(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route not found"})
		return
	}

	route.Enabled = !route.Enabled

	if err := h.store.UpdateRoute(route); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Auto-sync to Caddy
	if err := h.syncToCaddy(); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"route":   route,
			"warning": "Route toggled but sync to Caddy failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"route": route})
}

// GetConfig returns global configuration
func (h *Handler) GetConfig(c *gin.Context) {
	cfg, err := h.store.GetGlobalConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"config": cfg})
}

// UpdateConfig updates global configuration
func (h *Handler) UpdateConfig(c *gin.Context) {
	var cfg storage.GlobalConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.store.SetGlobalConfig(&cfg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"config": cfg})
}

// GetStatus returns Caddy health status
func (h *Handler) GetStatus(c *gin.Context) {
	start := time.Now()
	err := h.caddy.Health()
	latency := time.Since(start).Milliseconds()

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":    "offline",
			"error":     err.Error(),
			"latency":   latency,
			"admin_url": h.caddy.GetAdminURL(),
		})
		return
	}

	// Get route count
	routes, _ := h.store.ListRoutes()
	routeCount := 0
	if routes != nil {
		routeCount = len(routes)
	}

	c.JSON(http.StatusOK, gin.H{
		"status":      "online",
		"latency":     latency,
		"admin_url":   h.caddy.GetAdminURL(),
		"route_count": routeCount,
	})
}

// SyncToCaddy manually triggers sync to Caddy
func (h *Handler) SyncToCaddy(c *gin.Context) {
	if err := h.syncToCaddy(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "synced successfully"})
}

// TestConnection tests connection to a specific Caddy URL
func (h *Handler) TestConnection(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	testClient := caddy.NewClient(req.URL)
	start := time.Now()
	err := testClient.Health()
	latency := time.Since(start).Milliseconds()

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"error":   err.Error(),
			"latency": latency,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"latency": latency,
	})
}

// syncToCaddy builds config from routes and loads it into Caddy
func (h *Handler) syncToCaddy() error {
	routes, err := h.store.ListRoutes()
	if err != nil {
		return err
	}

	globalCfg, err := h.store.GetGlobalConfig()
	if err != nil {
		return err
	}

	// Build Caddy config from routes
	caddyConfig := config.BuildCaddyConfig(routes, globalCfg)

	// Pretty print for debugging
	data, _ := json.MarshalIndent(caddyConfig, "", "  ")
	_ = data // Could log this if needed

	// Load into Caddy
	return h.caddy.LoadConfig(caddyConfig)
}
