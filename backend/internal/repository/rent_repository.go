package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/kikichan/pencatatan/backend/internal/model"
	rentsvc "github.com/kikichan/pencatatan/backend/internal/service/rent"
)

type RentRepository struct {
	db *sql.DB
}

func NewRentRepository(db *sql.DB) *RentRepository {
	return &RentRepository{db: db}
}

type RentListFilter struct {
	WorkspaceID    string
	BusinessUnitID string
}

type CreateRentContractInput struct {
	WorkspaceID     string
	BusinessUnitID  string
	StartDate       time.Time
	DurationMonths  int
	TotalAmount     float64
	PaymentScheme   model.PaymentScheme
	Notes           *string
	ContractID      string
	Schedules       []model.PaymentSchedule
	EndDate         time.Time
	MonthlyEquiv    float64
}

type PayScheduleInput struct {
	WorkspaceID     string
	ScheduleID      string
	PaymentDate     time.Time
	CashAccountID   string
	Notes           *string
	PaymentID       string
	TransactionID   string
}

func (r *RentRepository) PondExists(ctx context.Context, workspaceID, pondID string) (bool, error) {
	var n int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM business_units WHERE id = ? AND workspace_id = ?`,
		pondID, workspaceID,
	).Scan(&n)
	return n > 0, err
}

func (r *RentRepository) CreateContract(ctx context.Context, input CreateRentContractInput) (*model.PeriodicContract, error) {
	now := time.Now().UTC()
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO periodic_contracts (
			id, workspace_id, business_unit_id, start_date, end_date, duration_months,
			total_amount, payment_scheme, monthly_equivalent, notes, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		input.ContractID, input.WorkspaceID, input.BusinessUnitID,
		input.StartDate, input.EndDate, input.DurationMonths,
		input.TotalAmount, input.PaymentScheme, input.MonthlyEquiv, input.Notes, now, now,
	)
	if err != nil {
		return nil, err
	}

	for _, s := range input.Schedules {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO payment_schedules (id, contract_id, due_date, amount, is_paid, created_at)
			VALUES (?, ?, ?, ?, 0, ?)`,
			s.ID, s.ContractID, s.DueDate, s.Amount, now,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return r.GetContract(ctx, input.WorkspaceID, input.ContractID)
}

func (r *RentRepository) ListContracts(ctx context.Context, filter RentListFilter) ([]model.PeriodicContract, error) {
	clauses := []string{"c.workspace_id = ?"}
	args := []any{filter.WorkspaceID}
	if filter.BusinessUnitID != "" {
		clauses = append(clauses, "c.business_unit_id = ?")
		args = append(args, filter.BusinessUnitID)
	}
	where := "WHERE " + joinClauses(clauses)

	rows, err := r.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT c.id, c.workspace_id, c.business_unit_id, bu.name,
			c.start_date, c.end_date, c.duration_months, c.total_amount,
			c.payment_scheme, c.monthly_equivalent, c.notes, c.created_at, c.updated_at
		FROM periodic_contracts c
		INNER JOIN business_units bu ON bu.id = c.business_unit_id
		%s
		ORDER BY c.start_date DESC`, where), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.PeriodicContract
	for rows.Next() {
		c, err := scanContractRow(rows)
		if err != nil {
			return nil, err
		}
		schedules, err := r.listSchedules(ctx, c.ID)
		if err != nil {
			return nil, err
		}
		c.Schedules = schedules
		enrichContract(&c, schedules)
		items = append(items, c)
	}
	return items, rows.Err()
}

func (r *RentRepository) GetContract(ctx context.Context, workspaceID, id string) (*model.PeriodicContract, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT c.id, c.workspace_id, c.business_unit_id, bu.name,
			c.start_date, c.end_date, c.duration_months, c.total_amount,
			c.payment_scheme, c.monthly_equivalent, c.notes, c.created_at, c.updated_at
		FROM periodic_contracts c
		INNER JOIN business_units bu ON bu.id = c.business_unit_id
		WHERE c.workspace_id = ? AND c.id = ?`,
		workspaceID, id,
	)
	c, err := scanContractRow(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	schedules, err := r.listSchedules(ctx, c.ID)
	if err != nil {
		return nil, err
	}
	c.Schedules = schedules
	enrichContract(&c, schedules)
	return &c, nil
}

func (r *RentRepository) PaySchedule(ctx context.Context, input PayScheduleInput) (*model.ContractPayment, *model.Transaction, error) {
	schedule, contract, err := r.getScheduleWithContract(ctx, input.WorkspaceID, input.ScheduleID)
	if err != nil {
		return nil, nil, err
	}
	if schedule == nil {
		return nil, nil, fmt.Errorf("NOT_FOUND")
	}
	if schedule.IsPaid {
		return nil, nil, fmt.Errorf("ALREADY_PAID")
	}

	now := time.Now().UTC()
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, nil, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO transactions (
			id, workspace_id, cash_account_id, transaction_type, amount, transaction_date,
			description, business_unit_id, created_at, updated_at
		) VALUES (?, ?, ?, 'RENT_PAYMENT', ?, ?, ?, ?, ?, ?)`,
		input.TransactionID, input.WorkspaceID, input.CashAccountID, schedule.Amount, input.PaymentDate,
		fmt.Sprintf("Bayar sewa kolam — jatuh tempo %s", schedule.DueDate),
		contract.BusinessUnitID, now, now,
	)
	if err != nil {
		return nil, nil, err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO contract_payments (id, schedule_id, transaction_id, amount, payment_date, notes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		input.PaymentID, input.ScheduleID, input.TransactionID, schedule.Amount, input.PaymentDate, input.Notes, now,
	)
	if err != nil {
		return nil, nil, err
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE payment_schedules SET is_paid = 1, paid_at = ? WHERE id = ?`,
		now, input.ScheduleID,
	)
	if err != nil {
		return nil, nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, nil, err
	}

	payment := &model.ContractPayment{
		ID:            input.PaymentID,
		ScheduleID:    input.ScheduleID,
		TransactionID: input.TransactionID,
		Amount:        schedule.Amount,
		PaymentDate:   input.PaymentDate.Format("2006-01-02"),
		Notes:         input.Notes,
		CreatedAt:     now,
	}

	financeRepo := NewFinanceRepository(r.db)
	transaction, err := financeRepo.GetTransaction(ctx, input.WorkspaceID, input.TransactionID)
	return payment, transaction, err
}

func (r *RentRepository) getScheduleWithContract(ctx context.Context, workspaceID, scheduleID string) (*model.PaymentSchedule, *model.PeriodicContract, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT s.id, s.contract_id, s.due_date, s.amount, s.is_paid, s.paid_at,
			c.id, c.workspace_id, c.business_unit_id, bu.name,
			c.start_date, c.end_date, c.duration_months, c.total_amount,
			c.payment_scheme, c.monthly_equivalent, c.notes, c.created_at, c.updated_at
		FROM payment_schedules s
		INNER JOIN periodic_contracts c ON c.id = s.contract_id
		INNER JOIN business_units bu ON bu.id = c.business_unit_id
		WHERE s.id = ? AND c.workspace_id = ?`,
		scheduleID, workspaceID,
	)
	var s model.PaymentSchedule
	var paidAt sql.NullTime
	var notes sql.NullString
	var c model.PeriodicContract
	var dueDate, contractStart, contractEnd time.Time
	err := row.Scan(
		&s.ID, &s.ContractID, &dueDate, &s.Amount, &s.IsPaid, &paidAt,
		&c.ID, &c.WorkspaceID, &c.BusinessUnitID, &c.BusinessUnitName,
		&contractStart, &contractEnd, &c.DurationMonths, &c.TotalAmount,
		&c.PaymentScheme, &c.MonthlyEquivalent, &notes, &c.CreatedAt, &c.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, err
	}
	s.DueDate = dueDate.Format("2006-01-02")
	if paidAt.Valid {
		t := paidAt.Time
		s.PaidAt = &t
	}
	c.StartDate = contractStart.Format("2006-01-02")
	c.EndDate = contractEnd.Format("2006-01-02")
	if notes.Valid {
		c.Notes = &notes.String
	}
	return &s, &c, nil
}

func (r *RentRepository) listSchedules(ctx context.Context, contractID string) ([]model.PaymentSchedule, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, contract_id, due_date, amount, is_paid, paid_at
		FROM payment_schedules WHERE contract_id = ? ORDER BY due_date`,
		contractID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.PaymentSchedule
	for rows.Next() {
		var s model.PaymentSchedule
		var due time.Time
		var paidAt sql.NullTime
		if err := rows.Scan(&s.ID, &s.ContractID, &due, &s.Amount, &s.IsPaid, &paidAt); err != nil {
			return nil, err
		}
		s.DueDate = due.Format("2006-01-02")
		if paidAt.Valid {
			t := paidAt.Time
			s.PaidAt = &t
		}
		items = append(items, s)
	}
	return items, rows.Err()
}

type contractScanner interface {
	Scan(dest ...any) error
}

func scanContractRow(row contractScanner) (model.PeriodicContract, error) {
	var c model.PeriodicContract
	var start, end time.Time
	var notes sql.NullString
	err := row.Scan(
		&c.ID, &c.WorkspaceID, &c.BusinessUnitID, &c.BusinessUnitName,
		&start, &end, &c.DurationMonths, &c.TotalAmount,
		&c.PaymentScheme, &c.MonthlyEquivalent, &notes, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return c, err
	}
	c.StartDate = start.Format("2006-01-02")
	c.EndDate = end.Format("2006-01-02")
	if notes.Valid {
		c.Notes = &notes.String
	}
	return c, nil
}

func enrichContract(c *model.PeriodicContract, schedules []model.PaymentSchedule) {
	end, _ := time.Parse("2006-01-02", c.EndDate)
	c.TimeStatus = rentsvc.ResolveTimeStatus(end, time.Now())
	c.PaymentStatus = rentsvc.ResolvePaymentStatus(schedules)
	c.PaidAmount = rentsvc.PaidTotal(schedules)
	c.RemainingAmount = c.TotalAmount - c.PaidAmount
	if c.RemainingAmount < 0 {
		c.RemainingAmount = 0
	}
}

func joinClauses(parts []string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += " AND "
		}
		out += p
	}
	return out
}
