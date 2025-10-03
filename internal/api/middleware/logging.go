package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LoggingMiddleware logs HTTP requests
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Generate request ID
		requestID := uuid.New().String()
		c.Set("request_id", requestID)
		c.Writer.Header().Set("X-Request-ID", requestID)

		// Start timer
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(start)

		// Get status
		statusCode := c.Writer.Status()

		// Build log message
		if raw != "" {
			path = path + "?" + raw
		}

		log.Printf("[%s] %s %s %d %v %s",
			requestID,
			c.Request.Method,
			path,
			statusCode,
			latency,
			c.ClientIP(),
		)
	}
}
