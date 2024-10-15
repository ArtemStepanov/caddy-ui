package routes

import (
	"github.com/artemstepanov/caddy-ui/controllers"

	"github.com/gin-gonic/gin"
)

func CaddyRoutes(router *gin.RouterGroup) {
	router.GET("/instances", controllers.GetCaddyInstances)
	router.POST("/instances", controllers.AddCaddyInstance)
	router.DELETE("/instances/:id", controllers.DeleteCaddyInstance)
	router.GET("/instances/:id/status", controllers.GetInstanceStatus)
	router.GET("/instances/:id/config", controllers.GetCaddyConfig)
	router.POST("/instances/:id/config", controllers.ApplyCaddyConfig)
	router.GET("/instances/:id/logs", controllers.GetCaddyLogs)
}
