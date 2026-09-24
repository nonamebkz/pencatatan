package model

type PurchaseReportRow struct {
	TransactionDate string  `json:"transactionDate"`
	ItemName        string  `json:"itemName"`
	Category        string  `json:"category"`
	Qty             float64 `json:"qty"`
	Unit            string  `json:"unit"`
	UnitPrice       float64 `json:"unitPrice"`
	TotalPrice      float64 `json:"totalPrice"`
	SupplierName    *string `json:"supplierName,omitempty"`
	PondName        *string `json:"pondName,omitempty"`
	TransactionID   string  `json:"transactionId"`
}

type PurchaseReportFooter struct {
	TotalAmount       float64 `json:"totalAmount"`
	TransactionCount  int     `json:"transactionCount"`
	LineCount         int     `json:"lineCount"`
}

type PriceHistoryEntry struct {
	TransactionDate string  `json:"transactionDate"`
	ItemName        string  `json:"itemName"`
	UnitPrice       float64 `json:"unitPrice"`
	PriceDelta      float64 `json:"priceDelta"`
	SupplierName    *string `json:"supplierName,omitempty"`
}

type PriceHistoryFooter struct {
	MinPrice  float64 `json:"minPrice"`
	MaxPrice  float64 `json:"maxPrice"`
	LastPrice float64 `json:"lastPrice"`
}

type RentReportFooter struct {
	ActiveContractCount int     `json:"activeContractCount"`
	TotalRemaining      float64 `json:"totalRemaining"`
}

type CategoryAmount struct {
	Category string  `json:"category"`
	Amount   float64 `json:"amount"`
}

type TransactionTypeSummary struct {
	TransactionType string  `json:"transactionType"`
	Count           int     `json:"count"`
	TotalAmount     float64 `json:"totalAmount"`
}

type OperationalSummaryReport struct {
	PeriodFrom            string                   `json:"periodFrom"`
	PeriodTo              string                   `json:"periodTo"`
	TotalPurchases        float64                  `json:"totalPurchases"`
	TotalFeed             float64                  `json:"totalFeed"`
	TotalRentPaid         float64                  `json:"totalRentPaid"`
	TotalProfitSharePaid  float64                  `json:"totalProfitSharePaid"`
	TopPurchaseCategories []CategoryAmount         `json:"topPurchaseCategories"`
	ByTransactionType     []TransactionTypeSummary `json:"byTransactionType"`
	GrandTotalOperational float64                  `json:"grandTotalOperational"`
}
