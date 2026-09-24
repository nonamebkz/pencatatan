package repository

import (
	"context"
	"database/sql"
	"strings"
	"time"

	financesvc "github.com/kikichan/pencatatan/backend/internal/service/finance"
	"github.com/kikichan/pencatatan/backend/internal/model"
)

type ReportDateFilter struct {
	WorkspaceID    string
	From           time.Time
	To             time.Time
	BusinessUnitID string
}

type ReportRepository struct {
	db *sql.DB
}

func NewReportRepository(db *sql.DB) *ReportRepository {
	return &ReportRepository{db: db}
}

func (r *ReportRepository) PurchaseReport(ctx context.Context, filter ReportDateFilter) ([]model.PurchaseReportRow, model.PurchaseReportFooter, error) {
	clauses := []string{
		"t.workspace_id = ?",
		"t.transaction_type = 'PURCHASE'",
		"t.transaction_date >= ?",
		"t.transaction_date <= ?",
	}
	args := []any{filter.WorkspaceID, filter.From, filter.To}
	if filter.BusinessUnitID != "" {
		clauses = append(clauses, "t.business_unit_id = ?")
		args = append(args, filter.BusinessUnitID)
	}
	where := "WHERE " + strings.Join(clauses, " AND ")

	rows, err := r.db.QueryContext(ctx, `
		SELECT t.transaction_date, pli.item_name, pli.category, pli.qty, pli.unit, pli.unit_price, pli.total_price,
		       pli.supplier_name, bu.name, t.id
		FROM purchase_line_items pli
		INNER JOIN transactions t ON t.id = pli.transaction_id
		LEFT JOIN business_units bu ON bu.id = t.business_unit_id
		`+where+`
		ORDER BY t.transaction_date DESC, pli.created_at DESC`, args...)
	if err != nil {
		return nil, model.PurchaseReportFooter{}, err
	}
	defer rows.Close()

	items := make([]model.PurchaseReportRow, 0)
	txIDs := make(map[string]struct{})
	var total float64
	for rows.Next() {
		var row model.PurchaseReportRow
		var txDate time.Time
		var supplier sql.NullString
		var pond sql.NullString
		if err := rows.Scan(
			&txDate, &row.ItemName, &row.Category, &row.Qty, &row.Unit, &row.UnitPrice, &row.TotalPrice,
			&supplier, &pond, &row.TransactionID,
		); err != nil {
			return nil, model.PurchaseReportFooter{}, err
		}
		row.TransactionDate = txDate.Format("2006-01-02")
		if supplier.Valid {
			row.SupplierName = &supplier.String
		}
		if pond.Valid {
			row.PondName = &pond.String
		}
		total += row.TotalPrice
		txIDs[row.TransactionID] = struct{}{}
		items = append(items, row)
	}
	if err := rows.Err(); err != nil {
		return nil, model.PurchaseReportFooter{}, err
	}

	footer := model.PurchaseReportFooter{
		TotalAmount:      financesvc.RoundMoney(total),
		TransactionCount: len(txIDs),
		LineCount:        len(items),
	}
	return items, footer, nil
}

func normalizeItemName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func (r *ReportRepository) SearchPurchaseItemNames(ctx context.Context, workspaceID, q string) ([]string, error) {
	q = strings.TrimSpace(q)
	clauses := []string{"t.workspace_id = ?", "t.transaction_type = 'PURCHASE'"}
	args := []any{workspaceID}
	if q != "" {
		clauses = append(clauses, "pli.item_name_normalized LIKE ?")
		args = append(args, "%"+normalizeItemName(q)+"%")
	}
	where := "WHERE " + strings.Join(clauses, " AND ")

	rows, err := r.db.QueryContext(ctx, `
		SELECT DISTINCT pli.item_name
		FROM purchase_line_items pli
		INNER JOIN transactions t ON t.id = pli.transaction_id
		`+where+`
		ORDER BY pli.item_name ASC
		LIMIT 20`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	names := make([]string, 0)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		names = append(names, name)
	}
	return names, rows.Err()
}

func (r *ReportRepository) PriceHistory(ctx context.Context, workspaceID, itemName string) ([]model.PriceHistoryEntry, model.PriceHistoryFooter, error) {
	norm := normalizeItemName(itemName)
	rows, err := r.db.QueryContext(ctx, `
		SELECT t.transaction_date, pli.item_name, pli.unit_price, pli.supplier_name
		FROM purchase_line_items pli
		INNER JOIN transactions t ON t.id = pli.transaction_id
		WHERE t.workspace_id = ? AND t.transaction_type = 'PURCHASE' AND pli.item_name_normalized = ?
		ORDER BY t.transaction_date ASC, pli.created_at ASC`,
		workspaceID, norm,
	)
	if err != nil {
		return nil, model.PriceHistoryFooter{}, err
	}
	defer rows.Close()

	entries := make([]model.PriceHistoryEntry, 0)
	var prevPrice float64
	var hasPrev bool
	var minP, maxP, lastP float64
	for rows.Next() {
		var e model.PriceHistoryEntry
		var txDate time.Time
		var supplier sql.NullString
		if err := rows.Scan(&txDate, &e.ItemName, &e.UnitPrice, &supplier); err != nil {
			return nil, model.PriceHistoryFooter{}, err
		}
		e.TransactionDate = txDate.Format("2006-01-02")
		if supplier.Valid {
			e.SupplierName = &supplier.String
		}
		if hasPrev {
			e.PriceDelta = financesvc.RoundMoney(e.UnitPrice - prevPrice)
		}
		prevPrice = e.UnitPrice
		hasPrev = true
		if len(entries) == 0 {
			minP, maxP, lastP = e.UnitPrice, e.UnitPrice, e.UnitPrice
		} else {
			if e.UnitPrice < minP {
				minP = e.UnitPrice
			}
			if e.UnitPrice > maxP {
				maxP = e.UnitPrice
			}
			lastP = e.UnitPrice
		}
		entries = append(entries, e)
	}
	if err := rows.Err(); err != nil {
		return nil, model.PriceHistoryFooter{}, err
	}
	return entries, model.PriceHistoryFooter{MinPrice: minP, MaxPrice: maxP, LastPrice: lastP}, nil
}

func (r *ReportRepository) OperationalSummary(ctx context.Context, filter ReportDateFilter) (*model.OperationalSummaryReport, error) {
	ws := filter.WorkspaceID
	from, to := filter.From, filter.To

	var purchases, rent, profitShare sql.NullFloat64
	err := r.db.QueryRowContext(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN transaction_type = 'PURCHASE' THEN amount END), 0),
			COALESCE(SUM(CASE WHEN transaction_type = 'RENT_PAYMENT' THEN amount END), 0),
			COALESCE(SUM(CASE WHEN transaction_type = 'PROFIT_SHARE_PAYOUT' THEN amount END), 0)
		FROM transactions
		WHERE workspace_id = ? AND transaction_date >= ? AND transaction_date <= ?`,
		ws, from, to,
	).Scan(&purchases, &rent, &profitShare)
	if err != nil {
		return nil, err
	}

	var feed sql.NullFloat64
	err = r.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(pli.total_price), 0)
		FROM purchase_line_items pli
		INNER JOIN transactions t ON t.id = pli.transaction_id
		WHERE t.workspace_id = ? AND t.transaction_type = 'PURCHASE'
		  AND pli.category = 'FEED'
		  AND t.transaction_date >= ? AND t.transaction_date <= ?`,
		ws, from, to,
	).Scan(&feed)
	if err != nil {
		return nil, err
	}

	topCats, err := r.topPurchaseCategories(ctx, ws, from, to)
	if err != nil {
		return nil, err
	}
	byType, err := r.transactionsByType(ctx, ws, from, to)
	if err != nil {
		return nil, err
	}

	report := &model.OperationalSummaryReport{
		PeriodFrom:            from.Format("2006-01-02"),
		PeriodTo:              to.Format("2006-01-02"),
		TopPurchaseCategories: topCats,
		ByTransactionType:     byType,
	}
	if purchases.Valid {
		report.TotalPurchases = purchases.Float64
	}
	if feed.Valid {
		report.TotalFeed = feed.Float64
	}
	if rent.Valid {
		report.TotalRentPaid = rent.Float64
	}
	if profitShare.Valid {
		report.TotalProfitSharePaid = profitShare.Float64
	}
	report.GrandTotalOperational = financesvc.RoundMoney(
		report.TotalPurchases + report.TotalRentPaid + report.TotalProfitSharePaid,
	)
	return report, nil
}

func (r *ReportRepository) topPurchaseCategories(ctx context.Context, workspaceID string, from, to time.Time) ([]model.CategoryAmount, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT pli.category, COALESCE(SUM(pli.total_price), 0) AS amount
		FROM purchase_line_items pli
		INNER JOIN transactions t ON t.id = pli.transaction_id
		WHERE t.workspace_id = ? AND t.transaction_type = 'PURCHASE'
		  AND t.transaction_date >= ? AND t.transaction_date <= ?
		GROUP BY pli.category
		ORDER BY amount DESC
		LIMIT 5`,
		workspaceID, from, to,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.CategoryAmount, 0)
	for rows.Next() {
		var row model.CategoryAmount
		if err := rows.Scan(&row.Category, &row.Amount); err != nil {
			return nil, err
		}
		row.Amount = financesvc.RoundMoney(row.Amount)
		out = append(out, row)
	}
	return out, rows.Err()
}

func (r *ReportRepository) transactionsByType(ctx context.Context, workspaceID string, from, to time.Time) ([]model.TransactionTypeSummary, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT transaction_type, COUNT(*), COALESCE(SUM(amount), 0)
		FROM transactions
		WHERE workspace_id = ? AND transaction_date >= ? AND transaction_date <= ?
		GROUP BY transaction_type
		ORDER BY SUM(amount) DESC`,
		workspaceID, from, to,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.TransactionTypeSummary, 0)
	for rows.Next() {
		var row model.TransactionTypeSummary
		if err := rows.Scan(&row.TransactionType, &row.Count, &row.TotalAmount); err != nil {
			return nil, err
		}
		row.TotalAmount = financesvc.RoundMoney(row.TotalAmount)
		out = append(out, row)
	}
	return out, rows.Err()
}
