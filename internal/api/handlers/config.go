package handlers

import (
	"fmt"
	"net/http"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/gin-gonic/gin"
)

// ConfigHandler handles configuration-related requests
type ConfigHandler struct {
	manager *caddy.Manager
}

// NewConfigHandler creates a new config handler
func NewConfigHandler(manager *caddy.Manager) *ConfigHandler {
	return &ConfigHandler{
		manager: manager,
	}
}

// GetConfig retrieves configuration from a Caddy instance
func (h *ConfigHandler) GetConfig(c *gin.Context) {
	instanceID := c.Param("id")
	path := c.Param("path")

	config, etag, err := h.manager.GetConfig(instanceID, path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "GET_CONFIG_FAILED",
				Message: "Failed to get configuration",
				Details: err.Error(),
			},
		})
		return
	}

	// Set ETag header
	if etag != "" {
		c.Header("ETag", etag)
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    config,
	})
}

// LoadConfig loads a new configuration (Caddy's /load endpoint)
func (h *ConfigHandler) LoadConfig(c *gin.Context) {
	instanceID := c.Param("id")

	var config map[string]interface{}
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid configuration",
				Details: err.Error(),
			},
		})
		return
	}

	// Load config uses Caddy's /load endpoint (no ETag needed)
	err := h.manager.LoadConfig(instanceID, config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:     "LOAD_CONFIG_FAILED",
				Message:  "Failed to load configuration",
				Details:  err.Error(),
				Rollback: false,
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data: map[string]string{
			"message": "Configuration loaded successfully",
		},
	})
}

// SetConfig sets configuration on a Caddy instance
func (h *ConfigHandler) SetConfig(c *gin.Context) {
	instanceID := c.Param("id")
	path := c.Param("path")

	var config map[string]interface{}
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid configuration",
				Details: err.Error(),
			},
		})
		return
	}

	// Get ETag from If-Match header for optimistic locking
	etag := c.GetHeader("If-Match")

	err := h.manager.SetConfig(instanceID, path, config, etag)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:     "SET_CONFIG_FAILED",
				Message:  "Failed to set configuration",
				Details:  err.Error(),
				Rollback: false,
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data: map[string]string{
			"message": "Configuration updated successfully",
		},
	})
}

// PatchConfig patches configuration on a Caddy instance
func (h *ConfigHandler) PatchConfig(c *gin.Context) {
	instanceID := c.Param("id")
	path := c.Param("path")

	var config map[string]interface{}
	if err := c.ShouldBindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid configuration",
				Details: err.Error(),
			},
		})
		return
	}

	err := h.manager.PatchConfig(instanceID, path, config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "PATCH_CONFIG_FAILED",
				Message: "Failed to patch configuration",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data: map[string]string{
			"message": "Configuration patched successfully",
		},
	})
}

// DeleteConfig deletes configuration from a Caddy instance
func (h *ConfigHandler) DeleteConfig(c *gin.Context) {
	instanceID := c.Param("id")
	path := c.Param("path")

	err := h.manager.DeleteConfig(instanceID, path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "DELETE_CONFIG_FAILED",
				Message: "Failed to delete configuration",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data: map[string]string{
			"message": "Configuration deleted successfully",
		},
	})
}

// AdaptConfig adapts Caddyfile to JSON
func (h *ConfigHandler) AdaptConfig(c *gin.Context) {
	instanceID := c.Param("id")

	var request struct {
		Caddyfile string `json:"caddyfile" binding:"required"`
		Adapter   string `json:"adapter"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid request body",
				Details: err.Error(),
			},
		})
		return
	}

	// Log the request for debugging
	c.Writer.Header().Set("X-Debug-Caddyfile-Length", fmt.Sprintf("%d", len(request.Caddyfile)))

	config, err := h.manager.AdaptConfig(instanceID, request.Caddyfile, request.Adapter)
	if err != nil {
		// Log detailed error
		errorDetails := fmt.Sprintf("Instance: %s, Adapter: %s, Error: %v", instanceID, request.Adapter, err)
		c.Writer.Header().Set("X-Debug-Error", errorDetails)

		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "ADAPT_FAILED",
				Message: "Failed to adapt Caddyfile",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    config,
	})
}

// GetUpstreams retrieves upstream information
func (h *ConfigHandler) GetUpstreams(c *gin.Context) {
	instanceID := c.Param("id")

	upstreams, err := h.manager.GetUpstreams(instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "GET_UPSTREAMS_FAILED",
				Message: "Failed to get upstreams",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    upstreams,
	})
}

// GetPKICA retrieves PKI CA information
func (h *ConfigHandler) GetPKICA(c *gin.Context) {
	instanceID := c.Param("id")
	caID := c.Param("ca_id")

	ca, err := h.manager.GetPKICA(instanceID, caID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "GET_PKI_CA_FAILED",
				Message: "Failed to get PKI CA",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    ca,
	})
}
