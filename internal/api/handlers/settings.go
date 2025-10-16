package handlers

import (
	"net/http"
	"sync"

	"github.com/ArtemStepanov/caddy-orchestrator/config"
	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/gin-gonic/gin"
)

// SettingsHandler handles settings-related requests
type SettingsHandler struct {
	config     *config.Config
	configPath string
	mu         sync.RWMutex
}

// NewSettingsHandler creates a new settings handler
func NewSettingsHandler(cfg *config.Config, configPath string) *SettingsHandler {
	return &SettingsHandler{
		config:     cfg,
		configPath: configPath,
	}
}

// SettingsResponse represents the settings API response
type SettingsResponse struct {
	Appearance AppearanceSettings `json:"appearance"`
	Dashboard  DashboardSettings  `json:"dashboard"`
}

// AppearanceSettings represents UI appearance settings
type AppearanceSettings struct {
	Theme                  string `json:"theme"`
	Language               string `json:"language"`
	DateFormat             string `json:"dateFormat"`
	TimeFormat             string `json:"timeFormat"`
	ShowRelativeTimestamps bool   `json:"showRelativeTimestamps"`
}

// DashboardSettings represents dashboard preferences
type DashboardSettings struct {
	RefreshInterval int `json:"refreshInterval"`
}

// UpdateSettingsRequest represents the request to update settings
type UpdateSettingsRequest struct {
	Appearance *AppearanceSettings `json:"appearance,omitempty"`
	Dashboard  *DashboardSettings  `json:"dashboard,omitempty"`
}

// GetSettings retrieves current settings
func (h *SettingsHandler) GetSettings(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	response := SettingsResponse{
		Appearance: AppearanceSettings{
			Theme:                  h.config.UI.Theme,
			Language:               h.config.UI.Language,
			DateFormat:             h.config.UI.DateFormat,
			TimeFormat:             h.config.UI.TimeFormat,
			ShowRelativeTimestamps: h.config.UI.ShowRelativeTimestamps,
		},
		Dashboard: DashboardSettings{
			RefreshInterval: h.config.Dashboard.RefreshInterval,
		},
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    response,
	})
}

// UpdateSettings updates settings and saves to config file
func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var req UpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "INVALID_REQUEST",
				Message: "Invalid settings data",
				Details: err.Error(),
			},
		})
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// Update appearance settings if provided
	if req.Appearance != nil {
		if req.Appearance.Theme != "" {
			h.config.UI.Theme = req.Appearance.Theme
		}
		if req.Appearance.Language != "" {
			h.config.UI.Language = req.Appearance.Language
		}
		if req.Appearance.DateFormat != "" {
			h.config.UI.DateFormat = req.Appearance.DateFormat
		}
		if req.Appearance.TimeFormat != "" {
			h.config.UI.TimeFormat = req.Appearance.TimeFormat
		}
		h.config.UI.ShowRelativeTimestamps = req.Appearance.ShowRelativeTimestamps
	}

	// Update dashboard settings if provided
	if req.Dashboard != nil {
		if req.Dashboard.RefreshInterval > 0 {
			h.config.Dashboard.RefreshInterval = req.Dashboard.RefreshInterval
		}
	}

	// Save config to file
	if err := config.SaveConfig(h.config, h.configPath); err != nil {
		c.JSON(http.StatusInternalServerError, storage.APIResponse{
			Success: false,
			Error: &storage.APIError{
				Code:    "SAVE_CONFIG_FAILED",
				Message: "Failed to save settings",
				Details: err.Error(),
			},
		})
		return
	}

	// Return updated settings
	response := SettingsResponse{
		Appearance: AppearanceSettings{
			Theme:                  h.config.UI.Theme,
			Language:               h.config.UI.Language,
			DateFormat:             h.config.UI.DateFormat,
			TimeFormat:             h.config.UI.TimeFormat,
			ShowRelativeTimestamps: h.config.UI.ShowRelativeTimestamps,
		},
		Dashboard: DashboardSettings{
			RefreshInterval: h.config.Dashboard.RefreshInterval,
		},
	}

	c.JSON(http.StatusOK, storage.APIResponse{
		Success: true,
		Data:    response,
	})
}
