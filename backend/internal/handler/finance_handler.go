package handler

import (
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/httpx"
	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

type FinanceHandler struct {
	repo *repository.FinanceRepository
}

func NewFinanceHandler(repo *repository.FinanceRepository) *FinanceHandler {
	return &FinanceHandler{repo: repo}
}

type purchaseItemRequest struct {
	ItemName     string  `json:"itemName"`
	Category     string  `json:"category"`
	Qty          float64 `json:"qty"`
	Unit         string  `json:"unit"`
	UnitPrice    float64 `json:"unitPrice"`
	SupplierName *string `json:"supplierName"`
	Notes        *string `json:"notes"`
}

type purchaseRequest struct {
	CashAccountID   *string               `json:"cashAccountId"`
	TransactionDate string                `json:"transactionDate"`
	Description     *string               `json:"description"`
	BusinessUnitID  *string               `json:"businessUnitId"`
	BatchID         *string               `json:"batchId"`
	Items           []purchaseItemRequest `json:"items"`
}

type cashAccountRequest struct {
	Name      string `json:"name"`
	IsDefault *bool  `json:"isDefault"`
}

type otherExpenseRequest struct {
	CashAccountID   *string `json:"cashAccountId"`
	TransactionDate string  `json:"transactionDate"`
	Amount          float64 `json:"amount"`
	Description     string  `json:"description"`
	Category        *string `json:"category"`
	BusinessUnitID  *string `json:"businessUnitId"`
	BatchID         *string `json:"batchId"`
}

func (h *FinanceHandler) ListCashAccounts(c *fiber.Ctx) error {
	items, err := h.repo.ListCashAccounts(c.Context(), workspaceID(c))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, items)
}

func (h *FinanceHandler) GetCashAccount(c *fiber.Ctx) error {
	item, err := h.repo.GetCashAccount(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Akun kas tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *FinanceHandler) CreateCashAccount(c *fiber.Ctx) error {
	var req cashAccountRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama kas wajib diisi")
	}

	now := time.Now()
	item := &model.CashAccount{
		ID:          uuid.New().String(),
		WorkspaceID: workspaceID(c),
		Name:        name,
		IsDefault:   req.IsDefault != nil && *req.IsDefault,
		CreatedAt:   now,
	}
	if err := h.repo.CreateCashAccount(c.Context(), item); err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": item})
}

func (h *FinanceHandler) UpdateCashAccount(c *fiber.Ctx) error {
	var req cashAccountRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nama kas wajib diisi")
	}

	ws := workspaceID(c)
	existing, err := h.repo.GetCashAccount(c.Context(), ws, c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if existing == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Akun kas tidak ditemukan")
	}

	existing.Name = name
	if req.IsDefault != nil {
		existing.IsDefault = *req.IsDefault
	}
	if err := h.repo.UpdateCashAccount(c.Context(), existing); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Akun kas tidak ditemukan")
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, existing)
}

func (h *FinanceHandler) DeleteCashAccount(c *fiber.Ctx) error {
	if err := h.repo.DeleteCashAccount(c.Context(), workspaceID(c), c.Params("id")); err != nil {
		if err == sql.ErrNoRows {
			return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Akun kas tidak ditemukan")
		}
		if msg := err.Error(); msg == "minimal satu akun kas harus tetap ada" ||
			msg == "jadikan akun lain sebagai default sebelum menghapus" ||
			msg == "akun kas masih memiliki transaksi" {
			return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", msg)
		}
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *FinanceHandler) Summary(c *fiber.Ctx) error {
	start, end, err := currentMonthRange(time.Now())
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	summary, err := h.repo.MonthSummary(c.Context(), workspaceID(c), start, end)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OK(c, summary)
}

func (h *FinanceHandler) GetTransaction(c *fiber.Ctx) error {
	item, err := h.repo.GetTransaction(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Transaksi tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *FinanceHandler) ListTransactions(c *fiber.Ctx) error {
	filter, err := parseFinanceFilter(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	items, total, err := h.repo.ListTransactions(c.Context(), filter)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OKWithMeta(c, items, fiber.Map{
		"page":  filter.Page,
		"limit": filter.Limit,
		"total": total,
	})
}

func (h *FinanceHandler) ListPurchases(c *fiber.Ctx) error {
	filter, err := parseFinanceFilter(c)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	filter.TransactionType = string(model.TransactionPurchase)
	items, total, err := h.repo.ListTransactions(c.Context(), filter)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return httpx.OKWithMeta(c, items, fiber.Map{
		"page":  filter.Page,
		"limit": filter.Limit,
		"total": total,
	})
}

func (h *FinanceHandler) GetPurchase(c *fiber.Ctx) error {
	item, err := h.repo.GetTransaction(c.Context(), workspaceID(c), c.Params("id"))
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	if item == nil || item.TransactionType != model.TransactionPurchase {
		return httpx.Fail(c, fiber.StatusNotFound, "NOT_FOUND", "Pembelian tidak ditemukan")
	}
	return httpx.OK(c, item)
}

func (h *FinanceHandler) CreatePurchase(c *fiber.Ctx) error {
	var req purchaseRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}

	input, err := h.buildPurchaseInput(c, req)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	item, err := h.repo.CreatePurchase(c.Context(), uuid.New().String(), input)
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": item})
}

func (h *FinanceHandler) CreateOtherExpense(c *fiber.Ctx) error {
	var req otherExpenseRequest
	if err := c.BodyParser(&req); err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Payload tidak valid")
	}

	ws := workspaceID(c)
	txDate, err := parseDate(req.TransactionDate)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Tanggal transaksi tidak valid")
	}
	if strings.TrimSpace(req.Description) == "" {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Deskripsi wajib diisi")
	}
	if req.Amount <= 0 {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Nominal harus lebih dari 0")
	}

	cashAccountID, err := h.resolveCashAccount(c, req.CashAccountID)
	if err != nil {
		return httpx.Fail(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}

	item, err := h.repo.CreateOtherExpense(c.Context(), uuid.New().String(), repository.CreateOtherExpenseInput{
		WorkspaceID:     ws,
		CashAccountID:   cashAccountID,
		TransactionDate: txDate,
		Amount:          req.Amount,
		Description:     strings.TrimSpace(req.Description),
		Category:        req.Category,
		BusinessUnitID:  req.BusinessUnitID,
		BatchID:         req.BatchID,
	})
	if err != nil {
		return httpx.Fail(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "data": item})
}

func (h *FinanceHandler) buildPurchaseInput(c *fiber.Ctx, req purchaseRequest) (repository.CreatePurchaseInput, error) {
	ws := workspaceID(c)
	if len(req.Items) == 0 {
		return repository.CreatePurchaseInput{}, fmt.Errorf("minimal satu barang pembelian")
	}

	txDate, err := parseDate(req.TransactionDate)
	if err != nil {
		return repository.CreatePurchaseInput{}, fmt.Errorf("tanggal transaksi tidak valid")
	}

	cashAccountID, err := h.resolveCashAccount(c, req.CashAccountID)
	if err != nil {
		return repository.CreatePurchaseInput{}, err
	}

	items := make([]repository.CreatePurchaseItemInput, 0, len(req.Items))
	for i, row := range req.Items {
		name := strings.TrimSpace(row.ItemName)
		unit := strings.TrimSpace(row.Unit)
		if name == "" {
			return repository.CreatePurchaseInput{}, fmt.Errorf("nama barang baris %d wajib diisi", i+1)
		}
		if unit == "" {
			return repository.CreatePurchaseInput{}, fmt.Errorf("satuan baris %d wajib diisi", i+1)
		}
		if row.Qty <= 0 {
			return repository.CreatePurchaseInput{}, fmt.Errorf("qty baris %d harus lebih dari 0", i+1)
		}
		if row.UnitPrice < 0 {
			return repository.CreatePurchaseInput{}, fmt.Errorf("harga satuan baris %d tidak valid", i+1)
		}
		category := model.PurchaseCategory(strings.ToUpper(strings.TrimSpace(row.Category)))
		if category == "" {
			category = model.CategoryOther
		}
		if !isValidPurchaseCategory(category) {
			return repository.CreatePurchaseInput{}, fmt.Errorf("kategori baris %d tidak valid", i+1)
		}
		items = append(items, repository.CreatePurchaseItemInput{
			ItemName:     name,
			Category:     category,
			Qty:          row.Qty,
			Unit:         unit,
			UnitPrice:    row.UnitPrice,
			SupplierName: row.SupplierName,
			Notes:        row.Notes,
		})
	}

	return repository.CreatePurchaseInput{
		WorkspaceID:     ws,
		CashAccountID:   cashAccountID,
		TransactionDate: txDate,
		Description:     req.Description,
		BusinessUnitID:  req.BusinessUnitID,
		BatchID:         req.BatchID,
		Items:           items,
	}, nil
}

func (h *FinanceHandler) resolveCashAccount(c *fiber.Ctx, id *string) (string, error) {
	ws := workspaceID(c)
	if id != nil && strings.TrimSpace(*id) != "" {
		accountID := strings.TrimSpace(*id)
		account, err := h.repo.GetCashAccount(c.Context(), ws, accountID)
		if err != nil {
			return "", fmt.Errorf("akun kas tidak valid")
		}
		if account == nil {
			return "", fmt.Errorf("akun kas tidak ditemukan")
		}
		return accountID, nil
	}
	return h.repo.DefaultCashAccountID(c.Context(), ws)
}

func parseFinanceFilter(c *fiber.Ctx) (repository.FinanceFilter, error) {
	filter := repository.FinanceFilter{
		WorkspaceID:     workspaceID(c),
		TransactionType: c.Query("transactionType"),
	}

	if from := c.Query("from"); from != "" {
		t, err := parseDate(from)
		if err != nil {
			return filter, fmt.Errorf("filter from tidak valid")
		}
		filter.From = &t
	}
	if to := c.Query("to"); to != "" {
		t, err := parseDate(to)
		if err != nil {
			return filter, fmt.Errorf("filter to tidak valid")
		}
		filter.To = &t
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	filter.Page = page
	filter.Limit = limit
	return filter, nil
}

func parseDate(value string) (time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return time.Time{}, fmt.Errorf("empty date")
	}
	if t, err := time.Parse("2006-01-02", value); err == nil {
		return t, nil
	}
	return time.Parse(time.RFC3339, value)
}

func isValidPurchaseCategory(category model.PurchaseCategory) bool {
	switch category {
	case model.CategoryFeed, model.CategoryTool, model.CategoryMedicine,
		model.CategoryMaintenance, model.CategorySupply, model.CategoryOther:
		return true
	default:
		return false
	}
}

func currentMonthRange(now time.Time) (time.Time, time.Time, error) {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	local := now.In(loc)
	start := time.Date(local.Year(), local.Month(), 1, 0, 0, 0, 0, loc)
	end := start.AddDate(0, 1, 0)
	return start, end, nil
}
