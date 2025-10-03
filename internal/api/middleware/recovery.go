package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RecoveryMiddleware recovers from panics and returns error response
func RecoveryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)

				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"error": map[string]string{
						"code":    "INTERNAL_ERROR",
						"message": "An internal server error occurred",
					},
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}
