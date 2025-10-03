package storage

import (
	"time"
)

// CaddyInstance represents a Caddy server instance
type CaddyInstance struct {
	ID          string            `json:"id" db:"id"`
	Name        string            `json:"name" db:"name"`
	AdminURL    string            `json:"admin_url" db:"admin_url"`
	AuthType    string            `json:"auth_type" db:"auth_type"` // "none", "bearer", "mtls"
	Credentials map[string]string `json:"credentials,omitempty" db:"-"`
	CredentialsJSON string        `json:"-" db:"credentials"` // Encrypted JSON for storage
	Status      string            `json:"status" db:"status"`
	LastSeen    time.Time         `json:"last_seen" db:"last_seen"`
	CreatedAt   time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at" db:"updated_at"`
}

// ConfigTemplate represents a reusable configuration template
type ConfigTemplate struct {
	ID          string                 `json:"id" db:"id"`
	Name        string                 `json:"name" db:"name"`
	Description string                 `json:"description" db:"description"`
	Category    string                 `json:"category" db:"category"`
	Template    map[string]interface{} `json:"template" db:"-"`
	TemplateJSON string                `json:"-" db:"template"` // JSON for storage
	Variables   []TemplateVariable     `json:"variables" db:"-"`
	VariablesJSON string               `json:"-" db:"variables"` // JSON for storage
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at" db:"updated_at"`
}

// TemplateVariable represents a variable in a configuration template
type TemplateVariable struct {
	Name         string      `json:"name"`
	Type         string      `json:"type"` // "string", "number", "boolean", "array"
	Required     bool        `json:"required"`
	DefaultValue interface{} `json:"default_value,omitempty"`
	Description  string      `json:"description"`
}

// AuditLog represents an audit log entry
type AuditLog struct {
	ID         string                 `json:"id" db:"id"`
	Timestamp  time.Time              `json:"timestamp" db:"timestamp"`
	UserID     string                 `json:"user_id" db:"user_id"`
	InstanceID string                 `json:"instance_id" db:"instance_id"`
	Action     string                 `json:"action" db:"action"`
	Changes    map[string]interface{} `json:"changes,omitempty" db:"-"`
	ChangesJSON string                `json:"-" db:"changes"` // JSON for storage
	Status     string                 `json:"status" db:"status"`
	Error      string                 `json:"error,omitempty" db:"error"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
	Meta    *Metadata   `json:"meta,omitempty"`
}

// APIError represents an error response
type APIError struct {
	Code     string `json:"code"`
	Message  string `json:"message"`
	Details  string `json:"details,omitempty"`
	Rollback bool   `json:"rollback_performed,omitempty"`
}

// Metadata represents response metadata
type Metadata struct {
	Page       int       `json:"page,omitempty"`
	PerPage    int       `json:"per_page,omitempty"`
	Total      int       `json:"total,omitempty"`
	Timestamp  time.Time `json:"timestamp"`
	RequestID  string    `json:"request_id,omitempty"`
}

// ConfigBackup represents a configuration backup
type ConfigBackup struct {
	ID          string                 `json:"id" db:"id"`
	InstanceID  string                 `json:"instance_id" db:"instance_id"`
	Config      map[string]interface{} `json:"config" db:"-"`
	ConfigJSON  string                 `json:"-" db:"config"`
	ETag        string                 `json:"etag" db:"etag"`
	CreatedAt   time.Time              `json:"created_at" db:"created_at"`
	CreatedBy   string                 `json:"created_by" db:"created_by"`
}

// HealthCheckResult represents a health check result
type HealthCheckResult struct {
	InstanceID string    `json:"instance_id"`
	Healthy    bool      `json:"healthy"`
	Message    string    `json:"message,omitempty"`
	Timestamp  time.Time `json:"timestamp"`
	Latency    int64     `json:"latency_ms"`
}
