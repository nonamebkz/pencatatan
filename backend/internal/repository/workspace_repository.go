package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kikichan/pencatatan/backend/internal/model"
)

type WorkspaceRepository struct {
	db *sql.DB
}

func NewWorkspaceRepository(db *sql.DB) *WorkspaceRepository {
	return &WorkspaceRepository{db: db}
}

func scanWorkspace(row interface {
	Scan(dest ...any) error
}) (*model.Workspace, error) {
	var item model.Workspace
	var wsType string
	if err := row.Scan(&item.ID, &item.Name, &wsType, &item.TemplateID, &item.CreatedAt, &item.UpdatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	item.Type = model.WorkspaceType(wsType)
	return &item, nil
}

func (r *WorkspaceRepository) List(ctx context.Context) ([]model.Workspace, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, type, template_id, created_at, updated_at
		FROM workspaces
		ORDER BY type ASC, name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.Workspace, 0)
	for rows.Next() {
		ws, err := scanWorkspace(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *ws)
	}
	return items, rows.Err()
}

func (r *WorkspaceRepository) Create(ctx context.Context, ws *model.Workspace) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO workspaces (id, name, type, template_id, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		ws.ID, ws.Name, string(ws.Type), ws.TemplateID, ws.CreatedAt, ws.UpdatedAt,
	)
	return err
}

func (r *WorkspaceRepository) UpdateName(ctx context.Context, id, name string) (*model.Workspace, error) {
	result, err := r.db.ExecContext(ctx, `
		UPDATE workspaces SET name = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`, name, id)
	if err != nil {
		return nil, err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return nil, nil
	}
	return r.GetByID(ctx, id)
}

func (r *WorkspaceRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM workspaces WHERE id = ?`, id)
	if err != nil {
		return err
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *WorkspaceRepository) CountByType(ctx context.Context, wsType model.WorkspaceType) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM workspaces WHERE type = ?`, string(wsType)).Scan(&count)
	return count, err
}

func (r *WorkspaceRepository) AddUserMembership(ctx context.Context, userID, workspaceID string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO user_workspaces (user_id, workspace_id, created_at)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE user_id = user_id`,
		userID, workspaceID, time.Now(),
	)
	return err
}

func (r *WorkspaceRepository) GetByID(ctx context.Context, id string) (*model.Workspace, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, type, template_id, created_at, updated_at
		FROM workspaces
		WHERE id = ?`, id)
	return scanWorkspace(row)
}

func (r *WorkspaceRepository) ListForUser(ctx context.Context, userID string) ([]model.Workspace, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT w.id, w.name, w.type, w.template_id, w.created_at, w.updated_at
		FROM workspaces w
		INNER JOIN user_workspaces uw ON uw.workspace_id = w.id
		WHERE uw.user_id = ?
		ORDER BY w.type ASC, w.name ASC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.Workspace, 0)
	for rows.Next() {
		ws, err := scanWorkspace(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *ws)
	}
	return items, rows.Err()
}

func (r *WorkspaceRepository) ListIDsForUser(ctx context.Context, userID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT workspace_id FROM user_workspaces WHERE user_id = ? ORDER BY workspace_id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *WorkspaceRepository) HasMembership(ctx context.Context, userID, workspaceID string) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM user_workspaces WHERE user_id = ? AND workspace_id = ?`,
		userID, workspaceID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *WorkspaceRepository) ListAllIDs(ctx context.Context) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT id FROM workspaces ORDER BY type ASC, name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *WorkspaceRepository) ListBusinessIDs(ctx context.Context) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id FROM workspaces WHERE type = 'BUSINESS' ORDER BY name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *WorkspaceRepository) ValidateWorkspaceIDs(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return fmt.Errorf("minimal satu workspace wajib dipilih")
	}
	placeholders := make([]string, len(ids))
	args := make([]any, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}
	query := fmt.Sprintf(`SELECT COUNT(*) FROM workspaces WHERE id IN (%s)`, strings.Join(placeholders, ","))
	var count int
	if err := r.db.QueryRowContext(ctx, query, args...).Scan(&count); err != nil {
		return err
	}
	if count != len(ids) {
		return fmt.Errorf("satu atau lebih workspace tidak ditemukan")
	}
	return nil
}

func (r *WorkspaceRepository) SetUserWorkspaces(ctx context.Context, userID string, workspaceIDs []string) error {
	if err := r.ValidateWorkspaceIDs(ctx, workspaceIDs); err != nil {
		return err
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM user_workspaces WHERE user_id = ?`, userID); err != nil {
		return err
	}
	for _, wsID := range workspaceIDs {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO user_workspaces (user_id, workspace_id) VALUES (?, ?)`, userID, wsID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *WorkspaceRepository) DefaultWorkspaceIDForUser(ctx context.Context, userID string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx, `
		SELECT w.id FROM workspaces w
		INNER JOIN user_workspaces uw ON uw.workspace_id = w.id
		WHERE uw.user_id = ? AND w.type = 'BUSINESS'
		ORDER BY w.name ASC
		LIMIT 1`, userID).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		err = r.db.QueryRowContext(ctx, `
			SELECT w.id FROM workspaces w
			INNER JOIN user_workspaces uw ON uw.workspace_id = w.id
			WHERE uw.user_id = ?
			ORDER BY w.type ASC, w.name ASC
			LIMIT 1`, userID).Scan(&id)
	}
	if errors.Is(err, sql.ErrNoRows) {
		return model.DefaultWorkspaceID, nil
	}
	return id, err
}
