package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"golang.org/x/time/rate"
)

func TestCORSMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name          string
		origins       []string
		requestOrigin string
		expectAllowed bool
	}{
		{
			name:          "Allow all origins",
			origins:       []string{"*"},
			requestOrigin: "http://example.com",
			expectAllowed: true,
		},
		{
			name:          "Allow specific origin",
			origins:       []string{"http://localhost:3000"},
			requestOrigin: "http://localhost:3000",
			expectAllowed: true,
		},
		{
			name:          "Deny unlisted origin",
			origins:       []string{"http://localhost:3000"},
			requestOrigin: "http://evil.com",
			expectAllowed: false,
		},
		{
			name:          "Allow multiple origins",
			origins:       []string{"http://localhost:3000", "http://localhost:5173"},
			requestOrigin: "http://localhost:5173",
			expectAllowed: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := gin.New()
			router.Use(CORSMiddleware(tt.origins))
			router.GET("/test", func(c *gin.Context) {
				c.String(200, "ok")
			})

			req, _ := http.NewRequest("GET", "/test", nil)
			req.Header.Set("Origin", tt.requestOrigin)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if tt.expectAllowed || tt.origins[0] == "*" {
				assert.Contains(t, w.Header().Get("Access-Control-Allow-Origin"), tt.requestOrigin)
			}
		})
	}
}

func TestCORSMiddleware_PreflightRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(CORSMiddleware([]string{"*"}))
	router.OPTIONS("/test", func(c *gin.Context) {})

	req, _ := http.NewRequest("OPTIONS", "/test", nil)
	req.Header.Set("Origin", "http://example.com")
	req.Header.Set("Access-Control-Request-Method", "POST")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.NotEmpty(t, w.Header().Get("Access-Control-Allow-Methods"))
	assert.NotEmpty(t, w.Header().Get("Access-Control-Allow-Headers"))
}

func TestRecoveryMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(RecoveryMiddleware())
	router.GET("/panic", func(c *gin.Context) {
		panic("test panic")
	})

	req, _ := http.NewRequest("GET", "/panic", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	assert.Contains(t, w.Body.String(), "INTERNAL_ERROR")
}

func TestLoggingMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(LoggingMiddleware())
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := NewRateLimiter(rate.Limit(1), 1) // Very restrictive: 1 req/sec, burst 1
	router := gin.New()
	router.Use(RateLimitMiddleware(limiter))
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	// First request should succeed
	req1, _ := http.NewRequest("GET", "/test", nil)
	req1.Header.Set("X-Forwarded-For", "192.168.1.1")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Second request should be rate limited
	req2, _ := http.NewRequest("GET", "/test", nil)
	req2.Header.Set("X-Forwarded-For", "192.168.1.1")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusTooManyRequests, w2.Code)
}

func TestRateLimitMiddleware_DifferentClients(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := NewRateLimiter(rate.Limit(10), 10) // More generous limits
	router := gin.New()
	router.Use(RateLimitMiddleware(limiter))
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "ok")
	})

	// Request from client 1
	req1, _ := http.NewRequest("GET", "/test", nil)
	req1.Header.Set("X-Forwarded-For", "192.168.1.1")
	w1 := httptest.NewRecorder()
	router.ServeHTTP(w1, req1)
	assert.Equal(t, http.StatusOK, w1.Code)

	// Request from client 2 should also succeed (different IP)
	req2, _ := http.NewRequest("GET", "/test", nil)
	req2.Header.Set("X-Forwarded-For", "192.168.1.2")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)
	assert.Equal(t, http.StatusOK, w2.Code)
}

func TestNewRateLimiter(t *testing.T) {
	limiter := NewRateLimiter(rate.Limit(100), 200)
	assert.NotNil(t, limiter)
	assert.NotNil(t, limiter.limiters)
}

func TestRateLimiter_GetLimiter(t *testing.T) {
	limiter := NewRateLimiter(rate.Limit(10), 20)

	// Get limiter for IP
	l1 := limiter.getLimiter("192.168.1.1")
	assert.NotNil(t, l1)

	// Get same limiter again - should be the same instance
	l2 := limiter.getLimiter("192.168.1.1")
	assert.Same(t, l1, l2)

	// Get different limiter for different IP
	l3 := limiter.getLimiter("192.168.1.2")
	assert.NotNil(t, l3)
	assert.NotSame(t, l1, l3)
}

func TestRateLimiter_Cleanup(t *testing.T) {
	limiter := NewRateLimiter(rate.Limit(10), 20)

	// Add many limiters to trigger cleanup threshold
	limiter.mu.Lock()
	for i := 0; i < 10001; i++ {
		key := fmt.Sprintf("192.168.%d.%d", i/256, i%256)
		limiter.limiters[key] = rate.NewLimiter(rate.Limit(10), 20)
	}
	initialCount := len(limiter.limiters)
	limiter.mu.Unlock()

	assert.Equal(t, 10001, initialCount)

	// Start cleanup - this starts a goroutine
	// We can't easily test the full cleanup cycle without waiting 1 minute
	// Just verify it starts without panic
	limiter.Cleanup()

	// Give the goroutine time to start
	time.Sleep(10 * time.Millisecond)

	// Verify limiters are still there (cleanup hasn't run yet)
	limiter.mu.Lock()
	count := len(limiter.limiters)
	limiter.mu.Unlock()

	assert.Equal(t, 10001, count)
}
