package caddy

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// Client represents a Caddy Admin API client
type Client struct {
	baseURL     string
	httpClient  *http.Client
	authType    string
	credentials map[string]string
}

// ClientConfig holds configuration for creating a Caddy client
type ClientConfig struct {
	BaseURL     string
	AuthType    string
	Credentials map[string]string
	Timeout     time.Duration
}

// NewClient creates a new Caddy Admin API client
func NewClient(config ClientConfig) (*Client, error) {
	if config.Timeout == 0 {
		config.Timeout = 10 * time.Second
	}

	httpClient := &http.Client{
		Timeout: config.Timeout,
	}

	// Configure mTLS if specified
	if config.AuthType == "mtls" {
		tlsConfig, err := configureMTLS(config.Credentials)
		if err != nil {
			return nil, fmt.Errorf("failed to configure mTLS: %w", err)
		}
		httpClient.Transport = &http.Transport{
			TLSClientConfig: tlsConfig,
		}
	}

	return &Client{
		baseURL:     config.BaseURL,
		httpClient:  httpClient,
		authType:    config.AuthType,
		credentials: config.Credentials,
	}, nil
}

// configureMTLS sets up mutual TLS authentication
func configureMTLS(credentials map[string]string) (*tls.Config, error) {
	certFile, ok := credentials["cert_file"]
	if !ok {
		return nil, fmt.Errorf("cert_file not provided")
	}

	keyFile, ok := credentials["key_file"]
	if !ok {
		return nil, fmt.Errorf("key_file not provided")
	}

	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return nil, fmt.Errorf("failed to load client certificate: %w", err)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		MinVersion:   tls.VersionTLS12,
	}

	// Load CA certificate if provided
	if caFile, ok := credentials["ca_file"]; ok {
		caCert, err := os.ReadFile(caFile)
		if err != nil {
			return nil, fmt.Errorf("failed to read CA certificate: %w", err)
		}

		caCertPool := x509.NewCertPool()
		if !caCertPool.AppendCertsFromPEM(caCert) {
			return nil, fmt.Errorf("failed to append CA certificate")
		}

		tlsConfig.RootCAs = caCertPool
	}

	return tlsConfig, nil
}

// doRequest performs an HTTP request with authentication
func (c *Client) doRequest(method, path string, body any, headers map[string]string) (*http.Response, error) {
	url := c.baseURL + path

	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Add authentication
	if c.authType == "bearer" {
		if token, ok := c.credentials["token"]; ok {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	return resp, nil
}

// GetConfig retrieves the configuration from Caddy
func (c *Client) GetConfig(path string) (map[string]any, string, error) {
	endpoint := "/config"
	if path != "" {
		endpoint = "/config/" + path
	}

	resp, err := c.doRequest("GET", endpoint, nil, nil)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, "", fmt.Errorf("failed to get config: status %d, body: %s", resp.StatusCode, string(body))
	}

	// Get ETag from response
	etag := resp.Header.Get("ETag")

	var config map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, "", fmt.Errorf("failed to decode config: %w", err)
	}

	return config, etag, nil
}

// GetConfigRaw retrieves the raw configuration without path or etag
func (c *Client) GetConfigRaw() (map[string]any, error) {
	config, _, err := c.GetConfig("")
	return config, err
}

// SetConfig sets the configuration in Caddy
func (c *Client) SetConfig(path string, config any, etag string) error {
	endpoint := "/config"
	if path != "" {
		endpoint = "/config/" + path
	}

	headers := make(map[string]string)
	if etag != "" {
		headers["If-Match"] = etag
	}

	resp, err := c.doRequest("POST", endpoint, config, headers)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to set config: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

// PatchConfig patches the configuration in Caddy
func (c *Client) PatchConfig(path string, config any) error {
	endpoint := "/config"
	if path != "" {
		endpoint = "/config/" + path
	}

	resp, err := c.doRequest("PATCH", endpoint, config, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to patch config: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

// DeleteConfig deletes configuration at the specified path
func (c *Client) DeleteConfig(path string) error {
	endpoint := "/config/" + path

	resp, err := c.doRequest("DELETE", endpoint, nil, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to delete config: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

// AdaptConfig adapts a Caddyfile to JSON format
func (c *Client) AdaptConfig(caddyfile string, adapter string) (map[string]any, error) {
	if adapter == "" {
		adapter = "caddyfile"
	}

	url := c.baseURL + fmt.Sprintf("/adapt?adapter=%s", adapter)

	req, err := http.NewRequest("POST", url, bytes.NewBufferString(caddyfile))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "text/caddyfile")

	if c.authType == "bearer" {
		if token, ok := c.credentials["token"]; ok {
			req.Header.Set("Authorization", "Bearer "+token)
		}
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		var errResponse map[string]any
		if json.Unmarshal(body, &errResponse) == nil {
			if errMsg, ok := errResponse["error"].(string); ok {
				return nil, fmt.Errorf("failed to parse caddyfile: %s", errMsg)
			}
		}
		return nil, fmt.Errorf("failed to adapt config: status %d, body: %s", resp.StatusCode, string(body))
	}

	var config map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, fmt.Errorf("failed to decode adapted config: %w", err)
	}

	return config, nil
}

// GetUpstreams retrieves reverse proxy upstream information
func (c *Client) GetUpstreams() ([]any, error) {
	resp, err := c.doRequest("GET", "/reverse_proxy/upstreams", nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get upstreams: status %d, body: %s", resp.StatusCode, string(body))
	}

	var upstreams []any
	if err := json.NewDecoder(resp.Body).Decode(&upstreams); err != nil {
		return nil, fmt.Errorf("failed to decode upstreams: %w", err)
	}

	return upstreams, nil
}

// GetPKICA retrieves PKI CA information
func (c *Client) GetPKICA(caID string) (map[string]any, error) {
	endpoint := "/pki/ca/" + caID

	resp, err := c.doRequest("GET", endpoint, nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get PKI CA: status %d, body: %s", resp.StatusCode, string(body))
	}

	var ca map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&ca); err != nil {
		return nil, fmt.Errorf("failed to decode PKI CA: %w", err)
	}

	return ca, nil
}

// HealthCheck performs a health check on the Caddy instance
func (c *Client) HealthCheck() (bool, error) {
	start := time.Now()

	resp, err := c.doRequest("GET", "/config/", nil, nil)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	latency := time.Since(start).Milliseconds()

	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("health check failed with status: %d", resp.StatusCode)
	}

	// Log latency for monitoring
	_ = latency

	return true, nil
}

// LoadConfig loads a complete configuration (replaces entire config)
func (c *Client) LoadConfig(config any) error {
	resp, err := c.doRequest("POST", "/load", config, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to load config: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}

// Stop gracefully stops the Caddy server
func (c *Client) Stop() error {
	resp, err := c.doRequest("POST", "/stop", nil, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to stop server: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}
