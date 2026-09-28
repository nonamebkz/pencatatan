package model

// Permission codes — sinkron shared/access-catalog.json (seed RBAC) & docs/features/access-catalog.md
const (
	PermUserRead           = "user.read"
	PermUserCreate         = "user.create"
	PermUserUpdate         = "user.update"
	PermUserDelete         = "user.delete"
	PermUserAssignRole      = "user.assign_role"
	PermUserAssignWorkspace = "user.assign_workspace"
	PermWorkspaceRead       = "workspace.read"
	PermWorkspaceCreate     = "workspace.create"
	PermWorkspaceUpdate     = "workspace.update"
	PermWorkspaceDelete     = "workspace.delete"
	PermRoleRead           = "role.read"
	PermRoleCreate         = "role.create"
	PermRoleUpdate         = "role.update"
	PermRoleDelete         = "role.delete"
	PermRoleAssignPerm     = "role.assign_permission"
	PermPermissionRead     = "permission.read"
	PermAuditRead          = "audit.read"
	PermPondDelete         = "pond.delete"
	PermWaterQualityDelete = "water_quality.delete"
	PermWaterQualityCfgUp  = "water_quality.config.update"
	PermCashAccountRead    = "cash_account.read"
	PermCashAccountCreate  = "cash_account.create"
	PermCashAccountUpdate  = "cash_account.update"
	PermCashAccountDelete  = "cash_account.delete"
	PermFinanceRentRead    = "finance.rent.read"
	PermFinanceRentCreate  = "finance.rent.create"
	PermFinanceRentPay        = "finance.rent.pay"
	PermFinancePurchaseUpdate = "finance.purchase.update"
	PermFinancePurchaseDelete = "finance.purchase.delete"
	PermFinanceExpenseUpdate  = "finance.expense.update"
	PermFinanceExpenseDelete  = "finance.expense.delete"
	PermOperationalUnitRead   = "operational_unit.read"
	PermOperationalUnitCreate = "operational_unit.create"
	PermOperationalUnitUpdate = "operational_unit.update"
	PermOperationalUnitDelete = "operational_unit.delete"
)

// AllPermissionCodes daftar lengkap untuk seed workspace_admin.
var AllPermissionCodes = []string{
	PermUserRead, PermUserCreate, PermUserUpdate, PermUserDelete, PermUserAssignRole, PermUserAssignWorkspace,
	PermWorkspaceRead, PermWorkspaceCreate, PermWorkspaceUpdate, PermWorkspaceDelete,
	PermRoleRead, PermRoleCreate, PermRoleUpdate, PermRoleDelete, PermRoleAssignPerm,
	PermPermissionRead, PermAuditRead,
	PermPondDelete, PermWaterQualityDelete, PermWaterQualityCfgUp,
	PermCashAccountRead, PermCashAccountCreate, PermCashAccountUpdate, PermCashAccountDelete,
	"finance.read", "finance.purchase.create", "finance.purchase.update", "finance.purchase.delete", "finance.expense.create", "finance.expense.update", "finance.expense.delete",
	"pond.read", "pond.create", "pond.update",
	"water_quality.read", "water_quality.create", "water_quality.update",
	PermOperationalUnitRead, PermOperationalUnitCreate, PermOperationalUnitUpdate, PermOperationalUnitDelete,
}

// OperatorPermissionCodes subset untuk peran operator — sinkron roleDefaults di access-catalog.json.
var OperatorPermissionCodes = []string{
	"finance.read", "finance.purchase.create", "finance.purchase.update", "finance.purchase.delete", "finance.expense.create", "finance.expense.update", "finance.expense.delete",
	"pond.read", "pond.create", "pond.update",
	"water_quality.read", "water_quality.create", "water_quality.update",
	"cash_account.read", "cash_account.create", "cash_account.update",
	PermOperationalUnitRead, PermOperationalUnitCreate, PermOperationalUnitUpdate,
}

type Permission struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
	Description string `json:"description,omitempty"`
}

type Role struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Code        string   `json:"code"`
	Description string   `json:"description,omitempty"`
	IsSystem    bool     `json:"isSystem"`
	Permissions []string `json:"permissions,omitempty"`
}

type RoleSummary struct {
	ID   string `json:"id,omitempty"`
	Code string `json:"code"`
	Name string `json:"name"`
}
