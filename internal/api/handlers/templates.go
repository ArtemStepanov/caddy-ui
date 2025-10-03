package handlers

import (
	"net/http"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/templates"
	"github.com/gin-gonic/gin"
)

// TemplateHandler handles template-related requests
type TemplateHandler struct {
	manager *templates.Manager
}

// NewTemplateHandler creates a new template handler
func NewTemplateHandler(manager *templates.Manager) *TemplateHandler {
	return &TemplateHandler{
		manager: manager,
	}
}

// ListTemplates lists all configuration templates
func (h *TemplateHandler) ListTemplates(c *gin.Context) {
	templates, err := h.manager.ListTemplates()
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "LIST_FAILED",
				Message: "Failed to list templates",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    templates,
	})
}

// GetTemplate retrieves a specific template
func (h *TemplateHandler) GetTemplate(c *gin.Context) {
	id := c.Param("id")

	template, err := h.manager.GetTemplate(id)
	if err != nil {
		c.JSON(http.StatusNotFound, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "NOT_FOUND",
				Message: "Template not found",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    template,
	})
}

// CreateTemplate creates a new custom template
func (h *TemplateHandler) CreateTemplate(c *gin.Context) {
	var template storage.ConfigTemplate

	if err := c.ShouldBindJSON(&template); err != nil {
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

	if err := h.manager.CreateTemplate(&template); err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "CREATE_FAILED",
				Message: "Failed to create template",
				Details: err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusCreated, storage.APIResponse{
		Success: true,
		Data:    template,
	})
}

// GenerateConfig generates configuration from a template
func (h *TemplateHandler) GenerateConfig(c *gin.Context) {
	id := c.Param("id")

	var request struct {
		Variables map[string]any `json:"variables" binding:"required"`
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

	// Validate variables
	if err := h.manager.ValidateVariables(id, request.Variables); err != nil {
		c.JSON(http.StatusBadRequest, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "VALIDATION_FAILED",
				Message: "Variable validation failed",
				Details: err.Error(),
			},
		})
		return
	}

	// Generate config
	config, err := h.manager.GenerateConfig(id, request.Variables)
	if err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "GENERATION_FAILED",
				Message: "Failed to generate configuration",
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
