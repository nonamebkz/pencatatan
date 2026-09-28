package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/kikichan/pencatatan/backend/internal/model"
)

type OperationalUnitRepository struct {
	db *sql.DB
}

func NewOperationalUnitRepository(db *sql.DB) *OperationalUnitRepository {
	return &OperationalUnitRepository{db: db}
}

func (r *OperationalUnitRepository) List(ctx context.Context, workspaceID, status string) ([]model.OperationalUnit, error) {
	query := `
		SELECT id, workspace_id, name, location, notes, status, created_at, updated_at
		FROM operational_units
		WHERE workspace_id = ?`
	args := []any{workspaceID}
	if s := strings.TrimSpace(status); s != "" {
		query += ` AND status = ?`
		args = append(args, s)
	}
	query += ` ORDER BY name ASC`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.OperationalUnit, 0)
	for rows.Next() {
		item, err := scanOperationalUnit(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *OperationalUnitRepository) GetByID(ctx context.Context, workspaceID, id string) (*model.OperationalUnit, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, workspace_id, name, location, notes, status, created_at, updated_at
		FROM operational_units
		WHERE workspace_id = ? AND id = ?`, workspaceID, id)
	item, err := scanOperationalUnitRow(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return item, err
}

func (r *OperationalUnitRepository) Create(ctx context.Context, unit *model.OperationalUnit) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO operational_units (id, workspace_id, name, location, notes, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		unit.ID, unit.WorkspaceID, unit.Name, unit.Location, unit.Notes, unit.Status, unit.CreatedAt, unit.UpdatedAt,
	)
	return err
}

func (r *OperationalUnitRepository) Update(ctx context.Context, unit *model.OperationalUnit) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE operational_units
		SET name = ?, location = ?, notes = ?, status = ?, updated_at = ?
		WHERE id = ? AND workspace_id = ?`,
		unit.Name, unit.Location, unit.Notes, unit.Status, unit.UpdatedAt, unit.ID, unit.WorkspaceID,
	)
	if err != nil {
		return err
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *OperationalUnitRepository) Delete(ctx context.Context, workspaceID, id string) error {
	result, err := r.db.ExecContext(ctx, `
		DELETE FROM operational_units WHERE id = ? AND workspace_id = ?`, id, workspaceID)
	if err != nil {
		return err
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func scanOperationalUnit(rows *sql.Rows) (model.OperationalUnit, error) {
	var item model.OperationalUnit
	var location, notes sql.NullString
	var status string
	err := rows.Scan(&item.ID, &item.WorkspaceID, &item.Name, &location, &notes, &status, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		return item, err
	}
	if location.Valid {
		item.Location = &location.String
	}
	if notes.Valid {
		item.Notes = &notes.String
	}
	item.Status = model.OperationalUnitStatus(status)
	return item, nil
}

func scanOperationalUnitRow(row *sql.Row) (*model.OperationalUnit, error) {
	var item model.OperationalUnit
	var location, notes sql.NullString
	var status string
	err := row.Scan(&item.ID, &item.WorkspaceID, &item.Name, &location, &notes, &status, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if location.Valid {
		item.Location = &location.String
	}
	if notes.Valid {
		item.Notes = &notes.String
	}
	item.Status = model.OperationalUnitStatus(status)
	return &item, nil
}
