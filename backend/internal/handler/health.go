package handler

import (
	"context"
	"database/sql"
	"time"

	"github.com/gofiber/fiber/v2"
)

type HealthHandler struct {
	db *sql.DB
}

func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{db: db}
}

type healthResponse struct {
	Status string            `json:"status"`
	DB     string            `json:"db"`
	Checks map[string]string `json:"checks,omitempty"`
}

func (h *HealthHandler) Check(c *fiber.Ctx) error {
	resp := healthResponse{
		Status: "ok",
		DB:     "ok",
		Checks: map[string]string{
			"api": "ok",
		},
	}

	ctx, cancel := context.WithTimeout(c.Context(), 3*time.Second)
	defer cancel()

	if err := h.db.PingContext(ctx); err != nil {
		resp.Status = "degraded"
		resp.DB = "error"
		resp.Checks["db"] = err.Error()
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"success": false,
			"data":    resp,
		})
	}

	resp.Checks["db"] = "ok"

	return c.JSON(fiber.Map{
		"success": true,
		"data":    resp,
	})
}
