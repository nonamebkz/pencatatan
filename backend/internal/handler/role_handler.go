package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

type RoleHandler struct {
	rbac *repository.RBACRepository
}

func NewRoleHandler(rbac *repository.RBACRepository) *RoleHandler {
	return &RoleHandler{rbac: rbac}
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

	item.Name = req.Name
	item.Description = req.Description
	if err := h.rbac.UpdateRoleMeta(c.Context(), item); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, item)
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
	if item.IsSystem {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Role sistem tidak dapat diubah permission-nya")
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