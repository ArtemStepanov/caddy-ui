# Task 02: Backend Core

## Objective
Create the core backend components: Caddy API client, SQLite storage, and main server entry point.

## Prerequisites
- Task 01 completed (project structure exists)

## Steps

### 2.1 Create Caddy Client (`internal/caddy/client.go`)

A simplified version of the existing client, keeping only essential methods:

```go
package caddy

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type Client struct {
    adminURL   string
    httpClient *http.Client
}

func NewClient(adminURL string) *Client {
    return &Client{
        adminURL: adminURL,
        httpClient: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

// GetConfig retrieves the current Caddy configuration
func (c *Client) GetConfig(path string) (json.RawMessage, error) {
    resp, err := c.httpClient.Get(c.adminURL + "/config/" + path)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
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
        return err
    }
    
    req, err := http.NewRequest("POST", c.adminURL+"/config/"+path, bytes.NewReader(data))
    if err != nil {
        return err
    }
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        body, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("caddy returned status %d: %s", resp.StatusCode, string(body))
    }
    
    return nil
}

// LoadConfig loads an entire configuration
func (c *Client) LoadConfig(config any) error {
    data, err := json.Marshal(config)
    if err != nil {
        return err
    }
    
    req, err := http.NewRequest("POST", c.adminURL+"/load", bytes.NewReader(data))
    if err != nil {
        return err
    }
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return err
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
        return err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("caddy returned status %d", resp.StatusCode)
    }
    
    return nil
}
```

### 2.2 Create Storage Models (`internal/storage/models.go`)

```go
package storage

import (
    "encoding/json"
    "time"
)

// Route represents a single route configuration
type Route struct {
    ID          string          `json:"id"`
    Domain      string          `json:"domain"`
    Path        string          `json:"path,omitempty"`        // Optional path matcher
    HandlerType string          `json:"handler_type"`          // reverse_proxy, file_server, redir
    Config      json.RawMessage `json:"config"`                // Handler-specific config
    Enabled     bool            `json:"enabled"`
    CreatedAt   time.Time       `json:"created_at"`
    UpdatedAt   time.Time       `json:"updated_at"`
}

// Handler-specific config structs

type ReverseProxyConfig struct {
    Upstreams     []string          `json:"upstreams"`              // e.g., ["localhost:8080"]
    Headers       map[string]string `json:"headers,omitempty"`      // Headers to add/set
    WebSocket     bool              `json:"websocket,omitempty"`    // Enable WebSocket support
    LoadBalancing string            `json:"load_balancing,omitempty"` // round_robin, etc.
}

type FileServerConfig struct {
    Root   string `json:"root"`             // Root directory
    Browse bool   `json:"browse,omitempty"` // Enable directory listing
}

type RedirectConfig struct {
    To   string `json:"to"`             // Redirect destination
    Code int    `json:"code,omitempty"` // 301, 302, etc. (default 302)
}

type HeaderConfig struct {
    Set    map[string]string `json:"set,omitempty"`    // Headers to set
    Add    map[string]string `json:"add,omitempty"`    // Headers to add
    Delete []string          `json:"delete,omitempty"` // Headers to delete
}

type BasicAuthConfig struct {
    Users []BasicAuthUser `json:"users"`
    Realm string          `json:"realm,omitempty"`
}

type BasicAuthUser struct {
    Username string `json:"username"`
    Password string `json:"password"` // Will be hashed before storage
}

type EncodeConfig struct {
    Gzip bool `json:"gzip"`
    Zstd bool `json:"zstd"`
}

// GlobalConfig for settings that apply to all routes
type GlobalConfig struct {
    CaddyAdminURL string `json:"caddy_admin_url"`
    EnableEncode  bool   `json:"enable_encode"` // Global compression
}
```

### 2.3 Create SQLite Storage (`internal/storage/sqlite.go`)

```go
package storage

import (
    "database/sql"
    "encoding/json"
    "time"

    "github.com/google/uuid"
    _ "github.com/mattn/go-sqlite3"
)

type SQLiteStorage struct {
    db *sql.DB
}

func NewSQLiteStorage(path string) (*SQLiteStorage, error) {
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
    `)
    return err
}

// Route CRUD operations

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
        string(route.Config), route.Enabled, route.CreatedAt, route.UpdatedAt,
    )
    return err
}

func (s *SQLiteStorage) GetRoute(id string) (*Route, error) {
    row := s.db.QueryRow(
        `SELECT id, domain, path, handler_type, config, enabled, created_at, updated_at
         FROM routes WHERE id = ?`, id,
    )
    return s.scanRoute(row)
}

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

func (s *SQLiteStorage) UpdateRoute(route *Route) error {
    route.UpdatedAt = time.Now()
    _, err := s.db.Exec(
        `UPDATE routes SET domain=?, path=?, handler_type=?, config=?, enabled=?, updated_at=?
         WHERE id=?`,
        route.Domain, route.Path, route.HandlerType,
        string(route.Config), route.Enabled, route.UpdatedAt, route.ID,
    )
    return err
}

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

func (s *SQLiteStorage) Close() error {
    return s.db.Close()
}
```

### 2.4 Create Main Server Entry Point (`cmd/server/main.go`)

```go
package main

import (
    "log"
    "os"

    "github.com/gin-gonic/gin"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/api"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/caddy"
    "github.com/ArtemStepanov/caddy-orchestrator-lite/internal/storage"
)

func main() {
    // Get configuration from environment
    dbPath := getEnv("DB_PATH", "./data/routes.db")
    caddyURL := getEnv("CADDY_ADMIN_URL", "http://localhost:2019")
    listenAddr := getEnv("LISTEN_ADDR", ":3000")

    // Initialize storage
    store, err := storage.NewSQLiteStorage(dbPath)
    if err != nil {
        log.Fatalf("Failed to initialize storage: %v", err)
    }
    defer store.Close()

    // Initialize Caddy client
    caddyClient := caddy.NewClient(caddyURL)

    // Initialize Gin router
    r := gin.Default()

    // Setup API routes
    api.SetupRoutes(r, store, caddyClient)

    // Serve static files (frontend)
    r.Static("/assets", "./web/dist/assets")
    r.StaticFile("/", "./web/dist/index.html")
    r.NoRoute(func(c *gin.Context) {
        c.File("./web/dist/index.html")
    })

    log.Printf("Starting server on %s", listenAddr)
    if err := r.Run(listenAddr); err != nil {
        log.Fatalf("Failed to start server: %v", err)
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

## Verification
- [ ] `go build ./...` succeeds
- [ ] SQLite database creates correctly
- [ ] Caddy client can connect (if Caddy is running)

## Files Created
- `internal/caddy/client.go`
- `internal/storage/models.go`
- `internal/storage/sqlite.go`
- `cmd/server/main.go`

## Estimated Time
1-2 hours
