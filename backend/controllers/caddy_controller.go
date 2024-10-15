package controllers

import (
	"encoding/json"
	"net/http"

	"github.com/artemstepanov/caddy-ui/models"
	"github.com/artemstepanov/caddy-ui/services"

	"github.com/gin-gonic/gin"
)

// Get all Caddy instances
func GetCaddyInstances(c *gin.Context) {
	instances := services.GetAllInstances()
	if len(instances) == 0 {
		instances = []models.CaddyInstance{}
	}
	c.JSON(http.StatusOK, instances)
}

// Add a new Caddy instance
func AddCaddyInstance(c *gin.Context) {
	var newInstance models.CaddyInstance
	if err := c.BindJSON(&newInstance); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}
	services.AddInstance(newInstance)
	c.JSON(http.StatusOK, newInstance)
}

// Delete a Caddy instance
func DeleteCaddyInstance(c *gin.Context) {
	id := c.Param("id")
	services.DeleteInstance(id)
	c.JSON(http.StatusOK, gin.H{"message": "Instance deleted"})
}

// Get the status of a specific Caddy instance
func GetInstanceStatus(c *gin.Context) {
	id := c.Param("id")
	status, err := services.GetInstanceStatus(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": status})
}

// Fetch the current Caddy configuration
func GetCaddyConfig(c *gin.Context) {
	id := c.Param("id")
	instance := services.GetInstance(id)

	config, err := services.FetchCaddyConfig(instance.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, config)
}

// Apply a new Caddy configuration
func ApplyCaddyConfig(c *gin.Context) {
	var newConfig map[string]interface{}
	if err := c.BindJSON(&newConfig); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	id := c.Param("id")
	instance := services.GetInstance(id)

	newConfigBytes, _ := json.Marshal(newConfig)
	err := services.ApplyCaddyConfigWithHistory(instance.URL, newConfigBytes, instance.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Configuration updated"})
}

// Get the logs for a specific Caddy instance
func GetCaddyLogs(c *gin.Context) {
	id := c.Param("id")
	logs, err := services.GetCaddyLogs(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
