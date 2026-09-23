package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

type BatchHandler struct {
	repo *repository.BatchRepository
}

func NewBatchHandler(repo *repository.BatchRepository) *BatchHandler {
	return &BatchHandler{repo: repo}
}

func (h *BatchHandler) List(c *fiber.Ctx) error {
	items, err := h.repo.List(c.Context(), workspaceID(c), c.Query("businessUnitId"), c.Query("status"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}
