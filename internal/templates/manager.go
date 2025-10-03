package templates

import (
	"bytes"
	"encoding/json"
	"fmt"
	"text/template"

	"github.com/ArtemStepanov/caddy-orchestrator/internal/storage"
	"github.com/google/uuid"
)

// Manager manages configuration templates
type Manager struct {
	storage *storage.SQLiteStorage
}

// NewManager creates a new template manager
func NewManager(storage *storage.SQLiteStorage) *Manager {
	return &Manager{
		storage: storage,
	}
}

// InitializeBuiltinTemplates loads built-in templates into storage
func (m *Manager) InitializeBuiltinTemplates() error {
	templates := GetBuiltinTemplates()
	
	for _, tmpl := range templates {
		existing, err := m.storage.GetTemplate(tmpl.ID)
		if err == nil && existing != nil {
			// Template already exists, skip
			continue
		}

		if err := m.storage.CreateTemplate(tmpl); err != nil {
			return fmt.Errorf("failed to create template %s: %w", tmpl.ID, err)
		}
	}

	return nil
}

// GetTemplate retrieves a template by ID
func (m *Manager) GetTemplate(id string) (*storage.ConfigTemplate, error) {
	return m.storage.GetTemplate(id)
}

// ListTemplates lists all templates
func (m *Manager) ListTemplates() ([]*storage.ConfigTemplate, error) {
	return m.storage.ListTemplates()
}

// CreateTemplate creates a new custom template
func (m *Manager) CreateTemplate(tmpl *storage.ConfigTemplate) error {
	if tmpl.ID == "" {
		tmpl.ID = uuid.New().String()
	}

	return m.storage.CreateTemplate(tmpl)
}

// GenerateConfig generates a configuration from a template with provided variables
func (m *Manager) GenerateConfig(templateID string, variables map[string]interface{}) (map[string]interface{}, error) {
	tmpl, err := m.storage.GetTemplate(templateID)
	if err != nil {
		return nil, fmt.Errorf("template not found: %w", err)
	}

	// Validate required variables
	for _, v := range tmpl.Variables {
		if v.Required {
			if _, ok := variables[v.Name]; !ok {
				// Use default value if available
				if v.DefaultValue != nil {
					variables[v.Name] = v.DefaultValue
				} else {
					return nil, fmt.Errorf("required variable '%s' not provided", v.Name)
				}
			}
		} else if _, ok := variables[v.Name]; !ok {
			// Use default value for optional variables
			if v.DefaultValue != nil {
				variables[v.Name] = v.DefaultValue
			}
		}
	}

	// Convert template to JSON string
	templateJSON, err := json.Marshal(tmpl.Template)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal template: %w", err)
	}

	// Apply variables using text/template
	t, err := template.New("config").Parse(string(templateJSON))
	if err != nil {
		return nil, fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, variables); err != nil {
		return nil, fmt.Errorf("failed to execute template: %w", err)
	}

	// Parse back to map
	var config map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal generated config: %w", err)
	}

	return config, nil
}

// ValidateVariables validates that provided variables match template requirements
func (m *Manager) ValidateVariables(templateID string, variables map[string]interface{}) error {
	tmpl, err := m.storage.GetTemplate(templateID)
	if err != nil {
		return fmt.Errorf("template not found: %w", err)
	}

	for _, v := range tmpl.Variables {
		value, ok := variables[v.Name]
		
		if !ok {
			if v.Required && v.DefaultValue == nil {
				return fmt.Errorf("required variable '%s' not provided", v.Name)
			}
			continue
		}

		// Type validation
		switch v.Type {
		case "string":
			if _, ok := value.(string); !ok {
				return fmt.Errorf("variable '%s' must be a string", v.Name)
			}
		case "number":
			switch value.(type) {
			case int, int64, float64:
				// OK
			default:
				return fmt.Errorf("variable '%s' must be a number", v.Name)
			}
		case "boolean":
			if _, ok := value.(bool); !ok {
				return fmt.Errorf("variable '%s' must be a boolean", v.Name)
			}
		case "array":
			if _, ok := value.([]interface{}); !ok {
				return fmt.Errorf("variable '%s' must be an array", v.Name)
			}
		}
	}

	return nil
}
