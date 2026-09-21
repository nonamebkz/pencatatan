package handler

import (
	"database/sql"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/auth"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/middleware"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

type UserHandler struct {
	repo *repository.UserRepository
}

func NewUserHandler(repo *repository.UserRepository) *UserHandler {
	return &UserHandler{repo: repo}
}

type userRequest struct {
	Email    string `json:"email"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	IsActive *bool  `json:"isActive"`
	Password string `json:"password"`
}

type resetPasswordRequest struct {
	Password string `json:"password"`
}

func (h *UserHandler) List(c *fiber.Ctx) error {
	items, err := h.repo.List(c.Context())
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *UserHandler) Get(c *fiber.Ctx) error {
	item, err := h.repo.GetByID(c.Context(), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Pengguna tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *UserHandler) Create(c *fiber.Ctx) error {
	var req userRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if err := validateUserRequest(req, true); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	existing, _, err := h.repo.GetByEmail(c.Context(), req.Email)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing != nil {
		return httpx.Fail(c, fiber.StatusConflict, "EMAIL_EXISTS", "Email sudah digunakan")
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	now := time.Now()
	user := &model.User{
		ID:        uuid.NewString(),
		Email:     strings.ToLower(strings.TrimSpace(req.Email)),
		Name:      strings.TrimSpace(req.Name),
		Role:      model.UserRole(req.Role),
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := h.repo.Create(c.Context(), user, hash); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": user})
}

func (h *UserHandler) Update(c *fiber.Ctx) error {
	var req userRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if err := validateUserRequest(req, false); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	existing, err := h.repo.GetByID(c.Context(), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Pengguna tidak ditemukan")
	}

	if email := strings.ToLower(strings.TrimSpace(req.Email)); email != existing.Email {
		other, _, err := h.repo.GetByEmail(c.Context(), email)
		if err != nil {
			return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		}
		if other != nil && other.ID != existing.ID {
			return httpx.Fail(c, fiber.StatusConflict, "EMAIL_EXISTS", "Email sudah digunakan")
		}
		existing.Email = email
	}

	existing.Name = strings.TrimSpace(req.Name)
	existing.Role = model.UserRole(req.Role)
	if req.IsActive != nil {
		if existing.ID == middleware.UserID(c) && !*req.IsActive {
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Tidak dapat menonaktifkan akun sendiri")
		}
		existing.IsActive = *req.IsActive
	}
	existing.UpdatedAt = time.Now()

	if err := h.repo.Update(c.Context(), existing); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, existing)
}

func (h *UserHandler) ResetPassword(c *fiber.Ctx) error {
	var req resetPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if len(req.Password) < 8 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Password minimal 8 karakter")
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	if err := h.repo.UpdatePassword(c.Context(), c.Params("id"), hash, time.Now()); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Pengguna tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, fiber.Map{"message": "Password berhasil diperbarui"})
}

func (h *UserHandler) Delete(c *fiber.Ctx) error {
	if c.Params("id") == middleware.UserID(c) {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Tidak dapat menghapus akun sendiri")
	}

	if err := h.repo.Delete(c.Context(), c.Params("id")); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Pengguna tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func validateUserRequest(req userRequest, requirePassword bool) error {
	if strings.TrimSpace(req.Email) == "" {
		return errString("Email wajib diisi")
	}
	if strings.TrimSpace(req.Name) == "" {
		return errString("Nama wajib diisi")
	}
	if req.Role != string(model.UserRoleAdmin) && req.Role != string(model.UserRoleUser) {
		return errString("Role harus ADMIN atau USER")
	}
	if requirePassword && len(req.Password) < 8 {
		return errString("Password minimal 8 karakter")
	}
	return nil
}

type errString string

func (e errString) Error() string { return string(e) }
