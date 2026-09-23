package model

import "time"

type BatchStatus string

const (
	BatchActive    BatchStatus = "ACTIVE"
	BatchCompleted BatchStatus = "COMPLETED"
)

type Batch struct {
	ID             string      `json:"id"`
	WorkspaceID    string      `json:"workspaceId"`
	BusinessUnitID *string     `json:"businessUnitId,omitempty"`
	Name           string      `json:"name"`
	StartDate      *time.Time  `json:"startDate,omitempty"`
	EndDate        *time.Time  `json:"endDate,omitempty"`
	Status         BatchStatus `json:"status"`
	Notes          *string     `json:"notes,omitempty"`
	CreatedAt      time.Time   `json:"createdAt"`
}
