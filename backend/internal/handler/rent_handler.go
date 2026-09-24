package handler

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
	rentsvc "github.com/kikichan/pencatatan/backend/internal/service/rent"
	financesvc "github.com/kikichan/pencatatan/backend/internal/service/finance"
)

type RentHandler struct {
	repo        *repository.RentRepository
	financeRepo *repository.FinanceRepository
}

func NewRentHandler(repo *repository.RentRepository, financeRepo *repository.FinanceRepository) *RentHandler {
	return &RentHandler{repo: repo, financeRepo: financeRepo}
}

type createRentContractRequest struct {
	BusinessUnitID string  `json:"businessUnitId"`
	StartDate      string  `json:"startDate"`
	DurationMonths int     `json:"durationMonths"`
	TotalAmount    float64 `json:"totalAmount"`
	PaymentScheme  string  `json:"paymentScheme"`
	Notes          *string `json:"notes"`
}

type payScheduleRequest struct {
	PaymentDate   string  `json:"paymentDate"`
	CashAccountID string  `json:"cashAccountId"`
	Notes         *string `json:"notes"`
}

func (h *RentHandler) List(c *fiber.Ctx) error {
	items, err := h.repo.ListContracts(c.Context(), repository.RentListFilter{
		WorkspaceID:    workspaceID(c),
		BusinessUnitID: strings.TrimSpace(c.Query("businessUnitId")),
	})
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *RentHandler) Get(c *fiber.Ctx) error {
	item, err := h.repo.GetContract(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Kontrak sewa tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *RentHandler) Create(c *fiber.Ctx) error {
	var req createRentContractRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}

	businessUnitID := strings.TrimSpace(req.BusinessUnitID)
	if businessUnitID == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Kolam wajib dipilih")
	}
	if req.DurationMonths < 1 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Durasi minimal 1 bulan")
	}
	if req.TotalAmount <= 0 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Total sewa harus lebih dari 0")
	}

	scheme := model.PaymentScheme(strings.TrimSpace(req.PaymentScheme))
	if scheme != model.PaymentSchemeLumpSum && scheme != model.PaymentSchemeInstallment {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Skema pembayaran tidak valid")
	}

	start, err := time.Parse("2006-01-02", strings.TrimSpace(req.StartDate))
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Tanggal mulai tidak valid")
	}

	ws := workspaceID(c)
	ok, err := h.repo.PondExists(c.Context(), ws, businessUnitID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if !ok {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Kolam tidak ditemukan")
	}

	contractID := uuid.New().String()
	end := rentsvc.EndDateFromStart(start, req.DurationMonths)
	total := financesvc.RoundMoney(req.TotalAmount)
	schedules := rentsvc.GenerateSchedules(contractID, scheme, start, req.DurationMonths, total)

	contract, err := h.repo.CreateContract(c.Context(), repository.CreateRentContractInput{
		WorkspaceID:    ws,
		BusinessUnitID: businessUnitID,
		StartDate:      start,
		EndDate:        end,
		DurationMonths: req.DurationMonths,
		TotalAmount:    total,
		PaymentScheme:  scheme,
		Notes:          req.Notes,
		ContractID:     contractID,
		Schedules:      schedules,
		MonthlyEquiv:   rentsvc.MonthlyEquivalent(total, req.DurationMonths),
	})
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"contract":  contract,
			"schedules": contract.Schedules,
		},
	})
}

func (h *RentHandler) PaySchedule(c *fiber.Ctx) error {
	var req payScheduleRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}

	cashAccountID := strings.TrimSpace(req.CashAccountID)
	if cashAccountID == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Akun kas wajib dipilih")
	}

	paymentDate, err := time.Parse("2006-01-02", strings.TrimSpace(req.PaymentDate))
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Tanggal bayar tidak valid")
	}

	ws := workspaceID(c)
	account, err := h.financeRepo.GetCashAccount(c.Context(), ws, cashAccountID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if account == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Akun kas tidak ditemukan")
	}

	payment, transaction, err := h.repo.PaySchedule(c.Context(), repository.PayScheduleInput{
		WorkspaceID:   ws,
		ScheduleID:    c.Params("scheduleId"),
		PaymentDate:   paymentDate,
		CashAccountID: cashAccountID,
		Notes:         req.Notes,
		PaymentID:     uuid.New().String(),
		TransactionID: uuid.New().String(),
	})
	if err != nil {
		if err.Error() == "NOT_FOUND" {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Jadwal tidak ditemukan")
		}
		if err.Error() == "ALREADY_PAID" {
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Jadwal sudah dibayar")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return httpx.OK(c, fiber.Map{
		"payment":     payment,
		"transaction": transaction,
	})
}
