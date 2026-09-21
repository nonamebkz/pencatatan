package seed

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/auth"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

func EnsureAdmin(ctx context.Context, db *sql.DB, email, password string) error {
	repo := repository.NewUserRepository(db)
	count, err := repo.Count(ctx)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}

	now := time.Now()
	user := &model.User{
		ID:        uuid.NewString(),
		Email:     email,
		Name:      "Administrator",
		Role:      model.UserRoleAdmin,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := repo.Create(ctx, user, hash); err != nil {
		return err
	}

	log.Printf("seed: admin user created (%s)", email)
	return nil
}
