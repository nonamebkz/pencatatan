package handler

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/middleware"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	financesvc "github.com/kikichan/pencatatan/backend/internal/service/finance"
)

type ReportHandler struct {
	reports    *repository.ReportRepository
	rent       *repository.RentRepository
	workspaces *repository.WorkspaceRepository
}

func NewReportHandler(reports *repository.ReportRepository, rent *repository.RentRepository, workspaces *repository.WorkspaceRepository) *ReportHandler {
	return &ReportHandler{reports: reports, rent: rent, workspaces: workspaces}
}

func (h *ReportHandler) Purchases(c *fiber.Ctx) error {
	filter, err := parseReportDateFilter(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	filter.BusinessUnitID = strings.TrimSpace(c.Query("businessUnitId"))

	items, footer, err := h.reports.PurchaseReport(c.Context(), filter)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, fiber.Map{"items": items, "footer": footer})
}

func (h *ReportHandler) PriceHistory(c *fiber.Ctx) error {
	itemName := strings.TrimSpace(c.Query("itemName"))
	if itemName == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "itemName wajib diisi")
	}
	entries, footer, err := h.reports.PriceHistory(c.Context(), workspaceID(c), itemName)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, fiber.Map{"entries": entries, "footer": footer})
}

func (h *ReportHandler) PriceHistoryItems(c *fiber.Ctx) error {
	names, err := h.reports.SearchPurchaseItemNames(c.Context(), workspaceID(c), c.Query("q"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, fiber.Map{"items": names})
}

func (h *ReportHandler) Rent(c *fiber.Ctx) error {
	timeStatus := strings.TrimSpace(c.Query("timeStatus"))
	paymentStatus := strings.TrimSpace(c.Query("paymentStatus"))

	items, err := h.rent.ListContracts(c.Context(), repository.RentListFilter{
		WorkspaceID: workspaceID(c),
	})
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	filtered := make([]model.PeriodicContract, 0, len(items))
	var totalPaid, totalRemaining float64
	activeCount := 0
	for _, c := range items {
		if timeStatus != "" && string(c.TimeStatus) != timeStatus {
			continue
		}
		if paymentStatus != "" && string(c.PaymentStatus) != paymentStatus {
			continue
		}
		filtered = append(filtered, c)
		totalPaid += c.PaidAmount
		totalRemaining += c.RemainingAmount
		if c.TimeStatus == model.ContractTimeActive || c.TimeStatus == model.ContractTimeExpiring {
			activeCount++
		}
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].EndDate < filtered[j].EndDate
	})

	footer := model.RentReportFooter{
		ActiveContractCount: activeCount,
		TotalRemaining:      financesvc.RoundMoney(totalRemaining),
	}
	return httpx.OK(c, fiber.Map{
		"contracts":      filtered,
		"totalPaid":        financesvc.RoundMoney(totalPaid),
		"totalRemaining":   footer.TotalRemaining,
		"footer":           footer,
	})
}

func (h *ReportHandler) Summary(c *fiber.Ctx) error {
	filter, err := parseReportDateFilter(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	report, err := h.reports.OperationalSummary(c.Context(), filter)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, report)
}

func (h *ReportHandler) ConsolidatedSummary(c *fiber.Ctx) error {
	from, to, err := parseReportPeriod(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	workspaceIDs, err := h.resolveConsolidatedWorkspaceIDs(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	report, err := h.reports.ConsolidatedOperationalSummary(c.Context(), workspaceIDs, from, to)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, report)
}

func (h *ReportHandler) resolveConsolidatedWorkspaceIDs(c *fiber.Ctx) ([]string, error) {
	userID := middleware.UserID(c)
	items, err := h.workspaces.ListForUser(c.Context(), userID)
	if err != nil {
		return nil, err
	}
	allowed := make([]string, 0)
	allowedSet := map[string]struct{}{}
	for _, ws := range items {
		if ws.Type != model.WorkspaceBusiness {
			continue
		}
		allowed = append(allowed, ws.ID)
		allowedSet[ws.ID] = struct{}{}
	}
	if raw := strings.TrimSpace(c.Query("workspaceIds")); raw != "" {
		requested := strings.Split(raw, ",")
		filtered := make([]string, 0, len(requested))
		for _, id := range requested {
			id = strings.TrimSpace(id)
			if id == "" {
				continue
			}
			if _, ok := allowedSet[id]; !ok {
				return nil, fmt.Errorf("workspace tidak boleh diakses atau bukan usaha")
			}
			filtered = append(filtered, id)
		}
		if len(filtered) == 0 {
			return nil, fmt.Errorf("pilih minimal satu workspace usaha")
		}
		return filtered, nil
	}
	return allowed, nil
}

func parseReportPeriod(c *fiber.Ctx) (time.Time, time.Time, error) {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	now := time.Now().In(loc)
	defaultFrom := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	defaultTo := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)

	from := defaultFrom
	to := defaultTo
	if q := strings.TrimSpace(c.Query("from")); q != "" {
		t, err := parseDate(q)
		if err != nil {
			return time.Time{}, time.Time{}, err
		}
		from = t
	}
	if q := strings.TrimSpace(c.Query("to")); q != "" {
		t, err := parseDate(q)
		if err != nil {
			return time.Time{}, time.Time{}, err
		}
		to = t
	}
	if to.Before(from) {
		return time.Time{}, time.Time{}, fmt.Errorf("periode tidak valid")
	}
	return from, to, nil
}

func parseReportDateFilter(c *fiber.Ctx) (repository.ReportDateFilter, error) {
	from, to, err := parseReportPeriod(c)
	if err != nil {
		return repository.ReportDateFilter{}, err
	}
	return repository.ReportDateFilter{
		WorkspaceID: workspaceID(c),
		From:        from,
		To:          to,
	}, nil
}
