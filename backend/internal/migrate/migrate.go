package migrate

import (
	"database/sql"
	"embed"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/kikichan/pencatatan/backend/internal/service/waterquality"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

func Up(db *sql.DB) error {
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".up.sql") {
			continue
		}

		content, err := migrationFiles.ReadFile("migrations/" + entry.Name())
		if err != nil {
			return fmt.Errorf("read %s: %w", entry.Name(), err)
		}

		for _, stmt := range splitStatements(string(content)) {
			if _, err := db.Exec(stmt); err != nil {
				return fmt.Errorf("exec %s: %w", entry.Name(), err)
			}
		}
	}

	if err := ensureBusinessUnitWaterQualityConfig(db); err != nil {
		return fmt.Errorf("ensure water_quality_config: %w", err)
	}

	return nil
}

// ensureBusinessUnitWaterQualityConfig adds business_units.water_quality_config when
// missing and backfills NULL rows from workspace template or DefaultConfig.
// Idempotent: safe under migrate.Up which re-runs every .up.sql on each start.
func ensureBusinessUnitWaterQualityConfig(db *sql.DB) error {
	var count int
	err := db.QueryRow(`
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'business_units'
		  AND COLUMN_NAME = 'water_quality_config'`).Scan(&count)
	if err != nil {
		return fmt.Errorf("check column: %w", err)
	}

	if count == 0 {
		if _, err := db.Exec(`ALTER TABLE business_units ADD COLUMN water_quality_config JSON NULL`); err != nil {
			return fmt.Errorf("add column: %w", err)
		}
	}

	defaultJSON, err := json.Marshal(waterquality.DefaultConfig())
	if err != nil {
		return fmt.Errorf("marshal default config: %w", err)
	}

	_, err = db.Exec(`
		UPDATE business_units bu
		LEFT JOIN workspace_settings ws
			ON ws.workspace_id = bu.workspace_id
			AND ws.setting_key = 'water_quality_config'
		SET bu.water_quality_config = COALESCE(ws.value_json, CAST(? AS JSON))
		WHERE bu.water_quality_config IS NULL`, string(defaultJSON))
	if err != nil {
		return fmt.Errorf("backfill config: %w", err)
	}

	return nil
}

func splitStatements(sqlText string) []string {
	parts := strings.Split(sqlText, ";")
	statements := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			statements = append(statements, trimmed)
		}
	}
	return statements
}
