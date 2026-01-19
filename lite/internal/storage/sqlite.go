package storage

import (
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
)

// SQLiteStorage implements storage using SQLite
type SQLiteStorage struct {
	db *sql.DB
}

// NewSQLiteStorage creates a new SQLite storage
func NewSQLiteStorage(path string) (*SQLiteStorage, error) {
	// Ensure directory exists
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	s := &SQLiteStorage{db: db}
	if err := s.migrate(); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *SQLiteStorage) migrate() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS routes (
			id TEXT PRIMARY KEY,
			domain TEXT NOT NULL,
			path TEXT DEFAULT '',
			handler_type TEXT NOT NULL,
			config TEXT NOT NULL,
			enabled INTEGER DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS global_config (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_routes_domain ON routes(domain);
		CREATE INDEX IF NOT EXISTS idx_routes_enabled ON routes(enabled);
	`)
	return err
}

// Route CRUD operations

// CreateRoute creates a new route
func (s *SQLiteStorage) CreateRoute(route *Route) error {
	if route.ID == "" {
		route.ID = uuid.New().String()
	}
	route.CreatedAt = time.Now()
	route.UpdatedAt = time.Now()

	_, err := s.db.Exec(
		`INSERT INTO routes (id, domain, path, handler_type, config, enabled, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		route.ID, route.Domain, route.Path, route.HandlerType,
		string(route.Config), boolToInt(route.Enabled), route.CreatedAt, route.UpdatedAt,
	)
	return err
}

// GetRoute retrieves a route by ID
func (s *SQLiteStorage) GetRoute(id string) (*Route, error) {
	row := s.db.QueryRow(
		`SELECT id, domain, path, handler_type, config, enabled, created_at, updated_at
		 FROM routes WHERE id = ?`, id,
	)
	return s.scanRoute(row)
}

// ListRoutes returns all routes
func (s *SQLiteStorage) ListRoutes() ([]*Route, error) {
	rows, err := s.db.Query(
		`SELECT id, domain, path, handler_type, config, enabled, created_at, updated_at
		 FROM routes ORDER BY domain, path`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var routes []*Route
	for rows.Next() {
		route, err := s.scanRouteRows(rows)
		if err != nil {
			return nil, err
		}
		routes = append(routes, route)
	}
	return routes, nil
}

// UpdateRoute updates an existing route
func (s *SQLiteStorage) UpdateRoute(route *Route) error {
	route.UpdatedAt = time.Now()
	_, err := s.db.Exec(
		`UPDATE routes SET domain=?, path=?, handler_type=?, config=?, enabled=?, updated_at=?
		 WHERE id=?`,
		route.Domain, route.Path, route.HandlerType,
		string(route.Config), boolToInt(route.Enabled), route.UpdatedAt, route.ID,
	)
	return err
}

// DeleteRoute deletes a route
func (s *SQLiteStorage) DeleteRoute(id string) error {
	_, err := s.db.Exec(`DELETE FROM routes WHERE id=?`, id)
	return err
}

func (s *SQLiteStorage) scanRoute(row *sql.Row) (*Route, error) {
	var route Route
	var config string
	var enabled int
	err := row.Scan(
		&route.ID, &route.Domain, &route.Path, &route.HandlerType,
		&config, &enabled, &route.CreatedAt, &route.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	route.Config = json.RawMessage(config)
	route.Enabled = enabled == 1
	return &route, nil
}

func (s *SQLiteStorage) scanRouteRows(rows *sql.Rows) (*Route, error) {
	var route Route
	var config string
	var enabled int
	err := rows.Scan(
		&route.ID, &route.Domain, &route.Path, &route.HandlerType,
		&config, &enabled, &route.CreatedAt, &route.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	route.Config = json.RawMessage(config)
	route.Enabled = enabled == 1
	return &route, nil
}

// Global config

// GetGlobalConfig retrieves the global configuration
func (s *SQLiteStorage) GetGlobalConfig() (*GlobalConfig, error) {
	row := s.db.QueryRow(`SELECT value FROM global_config WHERE key = 'main'`)
	var value string
	err := row.Scan(&value)
	if err == sql.ErrNoRows {
		// Return defaults
		return &GlobalConfig{
			CaddyAdminURL: "http://localhost:2019",
			EnableEncode:  true,
		}, nil
	}
	if err != nil {
		return nil, err
	}

	var config GlobalConfig
	if err := json.Unmarshal([]byte(value), &config); err != nil {
		return nil, err
	}
	return &config, nil
}

// SetGlobalConfig saves the global configuration
func (s *SQLiteStorage) SetGlobalConfig(config *GlobalConfig) error {
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(
		`INSERT OR REPLACE INTO global_config (key, value) VALUES ('main', ?)`,
		string(data),
	)
	return err
}

// Close closes the database connection
func (s *SQLiteStorage) Close() error {
	return s.db.Close()
}

func boolToInt(b bool) int {
	if b {
		return 1
	}
	return 0
}
