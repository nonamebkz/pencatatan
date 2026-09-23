package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/service/waterquality"
)

type PondRepository struct {
	db *sql.DB
}

func NewPondRepository(db *sql.DB) *PondRepository {
	return &PondRepository{db: db}
}

func (r *PondRepository) List(ctx context.Context, workspaceID string, status string) ([]model.BusinessUnit, error) {
	query := `
		SELECT id, workspace_id, unit_type, name, location, size, owner_name, status, notes, water_quality_config, created_at, updated_at
		FROM business_units
		WHERE workspace_id = ?`
	args := []any{workspaceID}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}
	query += " ORDER BY name ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.BusinessUnit, 0)
	for rows.Next() {
		item, err := scanBusinessUnit(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *PondRepository) GetByID(ctx context.Context, workspaceID, id string) (*model.BusinessUnit, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, workspace_id, unit_type, name, location, size, owner_name, status, notes, water_quality_config, created_at, updated_at
		FROM business_units
		WHERE workspace_id = ? AND id = ?`, workspaceID, id)

	item, err := scanBusinessUnitRow(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return item, err
}

func (r *PondRepository) Create(ctx context.Context, pond *model.BusinessUnit) error {
	cfgJSON, err := marshalWaterQualityConfig(pond.WaterQualityConfig)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO business_units (
			id, workspace_id, unit_type, name, location, size, owner_name, status, notes, water_quality_config, created_at, updated_at
		) VALUES (?, ?, 'POND', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		pond.ID, pond.WorkspaceID, pond.Name, pond.Location, pond.Size, pond.OwnerName, pond.Status, pond.Notes, cfgJSON, pond.CreatedAt, pond.UpdatedAt,
	)
	return err
}

func (r *PondRepository) Update(ctx context.Context, pond *model.BusinessUnit) error {
	cfgJSON, err := marshalWaterQualityConfig(pond.WaterQualityConfig)
	if err != nil {
		return err
	}
	result, err := r.db.ExecContext(ctx, `
		UPDATE business_units
		SET name = ?, location = ?, size = ?, owner_name = ?, status = ?, notes = ?, water_quality_config = ?, updated_at = ?
		WHERE id = ? AND workspace_id = ?`,
		pond.Name, pond.Location, pond.Size, pond.OwnerName, pond.Status, pond.Notes, cfgJSON, pond.UpdatedAt, pond.ID, pond.WorkspaceID,
	)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *PondRepository) Delete(ctx context.Context, workspaceID, id string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := deletePondRelatedData(ctx, tx, workspaceID, id); err != nil {
		return err
	}

	result, err := tx.ExecContext(ctx, `DELETE FROM business_units WHERE id = ? AND workspace_id = ?`, id, workspaceID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return tx.Commit()
}

func deletePondRelatedData(ctx context.Context, tx *sql.Tx, workspaceID, businessUnitID string) error {
	// Transaksi keuangan (+ baris pembelian) yang terhubung ke kolam atau batch kolam ini.
	if _, err := tx.ExecContext(ctx, `
		DELETE pli FROM purchase_line_items pli
		INNER JOIN transactions t ON t.id = pli.transaction_id
		LEFT JOIN batches b ON b.id = t.batch_id AND b.workspace_id = ? AND b.business_unit_id = ?
		WHERE t.workspace_id = ?
		  AND (t.business_unit_id = ? OR b.id IS NOT NULL)`,
		workspaceID, businessUnitID, workspaceID, businessUnitID,
	); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		DELETE t FROM transactions t
		LEFT JOIN batches b ON b.id = t.batch_id AND b.workspace_id = ? AND b.business_unit_id = ?
		WHERE t.workspace_id = ?
		  AND (t.business_unit_id = ? OR b.id IS NOT NULL)`,
		workspaceID, businessUnitID, workspaceID, businessUnitID,
	); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		DELETE FROM water_quality_logs WHERE workspace_id = ? AND business_unit_id = ?`,
		workspaceID, businessUnitID,
	); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		DELETE FROM batches WHERE workspace_id = ? AND business_unit_id = ?`,
		workspaceID, businessUnitID,
	); err != nil {
		return err
	}

	return nil
}

func scanBusinessUnit(rows *sql.Rows) (model.BusinessUnit, error) {
	var item model.BusinessUnit
	var cfgRaw []byte
	err := rows.Scan(
		&item.ID, &item.WorkspaceID, &item.UnitType, &item.Name, &item.Location, &item.Size,
		&item.OwnerName, &item.Status, &item.Notes, &cfgRaw, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return item, err
	}
	item.WaterQualityConfig = parseWaterQualityConfigJSON(cfgRaw)
	return item, nil
}

func scanBusinessUnitRow(row *sql.Row) (*model.BusinessUnit, error) {
	var item model.BusinessUnit
	var cfgRaw []byte
	err := row.Scan(
		&item.ID, &item.WorkspaceID, &item.UnitType, &item.Name, &item.Location, &item.Size,
		&item.OwnerName, &item.Status, &item.Notes, &cfgRaw, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	item.WaterQualityConfig = parseWaterQualityConfigJSON(cfgRaw)
	return &item, nil
}

func parseWaterQualityConfigJSON(raw []byte) model.WaterQualityConfig {
	if len(raw) == 0 {
		return waterquality.MergeWithDefaults(waterquality.DefaultConfig())
	}
	var cfg model.WaterQualityConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return waterquality.MergeWithDefaults(waterquality.DefaultConfig())
	}
	return waterquality.MergeWithDefaults(cfg)
}

func marshalWaterQualityConfig(cfg model.WaterQualityConfig) ([]byte, error) {
	cfg = waterquality.MergeWithDefaults(cfg)
	return json.Marshal(cfg)
}

type WaterQualityFilter struct {
	WorkspaceID    string
	BusinessUnitID string
	BatchID        string
	From           *time.Time
	To             *time.Time
	Page           int
	Limit          int
}

type WaterQualityRepository struct {
	db *sql.DB
}

func NewWaterQualityRepository(db *sql.DB) *WaterQualityRepository {
	return &WaterQualityRepository{db: db}
}

func (r *WaterQualityRepository) List(ctx context.Context, filter WaterQualityFilter) ([]model.WaterQualityLog, int, error) {
	where, args := buildWaterQualityWhere(filter)

	countQuery := "SELECT COUNT(*) FROM water_quality_logs w " + where
	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
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
		SELECT w.id, w.workspace_id, w.business_unit_id, b.name, w.batch_id, w.measured_at,
		       w.ammonia_ppm, w.ph, w.notes, w.created_at, w.updated_at
		FROM water_quality_logs w
		JOIN business_units b ON b.id = w.business_unit_id
	` + where + `
		ORDER BY w.measured_at DESC
		LIMIT ? OFFSET ?`

	listArgs := append(append([]any{}, args...), limit, offset)
	rows, err := r.db.QueryContext(ctx, query, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	items := make([]model.WaterQualityLog, 0)
	for rows.Next() {
		item, err := scanWaterQualityLog(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}

func (r *WaterQualityRepository) GetByID(ctx context.Context, workspaceID, id string) (*model.WaterQualityLog, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT w.id, w.workspace_id, w.business_unit_id, b.name, w.batch_id, w.measured_at,
		       w.ammonia_ppm, w.ph, w.notes, w.created_at, w.updated_at
		FROM water_quality_logs w
		JOIN business_units b ON b.id = w.business_unit_id
		WHERE w.workspace_id = ? AND w.id = ?`, workspaceID, id)

	item, err := scanWaterQualityLogRow(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return item, err
}

func (r *WaterQualityRepository) Create(ctx context.Context, log *model.WaterQualityLog) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO water_quality_logs (
			id, workspace_id, business_unit_id, batch_id, measured_at, ammonia_ppm, ph, notes, created_at, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		log.ID, log.WorkspaceID, log.BusinessUnitID, log.BatchID, log.MeasuredAt, log.AmmoniaPPM, log.PH, log.Notes, log.CreatedAt, log.UpdatedAt,
	)
	return err
}

func (r *WaterQualityRepository) Update(ctx context.Context, log *model.WaterQualityLog) error {
	result, err := r.db.ExecContext(ctx, `
		UPDATE water_quality_logs
		SET business_unit_id = ?, batch_id = ?, measured_at = ?, ammonia_ppm = ?, ph = ?, notes = ?, updated_at = ?
		WHERE id = ? AND workspace_id = ?`,
		log.BusinessUnitID, log.BatchID, log.MeasuredAt, log.AmmoniaPPM, log.PH, log.Notes, log.UpdatedAt, log.ID, log.WorkspaceID,
	)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *WaterQualityRepository) Delete(ctx context.Context, workspaceID, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM water_quality_logs WHERE id = ? AND workspace_id = ?`, id, workspaceID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *WaterQualityRepository) Trends(ctx context.Context, workspaceID, businessUnitID string, days int) ([]model.WaterQualityTrendPoint, error) {
	if days != 7 && days != 30 {
		days = 7
	}

	query := `
		SELECT business_unit_id, measured_at, ammonia_ppm, ph
		FROM water_quality_logs
		WHERE workspace_id = ?
		  AND measured_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`
	args := []any{workspaceID, days}

	if businessUnitID != "" {
		query += " AND business_unit_id = ?"
		args = append(args, businessUnitID)
	}
	query += " ORDER BY measured_at ASC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := make([]model.WaterQualityTrendPoint, 0)
	for rows.Next() {
		var point model.WaterQualityTrendPoint
		var ammonia sql.NullFloat64
		var ph sql.NullFloat64
		if err := rows.Scan(&point.BusinessUnitID, &point.MeasuredAt, &ammonia, &ph); err != nil {
			return nil, err
		}
		if ammonia.Valid {
			value := ammonia.Float64
			point.AmmoniaPPM = &value
		}
		if ph.Valid {
			value := ph.Float64
			point.PH = &value
		}
		points = append(points, point)
	}
	return points, rows.Err()
}

func (r *WaterQualityRepository) Summaries(ctx context.Context, workspaceID string, todayStart, todayEnd time.Time) ([]model.WaterQualitySummary, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			b.id,
			b.name,
			last_log.measured_at,
			last_log.ammonia_ppm,
			last_log.ph,
			CASE WHEN today_log.id IS NULL THEN 1 ELSE 0 END AS not_measured_today
		FROM business_units b
		LEFT JOIN (
			SELECT w1.*
			FROM water_quality_logs w1
			INNER JOIN (
				SELECT business_unit_id, MAX(measured_at) AS max_measured_at
				FROM water_quality_logs
				WHERE workspace_id = ?
				GROUP BY business_unit_id
			) latest ON latest.business_unit_id = w1.business_unit_id AND latest.max_measured_at = w1.measured_at
			WHERE w1.workspace_id = ?
		) last_log ON last_log.business_unit_id = b.id
		LEFT JOIN water_quality_logs today_log
			ON today_log.business_unit_id = b.id
			AND today_log.workspace_id = ?
			AND today_log.measured_at >= ?
			AND today_log.measured_at < ?
		WHERE b.workspace_id = ? AND b.status = 'ACTIVE'
		ORDER BY b.name ASC`, workspaceID, workspaceID, workspaceID, todayStart, todayEnd, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	summaries := make([]model.WaterQualitySummary, 0)
	for rows.Next() {
		var summary model.WaterQualitySummary
		var measuredAt sql.NullTime
		var ammonia sql.NullFloat64
		var ph sql.NullFloat64
		var notMeasured int
		if err := rows.Scan(
			&summary.BusinessUnitID,
			&summary.BusinessUnitName,
			&measuredAt,
			&ammonia,
			&ph,
			&notMeasured,
		); err != nil {
			return nil, err
		}
		if measuredAt.Valid {
			t := measuredAt.Time
			summary.LastMeasuredAt = &t
		}
		if ammonia.Valid {
			value := ammonia.Float64
			summary.AmmoniaPPM = &value
		}
		if ph.Valid {
			value := ph.Float64
			summary.PH = &value
		}
		summary.Status = waterquality.ComputeStatusLegacy(summary.AmmoniaPPM, summary.PH)
		summary.NotMeasuredToday = notMeasured == 1
		summaries = append(summaries, summary)
	}
	return summaries, rows.Err()
}

func buildWaterQualityWhere(filter WaterQualityFilter) (string, []any) {
	clauses := []string{"w.workspace_id = ?"}
	args := []any{filter.WorkspaceID}

	if filter.BusinessUnitID != "" {
		clauses = append(clauses, "w.business_unit_id = ?")
		args = append(args, filter.BusinessUnitID)
	}
	if filter.BatchID != "" {
		clauses = append(clauses, "w.batch_id = ?")
		args = append(args, filter.BatchID)
	}
	if filter.From != nil {
		clauses = append(clauses, "w.measured_at >= ?")
		args = append(args, *filter.From)
	}
	if filter.To != nil {
		clauses = append(clauses, "w.measured_at <= ?")
		args = append(args, *filter.To)
	}
	return "WHERE " + strings.Join(clauses, " AND "), args
}

func scanWaterQualityLog(rows *sql.Rows) (model.WaterQualityLog, error) {
	var item model.WaterQualityLog
	var batchID sql.NullString
	var ammonia sql.NullFloat64
	var ph sql.NullFloat64
	var notes sql.NullString

	err := rows.Scan(
		&item.ID, &item.WorkspaceID, &item.BusinessUnitID, &item.BusinessUnitName, &batchID, &item.MeasuredAt,
		&ammonia, &ph, &notes, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return item, err
	}
	applyNullableFields(&item, batchID, ammonia, ph, notes)
	item.Status = waterquality.ComputeStatusLegacy(item.AmmoniaPPM, item.PH)
	return item, nil
}

func scanWaterQualityLogRow(row *sql.Row) (*model.WaterQualityLog, error) {
	var item model.WaterQualityLog
	var batchID sql.NullString
	var ammonia sql.NullFloat64
	var ph sql.NullFloat64
	var notes sql.NullString

	err := row.Scan(
		&item.ID, &item.WorkspaceID, &item.BusinessUnitID, &item.BusinessUnitName, &batchID, &item.MeasuredAt,
		&ammonia, &ph, &notes, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	applyNullableFields(&item, batchID, ammonia, ph, notes)
	item.Status = waterquality.ComputeStatusLegacy(item.AmmoniaPPM, item.PH)
	return &item, nil
}

func applyNullableFields(item *model.WaterQualityLog, batchID sql.NullString, ammonia, ph sql.NullFloat64, notes sql.NullString) {
	if batchID.Valid {
		value := batchID.String
		item.BatchID = &value
	}
	if ammonia.Valid {
		value := ammonia.Float64
		item.AmmoniaPPM = &value
	}
	if ph.Valid {
		value := ph.Float64
		item.PH = &value
	}
	if notes.Valid {
		value := notes.String
		item.Notes = &value
	}
}

func TodayRangeJakarta(now time.Time) (time.Time, time.Time, error) {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("load timezone: %w", err)
	}
	local := now.In(loc)
	start := time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, loc)
	end := start.Add(24 * time.Hour)
	return start, end, nil
}

type BatchRepository struct {
	db *sql.DB
}

func NewBatchRepository(db *sql.DB) *BatchRepository {
	return &BatchRepository{db: db}
}

func (r *BatchRepository) List(ctx context.Context, workspaceID, businessUnitID, status string) ([]model.Batch, error) {
	query := `
		SELECT id, workspace_id, business_unit_id, name, start_date, end_date, status, notes, created_at
		FROM batches
		WHERE workspace_id = ?`
	args := []any{workspaceID}

	if businessUnitID != "" {
		query += " AND business_unit_id = ?"
		args = append(args, businessUnitID)
	}
	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]model.Batch, 0)
	for rows.Next() {
		var item model.Batch
		var businessUnitID sql.NullString
		var startDate, endDate sql.NullTime
		var notes sql.NullString
		if err := rows.Scan(
			&item.ID, &item.WorkspaceID, &businessUnitID, &item.Name, &startDate, &endDate, &item.Status, &notes, &item.CreatedAt,
		); err != nil {
			return nil, err
		}
		if businessUnitID.Valid {
			value := businessUnitID.String
			item.BusinessUnitID = &value
		}
		if startDate.Valid {
			value := startDate.Time
			item.StartDate = &value
		}
		if endDate.Valid {
			value := endDate.Time
			item.EndDate = &value
		}
		if notes.Valid {
			value := notes.String
			item.Notes = &value
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
