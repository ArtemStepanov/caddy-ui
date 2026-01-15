package caddy

import (
	"fmt"
	"sync"
	"time"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/google/uuid"
)

// Manager manages multiple Caddy instances
type Manager struct {
	storage     *storage.SQLiteStorage
	clients     map[string]*Client
	clientMutex sync.RWMutex
}

// NewManager creates a new Caddy instance manager
func NewManager(storage *storage.SQLiteStorage) *Manager {
	return &Manager{
		storage: storage,
		clients: make(map[string]*Client),
	}
}

// AddInstance adds a new Caddy instance
func (m *Manager) AddInstance(instance *storage.CaddyInstance) error {
	if instance.ID == "" {
		instance.ID = uuid.New().String()
	}

	instance.Status = "unknown"
	instance.LastSeen = time.Time{}

	// Create storage entry
	if err := m.storage.CreateInstance(instance); err != nil {
		return fmt.Errorf("failed to create instance: %w", err)
	}

	// Create client
	client, err := NewClient(ClientConfig{
		BaseURL:     instance.AdminURL,
		AuthType:    instance.AuthType,
		Credentials: instance.Credentials,
		Timeout:     10 * time.Second,
	})
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}

	m.clientMutex.Lock()
	m.clients[instance.ID] = client
	m.clientMutex.Unlock()

	// Test connection
	go m.updateInstanceStatus(instance.ID)

	return nil
}

// GetInstance retrieves a Caddy instance
func (m *Manager) GetInstance(id string) (*storage.CaddyInstance, error) {
	return m.storage.GetInstance(id)
}

// ListInstances lists all Caddy instances
func (m *Manager) ListInstances() ([]*storage.CaddyInstance, error) {
	return m.storage.ListInstances()
}

// UpdateInstance updates a Caddy instance
func (m *Manager) UpdateInstance(instance *storage.CaddyInstance) error {
	if err := m.storage.UpdateInstance(instance); err != nil {
		return fmt.Errorf("failed to update instance: %w", err)
	}

	// Recreate client if connection details changed
	client, err := NewClient(ClientConfig{
		BaseURL:     instance.AdminURL,
		AuthType:    instance.AuthType,
		Credentials: instance.Credentials,
		Timeout:     10 * time.Second,
	})
	if err != nil {
		return fmt.Errorf("failed to create client: %w", err)
	}

	m.clientMutex.Lock()
	m.clients[instance.ID] = client
	m.clientMutex.Unlock()

	// Test connection
	go m.updateInstanceStatus(instance.ID)

	return nil
}

// DeleteInstance removes a Caddy instance
func (m *Manager) DeleteInstance(id string) error {
	m.clientMutex.Lock()
	delete(m.clients, id)
	m.clientMutex.Unlock()

	return m.storage.DeleteInstance(id)
}

// GetClient retrieves a Caddy client for an instance
func (m *Manager) GetClient(id string) (*Client, error) {
	m.clientMutex.RLock()
	client, ok := m.clients[id]
	m.clientMutex.RUnlock()

	if !ok {
		// Try to load from storage and create client
		instance, err := m.storage.GetInstance(id)
		if err != nil {
			return nil, fmt.Errorf("instance not found: %w", err)
		}

		client, err = NewClient(ClientConfig{
			BaseURL:     instance.AdminURL,
			AuthType:    instance.AuthType,
			Credentials: instance.Credentials,
			Timeout:     10 * time.Second,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to create client: %w", err)
		}

		m.clientMutex.Lock()
		m.clients[id] = client
		m.clientMutex.Unlock()
	}

	return client, nil
}

// TestConnection tests the connection to a Caddy instance
func (m *Manager) TestConnection(id string) (*storage.HealthCheckResult, error) {
	client, err := m.GetClient(id)
	if err != nil {
		return &storage.HealthCheckResult{
			InstanceID: id,
			Healthy:    false,
			Message:    err.Error(),
			Timestamp:  time.Now(),
		}, err
	}

	start := time.Now()
	healthy, err := client.HealthCheck()
	latency := time.Since(start).Milliseconds()

	result := &storage.HealthCheckResult{
		InstanceID: id,
		Healthy:    healthy,
		Timestamp:  time.Now(),
		Latency:    latency,
	}

	if err != nil {
		result.Message = err.Error()
	} else {
		result.Message = "Connection successful"
	}

	// Update instance status
	go m.updateInstanceStatus(id)

	return result, err
}

// updateInstanceStatus updates the status of an instance
func (m *Manager) updateInstanceStatus(id string) {
	instance, err := m.storage.GetInstance(id)
	if err != nil {
		return
	}

	client, err := m.GetClient(id)
	if err != nil {
		instance.Status = "error"
		m.storage.UpdateInstance(instance)
		return
	}

	healthy, err := client.HealthCheck()
	if err != nil || !healthy {
		instance.Status = "offline"
	} else {
		instance.Status = "online"
		instance.LastSeen = time.Now()
	}

	m.storage.UpdateInstance(instance)
}

// StartHealthChecks starts periodic health checks for all instances
func (m *Manager) StartHealthChecks(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			instances, err := m.storage.ListInstances()
			if err != nil {
				continue
			}

			// Check instances concurrently
			var wg sync.WaitGroup
			for _, instance := range instances {
				wg.Add(1)
				go func(id string) {
					defer wg.Done()
					m.updateInstanceStatus(id)
				}(instance.ID)
			}
			wg.Wait()
		}
	}()
}

// GetConfig retrieves configuration from a Caddy instance
func (m *Manager) GetConfig(instanceID string, path string) (map[string]any, string, error) {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return nil, "", err
	}

	return client.GetConfig(path)
}

// LoadConfig loads a new configuration using Caddy's /load endpoint
func (m *Manager) LoadConfig(instanceID string, config any) error {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return err
	}

	return client.LoadConfig(config)
}

// SetConfig sets configuration on a Caddy instance
func (m *Manager) SetConfig(instanceID string, path string, config any, etag string) error {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return err
	}

	// Create backup before applying new config
	if etag != "" {
		currentConfig, currentETag, err := client.GetConfig(path)
		if err == nil {
			backup := &storage.ConfigBackup{
				ID:         uuid.New().String(),
				InstanceID: instanceID,
				Config:     currentConfig,
				ETag:       currentETag,
				CreatedBy:  "system",
			}
			m.storage.CreateConfigBackup(backup)
		}
	}

	return client.SetConfig(path, config, etag)
}

// PatchConfig patches configuration on a Caddy instance
func (m *Manager) PatchConfig(instanceID string, path string, config any) error {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return err
	}

	return client.PatchConfig(path, config)
}

// DeleteConfig deletes configuration from a Caddy instance
func (m *Manager) DeleteConfig(instanceID string, path string) error {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return err
	}

	return client.DeleteConfig(path)
}

// AdaptConfig adapts a Caddyfile to JSON
func (m *Manager) AdaptConfig(instanceID string, caddyfile string, adapter string) (map[string]any, error) {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return nil, err
	}

	return client.AdaptConfig(caddyfile, adapter)
}

// GetUpstreams retrieves upstream information
func (m *Manager) GetUpstreams(instanceID string) ([]any, error) {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return nil, err
	}

	return client.GetUpstreams()
}

// GetPKICA retrieves PKI CA information
func (m *Manager) GetPKICA(instanceID string, caID string) (map[string]any, error) {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return nil, err
	}

	return client.GetPKICA(caID)
}

// GetMetrics retrieves Prometheus metrics from a Caddy instance
func (m *Manager) GetMetrics(instanceID string) (*MetricsData, error) {
	client, err := m.GetClient(instanceID)
	if err != nil {
		return nil, err
	}

	return client.GetMetrics()
}

// RollbackConfig rolls back to a previous configuration
func (m *Manager) RollbackConfig(instanceID string, backupID string) error {
	backups, err := m.storage.GetConfigBackups(instanceID, 100)
	if err != nil {
		return fmt.Errorf("failed to get backups: %w", err)
	}

	var backup *storage.ConfigBackup
	for _, b := range backups {
		if b.ID == backupID {
			backup = b
			break
		}
	}

	if backup == nil {
		return fmt.Errorf("backup not found")
	}

	client, err := m.GetClient(instanceID)
	if err != nil {
		return err
	}

	return client.SetConfig("", backup.Config, "")
}

// BulkConfigUpdate applies configuration to multiple instances
func (m *Manager) BulkConfigUpdate(instanceIDs []string, path string, config any) map[string]error {
	results := make(map[string]error)
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, instanceID := range instanceIDs {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()

			err := m.SetConfig(id, path, config, "")

			mu.Lock()
			results[id] = err
			mu.Unlock()
		}(instanceID)
	}

	wg.Wait()
	return results
}
