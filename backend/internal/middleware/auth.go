package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/auth"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
)

func Auth(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenStr := extractBearer(c.Get("Authorization"))
		if tokenStr == "" {
			return httpx.Fail(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Token autentikasi diperlukan")
		}

		claims, err := auth.ParseToken(jwtSecret, tokenStr)
		if err != nil {
			return httpx.Fail(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Token tidak valid atau kedaluwarsa")
		}

		c.Locals("userId", claims.UserID)
		c.Locals("userEmail", claims.Email)
		c.Locals("userRole", claims.Role)
		c.Locals("tokenJTI", claims.JTI)
		return c.Next()
	}
}

func AdminOnly() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, _ := c.Locals("userRole").(string)
		if role != string(model.UserRoleAdmin) {
			return httpx.Fail(c, fiber.StatusForbidden, "FORBIDDEN", "Hanya admin yang dapat mengakses fitur ini")
		}
		return c.Next()
	}
}

func UserID(c *fiber.Ctx) string {
	value, _ := c.Locals("userId").(string)
	return value
}

func UserRole(c *fiber.Ctx) string {
	value, _ := c.Locals("userRole").(string)
	return value
}

func extractBearer(header string) string {
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
