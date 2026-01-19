package storage

import (
	"encoding/json"
	"time"
)

// Route represents a single route configuration
type Route struct {
	ID          string          `json:"id"`
	Domain      string          `json:"domain"`
	Path        string          `json:"path,omitempty"`
	HandlerType string          `json:"handler_type"`
	Config      json.RawMessage `json:"config"`
	Headers     *HeaderConfig   `json:"headers,omitempty"`
	Enabled     bool            `json:"enabled"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// Handler-specific config structs

// ReverseProxyConfig for reverse_proxy handler
type ReverseProxyConfig struct {
	Upstreams     []string          `json:"upstreams"`
	Headers       map[string]string `json:"headers,omitempty"`
	WebSocket     bool              `json:"websocket,omitempty"`
	LoadBalancing string            `json:"load_balancing,omitempty"`
}

// FileServerConfig for file_server handler
type FileServerConfig struct {
	Root          string   `json:"root"`
	Browse        bool     `json:"browse,omitempty"`
	Index         []string `json:"index,omitempty"`
	Hide          []string `json:"hide,omitempty"`
	Precompressed bool     `json:"precompressed,omitempty"`
}

// RedirectConfig for redir handler
type RedirectConfig struct {
	To   string `json:"to"`
	Code int    `json:"code,omitempty"`
}

// HeaderConfig for header manipulation
type HeaderConfig struct {
	Set    map[string]string `json:"set,omitempty"`
	Add    map[string]string `json:"add,omitempty"`
	Delete []string          `json:"delete,omitempty"`
}

// BasicAuthConfig for basic_auth protection
type BasicAuthConfig struct {
	Enabled bool            `json:"enabled"`
	Users   []BasicAuthUser `json:"users"`
	Realm   string          `json:"realm,omitempty"`
}

// BasicAuthUser represents a user for basic auth
type BasicAuthUser struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// GlobalConfig for settings that apply to all routes
type GlobalConfig struct {
	CaddyAdminURL string `json:"caddy_admin_url"`
	EnableEncode  bool   `json:"enable_encode"`
}
