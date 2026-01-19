package caddy

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client is a simple Caddy Admin API client
type Client struct {
	adminURL   string
	httpClient *http.Client
}

// NewClient creates a new Caddy client
func NewClient(adminURL string) *Client {
	return &Client{
		adminURL: adminURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetConfig retrieves the current Caddy configuration at the given path
func (c *Client) GetConfig(path string) (json.RawMessage, error) {
	url := c.adminURL + "/config/"
	if path != "" {
		url += path
	}

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Caddy: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("caddy returned status %d: %s", resp.StatusCode, string(body))
	}

	return body, nil
}

// SetConfig sets the Caddy configuration at the given path
func (c *Client) SetConfig(path string, config any) error {
	data, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	url := c.adminURL + "/config/"
	if path != "" {
		url += path
	}

	req, err := http.NewRequest("POST", url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to Caddy: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("caddy returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// LoadConfig loads an entire configuration into Caddy
func (c *Client) LoadConfig(config any) error {
	data, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	req, err := http.NewRequest("POST", c.adminURL+"/load", bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to connect to Caddy: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("caddy returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// Health checks if Caddy is responsive
func (c *Client) Health() error {
	resp, err := c.httpClient.Get(c.adminURL + "/config/")
	if err != nil {
		return fmt.Errorf("failed to connect to Caddy: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("caddy returned status %d", resp.StatusCode)
	}

	return nil
}

// GetAdminURL returns the configured admin URL
func (c *Client) GetAdminURL() string {
	return c.adminURL
}
