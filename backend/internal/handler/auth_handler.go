package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/auth"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/middleware"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

type AuthHandler struct {
	users     *repository.UserRepository
	jwtSecret string
	jwtExpiry time.Duration
}

func NewAuthHandler(users *repository.UserRepository, jwtSecret string, jwtExpiry time.Duration) *AuthHandler {
	return &AuthHandler{users: users, jwtSecret: jwtSecret, jwtExpiry: jwtExpiry}
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

	return httpx.OK(c, fiber.Map{
		"token":     token.Token,
		"expiresAt": token.ExpiresAt,
		"user":      user,
	})
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
	return httpx.OK(c, user)
}
