package model

// Permission codes — sinkron shared/access-catalog.json (seed RBAC) & docs/features/access-catalog.md
const (
	PermUserRead           = "user.read"
	PermUserCreate         = "user.create"
	PermUserUpdate         = "user.update"
	PermUserDelete         = "user.delete"
	PermUserAssignRole     = "user.assign_role"
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
)

// AllPermissionCodes daftar lengkap untuk seed workspace_admin.
var AllPermissionCodes = []string{
	PermUserRead, PermUserCreate, PermUserUpdate, PermUserDelete, PermUserAssignRole,
	PermRoleRead, PermRoleCreate, PermRoleUpdate, PermRoleDelete, PermRoleAssignPerm,
	PermPermissionRead, PermAuditRead,
	PermPondDelete, PermWaterQualityDelete, PermWaterQualityCfgUp,
	PermCashAccountRead, PermCashAccountCreate, PermCashAccountUpdate, PermCashAccountDelete,
}

// OperatorPermissionCodes subset untuk peran operator (legacy USER) — tanpa Kelola Akses.
var OperatorPermissionCodes = []string{
	PermCashAccountRead, PermCashAccountCreate, PermCashAccountUpdate,
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
