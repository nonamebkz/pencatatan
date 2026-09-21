package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/kikichan/pencatatan/backend/internal/model"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) List(ctx context.Context) ([]model.User, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, email, name, role, is_active, created_at, updated_at
		FROM users
		ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.User, 0)
	for rows.Next() {
		item, err := scanUser(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*model.User, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, email, name, role, is_active, created_at, updated_at
		FROM users WHERE id = ?`, id)
	item, err := scanUserRow(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return item, err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*model.User, string, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, email, name, role, is_active, created_at, updated_at, password_hash
		FROM users WHERE email = ?`, strings.ToLower(strings.TrimSpace(email)))

	var passwordHash string
	item, err := scanUserRowWithPassword(row, &passwordHash)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, "", nil
	}
	return item, passwordHash, err
}

func (r *UserRepository) Count(ctx context.Context) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	return count, err
}

func (r *UserRepository) Create(ctx context.Context, user *model.User, passwordHash string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		user.ID, strings.ToLower(user.Email), passwordHash, user.Name, user.Role, user.IsActive, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

func (r *UserRepository) Update(ctx context.Context, user *model.User) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE users
		SET email = ?, name = ?, role = ?, is_active = ?, updated_at = ?
		WHERE id = ?`,
		strings.ToLower(user.Email), user.Name, user.Role, user.IsActive, user.UpdatedAt, user.ID,
	)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, id, passwordHash string, updatedAt time.Time) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`, passwordHash, updatedAt, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *UserRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM users WHERE id = ?`, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func scanUser(scanner interface {
	Scan(dest ...any) error
}) (model.User, error) {
	var item model.User
	var isActive int
	err := scanner.Scan(&item.ID, &item.Email, &item.Name, &item.Role, &isActive, &item.CreatedAt, &item.UpdatedAt)
	item.IsActive = isActive == 1
	return item, err
}

func scanUserRow(row *sql.Row) (*model.User, error) {
	item, err := scanUser(row)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func scanUserRowWithPassword(row *sql.Row, passwordHash *string) (*model.User, error) {
	var item model.User
	var isActive int
	err := row.Scan(&item.ID, &item.Email, &item.Name, &item.Role, &isActive, &item.CreatedAt, &item.UpdatedAt, passwordHash)
	if err != nil {
		return nil, err
	}
	item.IsActive = isActive == 1
	return &item, nil
}
