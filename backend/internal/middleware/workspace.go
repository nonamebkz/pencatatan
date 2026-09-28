package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

func workspaceIDFromHeader(c *fiber.Ctx) string {
	if value := strings.TrimSpace(c.Get("X-Workspace-ID")); value != "" {
		return value
	}
	return model.DefaultWorkspaceID
}

func skipWorkspaceValidation(path string) bool {
	if path == "/api/v1/workspaces" || path == "/api/v1/workspaces/all" {
		return true
	}
	if strings.HasPrefix(path, "/api/v1/workspaces/") {
		suffix := strings.TrimPrefix(path, "/api/v1/workspaces/")
		if suffix != "" && suffix != "all" {
			return true
		}
	}
	if strings.HasPrefix(path, "/api/v1/reports/consolidated/") {
		return true
	}
	if strings.HasPrefix(path, "/api/v1/auth/") {
		return true
	}
	return false
}

func ValidateWorkspace(repo *repository.WorkspaceRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if skipWorkspaceValidation(c.Path()) {
			return c.Next()
		}
		id := workspaceIDFromHeader(c)
		ws, err := repo.GetByID(c.Context(), id)
		if err != nil {
			return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		}
		if ws == nil {
			return httpx.Fail(c, fiber.StatusNotFound, "WORKSPACE_NOT_FOUND", "Workspace tidak ditemukan")
		}
		c.Locals("workspaceId", id)
		c.Locals("workspaceTemplateId", ws.TemplateID)
		return c.Next()
	}
}

func RequireWorkspaceMembership(repo *repository.WorkspaceRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if skipWorkspaceValidation(c.Path()) {
			return c.Next()
		}
		userID := UserID(c)
		if userID == "" {
			return httpx.Fail(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Sesi tidak valid")
		}
		id := workspaceIDFromHeader(c)
		ok, err := repo.HasMembership(c.Context(), userID, id)
		if err != nil {
			return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		}
		if !ok {
			return httpx.Fail(c, fiber.StatusForbidden, "WORKSPACE_FORBIDDEN", "Anda tidak memiliki akses ke workspace ini")
		}
		return c.Next()
	}
}
