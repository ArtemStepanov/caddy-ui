package models

import (
	"time"

	"github.com/google/uuid"
)

// EditHistory represents a change made to a Caddyfile or configuration
type EditHistory struct {
	ID         uuid.UUID `json:"id"`          // Unique ID for the edit
	Timestamp  time.Time `json:"timestamp"`   // When the edit was made
	OldConfig  string    `json:"old_config"`  // The previous configuration
	NewConfig  string    `json:"new_config"`  // The new configuration
	EditedBy   string    `json:"edited_by"`   // User or service that made the change
	InstanceID string    `json:"instance_id"` // Which Caddy instance the edit relates to
}
