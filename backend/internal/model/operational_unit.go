package model

import "time"

type OperationalUnitStatus string

const (
	OperationalUnitActive   OperationalUnitStatus = "ACTIVE"
	OperationalUnitInactive OperationalUnitStatus = "INACTIVE"
)

type OperationalUnit struct {
	ID          string                `json:"id"`
	WorkspaceID string                `json:"workspaceId"`
	Name        string                `json:"name"`
	Location    *string               `json:"location,omitempty"`
	Notes       *string               `json:"notes,omitempty"`
	Status      OperationalUnitStatus `json:"status"`
	CreatedAt   time.Time             `json:"createdAt"`
	UpdatedAt   time.Time             `json:"updatedAt"`
}
