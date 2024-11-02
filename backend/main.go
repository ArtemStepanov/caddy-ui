package main

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/artemstepanov/caddy-ui/routes"
	"github.com/artemstepanov/caddy-ui/services"
	"github.com/gin-contrib/cors"

	"github.com/gin-gonic/gin"
)

// ServeStaticFiles serves the frontend files
func ServeStaticFiles(router *gin.Engine) {
	// Serve static files from the 'frontend/dist' directory
	router.Static("/assets", "../frontend/dist/assets")

	// Handle all other routes by serving the index.html file
	router.NoRoute(func(c *gin.Context) {
		// If the request path starts with /api, return 404 Not Found
		if strings.HasPrefix(c.Request.URL.Path, "/api") {
			c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
			return
		}
		// For all other routes, serve the index.html file
		c.File("../frontend/dist/index.html")
	})
}

func main() {
	// Initialize Gin router
	router := gin.Default()

	if gin.Mode() == gin.DebugMode {
		log.Println("Running in development mode, not serving static files")
		log.Println("CORS enabled for http://localhost:5173")
		router.Use(cors.New(cors.Config{
			AllowOrigins:     []string{"http://localhost*"},
			AllowMethods:     []string{"GET", "POST", "OPTIONS", "PUT", "DELETE"},
			AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
			ExposeHeaders:    []string{"Content-Length"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
			AllowWildcard:    true,
		}))
	} else {
		ServeStaticFiles(router)
	}

	// API routes
	api := router.Group("/api")
	routes.CaddyRoutes(api)

	err := services.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Start server
	port := ":8080"
	log.Printf("Starting Caddy UI backend on %s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
