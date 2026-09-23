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
	logs     *repository.WaterQualityRepository
	ponds    *repository.PondRepository
	settings *repository.SettingsRepository
}

func NewWaterQualityHandler(logs *repository.WaterQualityRepository, ponds *repository.PondRepository, settings *repository.SettingsRepository) *WaterQualityHandler {
	return &WaterQualityHandler{logs: logs, ponds: ponds, settings: settings}
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

	configs, err := h.pondConfigMap(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	for i := range items {
		h.applyLogEvaluation(configForPond(configs, items[i].BusinessUnitID), &items[i])
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
	cfg, err := h.configForBusinessUnit(c, item.BusinessUnitID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	h.applyLogEvaluation(cfg, item)
	return httpx.OK(c, item)
}

func (h *WaterQualityHandler) Create(c *fiber.Ctx) error {
	var req waterQualityRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}

	logItem, cfg, err := h.buildLogFromRequest(c, req, "")
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	if err := h.logs.Create(c.Context(), logItem); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	h.applyLogEvaluation(cfg, logItem)
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

	logItem, cfg, err := h.buildLogFromRequest(c, req, existing.ID)
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
	h.applyLogEvaluation(cfg, logItem)
	return httpx.OK(c, logItem)
}

func (h *WaterQualityHandler) Delete(c *fiber.Ctx) error {
	if err := h.logs.Delete(c.Context(), workspaceID(c), c.Params("id")); err != nil {
		if err == sql.ErrNoRows {
			return c.SendStatus(fiber.StatusNoContent)
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

	configs, err := h.pondConfigMap(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	for i := range points {
		eval := waterquality.Evaluate(configForPond(configs, points[i].BusinessUnitID), points[i].AmmoniaPPM, points[i].PH)
		points[i].Status = eval.Status
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

	configs, err := h.pondConfigMap(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	for i := range logs {
		h.applyLogEvaluation(configForPond(configs, logs[i].BusinessUnitID), &logs[i])
	}
	for i := range summaries {
		h.applySummaryEvaluation(configForPond(configs, summaries[i].BusinessUnitID), &summaries[i])
	}
	for i := range trends {
		eval := waterquality.Evaluate(configForPond(configs, trends[i].BusinessUnitID), trends[i].AmmoniaPPM, trends[i].PH)
		trends[i].Status = eval.Status
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

	configs, err := h.pondConfigMap(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	for i := range summaries {
		h.applySummaryEvaluation(configForPond(configs, summaries[i].BusinessUnitID), &summaries[i])
	}

	return httpx.OK(c, fiber.Map{"waterQualitySummary": summaries})
}

func (h *WaterQualityHandler) buildLogFromRequest(c *fiber.Ctx, req waterQualityRequest, existingID string) (*model.WaterQualityLog, model.WaterQualityConfig, error) {
	if req.BusinessUnitID == "" {
		return nil, model.WaterQualityConfig{}, errValidation("Kolam wajib dipilih")
	}
	if req.MeasuredAt == "" {
		return nil, model.WaterQualityConfig{}, errValidation("Waktu pengukuran wajib diisi")
	}
	if !waterquality.HasAnyMeasurement(req.AmmoniaPPM, req.PH, req.Notes) {
		return nil, model.WaterQualityConfig{}, errValidation("Minimal satu dari ammonia, pH, atau catatan harus diisi")
	}

	measuredAt, err := time.Parse(time.RFC3339, req.MeasuredAt)
	if err != nil {
		return nil, model.WaterQualityConfig{}, errValidation("Format measuredAt harus RFC3339")
	}

	pond, err := h.ponds.GetByID(c.Context(), workspaceID(c), req.BusinessUnitID)
	if err != nil {
		return nil, model.WaterQualityConfig{}, err
	}
	if pond == nil {
		return nil, model.WaterQualityConfig{}, errValidation("Kolam tidak ditemukan")
	}
	if pond.Status == model.BusinessUnitInactive {
		return nil, model.WaterQualityConfig{}, errValidation("Kolam nonaktif, tidak bisa menambah catatan baru")
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
	}, pond.WaterQualityConfig, nil
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

func (h *WaterQualityHandler) loadConfig(c *fiber.Ctx) (model.WaterQualityConfig, error) {
	if h.settings == nil {
		return waterquality.DefaultConfig(), nil
	}
	return h.settings.GetWaterQualityConfig(c.Context(), workspaceID(c))
}

// pondConfigMap loads all workspace ponds once (avoids N+1 GetByID).
func (h *WaterQualityHandler) pondConfigMap(c *fiber.Ctx) (map[string]model.WaterQualityConfig, error) {
	ponds, err := h.ponds.List(c.Context(), workspaceID(c), "")
	if err != nil {
		return nil, err
	}
	configs := make(map[string]model.WaterQualityConfig, len(ponds))
	for _, pond := range ponds {
		configs[pond.ID] = pond.WaterQualityConfig
	}
	return configs, nil
}

func (h *WaterQualityHandler) configForBusinessUnit(c *fiber.Ctx, businessUnitID string) (model.WaterQualityConfig, error) {
	pond, err := h.ponds.GetByID(c.Context(), workspaceID(c), businessUnitID)
	if err != nil {
		return model.WaterQualityConfig{}, err
	}
	if pond == nil {
		return waterquality.DefaultConfig(), nil
	}
	return pond.WaterQualityConfig, nil
}

func configForPond(configs map[string]model.WaterQualityConfig, businessUnitID string) model.WaterQualityConfig {
	if cfg, ok := configs[businessUnitID]; ok {
		return cfg
	}
	return waterquality.DefaultConfig()
}

func (h *WaterQualityHandler) applyLogEvaluation(cfg model.WaterQualityConfig, log *model.WaterQualityLog) {
	eval := waterquality.Evaluate(cfg, log.AmmoniaPPM, log.PH)
	log.Status = eval.Status
	log.Advice = eval.Advice
}

func (h *WaterQualityHandler) applySummaryEvaluation(cfg model.WaterQualityConfig, summary *model.WaterQualitySummary) {
	eval := waterquality.Evaluate(cfg, summary.AmmoniaPPM, summary.PH)
	summary.Status = eval.Status
	summary.Advice = eval.Advice
}

func (h *WaterQualityHandler) GetConfig(c *fiber.Ctx) error {
	cfg, err := h.loadConfig(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, cfg)
}

func (h *WaterQualityHandler) UpdateConfig(c *fiber.Ctx) error {
	var cfg model.WaterQualityConfig
	if err := c.BodyParser(&cfg); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if err := waterquality.ValidateConfig(cfg); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	cfg = waterquality.MergeWithDefaults(cfg)
	if err := h.settings.SaveWaterQualityConfig(c.Context(), workspaceID(c), cfg); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, cfg)
}

func (h *WaterQualityHandler) EvaluateMeasurements(c *fiber.Ctx) error {
	var req waterQualityRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	if req.BusinessUnitID == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Kolam wajib dipilih")
	}
	pond, err := h.ponds.GetByID(c.Context(), workspaceID(c), req.BusinessUnitID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if pond == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Kolam tidak ditemukan")
	}
	return httpx.OK(c, waterquality.Evaluate(pond.WaterQualityConfig, req.AmmoniaPPM, req.PH))
}
