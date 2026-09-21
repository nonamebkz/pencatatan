package model

import "time"

const DefaultWorkspaceID = "00000000-0000-4000-8000-000000000001"

type BusinessUnitStatus string

const (
	BusinessUnitActive   BusinessUnitStatus = "ACTIVE"
	BusinessUnitInactive BusinessUnitStatus = "INACTIVE"
)

type BusinessUnit struct {
	ID          string             `json:"id"`
	WorkspaceID string             `json:"workspaceId"`
	UnitType    string             `json:"unitType"`
	Name        string             `json:"name"`
	Location    *string            `json:"location,omitempty"`
	Size        *string            `json:"size,omitempty"`
	OwnerName   *string            `json:"ownerName,omitempty"`
	Status      BusinessUnitStatus `json:"status"`
	Notes       *string            `json:"notes,omitempty"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
}

type WaterQualityStatus string

const (
	StatusNormal  WaterQualityStatus = "NORMAL"
	StatusWarning WaterQualityStatus = "WARNING"
	StatusDanger  WaterQualityStatus = "DANGER"
)

type WaterQualityLog struct {
	ID              string             `json:"id"`
	WorkspaceID     string             `json:"workspaceId"`
	BusinessUnitID  string             `json:"businessUnitId"`
	BusinessUnitName string            `json:"businessUnitName,omitempty"`
	BatchID         *string            `json:"batchId,omitempty"`
	MeasuredAt      time.Time          `json:"measuredAt"`
	AmmoniaPPM      *float64           `json:"ammoniaPpm,omitempty"`
	PH              *float64           `json:"ph,omitempty"`
	Notes           *string            `json:"notes,omitempty"`
	Status          WaterQualityStatus `json:"status"`
	CreatedAt       time.Time          `json:"createdAt"`
	UpdatedAt       time.Time          `json:"updatedAt"`
}

type WaterQualityTrendPoint struct {
	MeasuredAt time.Time `json:"measuredAt"`
	AmmoniaPPM *float64  `json:"ammoniaPpm,omitempty"`
	PH         *float64  `json:"ph,omitempty"`
	Status     WaterQualityStatus `json:"status"`
}

type WaterQualitySummary struct {
	BusinessUnitID   string             `json:"businessUnitId"`
	BusinessUnitName string             `json:"businessUnitName"`
	LastMeasuredAt   *time.Time         `json:"lastMeasuredAt,omitempty"`
	AmmoniaPPM       *float64           `json:"ammoniaPpm,omitempty"`
	PH               *float64           `json:"ph,omitempty"`
	Status           WaterQualityStatus `json:"status"`
	NotMeasuredToday bool               `json:"notMeasuredToday"`
}
