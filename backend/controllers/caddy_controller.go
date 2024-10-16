package controllers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/artemstepanov/caddy-ui/models"
	"github.com/artemstepanov/caddy-ui/services"

	"github.com/gin-gonic/gin"
)

// GetCaddyInstances Get all Caddy instances
func GetCaddyInstances(c *gin.Context) {
	instances := services.GetAllInstances()
	if len(instances) == 0 {
		instances = []models.CaddyInstance{}
	}
	for i := range instances {
		instance := &instances[i]
		status, err := services.GetInstanceStatus(instance.URL)
		if err != nil {
			log.Println("Error getting instance status:", err)
		}
		instance.Status = status
	}
	c.JSON(http.StatusOK, instances)
}

// AddCaddyInstance Add a new Caddy instance
func AddCaddyInstance(c *gin.Context) {
	var newInstance models.CaddyInstance
	if err := c.BindJSON(&newInstance); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}
	services.UpsertInstance(newInstance)
	c.JSON(http.StatusOK, newInstance)
}

// UpdateCaddyInstance Update an existing Caddy instance
func UpdateCaddyInstance(c *gin.Context) {
	id := c.Param("id")
	var updatedInstance models.CaddyInstance
	if err := c.BindJSON(&updatedInstance); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}

	updatedInstance.ID = id
	services.UpsertInstance(updatedInstance)
	c.JSON(http.StatusOK, updatedInstance)
}

// DeleteCaddyInstance Delete a Caddy instance
func DeleteCaddyInstance(c *gin.Context) {
	id := c.Param("id")
	services.DeleteInstance(id)
	c.JSON(http.StatusOK, gin.H{"message": "Instance deleted"})
}

// GetInstanceStatus Get the status of a specific Caddy instance
func GetInstanceStatus(c *gin.Context) {
	id := c.Param("id")
	status, err := services.GetInstanceStatus(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": status})
}

// GetCaddyConfig Fetch the current Caddy configuration
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

// ApplyCaddyConfig Apply a new Caddy configuration
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

// GetCaddyLogs Get the logs for a specific Caddy instance
func GetCaddyLogs(c *gin.Context) {
	id := c.Param("id")
	logs, err := services.GetCaddyLogs(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": logs})
}
