package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/service/waterquality"
)

const SettingKeyWaterQualityConfig = "water_quality_config"

type SettingsRepository struct {
	db *sql.DB
}

func NewSettingsRepository(db *sql.DB) *SettingsRepository {
	return &SettingsRepository{db: db}
}

func (r *SettingsRepository) GetWaterQualityConfig(ctx context.Context, workspaceID string) (model.WaterQualityConfig, error) {
	var raw []byte
	err := r.db.QueryRowContext(ctx, `
		SELECT value_json FROM workspace_settings
		WHERE workspace_id = ? AND setting_key = ?`, workspaceID, SettingKeyWaterQualityConfig,
	).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return waterquality.DefaultConfig(), nil
	}
	if err != nil {
		return model.WaterQualityConfig{}, err
	}

	var cfg model.WaterQualityConfig
	if err := json.Unmarshal(raw, &cfg); err != nil {
		return model.WaterQualityConfig{}, err
	}
	return waterquality.MergeWithDefaults(cfg), nil
}

func (r *SettingsRepository) SaveWaterQualityConfig(ctx context.Context, workspaceID string, cfg model.WaterQualityConfig) error {
	cfg = waterquality.MergeWithDefaults(cfg)
	raw, err := json.Marshal(cfg)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO workspace_settings (workspace_id, setting_key, value_json)
		VALUES (?, ?, ?)
		ON DUPLICATE KEY UPDATE value_json = VALUES(value_json), updated_at = CURRENT_TIMESTAMP(3)`,
		workspaceID, SettingKeyWaterQualityConfig, raw,
	)
	return err
}
