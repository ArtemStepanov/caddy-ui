package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// SQLiteStorage implements storage using SQLite
type SQLiteStorage struct {
	db *sql.DB
}

// NewSQLiteStorage creates a new SQLite storage instance
func NewSQLiteStorage(dbPath string) (*SQLiteStorage, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	storage := &SQLiteStorage{db: db}

	if err := storage.migrate(); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	return storage, nil
}

// migrate creates the database schema
func (s *SQLiteStorage) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS caddy_instances (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		admin_url TEXT NOT NULL,
		auth_type TEXT NOT NULL DEFAULT 'none',
		credentials TEXT,
		status TEXT NOT NULL DEFAULT 'unknown',
		last_seen DATETIME,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_instances_status ON caddy_instances(status);
	CREATE INDEX IF NOT EXISTS idx_instances_name ON caddy_instances(name);

	CREATE TABLE IF NOT EXISTS config_templates (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT,
		category TEXT NOT NULL,
		template TEXT NOT NULL,
		variables TEXT NOT NULL,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_templates_category ON config_templates(category);

	CREATE TABLE IF NOT EXISTS audit_logs (
		id TEXT PRIMARY KEY,
		timestamp DATETIME NOT NULL,
		user_id TEXT NOT NULL,
		instance_id TEXT,
		action TEXT NOT NULL,
		changes TEXT,
		status TEXT NOT NULL,
		error TEXT
	);

	CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON audit_logs(timestamp);
	CREATE INDEX IF NOT EXISTS idx_logs_instance ON audit_logs(instance_id);
	CREATE INDEX IF NOT EXISTS idx_logs_user ON audit_logs(user_id);

	CREATE TABLE IF NOT EXISTS config_backups (
		id TEXT PRIMARY KEY,
		instance_id TEXT NOT NULL,
		config TEXT NOT NULL,
		etag TEXT NOT NULL,
		created_at DATETIME NOT NULL,
		created_by TEXT NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_backups_instance ON config_backups(instance_id);
	CREATE INDEX IF NOT EXISTS idx_backups_created ON config_backups(created_at);
	`

	_, err := s.db.Exec(schema)
	return err
}

// Close closes the database connection
func (s *SQLiteStorage) Close() error {
	return s.db.Close()
}

// CreateInstance creates a new Caddy instance
func (s *SQLiteStorage) CreateInstance(instance *CaddyInstance) error {
	credentialsJSON, err := json.Marshal(instance.Credentials)
	if err != nil {
		return fmt.Errorf("failed to marshal credentials: %w", err)
	}

	now := time.Now()
	instance.CreatedAt = now
	instance.UpdatedAt = now

	query := `
		INSERT INTO caddy_instances (id, name, admin_url, auth_type, credentials, status, last_seen, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = s.db.Exec(query,
		instance.ID,
		instance.Name,
		instance.AdminURL,
		instance.AuthType,
		string(credentialsJSON),
		instance.Status,
		instance.LastSeen,
		instance.CreatedAt,
		instance.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create instance: %w", err)
	}

	return nil
}

// GetInstance retrieves a Caddy instance by ID
func (s *SQLiteStorage) GetInstance(id string) (*CaddyInstance, error) {
	query := `
		SELECT id, name, admin_url, auth_type, credentials, status, last_seen, created_at, updated_at
		FROM caddy_instances
		WHERE id = ?
	`

	var instance CaddyInstance
	var credentialsJSON string
	var lastSeen sql.NullTime

	err := s.db.QueryRow(query, id).Scan(
		&instance.ID,
		&instance.Name,
		&instance.AdminURL,
		&instance.AuthType,
		&credentialsJSON,
		&instance.Status,
		&lastSeen,
		&instance.CreatedAt,
		&instance.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("instance not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get instance: %w", err)
	}

	if lastSeen.Valid {
		instance.LastSeen = lastSeen.Time
	}

	if credentialsJSON != "" {
		if err := json.Unmarshal([]byte(credentialsJSON), &instance.Credentials); err != nil {
			return nil, fmt.Errorf("failed to unmarshal credentials: %w", err)
		}
	}

	return &instance, nil
}

// ListInstances retrieves all Caddy instances
func (s *SQLiteStorage) ListInstances() ([]*CaddyInstance, error) {
	query := `
		SELECT id, name, admin_url, auth_type, credentials, status, last_seen, created_at, updated_at
		FROM caddy_instances
		ORDER BY name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list instances: %w", err)
	}
	defer rows.Close()

	var instances []*CaddyInstance

	for rows.Next() {
		var instance CaddyInstance
		var credentialsJSON string
		var lastSeen sql.NullTime

		err := rows.Scan(
			&instance.ID,
			&instance.Name,
			&instance.AdminURL,
			&instance.AuthType,
			&credentialsJSON,
			&instance.Status,
			&lastSeen,
			&instance.CreatedAt,
			&instance.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan instance: %w", err)
		}

		if lastSeen.Valid {
			instance.LastSeen = lastSeen.Time
		}

		if credentialsJSON != "" {
			if err := json.Unmarshal([]byte(credentialsJSON), &instance.Credentials); err != nil {
				return nil, fmt.Errorf("failed to unmarshal credentials: %w", err)
			}
		}

		instances = append(instances, &instance)
	}

	return instances, nil
}

// UpdateInstance updates a Caddy instance
func (s *SQLiteStorage) UpdateInstance(instance *CaddyInstance) error {
	credentialsJSON, err := json.Marshal(instance.Credentials)
	if err != nil {
		return fmt.Errorf("failed to marshal credentials: %w", err)
	}

	instance.UpdatedAt = time.Now()

	query := `
		UPDATE caddy_instances
		SET name = ?, admin_url = ?, auth_type = ?, credentials = ?, status = ?, last_seen = ?, updated_at = ?
		WHERE id = ?
	`

	result, err := s.db.Exec(query,
		instance.Name,
		instance.AdminURL,
		instance.AuthType,
		string(credentialsJSON),
		instance.Status,
		instance.LastSeen,
		instance.UpdatedAt,
		instance.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update instance: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("instance not found")
	}

	return nil
}

// DeleteInstance deletes a Caddy instance
func (s *SQLiteStorage) DeleteInstance(id string) error {
	query := `DELETE FROM caddy_instances WHERE id = ?`

	result, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete instance: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("instance not found")
	}

	return nil
}

// CreateTemplate creates a new configuration template
func (s *SQLiteStorage) CreateTemplate(template *ConfigTemplate) error {
	templateJSON, err := json.Marshal(template.Template)
	if err != nil {
		return fmt.Errorf("failed to marshal template: %w", err)
	}

	variablesJSON, err := json.Marshal(template.Variables)
	if err != nil {
		return fmt.Errorf("failed to marshal variables: %w", err)
	}

	now := time.Now()
	template.CreatedAt = now
	template.UpdatedAt = now

	query := `
		INSERT INTO config_templates (id, name, description, category, template, variables, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = s.db.Exec(query,
		template.ID,
		template.Name,
		template.Description,
		template.Category,
		string(templateJSON),
		string(variablesJSON),
		template.CreatedAt,
		template.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create template: %w", err)
	}

	return nil
}

// GetTemplate retrieves a configuration template by ID
func (s *SQLiteStorage) GetTemplate(id string) (*ConfigTemplate, error) {
	query := `
		SELECT id, name, description, category, template, variables, created_at, updated_at
		FROM config_templates
		WHERE id = ?
	`

	var template ConfigTemplate
	var templateJSON, variablesJSON string

	err := s.db.QueryRow(query, id).Scan(
		&template.ID,
		&template.Name,
		&template.Description,
		&template.Category,
		&templateJSON,
		&variablesJSON,
		&template.CreatedAt,
		&template.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("template not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get template: %w", err)
	}

	if err := json.Unmarshal([]byte(templateJSON), &template.Template); err != nil {
		return nil, fmt.Errorf("failed to unmarshal template: %w", err)
	}

	if err := json.Unmarshal([]byte(variablesJSON), &template.Variables); err != nil {
		return nil, fmt.Errorf("failed to unmarshal variables: %w", err)
	}

	return &template, nil
}

// ListTemplates retrieves all configuration templates
func (s *SQLiteStorage) ListTemplates() ([]*ConfigTemplate, error) {
	query := `
		SELECT id, name, description, category, template, variables, created_at, updated_at
		FROM config_templates
		ORDER BY category, name
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to list templates: %w", err)
	}
	defer rows.Close()

	var templates []*ConfigTemplate

	for rows.Next() {
		var template ConfigTemplate
		var templateJSON, variablesJSON string

		err := rows.Scan(
			&template.ID,
			&template.Name,
			&template.Description,
			&template.Category,
			&templateJSON,
			&variablesJSON,
			&template.CreatedAt,
			&template.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan template: %w", err)
		}

		if err := json.Unmarshal([]byte(templateJSON), &template.Template); err != nil {
			return nil, fmt.Errorf("failed to unmarshal template: %w", err)
		}

		if err := json.Unmarshal([]byte(variablesJSON), &template.Variables); err != nil {
			return nil, fmt.Errorf("failed to unmarshal variables: %w", err)
		}

		templates = append(templates, &template)
	}

	return templates, nil
}

// CreateAuditLog creates a new audit log entry
func (s *SQLiteStorage) CreateAuditLog(log *AuditLog) error {
	changesJSON, err := json.Marshal(log.Changes)
	if err != nil {
		return fmt.Errorf("failed to marshal changes: %w", err)
	}

	query := `
		INSERT INTO audit_logs (id, timestamp, user_id, instance_id, action, changes, status, error)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = s.db.Exec(query,
		log.ID,
		log.Timestamp,
		log.UserID,
		log.InstanceID,
		log.Action,
		string(changesJSON),
		log.Status,
		log.Error,
	)

	if err != nil {
		return fmt.Errorf("failed to create audit log: %w", err)
	}

	return nil
}

// ListAuditLogs retrieves audit logs with optional filtering
func (s *SQLiteStorage) ListAuditLogs(instanceID string, limit int) ([]*AuditLog, error) {
	query := `
		SELECT id, timestamp, user_id, instance_id, action, changes, status, error
		FROM audit_logs
		WHERE (? = '' OR instance_id = ?)
		ORDER BY timestamp DESC
		LIMIT ?
	`

	rows, err := s.db.Query(query, instanceID, instanceID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list audit logs: %w", err)
	}
	defer rows.Close()

	var logs []*AuditLog

	for rows.Next() {
		var log AuditLog
		var changesJSON string
		var instanceIDNull sql.NullString
		var errorNull sql.NullString

		err := rows.Scan(
			&log.ID,
			&log.Timestamp,
			&log.UserID,
			&instanceIDNull,
			&log.Action,
			&changesJSON,
			&log.Status,
			&errorNull,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan audit log: %w", err)
		}

		if instanceIDNull.Valid {
			log.InstanceID = instanceIDNull.String
		}

		if errorNull.Valid {
			log.Error = errorNull.String
		}

		if changesJSON != "" {
			if err := json.Unmarshal([]byte(changesJSON), &log.Changes); err != nil {
				return nil, fmt.Errorf("failed to unmarshal changes: %w", err)
			}
		}

		logs = append(logs, &log)
	}

	return logs, nil
}

// CreateConfigBackup creates a configuration backup
func (s *SQLiteStorage) CreateConfigBackup(backup *ConfigBackup) error {
	configJSON, err := json.Marshal(backup.Config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	backup.CreatedAt = time.Now()

	query := `
		INSERT INTO config_backups (id, instance_id, config, etag, created_at, created_by)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	_, err = s.db.Exec(query,
		backup.ID,
		backup.InstanceID,
		string(configJSON),
		backup.ETag,
		backup.CreatedAt,
		backup.CreatedBy,
	)

	if err != nil {
		return fmt.Errorf("failed to create config backup: %w", err)
	}

	return nil
}

// GetConfigBackups retrieves backups for an instance
func (s *SQLiteStorage) GetConfigBackups(instanceID string, limit int) ([]*ConfigBackup, error) {
	query := `
		SELECT id, instance_id, config, etag, created_at, created_by
		FROM config_backups
		WHERE instance_id = ?
		ORDER BY created_at DESC
		LIMIT ?
	`

	rows, err := s.db.Query(query, instanceID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list config backups: %w", err)
	}
	defer rows.Close()

	var backups []*ConfigBackup

	for rows.Next() {
		var backup ConfigBackup
		var configJSON string

		err := rows.Scan(
			&backup.ID,
			&backup.InstanceID,
			&configJSON,
			&backup.ETag,
			&backup.CreatedAt,
			&backup.CreatedBy,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan config backup: %w", err)
		}

		if err := json.Unmarshal([]byte(configJSON), &backup.Config); err != nil {
			return nil, fmt.Errorf("failed to unmarshal config: %w", err)
		}

		backups = append(backups, &backup)
	}

	return backups, nil
}
