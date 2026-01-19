# Task 03: API Routes

## Objective
Create REST API endpoints for route management (CRUD operations).

## Prerequisites
- Task 02 completed (storage and caddy client exist)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/routes` | List all routes |
| POST | `/api/routes` | Create a new route |
| GET | `/api/routes/:id` | Get a single route |
| PUT | `/api/routes/:id` | Update a route |
| DELETE | `/api/routes/:id` | Delete a route |
| POST | `/api/routes/:id/toggle` | Enable/disable a route |
| GET | `/api/config` | Get global config |
| PUT | `/api/config` | Update global config |
| GET | `/api/status` | Get Caddy health status |
| POST | `/api/sync` | Sync routes to Caddy |

## Steps

### 3.1 Create API Handlers (`internal/api/handlers.go`)

```go
package api

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/caddy"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/config"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/storage"
)

type Handler struct {
    store  *storage.SQLiteStorage
    caddy  *caddy.Client
}

func NewHandler(store *storage.SQLiteStorage, caddyClient *caddy.Client) *Handler {
    return &Handler{
        store:  store,
        caddy:  caddyClient,
    }
}

// ListRoutes returns all routes
func (h *Handler) ListRoutes(c *gin.Context) {
    routes, err := h.store.ListRoutes()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
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
        // Route created but sync failed - return warning
        c.JSON(http.StatusCreated, gin.H{
            "route": route,
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
            "route": route,
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
            "route": route,
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
    err := h.caddy.Health()
    if err != nil {
        c.JSON(http.StatusOK, gin.H{
            "status": "offline",
            "error":  err.Error(),
        })
        return
    }
    c.JSON(http.StatusOK, gin.H{"status": "online"})
}

// SyncToCaddy manually triggers sync to Caddy
func (h *Handler) SyncToCaddy(c *gin.Context) {
    if err := h.syncToCaddy(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "synced successfully"})
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

    // Load into Caddy
    return h.caddy.LoadConfig(caddyConfig)
}
```

### 3.2 Create Route Setup (`internal/api/routes.go`)

```go
package api

import (
    "github.com/gin-gonic/gin"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/caddy"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/storage"
)

func SetupRoutes(r *gin.Engine, store *storage.SQLiteStorage, caddyClient *caddy.Client) {
    h := NewHandler(store, caddyClient)

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
    }
}
```

## Request/Response Examples

### Create Reverse Proxy Route
```bash
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "myapp.example.com",
    "handler_type": "reverse_proxy",
    "config": {
      "upstreams": ["localhost:8080"],
      "websocket": true
    }
  }'
```

### Create File Server Route
```bash
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "static.example.com",
    "handler_type": "file_server",
    "config": {
      "root": "/var/www/static",
      "browse": true
    }
  }'
```

### Create Redirect
```bash
curl -X POST http://localhost:3000/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "www.example.com",
    "handler_type": "redir",
    "config": {
      "to": "https://example.com{uri}",
      "code": 301
    }
  }'
```

## Verification
- [ ] All endpoints return correct responses
- [ ] Routes persist in SQLite
- [ ] Invalid requests return 400 with error message
- [ ] Non-existent routes return 404

## Files Created
- `internal/api/handlers.go`
- `internal/api/routes.go`

## Estimated Time
1-2 hours
