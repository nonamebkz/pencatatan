package waterquality

import "github.com/kikichan/pencatatan/backend/internal/model"

// Backward-compatible defaults when config is not loaded.
const (
	AmmoniaWarnPPM   = 0.5
	AmmoniaDangerPPM = 1.0
	PHMinNormal      = 6.5
	PHMaxNormal      = 8.5
)

func ComputeStatusLegacy(ammonia *float64, ph *float64) model.WaterQualityStatus {
	return ComputeStatus(DefaultConfig(), ammonia, ph)
}
