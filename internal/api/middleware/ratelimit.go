package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// RateLimiter stores rate limiters for each client
type RateLimiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	r        rate.Limit
	b        int
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(r rate.Limit, b int) *RateLimiter {
	return &RateLimiter{
		limiters: make(map[string]*rate.Limiter),
		r:        r,
		b:        b,
	}
}

// getLimiter returns a rate limiter for a client
func (rl *RateLimiter) getLimiter(key string) *rate.Limiter {
	rl.mu.RLock()
	limiter, exists := rl.limiters[key]
	rl.mu.RUnlock()

	if !exists {
		rl.mu.Lock()
		limiter = rate.NewLimiter(rl.r, rl.b)
		rl.limiters[key] = limiter
		rl.mu.Unlock()
	}

	return limiter
}

// Cleanup removes old limiters
func (rl *RateLimiter) Cleanup() {
	ticker := time.NewTicker(time.Minute)
	go func() {
		for range ticker.C {
			rl.mu.Lock()
			// In production, you'd want more sophisticated cleanup
			// For now, we'll just clear everything periodically
			if len(rl.limiters) > 10000 {
				rl.limiters = make(map[string]*rate.Limiter)
			}
			rl.mu.Unlock()
		}
	}()
}

// RateLimitMiddleware creates a rate limiting middleware
func RateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Use IP address as key
		key := c.ClientIP()

		// Get limiter for this client
		l := limiter.getLimiter(key)

		if !l.Allow() {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": map[string]string{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Too many requests, please try again later",
				},
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
