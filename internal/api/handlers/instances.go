package handlers

import (
	"net/http"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/gin-gonic/gin"
)

// InstanceHandler handles instance-related requests
type InstanceHandler struct {
	manager *caddy.Manager
}

// NewInstanceHandler creates a new instance handler
func NewInstanceHandler(manager *caddy.Manager) *InstanceHandler {
	return &InstanceHandler{
		manager: manager,
	}
}

// ListInstances lists all Caddy instances
func (h *InstanceHandler) ListInstances(c *gin.Context) {
	instances, err := h.manager.ListInstances()
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "LIST_FAILED",
				Message: "Failed to list instances",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    instances,
	})
}

// GetInstance retrieves a specific Caddy instance
func (h *InstanceHandler) GetInstance(c *gin.Context) {
	id := c.Param("id")

	instance, err := h.manager.GetInstance(id)
	if err != nil {
		c.JSON(http.StatusNotFound, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "NOT_FOUND",
				Message: "Instance not found",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    instance,
	})
}

// CreateInstance creates a new Caddy instance
func (h *InstanceHandler) CreateInstance(c *gin.Context) {
	var instance storage.CaddyInstance

	if err := c.ShouldBindJSON(&instance); err != nil {
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

	if err := h.manager.AddInstance(&instance); err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "CREATE_FAILED",
				Message: "Failed to create instance",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, storage.APIResponse{
		Success: true,
		Data:    instance,
	})
}

// UpdateInstance updates a Caddy instance
func (h *InstanceHandler) UpdateInstance(c *gin.Context) {
	id := c.Param("id")

	var instance storage.CaddyInstance
	if err := c.ShouldBindJSON(&instance); err != nil {
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

	instance.ID = id

	if err := h.manager.UpdateInstance(&instance); err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "UPDATE_FAILED",
				Message: "Failed to update instance",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    instance,
	})
}

// DeleteInstance deletes a Caddy instance
func (h *InstanceHandler) DeleteInstance(c *gin.Context) {
	id := c.Param("id")

	if err := h.manager.DeleteInstance(id); err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "DELETE_FAILED",
				Message: "Failed to delete instance",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data: map[string]string{
			"message": "Instance deleted successfully",
		},
	})
}

// TestConnection tests connection to a Caddy instance
func (h *InstanceHandler) TestConnection(c *gin.Context) {
	id := c.Param("id")

	result, err := h.manager.TestConnection(id)
	if err != nil {
		c.JSON(http.StatusOK, storage.APIResponse{
			Success: false,
			Data:    result,
			Error: &storage.APIError{
				Code:    "CONNECTION_FAILED",
				Message: "Failed to connect to instance",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    result,
	})
}
