package models

// CaddyInstance represents a Caddy instance
type CaddyInstance struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	URL    string `json:"url"`
	Status string `json:"status"`
}
