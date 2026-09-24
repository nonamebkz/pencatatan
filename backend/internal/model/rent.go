package model

import "time"

type PaymentScheme string

const (
	PaymentSchemeLumpSum     PaymentScheme = "LUMP_SUM"
	PaymentSchemeInstallment PaymentScheme = "INSTALLMENT"
)

type ContractTimeStatus string

const (
	ContractTimeActive    ContractTimeStatus = "ACTIVE"
	ContractTimeExpiring  ContractTimeStatus = "EXPIRING"
	ContractTimeEnded     ContractTimeStatus = "ENDED"
)

type ContractPaymentStatus string

const (
	ContractPaymentUnpaid  ContractPaymentStatus = "UNPAID"
	ContractPaymentPartial ContractPaymentStatus = "PARTIAL"
	ContractPaymentPaid    ContractPaymentStatus = "PAID"
)

type PeriodicContract struct {
	ID                 string                `json:"id"`
	WorkspaceID        string                `json:"workspaceId"`
	BusinessUnitID     string                `json:"businessUnitId"`
	BusinessUnitName   string                `json:"businessUnitName,omitempty"`
	StartDate          string                `json:"startDate"`
	EndDate            string                `json:"endDate"`
	DurationMonths     int                   `json:"durationMonths"`
	TotalAmount        float64               `json:"totalAmount"`
	PaymentScheme      PaymentScheme         `json:"paymentScheme"`
	MonthlyEquivalent  float64               `json:"monthlyEquivalent"`
	Notes              *string               `json:"notes,omitempty"`
	TimeStatus         ContractTimeStatus    `json:"timeStatus"`
	PaymentStatus      ContractPaymentStatus `json:"paymentStatus"`
	PaidAmount         float64               `json:"paidAmount"`
	RemainingAmount    float64               `json:"remainingAmount"`
	Schedules          []PaymentSchedule     `json:"schedules,omitempty"`
	CreatedAt          time.Time             `json:"createdAt"`
	UpdatedAt          time.Time             `json:"updatedAt"`
}

type PaymentSchedule struct {
	ID         string     `json:"id"`
	ContractID string     `json:"contractId"`
	DueDate    string     `json:"dueDate"`
	Amount     float64    `json:"amount"`
	IsPaid     bool       `json:"isPaid"`
	PaidAt     *time.Time `json:"paidAt,omitempty"`
}

type ContractPayment struct {
	ID            string    `json:"id"`
	ScheduleID    string    `json:"scheduleId"`
	TransactionID string    `json:"transactionId"`
	Amount        float64   `json:"amount"`
	PaymentDate   string    `json:"paymentDate"`
	Notes         *string   `json:"notes,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
}
