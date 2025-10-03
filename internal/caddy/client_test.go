package caddy

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewClient(t *testing.T) {
	config := ClientConfig{
		BaseURL:  "http://localhost:2019",
		AuthType: "none",
		Timeout:  10 * time.Second,
	}

	client, err := NewClient(config)
	require.NoError(t, err)
	assert.NotNil(t, client)
	assert.Equal(t, config.BaseURL, client.baseURL)
	assert.Equal(t, config.AuthType, client.authType)
}

func TestNewClient_DefaultTimeout(t *testing.T) {
	config := ClientConfig{
		BaseURL:  "http://localhost:2019",
		AuthType: "none",
	}

	client, err := NewClient(config)
	require.NoError(t, err)
	assert.NotNil(t, client)
	assert.Equal(t, 10*time.Second, client.httpClient.Timeout)
}

func TestNewClient_BearerAuth(t *testing.T) {
	config := ClientConfig{
		BaseURL:  "http://localhost:2019",
		AuthType: "bearer",
		Credentials: map[string]string{
			"token": "test-token",
		},
	}

	client, err := NewClient(config)
	require.NoError(t, err)
	assert.NotNil(t, client)
	assert.Equal(t, "bearer", client.authType)
	assert.Equal(t, "test-token", client.credentials["token"])
}

func TestGetConfig(t *testing.T) {
	mockConfig := map[string]any{
		"apps": map[string]any{
			"http": map[string]any{
				"servers": map[string]any{},
			},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/config", r.URL.Path)
		
		w.Header().Set("ETag", "test-etag-123")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mockConfig)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	config, etag, err := client.GetConfig("")
	require.NoError(t, err)
	assert.NotNil(t, config)
	assert.Equal(t, "test-etag-123", etag)
	assert.Contains(t, config, "apps")
}

func TestGetConfig_WithPath(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/config/apps/http", r.URL.Path)
		
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{"servers": map[string]any{}})
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	config, _, err := client.GetConfig("apps/http")
	require.NoError(t, err)
	assert.NotNil(t, config)
}

func TestGetConfig_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("internal error"))
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	_, _, err = client.GetConfig("")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to get config")
}

func TestGetConfigRaw(t *testing.T) {
	mockConfig := map[string]any{"test": "value"}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(mockConfig)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	config, err := client.GetConfigRaw()
	require.NoError(t, err)
	assert.Equal(t, "value", config["test"])
}

func TestSetConfig(t *testing.T) {
	newConfig := map[string]any{
		"apps": map[string]any{
			"http": "config",
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "/config", r.URL.Path)
		assert.Equal(t, "application/json", r.Header.Get("Content-Type"))
		
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(newConfig)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.SetConfig("", newConfig, "")
	require.NoError(t, err)
}

func TestSetConfig_WithETag(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "test-etag", r.Header.Get("If-Match"))
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.SetConfig("", map[string]any{}, "test-etag")
	require.NoError(t, err)
}

func TestSetConfig_WithPath(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/config/apps/http", r.URL.Path)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.SetConfig("apps/http", map[string]any{}, "")
	require.NoError(t, err)
}

func TestSetConfig_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("invalid config"))
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.SetConfig("", map[string]any{}, "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to set config")
}

func TestPatchConfig(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "PATCH", r.Method)
		assert.Equal(t, "/config/apps/http", r.URL.Path)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.PatchConfig("apps/http", map[string]any{"test": "value"})
	require.NoError(t, err)
}

func TestDeleteConfig(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "DELETE", r.Method)
		assert.Equal(t, "/config/apps/http", r.URL.Path)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.DeleteConfig("apps/http")
	require.NoError(t, err)
}

func TestAdaptConfig(t *testing.T) {
	caddyfile := `
example.com {
	reverse_proxy localhost:8080
}
`
	adaptedConfig := map[string]any{
		"apps": map[string]any{
			"http": "adapted",
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "/adapt", r.URL.Path)
		assert.Equal(t, "caddyfile", r.URL.Query().Get("adapter"))
		assert.Equal(t, "text/caddyfile", r.Header.Get("Content-Type"))
		
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(adaptedConfig)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	config, err := client.AdaptConfig(caddyfile, "caddyfile")
	require.NoError(t, err)
	assert.NotNil(t, config)
	assert.Contains(t, config, "apps")
}

func TestAdaptConfig_Error(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"error": "invalid Caddyfile syntax",
		})
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	_, err = client.AdaptConfig("invalid caddyfile", "")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid Caddyfile syntax")
}

func TestGetUpstreams(t *testing.T) {
	upstreams := []any{
		map[string]any{
			"address": "localhost:8080",
			"healthy": true,
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/reverse_proxy/upstreams", r.URL.Path)
		
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(upstreams)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	result, err := client.GetUpstreams()
	require.NoError(t, err)
	assert.Len(t, result, 1)
}

func TestGetPKICA(t *testing.T) {
	caData := map[string]any{
		"id":   "local",
		"name": "Caddy Local Authority",
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		assert.Equal(t, "/pki/ca/local", r.URL.Path)
		
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(caData)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	ca, err := client.GetPKICA("local")
	require.NoError(t, err)
	assert.Equal(t, "local", ca["id"])
}

func TestHealthCheck(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "GET", r.Method)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	healthy, err := client.HealthCheck()
	require.NoError(t, err)
	assert.True(t, healthy)
}

func TestHealthCheck_Unhealthy(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	healthy, err := client.HealthCheck()
	assert.Error(t, err)
	assert.False(t, healthy)
}

func TestLoadConfig(t *testing.T) {
	config := map[string]any{
		"apps": map[string]any{
			"http": "config",
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "/load", r.URL.Path)
		
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.LoadConfig(config)
	require.NoError(t, err)
}

func TestStop(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "/stop", r.URL.Path)
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "none",
	})
	require.NoError(t, err)

	err = client.Stop()
	require.NoError(t, err)
}

func TestDoRequest_WithBearerAuth(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		assert.Equal(t, "Bearer test-token-123", authHeader)
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]any{})
	}))
	defer server.Close()

	client, err := NewClient(ClientConfig{
		BaseURL:  server.URL,
		AuthType: "bearer",
		Credentials: map[string]string{
			"token": "test-token-123",
		},
	})
	require.NoError(t, err)

	_, _, err = client.GetConfig("")
	require.NoError(t, err)
}
