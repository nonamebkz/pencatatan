package handler

import (
	"database/sql"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	"github.com/kikichan/pencatatan/backend/internal/service/waterquality"
)

type WaterQualityHandler struct {
	logs  *repository.WaterQualityRepository
	ponds *repository.PondRepository
}

func NewWaterQualityHandler(logs *repository.WaterQualityRepository, ponds *repository.PondRepository) *WaterQualityHandler {
	return &WaterQualityHandler{logs: logs, ponds: ponds}
}

type waterQualityRequest struct {
	BusinessUnitID string   `json:"businessUnitId"`
	BatchID        *string  `json:"batchId"`
	MeasuredAt     string   `json:"measuredAt"`
	AmmoniaPPM     *float64 `json:"ammoniaPpm"`
	PH             *float64 `json:"ph"`
	Notes          *string  `json:"notes"`
}

func (h *WaterQualityHandler) List(c *fiber.Ctx) error {
	filter, err := parseWaterQualityFilter(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	items, total, err := h.logs.List(c.Context(), filter)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return httpx.OKWithMeta(c, items, fiber.Map{
		"page":  filter.Page,
		"limit": filter.Limit,
		"total": total,
	})
}

func (h *WaterQualityHandler) Get(c *fiber.Ctx) error {
	item, err := h.logs.GetByID(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Catatan kualitas air tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *WaterQualityHandler) Create(c *fiber.Ctx) error {
	var req waterQualityRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}

	logItem, err := h.buildLogFromRequest(c, req, "")
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	if err := h.logs.Create(c.Context(), logItem); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	logItem.Status = waterquality.ComputeStatus(logItem.AmmoniaPPM, logItem.PH)
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": logItem})
}

func (h *WaterQualityHandler) Update(c *fiber.Ctx) error {
	existing, err := h.logs.GetByID(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Catatan kualitas air tidak ditemukan")
	}

	var req waterQualityRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}

	logItem, err := h.buildLogFromRequest(c, req, existing.ID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	logItem.CreatedAt = existing.CreatedAt

	if err := h.logs.Update(c.Context(), logItem); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Catatan kualitas air tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	logItem.BusinessUnitName = existing.BusinessUnitName
	logItem.Status = waterquality.ComputeStatus(logItem.AmmoniaPPM, logItem.PH)
	return httpx.OK(c, logItem)
}

func (h *WaterQualityHandler) Delete(c *fiber.Ctx) error {
	if err := h.logs.Delete(c.Context(), workspaceID(c), c.Params("id")); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Catatan kualitas air tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *WaterQualityHandler) Trends(c *fiber.Ctx) error {
	days, _ := strconv.Atoi(c.Query("days", "7"))
	points, err := h.logs.Trends(c.Context(), workspaceID(c), c.Query("businessUnitId"), days)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	measuredAt := make([]time.Time, 0, len(points))
	ammonia := make([]*float64, 0, len(points))
	ph := make([]*float64, 0, len(points))

	for _, point := range points {
		measuredAt = append(measuredAt, point.MeasuredAt)
		ammonia = append(ammonia, point.AmmoniaPPM)
		ph = append(ph, point.PH)
	}

	return httpx.OK(c, fiber.Map{
		"measuredAt": measuredAt,
		"series": fiber.Map{
			"ammonia": ammonia,
			"ph":      ph,
		},
		"points": points,
	})
}

func (h *WaterQualityHandler) Report(c *fiber.Ctx) error {
	filter, err := parseWaterQualityFilter(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	logs, total, err := h.logs.List(c.Context(), filter)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	days, _ := strconv.Atoi(c.Query("days", "7"))
	trends, err := h.logs.Trends(c.Context(), workspaceID(c), filter.BusinessUnitID, days)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	todayStart, todayEnd, err := repository.TodayRangeJakarta(time.Now())
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	summaries, err := h.logs.Summaries(c.Context(), workspaceID(c), todayStart, todayEnd)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	notMeasuredToday := make([]model.WaterQualitySummary, 0)
	for _, summary := range summaries {
		if summary.NotMeasuredToday {
			notMeasuredToday = append(notMeasuredToday, summary)
		}
	}

	return httpx.OK(c, fiber.Map{
		"logs":             logs,
		"trends":           trends,
		"notMeasuredToday": notMeasuredToday,
		"meta": fiber.Map{
			"total": total,
			"days":  days,
		},
	})
}

func (h *WaterQualityHandler) DashboardSummary(c *fiber.Ctx) error {
	todayStart, todayEnd, err := repository.TodayRangeJakarta(time.Now())
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	summaries, err := h.logs.Summaries(c.Context(), workspaceID(c), todayStart, todayEnd)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return httpx.OK(c, fiber.Map{"waterQualitySummary": summaries})
}

func (h *WaterQualityHandler) buildLogFromRequest(c *fiber.Ctx, req waterQualityRequest, existingID string) (*model.WaterQualityLog, error) {
	if req.BusinessUnitID == "" {
		return nil, errValidation("Kolam wajib dipilih")
	}
	if req.MeasuredAt == "" {
		return nil, errValidation("Waktu pengukuran wajib diisi")
	}
	if !waterquality.HasAnyMeasurement(req.AmmoniaPPM, req.PH, req.Notes) {
		return nil, errValidation("Minimal satu dari ammonia, pH, atau catatan harus diisi")
	}

	measuredAt, err := time.Parse(time.RFC3339, req.MeasuredAt)
	if err != nil {
		return nil, errValidation("Format measuredAt harus RFC3339")
	}

	pond, err := h.ponds.GetByID(c.Context(), workspaceID(c), req.BusinessUnitID)
	if err != nil {
		return nil, err
	}
	if pond == nil {
		return nil, errValidation("Kolam tidak ditemukan")
	}
	if pond.Status == model.BusinessUnitInactive {
		return nil, errValidation("Kolam nonaktif, tidak bisa menambah catatan baru")
	}

	now := time.Now()
	id := existingID
	if id == "" {
		id = uuid.NewString()
	}

	return &model.WaterQualityLog{
		ID:             id,
		WorkspaceID:    workspaceID(c),
		BusinessUnitID: req.BusinessUnitID,
		BatchID:        req.BatchID,
		MeasuredAt:     measuredAt,
		AmmoniaPPM:     req.AmmoniaPPM,
		PH:             req.PH,
		Notes:          req.Notes,
		CreatedAt:      now,
		UpdatedAt:      now,
	}, nil
}

func parseWaterQualityFilter(c *fiber.Ctx) (repository.WaterQualityFilter, error) {
	filter := repository.WaterQualityFilter{
		WorkspaceID:    workspaceID(c),
		BusinessUnitID: c.Query("businessUnitId"),
		BatchID:        c.Query("batchId"),
		Page:           queryInt(c, "page", 1),
		Limit:          queryInt(c, "limit", 50),
	}

	if from := c.Query("from"); from != "" {
		parsed, err := time.Parse("2006-01-02", from)
		if err != nil {
			return filter, errValidation("Format from harus YYYY-MM-DD")
		}
		filter.From = &parsed
	}
	if to := c.Query("to"); to != "" {
		parsed, err := time.Parse("2006-01-02", to)
		if err != nil {
			return filter, errValidation("Format to harus YYYY-MM-DD")
		}
		end := parsed.Add(24*time.Hour - time.Nanosecond)
		filter.To = &end
	}

	return filter, nil
}

func queryInt(c *fiber.Ctx, key string, fallback int) int {
	value, err := strconv.Atoi(c.Query(key, strconv.Itoa(fallback)))
	if err != nil || value <= 0 {
		return fallback
	}
	return value
}

type validationError struct {
	message string
}

func (e validationError) Error() string {
	return e.message
}

func errValidation(message string) error {
	return validationError{message: message}
}
