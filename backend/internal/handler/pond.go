package handler

import (
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/service/waterquality"
)

type PondHandler struct {
	repo     *repository.PondRepository
	settings *repository.SettingsRepository
}

func NewPondHandler(repo *repository.PondRepository, settings *repository.SettingsRepository) *PondHandler {
	return &PondHandler{repo: repo, settings: settings}
}

type pondRequest struct {
	Name               string                     `json:"name"`
	Location           *string                    `json:"location"`
	Size               *string                    `json:"size"`
	OwnerName          *string                    `json:"ownerName"`
	Status             *string                    `json:"status"`
	Notes              *string                    `json:"notes"`
	WaterQualityConfig *model.WaterQualityConfig  `json:"waterQualityConfig"`
}

func (h *PondHandler) List(c *fiber.Ctx) error {
	items, err := h.repo.List(c.Context(), workspaceID(c), c.Query("status"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *PondHandler) Get(c *fiber.Ctx) error {
	item, err := h.repo.GetByID(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Kolam tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *PondHandler) Create(c *fiber.Ctx) error {
	var req pondRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if req.Name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama kolam wajib diisi")
	}

	cfg, err := h.resolveCreateConfig(c, req.WaterQualityConfig)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	now := time.Now()
	pond := &model.BusinessUnit{
		ID:                 uuid.NewString(),
		WorkspaceID:        workspaceID(c),
		UnitType:           "POND",
		Name:               req.Name,
		Location:           req.Location,
		Size:               req.Size,
		OwnerName:          req.OwnerName,
		Status:             model.BusinessUnitActive,
		Notes:              req.Notes,
		WaterQualityConfig: cfg,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
	if req.Status != nil && *req.Status == string(model.BusinessUnitInactive) {
		pond.Status = model.BusinessUnitInactive
	}

	if err := h.repo.Create(c.Context(), pond); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": pond})
}

func (h *PondHandler) Update(c *fiber.Ctx) error {
	existing, err := h.repo.GetByID(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Kolam tidak ditemukan")
	}

	var req pondRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if req.Name != "" {
		existing.Name = req.Name
	}
	if req.Location != nil {
		existing.Location = req.Location
	}
	if req.Size != nil {
		existing.Size = req.Size
	}
	if req.OwnerName != nil {
		existing.OwnerName = req.OwnerName
	}
	if req.Notes != nil {
		existing.Notes = req.Notes
	}
	if req.Status != nil {
		switch *req.Status {
		case string(model.BusinessUnitActive):
			existing.Status = model.BusinessUnitActive
		case string(model.BusinessUnitInactive):
			existing.Status = model.BusinessUnitInactive
		default:
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Status kolam tidak valid")
		}
	}
	if req.WaterQualityConfig != nil {
		if err := waterquality.ValidateConfig(*req.WaterQualityConfig); err != nil {
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
		}
		existing.WaterQualityConfig = waterquality.MergeWithDefaults(*req.WaterQualityConfig)
	}
	existing.UpdatedAt = time.Now()

	if err := h.repo.Update(c.Context(), existing); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Kolam tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, existing)
}

func (h *PondHandler) Delete(c *fiber.Ctx) error {
	if err := h.repo.Delete(c.Context(), workspaceID(c), c.Params("id")); err != nil {
		if err == sql.ErrNoRows {
			return c.SendStatus(fiber.StatusNoContent)
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *PondHandler) resolveCreateConfig(c *fiber.Ctx, cfg *model.WaterQualityConfig) (model.WaterQualityConfig, error) {
	if cfg == nil {
		if h.settings == nil {
			return waterquality.DefaultConfig(), nil
		}
		return h.settings.GetWaterQualityConfig(c.Context(), workspaceID(c))
	}
	if err := waterquality.ValidateConfig(*cfg); err != nil {
		return model.WaterQualityConfig{}, err
	}
	return waterquality.MergeWithDefaults(*cfg), nil
}
