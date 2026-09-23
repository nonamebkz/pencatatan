package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kikichan/pencatatan/backend/internal/model"
	financesvc "github.com/kikichan/pencatatan/backend/internal/service/finance"
)

type FinanceFilter struct {
	WorkspaceID     string
	TransactionType string
	From            *time.Time
	To              *time.Time
	Page            int
	Limit           int
}

type FinanceRepository struct {
	db *sql.DB
}

func NewFinanceRepository(db *sql.DB) *FinanceRepository {
	return &FinanceRepository{db: db}
}

func (r *FinanceRepository) ListCashAccounts(ctx context.Context, workspaceID string) ([]model.CashAccount, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, workspace_id, name, is_default, created_at
		FROM cash_accounts
		WHERE workspace_id = ?
		ORDER BY is_default DESC, name ASC`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.CashAccount, 0)
	for rows.Next() {
		var item model.CashAccount
		var isDefault int
		if err := rows.Scan(&item.ID, &item.WorkspaceID, &item.Name, &isDefault, &item.CreatedAt); err != nil {
			return nil, err
		}
		item.IsDefault = isDefault == 1
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *FinanceRepository) DefaultCashAccountID(ctx context.Context, workspaceID string) (string, error) {
	var id string
	err := r.db.QueryRowContext(ctx, `
		SELECT id FROM cash_accounts
		WHERE workspace_id = ?
		ORDER BY is_default DESC, created_at ASC
		LIMIT 1`, workspaceID).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return "", fmt.Errorf("no cash account for workspace")
	}
	return id, err
}

func (r *FinanceRepository) ListTransactions(ctx context.Context, filter FinanceFilter) ([]model.Transaction, int, error) {
	where, args := buildFinanceWhere(filter)

	var total int
	if err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM transactions t "+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	}
	offset := (page - 1) * limit

	query := `
		SELECT t.id, t.workspace_id, t.cash_account_id, c.name, t.transaction_type, t.amount,
		       t.transaction_date, t.description, t.business_unit_id, b.name, t.batch_id, t.category,
		       t.created_at, t.updated_at
		FROM transactions t
		JOIN cash_accounts c ON c.id = t.cash_account_id
		LEFT JOIN business_units b ON b.id = t.business_unit_id
	` + where + `
		ORDER BY t.transaction_date DESC, t.created_at DESC
		LIMIT ? OFFSET ?`

	listArgs := append(append([]any{}, args...), limit, offset)
	rows, err := r.db.QueryContext(ctx, query, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]model.Transaction, 0)
	for rows.Next() {
		item, err := scanTransaction(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}

func (r *FinanceRepository) GetTransaction(ctx context.Context, workspaceID, id string) (*model.Transaction, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT t.id, t.workspace_id, t.cash_account_id, c.name, t.transaction_type, t.amount,
		       t.transaction_date, t.description, t.business_unit_id, b.name, t.batch_id, t.category,
		       t.created_at, t.updated_at
		FROM transactions t
		JOIN cash_accounts c ON c.id = t.cash_account_id
		LEFT JOIN business_units b ON b.id = t.business_unit_id
		WHERE t.workspace_id = ? AND t.id = ?`, workspaceID, id)

	item, err := scanTransactionRow(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	items, err := r.loadLineItems(ctx, id)
	if err != nil {
		return nil, err
	}
	item.Items = items
	return item, nil
}

func (r *FinanceRepository) loadLineItems(ctx context.Context, transactionID string) ([]model.PurchaseLineItem, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, transaction_id, item_name, item_name_normalized, category, qty, unit, unit_price, total_price,
		       supplier_name, notes, created_at
		FROM purchase_line_items
		WHERE transaction_id = ?
		ORDER BY created_at ASC`, transactionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.PurchaseLineItem, 0)
	for rows.Next() {
		item, err := scanLineItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

type CreatePurchaseInput struct {
	WorkspaceID     string
	CashAccountID   string
	TransactionDate time.Time
	Description     *string
	BusinessUnitID  *string
	BatchID         *string
	Items           []CreatePurchaseItemInput
}

type CreatePurchaseItemInput struct {
	ItemName     string
	Category     model.PurchaseCategory
	Qty          float64
	Unit         string
	UnitPrice    float64
	SupplierName *string
	Notes        *string
}

func (r *FinanceRepository) CreatePurchase(ctx context.Context, txID string, input CreatePurchaseInput) (*model.Transaction, error) {
	var total float64
	for _, item := range input.Items {
		lineTotal := financesvc.RoundMoney(item.Qty * item.UnitPrice)
		total += lineTotal
	}
	total = financesvc.RoundMoney(total)

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	now := time.Now().UTC()
	_, err = tx.ExecContext(ctx, `
		INSERT INTO transactions (
			id, workspace_id, cash_account_id, transaction_type, amount, transaction_date,
			description, business_unit_id, batch_id, created_at, updated_at
		) VALUES (?, ?, ?, 'PURCHASE', ?, ?, ?, ?, ?, ?, ?)`,
		txID, input.WorkspaceID, input.CashAccountID, total, input.TransactionDate,
		input.Description, input.BusinessUnitID, input.BatchID, now, now,
	)
	if err != nil {
		return nil, err
	}

	for _, item := range input.Items {
		lineTotal := financesvc.RoundMoney(item.Qty * item.UnitPrice)
		itemID := uuid.New().String()
		normalized := financesvc.NormalizeItemName(item.ItemName)
		_, err = tx.ExecContext(ctx, `
			INSERT INTO purchase_line_items (
				id, transaction_id, item_name, item_name_normalized, category, qty, unit, unit_price, total_price,
				supplier_name, notes, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			itemID, txID, strings.TrimSpace(item.ItemName), normalized, item.Category, item.Qty, item.Unit,
			item.UnitPrice, lineTotal, item.SupplierName, item.Notes, now,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return r.GetTransaction(ctx, input.WorkspaceID, txID)
}

type CreateOtherExpenseInput struct {
	WorkspaceID     string
	CashAccountID   string
	TransactionDate time.Time
	Amount          float64
	Description     string
	Category        *string
	BusinessUnitID  *string
	BatchID         *string
}

func (r *FinanceRepository) CreateOtherExpense(ctx context.Context, txID string, input CreateOtherExpenseInput) (*model.Transaction, error) {
	now := time.Now().UTC()
	amount := financesvc.RoundMoney(input.Amount)
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO transactions (
			id, workspace_id, cash_account_id, transaction_type, amount, transaction_date,
			description, business_unit_id, batch_id, category, created_at, updated_at
		) VALUES (?, ?, ?, 'OTHER_EXPENSE', ?, ?, ?, ?, ?, ?, ?, ?)`,
		txID, input.WorkspaceID, input.CashAccountID, amount, input.TransactionDate,
		input.Description, input.BusinessUnitID, input.BatchID, input.Category, now, now,
	)
	if err != nil {
		return nil, err
	}
	return r.GetTransaction(ctx, input.WorkspaceID, txID)
}

func (r *FinanceRepository) MonthSummary(ctx context.Context, workspaceID string, monthStart, monthEnd time.Time) (*model.FinanceSummary, error) {
	var purchases, otherExpenses sql.NullFloat64
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount END), 0),
			COALESCE(SUM(CASE WHEN transaction_type = 'OTHER_EXPENSE' THEN amount END), 0),
			COUNT(*)
		FROM transactions
		WHERE workspace_id = ?
		  AND transaction_date >= ?
		  AND transaction_date < ?`,
		workspaceID, monthStart, monthEnd,
	).Scan(&purchases, &otherExpenses, &count)
	if err != nil {
		return nil, err
	}

	summary := &model.FinanceSummary{TransactionCount: count}
	if purchases.Valid {
		summary.MonthPurchases = purchases.Float64
	}
	if otherExpenses.Valid {
		summary.MonthOtherExpenses = otherExpenses.Float64
	}
	summary.MonthTotalOut = financesvc.RoundMoney(summary.MonthPurchases + summary.MonthOtherExpenses)
	return summary, nil
}

func buildFinanceWhere(filter FinanceFilter) (string, []any) {
	clauses := []string{"t.workspace_id = ?"}
	args := []any{filter.WorkspaceID}

	if filter.TransactionType != "" {
		clauses = append(clauses, "t.transaction_type = ?")
		args = append(args, filter.TransactionType)
	}
	if filter.From != nil {
		clauses = append(clauses, "t.transaction_date >= ?")
		args = append(args, *filter.From)
	}
	if filter.To != nil {
		clauses = append(clauses, "t.transaction_date <= ?")
		args = append(args, *filter.To)
	}
	return "WHERE " + strings.Join(clauses, " AND "), args
}

func scanTransaction(rows *sql.Rows) (model.Transaction, error) {
	var item model.Transaction
	var txType string
	var txDate time.Time
	var description sql.NullString
	var businessUnitID sql.NullString
	var businessUnitName sql.NullString
	var batchID sql.NullString
	var category sql.NullString

	err := rows.Scan(
		&item.ID, &item.WorkspaceID, &item.CashAccountID, &item.CashAccountName, &txType, &item.Amount,
		&txDate, &description, &businessUnitID, &businessUnitName, &batchID, &category,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return item, err
	}
	applyTransactionFields(&item, txType, txDate, description, businessUnitID, businessUnitName, batchID, category)
	return item, nil
}

func scanTransactionRow(row *sql.Row) (*model.Transaction, error) {
	var item model.Transaction
	var txType string
	var txDate time.Time
	var description sql.NullString
	var businessUnitID sql.NullString
	var businessUnitName sql.NullString
	var batchID sql.NullString
	var category sql.NullString

	err := row.Scan(
		&item.ID, &item.WorkspaceID, &item.CashAccountID, &item.CashAccountName, &txType, &item.Amount,
		&txDate, &description, &businessUnitID, &businessUnitName, &batchID, &category,
		&item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	applyTransactionFields(&item, txType, txDate, description, businessUnitID, businessUnitName, batchID, category)
	return &item, nil
}

func applyTransactionFields(
	item *model.Transaction,
	txType string,
	txDate time.Time,
	description sql.NullString,
	businessUnitID sql.NullString,
	businessUnitName sql.NullString,
	batchID sql.NullString,
	category sql.NullString,
) {
	item.TransactionType = model.TransactionType(txType)
	item.TransactionDate = txDate.Format("2006-01-02")
	if description.Valid {
		value := description.String
		item.Description = &value
	}
	if businessUnitID.Valid {
		value := businessUnitID.String
		item.BusinessUnitID = &value
	}
	if businessUnitName.Valid {
		item.BusinessUnitName = businessUnitName.String
	}
	if batchID.Valid {
		value := batchID.String
		item.BatchID = &value
	}
	if category.Valid {
		value := category.String
		item.Category = &value
	}
}

func scanLineItem(rows *sql.Rows) (model.PurchaseLineItem, error) {
	var item model.PurchaseLineItem
	var category string
	var supplier sql.NullString
	var notes sql.NullString
	err := rows.Scan(
		&item.ID, &item.TransactionID, &item.ItemName, &item.ItemNameNormalized, &category,
		&item.Qty, &item.Unit, &item.UnitPrice, &item.TotalPrice, &supplier, &notes, &item.CreatedAt,
	)
	if err != nil {
		return item, err
	}
	item.Category = model.PurchaseCategory(category)
	if supplier.Valid {
		value := supplier.String
		item.SupplierName = &value
	}
	if notes.Valid {
		value := notes.String
		item.Notes = &value
	}
	return item, nil
}
