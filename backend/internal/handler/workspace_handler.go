package handler

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/middleware"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/service/waterquality"
)

type WorkspaceHandler struct {
	repo     *repository.WorkspaceRepository
	settings *repository.SettingsRepository
	finance  *repository.FinanceRepository
}

func NewWorkspaceHandler(
	repo *repository.WorkspaceRepository,
	settings *repository.SettingsRepository,
	finance *repository.FinanceRepository,
) *WorkspaceHandler {
	return &WorkspaceHandler{repo: repo, settings: settings, finance: finance}
}

type createWorkspaceRequest struct {
	Name       string `json:"name"`
	Type       string `json:"type"`
	TemplateID string `json:"templateId"`
}

type updateWorkspaceRequest struct {
	Name string `json:"name"`
}

func (h *WorkspaceHandler) List(c *fiber.Ctx) error {
	userID := middleware.UserID(c)
	items, err := h.repo.ListForUser(c.Context(), userID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *WorkspaceHandler) ListAll(c *fiber.Ctx) error {
	items, err := h.repo.List(c.Context())
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *WorkspaceHandler) Create(c *fiber.Ctx) error {
	var req createWorkspaceRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama workspace wajib diisi")
	}

	wsType := model.WorkspaceBusiness
	if t := strings.ToUpper(strings.TrimSpace(req.Type)); t == string(model.WorkspacePersonal) {
		wsType = model.WorkspacePersonal
	} else if t != "" && t != string(model.WorkspaceBusiness) {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Tipe workspace tidak valid")
	}

	templateID := strings.TrimSpace(req.TemplateID)
	if templateID == "" {
		if wsType == model.WorkspacePersonal {
			templateID = "personal"
		} else {
			templateID = "lele"
		}
	}
	if wsType == model.WorkspacePersonal && templateID != "personal" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Workspace pribadi memakai template personal")
	}
	if wsType == model.WorkspaceBusiness && templateID != "lele" && templateID != "generic" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Template usaha tidak didukung")
	}

	now := time.Now()
	ws := &model.Workspace{
		ID:         uuid.NewString(),
		Name:       name,
		Type:       wsType,
		TemplateID: templateID,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := h.repo.Create(c.Context(), ws); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	cashName := "Kas Utama"
	if wsType == model.WorkspacePersonal {
		cashName = "Kas Pribadi"
	}
	if err := h.finance.CreateCashAccount(c.Context(), &model.CashAccount{
		ID:          uuid.NewString(),
		WorkspaceID: ws.ID,
		Name:        cashName,
		IsDefault:   true,
		CreatedAt:   now,
	}); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	if wsType == model.WorkspaceBusiness && templateID == "lele" {
		if err := h.settings.SaveWaterQualityConfig(c.Context(), ws.ID, waterquality.DefaultConfig()); err != nil {
			return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		}
	}

	userID := middleware.UserID(c)
	if err := h.repo.AddUserMembership(c.Context(), userID, ws.ID); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": ws})
}

func (h *WorkspaceHandler) Update(c *fiber.Ctx) error {
	var req updateWorkspaceRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama workspace wajib diisi")
	}
	updated, err := h.repo.UpdateName(c.Context(), c.Params("id"), name)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if updated == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Workspace tidak ditemukan")
	}
	return httpx.OK(c, updated)
}

func (h *WorkspaceHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	existing, err := h.repo.GetByID(c.Context(), id)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Workspace tidak ditemukan")
	}
	if existing.Type == model.WorkspaceBusiness {
		count, err := h.repo.CountByType(c.Context(), model.WorkspaceBusiness)
		if err != nil {
			return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		}
		if count <= 1 {
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Tidak dapat menghapus workspace usaha terakhir")
		}
	}
	if err := h.repo.Delete(c.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Workspace tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}
