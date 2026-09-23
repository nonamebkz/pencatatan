package waterquality

import (
	"errors"

	"github.com/kikichan/pencatatan/backend/internal/model"
)

func ValidateConfig(cfg model.WaterQualityConfig) error {
	if cfg.AmmoniaWarnPPM <= 0 || cfg.AmmoniaDangerPPM <= 0 || cfg.PHMinNormal <= 0 || cfg.PHMaxNormal <= 0 {
		return errors.New("Ambang threshold harus lebih dari 0")
	}
	if cfg.AmmoniaDangerPPM < cfg.AmmoniaWarnPPM {
		return errors.New("Ambang bahaya amonia harus ≥ waspada")
	}
	if cfg.PHMaxNormal < cfg.PHMinNormal {
		return errors.New("pH maksimum harus ≥ minimum")
	}
	return nil
}

func DefaultConfig() model.WaterQualityConfig {
	return model.WaterQualityConfig{
		AmmoniaWarnPPM:     0.5,
		AmmoniaDangerPPM:   1.0,
		PHMinNormal:        6.5,
		PHMaxNormal:        8.5,
		AmmoniaAnalyteNote: "Nilai amonia dari kit uji sering TAN (total). SNI pembesaran NH₃ <0,01 mg/L — sesuaikan ambang dengan jenis kit.",
		AdvicePHLow: []string{
			"Ukur alkalinitas bila memungkinkan (target >50 mg/L CaCO₃).",
			"Tambah kapur dolomit/pertanian bertahap: mulai ~50 g/m³ volume air; ukur ulang pH setelah 12–24 jam.",
			"Kurangi pakan sementara jika ikan stres atau air keruh.",
			"Pertimbangkan ganti air 10–20% (air endap ≥24 jam).",
		},
		AdvicePHHigh: []string{
			"Jangan tambah kapur; NH₃ toxic naik saat pH tinggi.",
			"Kurangi pakan 20–30% sampai kondisi membaik.",
			"Ganti air bagian bawah 10–20% secara bertahap (maks. ~20%/hari).",
			"Tingkatkan aerasi bila DO rendah atau ikan nafsu makan turun.",
		},
		AdviceAmmoniaWarn: []string{
			"Sifon endapan dan kurangi pakan 20–30%.",
			"Ganti air 10–20%; hindari ganti >20%/hari sekaligus.",
			"Pastikan aerasi cukup (DO indikator >3 mg/L).",
			"Pertimbangkan probiotik sesuai label kemasan (7–10 hari sekali rutin).",
		},
		AdviceAmmoniaDanger: []string{
			"Segera kurangi pakan 30–50% atau hentikan sementara.",
			"Ganti air 20–30% hari ini; ulangi besok jika masih tinggi.",
			"Aerasi maksimal; angkat endapan dan sifon dasar kolam.",
			"Pantau ikan di permukaan; siapkan cadangan air bersih.",
		},
	}
}

func MergeWithDefaults(cfg model.WaterQualityConfig) model.WaterQualityConfig {
	def := DefaultConfig()
	if cfg.AmmoniaWarnPPM <= 0 {
		cfg.AmmoniaWarnPPM = def.AmmoniaWarnPPM
	}
	if cfg.AmmoniaDangerPPM <= 0 {
		cfg.AmmoniaDangerPPM = def.AmmoniaDangerPPM
	}
	if cfg.AmmoniaDangerPPM < cfg.AmmoniaWarnPPM {
		cfg.AmmoniaDangerPPM = cfg.AmmoniaWarnPPM
	}
	if cfg.PHMinNormal <= 0 {
		cfg.PHMinNormal = def.PHMinNormal
	}
	if cfg.PHMaxNormal <= 0 {
		cfg.PHMaxNormal = def.PHMaxNormal
	}
	if cfg.PHMaxNormal < cfg.PHMinNormal {
		cfg.PHMaxNormal = def.PHMaxNormal
	}
	if cfg.AmmoniaAnalyteNote == "" {
		cfg.AmmoniaAnalyteNote = def.AmmoniaAnalyteNote
	}
	if len(cfg.AdvicePHLow) == 0 {
		cfg.AdvicePHLow = def.AdvicePHLow
	}
	if len(cfg.AdvicePHHigh) == 0 {
		cfg.AdvicePHHigh = def.AdvicePHHigh
	}
	if len(cfg.AdviceAmmoniaWarn) == 0 {
		cfg.AdviceAmmoniaWarn = def.AdviceAmmoniaWarn
	}
	if len(cfg.AdviceAmmoniaDanger) == 0 {
		cfg.AdviceAmmoniaDanger = def.AdviceAmmoniaDanger
	}
	return cfg
}

func ComputeStatus(cfg model.WaterQualityConfig, ammonia *float64, ph *float64) model.WaterQualityStatus {
	status := model.StatusNormal

	if ammonia != nil {
		switch {
		case *ammonia >= cfg.AmmoniaDangerPPM:
			return model.StatusDanger
		case *ammonia >= cfg.AmmoniaWarnPPM:
			status = model.StatusWarning
		}
	}

	if ph != nil && (*ph < cfg.PHMinNormal || *ph > cfg.PHMaxNormal) {
		if status == model.StatusNormal {
			status = model.StatusWarning
		}
	}

	return status
}

func Evaluate(cfg model.WaterQualityConfig, ammonia *float64, ph *float64) model.WaterQualityEvaluation {
	status := ComputeStatus(cfg, ammonia, ph)
	return model.WaterQualityEvaluation{
		Status: status,
		Advice: BuildAdvice(cfg, ammonia, ph, status),
	}
}

func BuildAdvice(cfg model.WaterQualityConfig, ammonia *float64, ph *float64, status model.WaterQualityStatus) []model.WaterQualityAdviceItem {
	if status == model.StatusNormal {
		return nil
	}

	items := make([]model.WaterQualityAdviceItem, 0, 3)

	if ammonia != nil {
		switch {
		case *ammonia >= cfg.AmmoniaDangerPPM:
			items = append(items, model.WaterQualityAdviceItem{
				Code:  "AMMONIA_DANGER",
				Title: "Amonia tinggi — tindakan segera",
				Steps: cfg.AdviceAmmoniaDanger,
			})
		case *ammonia >= cfg.AmmoniaWarnPPM:
			items = append(items, model.WaterQualityAdviceItem{
				Code:  "AMMONIA_WARN",
				Title: "Amonia waspada",
				Steps: cfg.AdviceAmmoniaWarn,
			})
		}
	}

	if ph != nil {
		if *ph < cfg.PHMinNormal {
			items = append(items, model.WaterQualityAdviceItem{
				Code:  "PH_LOW",
				Title: "pH rendah (asam)",
				Steps: cfg.AdvicePHLow,
			})
		}
		if *ph > cfg.PHMaxNormal {
			items = append(items, model.WaterQualityAdviceItem{
				Code:  "PH_HIGH",
				Title: "pH tinggi (basa)",
				Steps: cfg.AdvicePHHigh,
			})
		}
	}

	return items
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
