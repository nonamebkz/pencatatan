package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/auth"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/middleware"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/seed"
)

type AuthHandler struct {
	users     *repository.UserRepository
	rbac      *repository.RBACRepository
	jwtSecret string
	jwtExpiry time.Duration
}

func NewAuthHandler(users *repository.UserRepository, rbac *repository.RBACRepository, jwtSecret string, jwtExpiry time.Duration) *AuthHandler {
	return &AuthHandler{users: users, rbac: rbac, jwtSecret: jwtSecret, jwtExpiry: jwtExpiry}
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if req.Email == "" || req.Password == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Email dan password wajib diisi")
	}

	user, passwordHash, err := h.users.GetByEmail(c.Context(), req.Email)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if user == nil || !auth.ComparePassword(passwordHash, req.Password) {
		return httpx.Fail(c, fiber.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau password salah")
	}
	if !user.IsActive {
		return httpx.Fail(c, fiber.StatusForbidden, "ACCOUNT_INACTIVE", "Akun dinonaktifkan. Hubungi admin.")
	}

	token, err := auth.GenerateToken(h.jwtSecret, user.ID, user.Email, string(user.Role), h.jwtExpiry)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	payload, err := h.buildSessionPayload(c, user)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	payload["token"] = token.Token
	payload["expiresAt"] = token.ExpiresAt
	return httpx.OK(c, payload)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	return httpx.OK(c, fiber.Map{"message": "Logout berhasil"})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	user, err := h.users.GetByID(c.Context(), middleware.UserID(c))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if user == nil {
		return httpx.Fail(c, fiber.StatusUnauthorized, "UNAUTHORIZED", "Pengguna tidak ditemukan")
	}
	payload, err := h.buildSessionPayload(c, user)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, payload)
}

func (h *AuthHandler) buildSessionPayload(c *fiber.Ctx, user *model.User) (fiber.Map, error) {
	perms, err := h.rbac.EffectivePermissionCodes(c.Context(), user.ID)
	if err != nil {
		return nil, err
	}
	if len(perms) == 0 {
		perms = seed.LegacyPermissions(user.Role)
	}
	roles, err := h.rbac.ListRoleSummariesForUser(c.Context(), user.ID)
	if err != nil {
		return nil, err
	}
	return fiber.Map{
		"user":        user,
		"permissions": perms,
		"roles":       roles,
	}, nil
}
