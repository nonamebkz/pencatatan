package model

type WaterQualityAdviceItem struct {
	Code  string `json:"code"`
	Title string `json:"title"`
	Steps []string `json:"steps"`
}

type WaterQualityConfig struct {
	AmmoniaWarnPPM      float64  `json:"ammoniaWarnPpm"`
	AmmoniaDangerPPM    float64  `json:"ammoniaDangerPpm"`
	PHMinNormal         float64  `json:"phMinNormal"`
	PHMaxNormal         float64  `json:"phMaxNormal"`
	AmmoniaAnalyteNote  string   `json:"ammoniaAnalyteNote"`
	AdvicePHLow         []string `json:"advicePhLow"`
	AdvicePHHigh        []string `json:"advicePhHigh"`
	AdviceAmmoniaWarn   []string `json:"adviceAmmoniaWarn"`
	AdviceAmmoniaDanger []string `json:"adviceAmmoniaDanger"`
}

type WaterQualityEvaluation struct {
	Status WaterQualityStatus       `json:"status"`
	Advice []WaterQualityAdviceItem `json:"advice"`
}
