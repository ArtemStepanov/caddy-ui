package handlers

import (
	"net/http"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/caddy"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/gin-gonic/gin"
)

// BulkHandler handles bulk operations
type BulkHandler struct {
	manager *caddy.Manager
}

// NewBulkHandler creates a new bulk handler
func NewBulkHandler(manager *caddy.Manager) *BulkHandler {
	return &BulkHandler{
		manager: manager,
	}
}

// BulkConfigUpdate applies configuration to multiple instances
func (h *BulkHandler) BulkConfigUpdate(c *gin.Context) {
	var request struct {
		InstanceIDs []string       `json:"instance_ids" binding:"required"`
		Path        string         `json:"path"`
		Config      map[string]any `json:"config" binding:"required"`
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

	results := h.manager.BulkConfigUpdate(request.InstanceIDs, request.Path, request.Config)

	// Check if all succeeded
	allSucceeded := true
	for _, err := range results {
		if err != nil {
			allSucceeded = false
			break
		}
	}

	// Format results
	formattedResults := make(map[string]any)
	for instanceID, err := range results {
		if err != nil {
			formattedResults[instanceID] = map[string]any{
				"success": false,
				"error":   err.Error(),
			}
		} else {
			formattedResults[instanceID] = map[string]any{
				"success": true,
			}
		}
	}

	statusCode := http.StatusOK
	if !allSucceeded {
		statusCode = http.StatusMultiStatus
	}

	c.JSON(statusCode, storage.APIResponse{
		Success: allSucceeded,
		Data:    formattedResults,
	})
}

// BulkTemplateApply applies a template to multiple instances
func (h *BulkHandler) BulkTemplateApply(c *gin.Context) {
	var request struct {
		InstanceIDs []string       `json:"instance_ids" binding:"required"`
		TemplateID  string         `json:"template_id" binding:"required"`
		Variables   map[string]any `json:"variables" binding:"required"`
		Path        string         `json:"path"`
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

	// This would need template manager integration
	// For now, return not implemented
	c.JSON(http.StatusNotImplemented, storage.APIResponse{
		Success: false,
		Error: &storage.APIError{
			Code:    "NOT_IMPLEMENTED",
			Message: "Bulk template apply not yet implemented",
		},
	})
}
