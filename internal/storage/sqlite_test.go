package storage

import (
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestDB(t *testing.T) (*SQLiteStorage, func()) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()

	db, err := NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)

	cleanup := func() {
		db.Close()
		os.Remove(tmpFile.Name())
	}

	return db, cleanup
}

func TestNewSQLiteStorage(t *testing.T) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()
	defer os.Remove(tmpFile.Name())

	db, err := NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)
	require.NotNil(t, db)
	defer db.Close()

	// Verify tables were created
	var count int
	err = db.db.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table'").Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 4, count) // 4 tables: instances, templates, audit_logs, config_backups
}

func TestNewSQLiteStorage_InvalidPath(t *testing.T) {
	db, err := NewSQLiteStorage("/invalid/path/test.db")
	assert.Error(t, err)
	assert.Nil(t, db)
}

func TestCreateInstance(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	instance := &CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	// Verify timestamps were set
	assert.False(t, instance.CreatedAt.IsZero())
	assert.False(t, instance.UpdatedAt.IsZero())
}

func TestCreateInstance_WithCredentials(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	instance := &CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "bearer",
		Credentials: map[string]string{
			"token": "test-token-123",
		},
		Status: "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	// Retrieve and verify credentials
	retrieved, err := db.GetInstance(instance.ID)
	require.NoError(t, err)
	assert.Equal(t, "test-token-123", retrieved.Credentials["token"])
}

func TestGetInstance(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	instance := &CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	retrieved, err := db.GetInstance(instance.ID)
	require.NoError(t, err)
	assert.Equal(t, instance.Name, retrieved.Name)
	assert.Equal(t, instance.AdminURL, retrieved.AdminURL)
	assert.Equal(t, instance.AuthType, retrieved.AuthType)
}

func TestGetInstance_NotFound(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	_, err := db.GetInstance("non-existent-id")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "instance not found")
}

func TestListInstances(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create multiple instances
	instances := []*CaddyInstance{
		{
			ID:       uuid.New().String(),
			Name:     "Instance A",
			AdminURL: "http://localhost:2019",
			AuthType: "none",
			Status:   "unknown",
		},
		{
			ID:       uuid.New().String(),
			Name:     "Instance B",
			AdminURL: "http://localhost:2020",
			AuthType: "bearer",
			Credentials: map[string]string{
				"token": "token-b",
			},
			Status: "unknown",
		},
		{
			ID:       uuid.New().String(),
			Name:     "Instance C",
			AdminURL: "http://localhost:2021",
			AuthType: "none",
			Status:   "unknown",
		},
	}

	for _, inst := range instances {
		err := db.CreateInstance(inst)
		require.NoError(t, err)
	}

	// List all instances
	list, err := db.ListInstances()
	require.NoError(t, err)
	assert.Len(t, list, 3)

	// Verify they're ordered by name
	assert.Equal(t, "Instance A", list[0].Name)
	assert.Equal(t, "Instance B", list[1].Name)
	assert.Equal(t, "Instance C", list[2].Name)
}

func TestListInstances_Empty(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	list, err := db.ListInstances()
	require.NoError(t, err)
	assert.Empty(t, list)
}

func TestUpdateInstance(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	instance := &CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	// Update instance
	instance.Name = "Updated Instance"
	instance.Status = "online"
	instance.LastSeen = time.Now()

	err = db.UpdateInstance(instance)
	require.NoError(t, err)

	// Verify update
	retrieved, err := db.GetInstance(instance.ID)
	require.NoError(t, err)
	assert.Equal(t, "Updated Instance", retrieved.Name)
	assert.Equal(t, "online", retrieved.Status)
	assert.False(t, retrieved.LastSeen.IsZero())
}

func TestUpdateInstance_NotFound(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	instance := &CaddyInstance{
		ID:       "non-existent",
		Name:     "Test",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.UpdateInstance(instance)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "instance not found")
}

func TestDeleteInstance(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	instance := &CaddyInstance{
		ID:       uuid.New().String(),
		Name:     "Test Instance",
		AdminURL: "http://localhost:2019",
		AuthType: "none",
		Status:   "unknown",
	}

	err := db.CreateInstance(instance)
	require.NoError(t, err)

	// Delete instance
	err = db.DeleteInstance(instance.ID)
	require.NoError(t, err)

	// Verify deletion
	_, err = db.GetInstance(instance.ID)
	assert.Error(t, err)
}

func TestDeleteInstance_NotFound(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	err := db.DeleteInstance("non-existent")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "instance not found")
}

func TestCreateTemplate(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	template := &ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "A test template",
		Category:    "reverse-proxy",
		Template: map[string]any{
			"apps": map[string]any{
				"http": map[string]any{
					"servers": map[string]any{},
				},
			},
		},
		Variables: []TemplateVariable{
			{
				Name:        "port",
				Type:        "number",
				Required:    true,
				Description: "Port number",
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)
	assert.False(t, template.CreatedAt.IsZero())
	assert.False(t, template.UpdatedAt.IsZero())
}

func TestGetTemplate(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	template := &ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "A test template",
		Category:    "reverse-proxy",
		Template: map[string]any{
			"test": "value",
		},
		Variables: []TemplateVariable{
			{
				Name:     "port",
				Type:     "number",
				Required: true,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	retrieved, err := db.GetTemplate(template.ID)
	require.NoError(t, err)
	assert.Equal(t, template.Name, retrieved.Name)
	assert.Equal(t, template.Description, retrieved.Description)
	assert.Equal(t, template.Category, retrieved.Category)
	assert.Equal(t, "value", retrieved.Template["test"])
	assert.Len(t, retrieved.Variables, 1)
}

func TestGetTemplate_NotFound(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	_, err := db.GetTemplate("non-existent")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "template not found")
}

func TestListTemplates(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	templates := []*ConfigTemplate{
		{
			ID:          uuid.New().String(),
			Name:        "Template A",
			Description: "Description A",
			Category:    "reverse-proxy",
			Template:    map[string]any{"test": "a"},
			Variables:   []TemplateVariable{},
		},
		{
			ID:          uuid.New().String(),
			Name:        "Template B",
			Description: "Description B",
			Category:    "file-server",
			Template:    map[string]any{"test": "b"},
			Variables:   []TemplateVariable{},
		},
	}

	for _, tmpl := range templates {
		err := db.CreateTemplate(tmpl)
		require.NoError(t, err)
	}

	list, err := db.ListTemplates()
	require.NoError(t, err)
	assert.Len(t, list, 2)
}

func TestCreateAuditLog(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	log := &AuditLog{
		ID:         uuid.New().String(),
		Timestamp:  time.Now(),
		UserID:     "test-user",
		InstanceID: "test-instance",
		Action:     "config_update",
		Changes: map[string]any{
			"field": "value",
		},
		Status: "success",
	}

	err := db.CreateAuditLog(log)
	require.NoError(t, err)
}

func TestListAuditLogs(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create multiple logs
	logs := []*AuditLog{
		{
			ID:         uuid.New().String(),
			Timestamp:  time.Now().Add(-2 * time.Hour),
			UserID:     "user1",
			InstanceID: "instance1",
			Action:     "create",
			Changes:    map[string]any{"test": "1"},
			Status:     "success",
		},
		{
			ID:         uuid.New().String(),
			Timestamp:  time.Now().Add(-1 * time.Hour),
			UserID:     "user1",
			InstanceID: "instance2",
			Action:     "update",
			Changes:    map[string]any{"test": "2"},
			Status:     "success",
		},
		{
			ID:         uuid.New().String(),
			Timestamp:  time.Now(),
			UserID:     "user2",
			InstanceID: "instance1",
			Action:     "delete",
			Changes:    map[string]any{"test": "3"},
			Status:     "error",
			Error:      "something failed",
		},
	}

	for _, log := range logs {
		err := db.CreateAuditLog(log)
		require.NoError(t, err)
	}

	// List all logs
	allLogs, err := db.ListAuditLogs("", 100)
	require.NoError(t, err)
	assert.Len(t, allLogs, 3)
	// Should be ordered by timestamp DESC
	assert.Equal(t, "delete", allLogs[0].Action)

	// List logs for specific instance
	instanceLogs, err := db.ListAuditLogs("instance1", 100)
	require.NoError(t, err)
	assert.Len(t, instanceLogs, 2)

	// Test limit
	limitedLogs, err := db.ListAuditLogs("", 2)
	require.NoError(t, err)
	assert.Len(t, limitedLogs, 2)
}

func TestCreateConfigBackup(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	backup := &ConfigBackup{
		ID:         uuid.New().String(),
		InstanceID: "test-instance",
		Config: map[string]any{
			"apps": map[string]any{
				"http": "config",
			},
		},
		ETag:      "test-etag",
		CreatedBy: "test-user",
	}

	err := db.CreateConfigBackup(backup)
	require.NoError(t, err)
	assert.False(t, backup.CreatedAt.IsZero())
}

func TestGetConfigBackups(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	instanceID := "test-instance"

	// Create multiple backups
	backups := []*ConfigBackup{
		{
			ID:         uuid.New().String(),
			InstanceID: instanceID,
			Config:     map[string]any{"version": 1},
			ETag:       "etag1",
			CreatedBy:  "user1",
		},
		{
			ID:         uuid.New().String(),
			InstanceID: instanceID,
			Config:     map[string]any{"version": 2},
			ETag:       "etag2",
			CreatedBy:  "user1",
		},
		{
			ID:         uuid.New().String(),
			InstanceID: "other-instance",
			Config:     map[string]any{"version": 3},
			ETag:       "etag3",
			CreatedBy:  "user2",
		},
	}

	for _, backup := range backups {
		// Add small delay to ensure different timestamps
		time.Sleep(10 * time.Millisecond)
		err := db.CreateConfigBackup(backup)
		require.NoError(t, err)
	}

	// Get backups for specific instance
	retrieved, err := db.GetConfigBackups(instanceID, 10)
	require.NoError(t, err)
	assert.Len(t, retrieved, 2)
	// Should be ordered by created_at DESC
	assert.Equal(t, float64(2), retrieved[0].Config["version"])
	assert.Equal(t, float64(1), retrieved[1].Config["version"])

	// Test limit
	limited, err := db.GetConfigBackups(instanceID, 1)
	require.NoError(t, err)
	assert.Len(t, limited, 1)
}

func TestClose(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	err := db.Close()
	assert.NoError(t, err)

	// Try to use closed database
	_, err = db.ListInstances()
	assert.Error(t, err)
}
