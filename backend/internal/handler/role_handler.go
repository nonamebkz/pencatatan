package handler

import (
	"database/sql"
	"regexp"
	"strings"
	"unicode"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/seed"
)

type RoleHandler struct {
	rbac *repository.RBACRepository
}

func NewRoleHandler(rbac *repository.RBACRepository) *RoleHandler {
	return &RoleHandler{rbac: rbac}
}

var roleCodePattern = regexp.MustCompile(`^[a-z][a-z0-9_]{2,63}$`)

func normalizeRoleCode(raw string) string {
	raw = strings.ToLower(strings.TrimSpace(raw))
	var b strings.Builder
	for _, r := range raw {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(r)
		case r == ' ' || r == '-' || r == '.':
			b.WriteRune('_')
		}
	}
	code := strings.Trim(b.String(), "_")
	for strings.Contains(code, "__") {
		code = strings.ReplaceAll(code, "__", "_")
	}
	return code
}

func (h *RoleHandler) List(c *fiber.Ctx) error {
	items, err := h.rbac.ListRoles(c.Context())
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *RoleHandler) Get(c *fiber.Ctx) error {
	item, err := h.rbac.GetRoleByID(c.Context(), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Role tidak ditemukan")
	}
	return httpx.OK(c, item)
}

type roleCreateRequest struct {
	Name          string   `json:"name"`
	Code          string   `json:"code"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permissionIds"`
}

func (h *RoleHandler) Create(c *fiber.Ctx) error {
	var req roleCreateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	name := strings.TrimSpace(req.Name)
	code := normalizeRoleCode(req.Code)
	if name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama role wajib diisi")
	}
	if code == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Kode role wajib diisi")
	}
	if !roleCodePattern.MatchString(code) {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Kode role: huruf kecil, angka, underscore; 3–64 karakter; diawali huruf")
	}
	if code == seed.RoleCodeWorkspaceAdmin || code == seed.RoleCodeOperator {
		return httpx.Fail(c, fiber.StatusConflict, "CODE_RESERVED", "Kode role sudah dipakai sistem")
	}
	existing, err := h.rbac.GetRoleByCode(c.Context(), code)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing != nil {
		return httpx.Fail(c, fiber.StatusConflict, "CODE_EXISTS", "Kode role sudah digunakan")
	}
	if len(req.PermissionIDs) == 0 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Minimal satu permission")
	}

	role := &model.Role{
		ID:          uuid.NewString(),
		Name:        name,
		Code:        code,
		Description: strings.TrimSpace(req.Description),
		IsSystem:    false,
	}
	if err := h.rbac.InsertRole(c.Context(), role); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if err := h.rbac.ReplaceRolePermissions(c.Context(), role.ID, req.PermissionIDs); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	created, err := h.rbac.GetRoleByID(c.Context(), role.ID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": created})
}

type roleUpdateRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *RoleHandler) Update(c *fiber.Ctx) error {
	var req roleUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if req.Name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama role wajib diisi")
	}

	item, err := h.rbac.GetRoleByID(c.Context(), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Role tidak ditemukan")
	}

	item.Name = strings.TrimSpace(req.Name)
	item.Description = strings.TrimSpace(req.Description)
	if err := h.rbac.UpdateRoleMeta(c.Context(), item); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	updated, err := h.rbac.GetRoleByID(c.Context(), item.ID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, updated)
}

func (h *RoleHandler) Delete(c *fiber.Ctx) error {
	item, err := h.rbac.GetRoleByID(c.Context(), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Role tidak ditemukan")
	}
	if item.IsSystem {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Role sistem tidak dapat dihapus")
	}
	count, err := h.rbac.CountUsersWithRole(c.Context(), item.ID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if count > 0 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Role masih dipakai pengguna")
	}
	if err := h.rbac.DeleteRole(c.Context(), item.ID); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Role tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

type rolePermissionsRequest struct {
	PermissionIDs []string `json:"permissionIds"`
}

func (h *RoleHandler) SetPermissions(c *fiber.Ctx) error {
	var req rolePermissionsRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if len(req.PermissionIDs) == 0 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Minimal satu permission")
	}

	item, err := h.rbac.GetRoleByID(c.Context(), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Role tidak ditemukan")
	}

	if err := h.rbac.ReplaceRolePermissions(c.Context(), item.ID, req.PermissionIDs); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	updated, err := h.rbac.GetRoleByID(c.Context(), item.ID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, updated)
}

type PermissionHandler struct {
	rbac *repository.RBACRepository
}

func NewPermissionHandler(rbac *repository.RBACRepository) *PermissionHandler {
	return &PermissionHandler{rbac: rbac}
}

func (h *PermissionHandler) List(c *fiber.Ctx) error {
	items, err := h.rbac.ListPermissions(c.Context())
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}
