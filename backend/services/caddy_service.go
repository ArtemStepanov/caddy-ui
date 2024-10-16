package services

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

// GetInstanceStatus Get the status of a Caddy instance by calling its API
func GetInstanceStatus(instanceUrl string) (string, error) {
	// Placeholder function for getting status
	resp, err := http.Get(instanceUrl + "/reverse_proxy/upstreams")
	if err != nil {
		return "", err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			fmt.Println("Error closing response", err)
		}
	}(resp.Body)

	return "running", nil
}

// FetchCaddyConfig retrieves the current JSON configuration from Caddy
func FetchCaddyConfig(caddyURL string) (string, error) {
	resp, err := http.Get(caddyURL + "/config/")
	if err != nil {
		return "", err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			fmt.Println("Error closing response", err)
		}
	}(resp.Body)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(body), nil
}

// ApplyCaddyConfig sends a new JSON configuration to Caddy
func ApplyCaddyConfig(caddyURL string, newConfig []byte) error {
	req, err := http.NewRequest("POST", caddyURL+"/config/", bytes.NewBuffer(newConfig))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			fmt.Println("Error closing response", err)
		}
	}(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to apply config: status %s", resp.Status)
	}

	return nil
}

// GetCaddyLogs retrieves the logs from a specific Caddy instance
func GetCaddyLogs(instanceID string) (string, error) {
	// Placeholder function for fetching logs
	return fmt.Sprintf("Logs for instance %s", instanceID), nil
}
