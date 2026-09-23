package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/model"
)

func workspaceID(c *fiber.Ctx) string {
	if value := c.Get("X-Workspace-ID"); value != "" {
		return value
	}
	return model.DefaultWorkspaceID
}
