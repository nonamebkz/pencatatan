package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/model"
)

type RBACRepository struct {
	db *sql.DB
}

func NewRBACRepository(db *sql.DB) *RBACRepository {
	return &RBACRepository{db: db}
}

func (r *RBACRepository) CountPermissions(ctx context.Context) (int, error) {
	var n int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM permissions`).Scan(&n)
	return n, err
}

func (r *RBACRepository) InsertPermission(ctx context.Context, p *model.Permission) error {
	now := time.Now()
	if p.ID == "" {
		p.ID = uuid.NewString()
	}
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO permissions (id, name, code, resource, action, description, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		p.ID, p.Name, p.Code, p.Resource, p.Action, nullString(p.Description), now, now,
	)
	return err
}

// UpsertPermissionMeta insert atau perbarui metadata permission dari access catalog (by code).
func (r *RBACRepository) UpsertPermissionMeta(ctx context.Context, p *model.Permission) error {
	existingID, err := r.GetPermissionIDByCode(ctx, p.Code)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return err
		}
		return r.InsertPermission(ctx, p)
	}
	now := time.Now()
	_, err = r.db.ExecContext(ctx, `
		UPDATE permissions SET name = ?, resource = ?, action = ?, description = ?, updated_at = ?
		WHERE id = ?`,
		p.Name, p.Resource, p.Action, nullString(p.Description), now, existingID,
	)
	return err
}

func (r *RBACRepository) InsertRole(ctx context.Context, role *model.Role) error {
	now := time.Now()
	if role.ID == "" {
		role.ID = uuid.NewString()
	}
	isSystem := 0
	if role.IsSystem {
		isSystem = 1
	}
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO roles (id, name, code, description, is_system, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		role.ID, role.Name, role.Code, nullString(role.Description), isSystem, now, now,
	)
	return err
}

func (r *RBACRepository) AssignPermissionToRole(ctx context.Context, roleID, permissionID string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT IGNORE INTO role_permissions (id, role_id, permission_id, created_at)
		VALUES (?, ?, ?, ?)`,
		uuid.NewString(), roleID, permissionID, time.Now(),
	)
	return err
}

func (r *RBACRepository) SetUserRoles(ctx context.Context, userID string, roleIDs []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM user_roles WHERE user_id = ?`, userID); err != nil {
		return err
	}
	now := time.Now()
	for _, roleID := range roleIDs {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO user_roles (id, user_id, role_id, created_at)
			VALUES (?, ?, ?, ?)`, uuid.NewString(), userID, roleID, now); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *RBACRepository) ListUserRoleIDs(ctx context.Context, userID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT role_id FROM user_roles WHERE user_id = ? ORDER BY created_at`, userID)
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

func (r *RBACRepository) AssignRoleToUser(ctx context.Context, userID, roleID string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT IGNORE INTO user_roles (id, user_id, role_id, created_at)
		VALUES (?, ?, ?, ?)`,
		uuid.NewString(), userID, roleID, time.Now(),
	)
	return err
}

func (r *RBACRepository) ClearUserRoles(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM user_roles WHERE user_id = ?`, userID)
	return err
}

func (r *RBACRepository) GetRoleIDByCode(ctx context.Context, code string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx, `SELECT id FROM roles WHERE code = ?`, code).Scan(&id)
	return id, err
}

func (r *RBACRepository) GetPermissionIDByCode(ctx context.Context, code string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx, `SELECT id FROM permissions WHERE code = ?`, code).Scan(&id)
	return id, err
}

func (r *RBACRepository) EffectivePermissionCodes(ctx context.Context, userID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT DISTINCT p.code
		FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		INNER JOIN user_roles ur ON ur.role_id = rp.role_id
		WHERE ur.user_id = ?
		ORDER BY p.code`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	codes := make([]string, 0)
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, err
		}
		codes = append(codes, code)
	}
	return codes, rows.Err()
}

func (r *RBACRepository) ListRoleSummariesForUser(ctx context.Context, userID string) ([]model.RoleSummary, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT r.id, r.code, r.name
		FROM roles r
		INNER JOIN user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = ?
		ORDER BY r.name`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.RoleSummary, 0)
	for rows.Next() {
		var item model.RoleSummary
		if err := rows.Scan(&item.ID, &item.Code, &item.Name); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *RBACRepository) ListRoles(ctx context.Context) ([]model.Role, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, code, COALESCE(description,''), is_system
		FROM roles ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.Role, 0)
	for rows.Next() {
		var item model.Role
		var isSystem int
		if err := rows.Scan(&item.ID, &item.Name, &item.Code, &item.Description, &isSystem); err != nil {
			return nil, err
		}
		item.IsSystem = isSystem == 1
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := range items {
		perms, err := r.permissionCodesForRole(ctx, items[i].ID)
		if err != nil {
			return nil, err
		}
		items[i].Permissions = perms
	}
	return items, nil
}

func (r *RBACRepository) GetRoleByID(ctx context.Context, id string) (*model.Role, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, code, COALESCE(description,''), is_system
		FROM roles WHERE id = ?`, id)
	var item model.Role
	var isSystem int
	if err := row.Scan(&item.ID, &item.Name, &item.Code, &item.Description, &isSystem); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	item.IsSystem = isSystem == 1
	perms, err := r.permissionCodesForRole(ctx, id)
	if err != nil {
		return nil, err
	}
	item.Permissions = perms
	return &item, nil
}

func (r *RBACRepository) permissionCodesForRole(ctx context.Context, roleID string) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT p.code FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id = ?
		ORDER BY p.code`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	codes := make([]string, 0)
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, err
		}
		codes = append(codes, code)
	}
	return codes, rows.Err()
}

func (r *RBACRepository) ListPermissions(ctx context.Context) ([]model.Permission, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, name, code, resource, action, COALESCE(description,'')
		FROM permissions ORDER BY resource, action`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]model.Permission, 0)
	for rows.Next() {
		var item model.Permission
		if err := rows.Scan(&item.ID, &item.Name, &item.Code, &item.Resource, &item.Action, &item.Description); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *RBACRepository) ReplaceRolePermissions(ctx context.Context, roleID string, permissionIDs []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, `DELETE FROM role_permissions WHERE role_id = ?`, roleID); err != nil {
		return err
	}
	now := time.Now()
	for _, pid := range permissionIDs {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO role_permissions (id, role_id, permission_id, created_at)
			VALUES (?, ?, ?, ?)`, uuid.NewString(), roleID, pid, now); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *RBACRepository) UpdateRoleMeta(ctx context.Context, role *model.Role) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
		role.Name, nullString(role.Description), time.Now(), role.ID,
	)
	return err
}

func (r *RBACRepository) GetRoleByCode(ctx context.Context, code string) (*model.Role, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, name, code, COALESCE(description,''), is_system
		FROM roles WHERE code = ?`, code)
	var item model.Role
	var isSystem int
	if err := row.Scan(&item.ID, &item.Name, &item.Code, &item.Description, &isSystem); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	item.IsSystem = isSystem == 1
	return &item, nil
}

func (r *RBACRepository) CountUsersWithRole(ctx context.Context, roleID string) (int, error) {
	var n int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM user_roles WHERE role_id = ?`, roleID).Scan(&n)
	return n, err
}

func (r *RBACRepository) DeleteRole(ctx context.Context, roleID string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM roles WHERE id = ? AND is_system = 0`, roleID)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *RBACRepository) UserHasRoleAssignment(ctx context.Context, userID string) (bool, error) {
	var n int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM user_roles WHERE user_id = ?`, userID).Scan(&n)
	return n > 0, err
}

func nullString(s string) sql.NullString {
	s = strings.TrimSpace(s)
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}
