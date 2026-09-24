package rent

import (
	"time"

	"github.com/google/uuid"
	financesvc "github.com/kikichan/pencatatan/backend/internal/service/finance"
	"github.com/kikichan/pencatatan/backend/internal/model"
)

func EndDateFromStart(start time.Time, durationMonths int) time.Time {
	return start.AddDate(0, durationMonths, -1)
}

func MonthlyEquivalent(total float64, durationMonths int) float64 {
	if durationMonths <= 0 {
		return total
	}
	return financesvc.RoundMoney(total / float64(durationMonths))
}

func GenerateSchedules(contractID string, scheme model.PaymentScheme, start time.Time, durationMonths int, total float64) []model.PaymentSchedule {
	total = financesvc.RoundMoney(total)
	if scheme == model.PaymentSchemeLumpSum {
		return []model.PaymentSchedule{{
			ID:         uuid.New().String(),
			ContractID: contractID,
			DueDate:    start.Format("2006-01-02"),
			Amount:     total,
		}}
	}

	schedules := make([]model.PaymentSchedule, durationMonths)
	monthly := MonthlyEquivalent(total, durationMonths)
	allocated := 0.0
	for i := 0; i < durationMonths; i++ {
		amount := monthly
		if i == durationMonths-1 {
			amount = financesvc.RoundMoney(total - allocated)
		} else {
			allocated += amount
		}
		due := start.AddDate(0, i, 0)
		schedules[i] = model.PaymentSchedule{
			ID:         uuid.New().String(),
			ContractID: contractID,
			DueDate:    due.Format("2006-01-02"),
			Amount:     amount,
		}
	}
	return schedules
}

func ResolveTimeStatus(endDate time.Time, now time.Time) model.ContractTimeStatus {
	end := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 0, endDate.Location())
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	daysLeft := int(end.Sub(today).Hours() / 24)
	if daysLeft < 0 {
		return model.ContractTimeEnded
	}
	if daysLeft <= 30 {
		return model.ContractTimeExpiring
	}
	return model.ContractTimeActive
}

func ResolvePaymentStatus(schedules []model.PaymentSchedule) model.ContractPaymentStatus {
	if len(schedules) == 0 {
		return model.ContractPaymentUnpaid
	}
	paid := 0
	for _, s := range schedules {
		if s.IsPaid {
			paid++
		}
	}
	switch {
	case paid == 0:
		return model.ContractPaymentUnpaid
	case paid == len(schedules):
		return model.ContractPaymentPaid
	default:
		return model.ContractPaymentPartial
	}
}

func PaidTotal(schedules []model.PaymentSchedule) float64 {
	var sum float64
	for _, s := range schedules {
		if s.IsPaid {
			sum += s.Amount
		}
	}
	return financesvc.RoundMoney(sum)
}
