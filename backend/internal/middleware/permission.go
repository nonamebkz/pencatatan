package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/seed"
)

const permissionsLocalKey = "permissions"

func LoadPermissions(rbac *repository.RBACRepository) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := UserID(c)
		if userID == "" {
			return c.Next()
		}
		codes, err := rbac.EffectivePermissionCodes(c.Context(), userID)
		if err != nil {
			return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memuat permission")
		}
		if len(codes) == 0 {
			codes = seed.LegacyPermissions(model.UserRole(UserRole(c)))
		}
		c.Locals(permissionsLocalKey, toPermissionSet(codes))
		return c.Next()
	}
}

func RequirePermission(code string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		set, _ := c.Locals(permissionsLocalKey).(map[string]struct{})
		if !hasPermission(set, code) {
			return httpx.Fail(c, fiber.StatusForbidden, "FORBIDDEN", "Anda tidak memiliki izin untuk aksi ini")
		}
		return c.Next()
	}
}

func Permissions(c *fiber.Ctx) []string {
	set, _ := c.Locals(permissionsLocalKey).(map[string]struct{})
	if set == nil {
		return nil
	}
	out := make([]string, 0, len(set))
	for code := range set {
		out = append(out, code)
	}
	return out
}

func hasPermission(set map[string]struct{}, code string) bool {
	if set == nil {
		return false
	}
	_, ok := set[code]
	return ok
}

func toPermissionSet(codes []string) map[string]struct{} {
	set := make(map[string]struct{}, len(codes))
	for _, code := range codes {
		set[code] = struct{}{}
	}
	return set
}
