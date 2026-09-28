package model

import "time"

const (
	AuditEventCreate = "CREATE"
	AuditEventUpdate = "UPDATE"
	AuditEventDelete = "DELETE"

	AuditEntityTransaction = "transaction"
)

type AuditLog struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	ActorUserID *string   `json:"actorUserId,omitempty"`
	EntityType  string    `json:"entityType"`
	EntityID    string    `json:"entityId"`
	EventType   string    `json:"eventType"`
	ChangesJSON []byte    `json:"changesJson,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}
