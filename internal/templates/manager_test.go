package templates

import (
	"os"
	"testing"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestManager(t *testing.T) (*Manager, *storage.SQLiteStorage, func()) {
	tmpFile, err := os.CreateTemp("", "test-*.db")
	require.NoError(t, err)
	tmpFile.Close()

	db, err := storage.NewSQLiteStorage(tmpFile.Name())
	require.NoError(t, err)

	manager := NewManager(db)

	cleanup := func() {
		db.Close()
		os.Remove(tmpFile.Name())
	}

	return manager, db, cleanup
}

func TestNewManager(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	assert.NotNil(t, manager)
	assert.NotNil(t, manager.storage)
}

func TestInitializeBuiltinTemplates(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	err := manager.InitializeBuiltinTemplates()
	require.NoError(t, err)

	// Verify templates were created
	templates, err := manager.ListTemplates()
	require.NoError(t, err)
	assert.Greater(t, len(templates), 0)

	// Verify specific built-in templates exist
	foundReverseProxy := false
	foundFileServer := false
	for _, tmpl := range templates {
		if tmpl.ID == "reverse-proxy-basic" {
			foundReverseProxy = true
		}
		if tmpl.ID == "static-file-server" {
			foundFileServer = true
		}
	}
	assert.True(t, foundReverseProxy)
	assert.True(t, foundFileServer)
}

func TestInitializeBuiltinTemplates_Idempotent(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	// Initialize once
	err := manager.InitializeBuiltinTemplates()
	require.NoError(t, err)

	count1, err := manager.ListTemplates()
	require.NoError(t, err)

	// Initialize again - should not duplicate
	err = manager.InitializeBuiltinTemplates()
	require.NoError(t, err)

	count2, err := manager.ListTemplates()
	require.NoError(t, err)

	assert.Equal(t, len(count1), len(count2))
}

func TestGetTemplate(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{"test": "value"},
		Variables:   []storage.TemplateVariable{},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	retrieved, err := manager.GetTemplate(template.ID)
	require.NoError(t, err)
	assert.Equal(t, template.ID, retrieved.ID)
	assert.Equal(t, template.Name, retrieved.Name)
}

func TestGetTemplate_NotFound(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	_, err := manager.GetTemplate("non-existent")
	assert.Error(t, err)
}

func TestListTemplates(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	templates := []*storage.ConfigTemplate{
		{
			ID:          uuid.New().String(),
			Name:        "Template 1",
			Description: "Description 1",
			Category:    "category1",
			Template:    map[string]any{},
			Variables:   []storage.TemplateVariable{},
		},
		{
			ID:          uuid.New().String(),
			Name:        "Template 2",
			Description: "Description 2",
			Category:    "category2",
			Template:    map[string]any{},
			Variables:   []storage.TemplateVariable{},
		},
	}

	for _, tmpl := range templates {
		err := db.CreateTemplate(tmpl)
		require.NoError(t, err)
	}

	list, err := manager.ListTemplates()
	require.NoError(t, err)
	assert.Len(t, list, 2)
}

func TestCreateTemplate(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		Name:        "Custom Template",
		Description: "Custom description",
		Category:    "custom",
		Template:    map[string]any{"custom": "config"},
		Variables:   []storage.TemplateVariable{},
	}

	err := manager.CreateTemplate(template)
	require.NoError(t, err)
	assert.NotEmpty(t, template.ID)
}

func TestCreateTemplate_WithID(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	customID := uuid.New().String()
	template := &storage.ConfigTemplate{
		ID:          customID,
		Name:        "Custom Template",
		Description: "Custom description",
		Category:    "custom",
		Template:    map[string]any{"custom": "config"},
		Variables:   []storage.TemplateVariable{},
	}

	err := manager.CreateTemplate(template)
	require.NoError(t, err)
	assert.Equal(t, customID, template.ID)
}

func TestGenerateConfig(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template: map[string]any{
			"server": map[string]any{
				"name": "{{.server_name}}",
				"port": "{{.port}}",
			},
		},
		Variables: []storage.TemplateVariable{
			{
				Name:     "server_name",
				Type:     "string",
				Required: true,
			},
			{
				Name:     "port",
				Type:     "number",
				Required: true,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	variables := map[string]any{
		"server_name": "test-server",
		"port":        8080,
	}

	config, err := manager.GenerateConfig(template.ID, variables)
	require.NoError(t, err)
	assert.NotNil(t, config)

	server, ok := config["server"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "test-server", server["name"])
	assert.Equal(t, "8080", server["port"]) // Note: template rendering converts to string
}

func TestGenerateConfig_WithDefaults(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template: map[string]any{
			"server": map[string]any{
				"port": "{{.port}}",
			},
		},
		Variables: []storage.TemplateVariable{
			{
				Name:         "port",
				Type:         "number",
				Required:     true,
				DefaultValue: 443,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	// Don't provide port - should use default
	variables := map[string]any{}

	config, err := manager.GenerateConfig(template.ID, variables)
	require.NoError(t, err)
	assert.NotNil(t, config)
}

func TestGenerateConfig_MissingRequired(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template: map[string]any{
			"server": "{{.name}}",
		},
		Variables: []storage.TemplateVariable{
			{
				Name:     "name",
				Type:     "string",
				Required: true,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	variables := map[string]any{} // Missing required 'name'

	_, err = manager.GenerateConfig(template.ID, variables)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "required variable")
}

func TestGenerateConfig_TemplateNotFound(t *testing.T) {
	manager, _, cleanup := setupTestManager(t)
	defer cleanup()

	_, err := manager.GenerateConfig("non-existent", map[string]any{})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "template not found")
}

func TestValidateVariables(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{},
		Variables: []storage.TemplateVariable{
			{
				Name:     "string_var",
				Type:     "string",
				Required: true,
			},
			{
				Name:     "number_var",
				Type:     "number",
				Required: true,
			},
			{
				Name:     "bool_var",
				Type:     "boolean",
				Required: true,
			},
			{
				Name:     "array_var",
				Type:     "array",
				Required: true,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	variables := map[string]any{
		"string_var": "test",
		"number_var": 123,
		"bool_var":   true,
		"array_var":  []any{"item1", "item2"},
	}

	err = manager.ValidateVariables(template.ID, variables)
	require.NoError(t, err)
}

func TestValidateVariables_WrongType(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{},
		Variables: []storage.TemplateVariable{
			{
				Name:     "number_var",
				Type:     "number",
				Required: true,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	variables := map[string]any{
		"number_var": "not a number",
	}

	err = manager.ValidateVariables(template.ID, variables)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "must be a number")
}

func TestValidateVariables_MissingRequired(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{},
		Variables: []storage.TemplateVariable{
			{
				Name:     "required_var",
				Type:     "string",
				Required: true,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	variables := map[string]any{} // Missing required variable

	err = manager.ValidateVariables(template.ID, variables)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "required variable")
}

func TestValidateVariables_OptionalMissing(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{},
		Variables: []storage.TemplateVariable{
			{
				Name:     "optional_var",
				Type:     "string",
				Required: false,
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	variables := map[string]any{} // Missing optional variable is OK

	err = manager.ValidateVariables(template.ID, variables)
	require.NoError(t, err)
}

func TestValidateVariables_WithDefaultValue(t *testing.T) {
	manager, db, cleanup := setupTestManager(t)
	defer cleanup()

	template := &storage.ConfigTemplate{
		ID:          uuid.New().String(),
		Name:        "Test Template",
		Description: "Test description",
		Category:    "test",
		Template:    map[string]any{},
		Variables: []storage.TemplateVariable{
			{
				Name:         "optional_var",
				Type:         "string",
				Required:     false,
				DefaultValue: "default",
			},
		},
	}

	err := db.CreateTemplate(template)
	require.NoError(t, err)

	variables := map[string]any{} // Missing optional variable with default is OK

	err = manager.ValidateVariables(template.ID, variables)
	require.NoError(t, err)
}

func TestGetBuiltinTemplates(t *testing.T) {
	templates := GetBuiltinTemplates()

	assert.NotEmpty(t, templates)

	// Verify each template has required fields
	for _, tmpl := range templates {
		assert.NotEmpty(t, tmpl.ID)
		assert.NotEmpty(t, tmpl.Name)
		assert.NotEmpty(t, tmpl.Category)
		assert.NotNil(t, tmpl.Template)
		assert.NotNil(t, tmpl.Variables)
	}

	// Verify specific templates
	ids := make(map[string]bool)
	for _, tmpl := range templates {
		ids[tmpl.ID] = true
	}

	assert.True(t, ids["reverse-proxy-basic"])
	assert.True(t, ids["static-file-server"])
	assert.True(t, ids["websocket-proxy"])
	assert.True(t, ids["load-balancer"])
}
