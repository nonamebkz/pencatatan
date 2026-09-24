package handler

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/model"
)

func (h *UserHandler) userPayload(ctx context.Context, user *model.User) (fiber.Map, error) {
	roles, err := h.rbac.ListRoleSummariesForUser(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	roleIDs, err := h.rbac.ListUserRoleIDs(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	return fiber.Map{
		"id":        user.ID,
		"email":     user.Email,
		"name":      user.Name,
		"role":      user.Role,
		"isActive":  user.IsActive,
		"createdAt": user.CreatedAt,
		"updatedAt": user.UpdatedAt,
		"roleIds":   roleIDs,
		"roles":     roles,
	}, nil
}

func (h *UserHandler) listPayload(ctx context.Context, users []model.User) ([]fiber.Map, error) {
	out := make([]fiber.Map, 0, len(users))
	for i := range users {
		item, err := h.userPayload(ctx, &users[i])
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}
