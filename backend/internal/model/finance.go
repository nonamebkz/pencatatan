package model

import "time"

const DefaultCashAccountID = "00000000-0000-4000-8000-000000000002"

type TransactionType string

const (
	TransactionPurchase          TransactionType = "PURCHASE"
	TransactionRentPayment       TransactionType = "RENT_PAYMENT"
	TransactionProfitSharePayout TransactionType = "PROFIT_SHARE_PAYOUT"
	TransactionOtherExpense        TransactionType = "OTHER_EXPENSE"
	TransactionOtherIncome         TransactionType = "OTHER_INCOME"
)

type PurchaseCategory string

const (
	CategoryFeed        PurchaseCategory = "FEED"
	CategoryTool        PurchaseCategory = "TOOL"
	CategoryMedicine    PurchaseCategory = "MEDICINE"
	CategoryMaintenance PurchaseCategory = "MAINTENANCE"
	CategorySupply      PurchaseCategory = "SUPPLY"
	CategoryOther       PurchaseCategory = "OTHER"
)

type CashAccount struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	Name        string    `json:"name"`
	IsDefault   bool      `json:"isDefault"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Transaction struct {
	ID              string          `json:"id"`
	WorkspaceID     string          `json:"workspaceId"`
	CashAccountID   string          `json:"cashAccountId"`
	CashAccountName string          `json:"cashAccountName,omitempty"`
	TransactionType TransactionType `json:"transactionType"`
	Amount          float64         `json:"amount"`
	TransactionDate string          `json:"transactionDate"`
	Description     *string         `json:"description,omitempty"`
	BusinessUnitID  *string         `json:"businessUnitId,omitempty"`
	BusinessUnitName string         `json:"businessUnitName,omitempty"`
	BatchID         *string         `json:"batchId,omitempty"`
	Category        *string         `json:"category,omitempty"`
	Items           []PurchaseLineItem `json:"items,omitempty"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
}

type PurchaseLineItem struct {
	ID                 string           `json:"id"`
	TransactionID      string           `json:"transactionId"`
	ItemName           string           `json:"itemName"`
	ItemNameNormalized string           `json:"itemNameNormalized"`
	Category           PurchaseCategory `json:"category"`
	Qty                float64          `json:"qty"`
	Unit               string           `json:"unit"`
	UnitPrice          float64          `json:"unitPrice"`
	TotalPrice         float64          `json:"totalPrice"`
	SupplierName       *string          `json:"supplierName,omitempty"`
	Notes              *string          `json:"notes,omitempty"`
	CreatedAt          time.Time        `json:"createdAt"`
}

type FinanceSummary struct {
	MonthPurchases      float64 `json:"monthPurchases"`
	MonthOtherExpenses  float64 `json:"monthOtherExpenses"`
	MonthTotalOut       float64 `json:"monthTotalOut"`
	TransactionCount    int     `json:"transactionCount"`
}
