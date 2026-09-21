package waterquality

import "github.com/kikichan/pencatatan/backend/internal/model"

const (
	AmmoniaWarnPPM   = 0.5
	AmmoniaDangerPPM = 1.0
	PHMinNormal      = 6.5
	PHMaxNormal      = 8.5
)

func ComputeStatus(ammonia *float64, ph *float64) model.WaterQualityStatus {
	status := model.StatusNormal

	if ammonia != nil {
		switch {
		case *ammonia >= AmmoniaDangerPPM:
			return model.StatusDanger
		case *ammonia >= AmmoniaWarnPPM:
			status = model.StatusWarning
		}
	}

	if ph != nil && (*ph < PHMinNormal || *ph > PHMaxNormal) {
		if status == model.StatusNormal {
			status = model.StatusWarning
		}
	}

	return status
}

func HasAnyMeasurement(ammonia *float64, ph *float64, notes *string) bool {
	if ammonia != nil {
		return true
	}
	if ph != nil {
		return true
	}
	return notes != nil && *notes != ""
}
