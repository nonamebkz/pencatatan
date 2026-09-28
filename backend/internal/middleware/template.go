package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
)

func RequireWorkspaceTemplate(allowed ...string) fiber.Handler {
	allowedSet := make(map[string]struct{}, len(allowed))
	for _, id := range allowed {
		allowedSet[id] = struct{}{}
	}
	return func(c *fiber.Ctx) error {
		templateID, _ := c.Locals("workspaceTemplateId").(string)
		if templateID == "" {
			return httpx.Fail(c, fiber.StatusForbidden, "TEMPLATE_NOT_SUPPORTED", "Modul tidak tersedia untuk template workspace ini")
		}
		if _, ok := allowedSet[templateID]; !ok {
			return httpx.Fail(c, fiber.StatusForbidden, "TEMPLATE_NOT_SUPPORTED", "Modul tidak tersedia untuk template workspace ini")
		}
		return c.Next()
	}
}
