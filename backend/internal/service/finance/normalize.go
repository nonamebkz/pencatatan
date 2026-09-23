package finance

import "strings"

func NormalizeItemName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func RoundMoney(value float64) float64 {
	return float64(int64(value*100+0.5)) / 100
}
