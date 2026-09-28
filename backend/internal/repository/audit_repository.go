package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type AuditRepository struct {
	db *sql.DB
}

func NewAuditRepository(db *sql.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

type AuditWriteInput struct {
	WorkspaceID string
	ActorUserID string
	EntityType  string
	EntityID    string
	EventType   string
	Changes     any
}

func (r *AuditRepository) Insert(ctx context.Context, input AuditWriteInput) error {
	return r.InsertTx(ctx, nil, input)
}

func (r *AuditRepository) InsertTx(ctx context.Context, tx *sql.Tx, input AuditWriteInput) error {
	var changesJSON []byte
	if input.Changes != nil {
		raw, err := json.Marshal(input.Changes)
		if err != nil {
			return err
		}
		changesJSON = raw
	}

	now := time.Now().UTC()
	var actor any
	if input.ActorUserID != "" {
		actor = input.ActorUserID
	}

	query := `
		INSERT INTO audit_logs (
			id, workspace_id, actor_user_id, entity_type, entity_id, event_type, changes_json, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	args := []any{
		uuid.New().String(),
		input.WorkspaceID,
		actor,
		input.EntityType,
		input.EntityID,
		input.EventType,
		changesJSON,
		now,
	}

	if tx != nil {
		_, err := tx.ExecContext(ctx, query, args...)
		return err
	}
	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}
