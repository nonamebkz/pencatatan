package handler

import (
	"database/sql"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

type OperationalUnitHandler struct {
	repo *repository.OperationalUnitRepository
}

func NewOperationalUnitHandler(repo *repository.OperationalUnitRepository) *OperationalUnitHandler {
	return &OperationalUnitHandler{repo: repo}
}

type operationalUnitRequest struct {
	Name     string  `json:"name"`
	Location *string `json:"location"`
	Notes    *string `json:"notes"`
	Status   *string `json:"status"`
}

func (h *OperationalUnitHandler) List(c *fiber.Ctx) error {
	items, err := h.repo.List(c.Context(), workspaceID(c), c.Query("status"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *OperationalUnitHandler) Get(c *fiber.Ctx) error {
	item, err := h.repo.GetByID(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Unit tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *OperationalUnitHandler) Create(c *fiber.Ctx) error {
	var req operationalUnitRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama unit wajib diisi")
	}
	if len(name) > 255 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama unit terlalu panjang")
	}

	now := time.Now()
	unit := &model.OperationalUnit{
		ID:          uuid.NewString(),
		WorkspaceID: workspaceID(c),
		Name:        name,
		Location:    trimOptionalString(req.Location),
		Notes:       trimOptionalString(req.Notes),
		Status:      model.OperationalUnitActive,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if req.Status != nil && strings.TrimSpace(*req.Status) == string(model.OperationalUnitInactive) {
		unit.Status = model.OperationalUnitInactive
	}

	if err := h.repo.Create(c.Context(), unit); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": unit})
}

func (h *OperationalUnitHandler) Update(c *fiber.Ctx) error {
	existing, err := h.repo.GetByID(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Unit tidak ditemukan")
	}

	var req operationalUnitRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if req.Name != "" {
		name := strings.TrimSpace(req.Name)
		if name == "" {
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama unit wajib diisi")
		}
		existing.Name = name
	}
	if req.Location != nil {
		existing.Location = trimOptionalString(req.Location)
	}
	if req.Notes != nil {
		existing.Notes = trimOptionalString(req.Notes)
	}
	if req.Status != nil {
		switch strings.TrimSpace(*req.Status) {
		case string(model.OperationalUnitActive):
			existing.Status = model.OperationalUnitActive
		case string(model.OperationalUnitInactive):
			existing.Status = model.OperationalUnitInactive
		default:
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Status tidak valid")
		}
	}
	existing.UpdatedAt = time.Now()

	if err := h.repo.Update(c.Context(), existing); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Unit tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, existing)
}

func (h *OperationalUnitHandler) Delete(c *fiber.Ctx) error {
	if err := h.repo.Delete(c.Context(), workspaceID(c), c.Params("id")); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Unit tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func trimOptionalString(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
