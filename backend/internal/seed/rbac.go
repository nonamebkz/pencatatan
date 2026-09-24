package seed

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	"github.com/kikichan/pencatatan/backend/internal/model"
	"github.com/kikichan/pencatatan/backend/internal/repository"
)

const (
	RoleCodeWorkspaceAdmin = "workspace_admin"
	RoleCodeOperator       = "operator"
)

func EnsureRBAC(ctx context.Context, db *sql.DB) error {
	rbac := repository.NewRBACRepository(db)
	userRepo := repository.NewUserRepository(db)

	count, err := rbac.CountPermissions(ctx)
	if err != nil {
		return err
	}
	if count == 0 {
		if err := seedPermissionsAndRoles(ctx, rbac); err != nil {
			return err
		}
		log.Print("seed: RBAC permissions and roles created")
	}

	users, err := userRepo.List(ctx)
	if err != nil {
		return err
	}
	for _, u := range users {
		has, err := rbac.UserHasRoleAssignment(ctx, u.ID)
		if err != nil {
			return err
		}
		if has {
			continue
		}
		if err := syncLegacyUserRole(ctx, rbac, u.ID, u.Role); err != nil {
			return err
		}
	}
	if err := ensurePermissionCatalog(ctx, rbac); err != nil {
		return err
	}
	return nil
}

func permissionCatalogMeta() map[string]struct{ name, resource, action, desc string } {
	return map[string]struct{ name, resource, action, desc string }{
		model.PermUserRead:           {"Baca pengguna", "user", "read", "Lihat daftar pengguna"},
		model.PermUserCreate:         {"Buat pengguna", "user", "create", "Tambah akun tim"},
		model.PermUserUpdate:         {"Ubah pengguna", "user", "update", "Edit profil dan reset password"},
		model.PermUserDelete:         {"Hapus pengguna", "user", "delete", "Hapus akun tim"},
		model.PermUserAssignRole:     {"Assign role user", "user", "assign_role", "Atur role pengguna"},
		model.PermRoleRead:           {"Baca role", "role", "read", "Lihat daftar role"},
		model.PermRoleCreate:         {"Buat role", "role", "create", "Tambah role custom"},
		model.PermRoleUpdate:         {"Ubah role", "role", "update", "Edit metadata role"},
		model.PermRoleDelete:         {"Hapus role", "role", "delete", "Hapus role non-sistem"},
		model.PermRoleAssignPerm:     {"Assign permission", "role", "assign_permission", "Atur permission role"},
		model.PermPermissionRead:     {"Baca permission", "permission", "read", "Katalog permission"},
		model.PermAuditRead:          {"Baca audit", "audit", "read", "Log audit akses"},
		model.PermPondDelete:         {"Hapus kolam", "pond", "delete", "Hapus master kolam"},
		model.PermWaterQualityDelete: {"Hapus catatan kualitas air", "water_quality", "delete", "Hapus log observasi"},
		model.PermWaterQualityCfgUp:  {"Konfigurasi kualitas air", "water_quality", "config", "Ubah template ambang workspace"},
		model.PermCashAccountRead:    {"Baca kas", "cash_account", "read", "Lihat daftar akun kas"},
		model.PermCashAccountCreate:  {"Buat kas", "cash_account", "create", "Tambah akun kas"},
		model.PermCashAccountUpdate:  {"Ubah kas", "cash_account", "update", "Edit akun kas"},
		model.PermCashAccountDelete:  {"Hapus kas", "cash_account", "delete", "Hapus akun kas"},
	}
}

func ensurePermissionCatalog(ctx context.Context, rbac *repository.RBACRepository) error {
	meta := permissionCatalogMeta()
	for code, m := range meta {
		if _, err := rbac.GetPermissionIDByCode(ctx, code); err != nil {
			if !errors.Is(err, sql.ErrNoRows) {
				return err
			}
			p := &model.Permission{
				Name:        m.name,
				Code:        code,
				Resource:    m.resource,
				Action:      m.action,
				Description: m.desc,
			}
			if err := rbac.InsertPermission(ctx, p); err != nil {
				return err
			}
		}
	}

	adminID, err := rbac.GetRoleIDByCode(ctx, RoleCodeWorkspaceAdmin)
	if err != nil {
		return err
	}
	for _, code := range model.AllPermissionCodes {
		permID, err := rbac.GetPermissionIDByCode(ctx, code)
		if err != nil {
			return err
		}
		if err := rbac.AssignPermissionToRole(ctx, adminID, permID); err != nil {
			return err
		}
	}

	opID, err := rbac.GetRoleIDByCode(ctx, RoleCodeOperator)
	if err != nil {
		return err
	}
	for _, code := range model.OperatorPermissionCodes {
		permID, err := rbac.GetPermissionIDByCode(ctx, code)
		if err != nil {
			return err
		}
		if err := rbac.AssignPermissionToRole(ctx, opID, permID); err != nil {
			return err
		}
	}
	return nil
}

func syncLegacyUserRole(ctx context.Context, rbac *repository.RBACRepository, userID string, legacy model.UserRole) error {
	code := RoleCodeOperator
	if legacy == model.UserRoleAdmin {
		code = RoleCodeWorkspaceAdmin
	}
	roleID, err := rbac.GetRoleIDByCode(ctx, code)
	if err != nil {
		return err
	}
	return rbac.AssignRoleToUser(ctx, userID, roleID)
}

func seedPermissionsAndRoles(ctx context.Context, rbac *repository.RBACRepository) error {
	meta := permissionCatalogMeta()

	permIDs := make(map[string]string, len(meta))
	for code, m := range meta {
		p := &model.Permission{
			Name:        m.name,
			Code:        code,
			Resource:    m.resource,
			Action:      m.action,
			Description: m.desc,
		}
		if err := rbac.InsertPermission(ctx, p); err != nil {
			return err
		}
		permIDs[code] = p.ID
	}

	adminRole := &model.Role{
		Name:        "Admin Workspace",
		Code:        RoleCodeWorkspaceAdmin,
		Description: "Kelola pengguna, role, dan aksi destruktif workspace",
		IsSystem:    true,
	}
	if err := rbac.InsertRole(ctx, adminRole); err != nil {
		return err
	}
	for _, code := range model.AllPermissionCodes {
		if err := rbac.AssignPermissionToRole(ctx, adminRole.ID, permIDs[code]); err != nil {
			return err
		}
	}

	opRole := &model.Role{
		Name:        "Operator",
		Code:        RoleCodeOperator,
		Description: "Operasional harian tanpa kelola akses",
		IsSystem:    true,
	}
	if err := rbac.InsertRole(ctx, opRole); err != nil {
		return err
	}
	for _, code := range model.OperatorPermissionCodes {
		if err := rbac.AssignPermissionToRole(ctx, opRole.ID, permIDs[code]); err != nil {
			return err
		}
	}

	return nil
}

// SyncUserRoleFromLegacy dipanggil setelah create/update user.
func SyncUserRoleFromLegacy(ctx context.Context, rbac *repository.RBACRepository, userID string, legacy model.UserRole) error {
	if err := rbac.ClearUserRoles(ctx, userID); err != nil {
		return err
	}
	return syncLegacyUserRole(ctx, rbac, userID, legacy)
}

// SyncUserRoles mengganti assignment role dan sinkronkan kolom legacy users.role (JWT).
func SyncUserRoles(ctx context.Context, rbac *repository.RBACRepository, userRepo *repository.UserRepository, userID string, roleIDs []string) error {
	if len(roleIDs) == 0 {
		return errString("Minimal satu peran wajib dipilih")
	}
	for _, roleID := range roleIDs {
		role, err := rbac.GetRoleByID(ctx, roleID)
		if err != nil {
			return err
		}
		if role == nil {
			return errString("Peran tidak ditemukan")
		}
	}
	if err := rbac.SetUserRoles(ctx, userID, roleIDs); err != nil {
		return err
	}
	legacy, err := LegacyUserRoleFromRoleIDs(ctx, rbac, roleIDs)
	if err != nil {
		return err
	}
	user, err := userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errString("Pengguna tidak ditemukan")
	}
	user.Role = legacy
	user.UpdatedAt = time.Now()
	return userRepo.Update(ctx, user)
}

func LegacyUserRoleFromRoleIDs(ctx context.Context, rbac *repository.RBACRepository, roleIDs []string) (model.UserRole, error) {
	for _, roleID := range roleIDs {
		role, err := rbac.GetRoleByID(ctx, roleID)
		if err != nil {
			return "", err
		}
		if role != nil && role.Code == RoleCodeWorkspaceAdmin {
			return model.UserRoleAdmin, nil
		}
	}
	return model.UserRoleUser, nil
}

func ResolveRoleIDsFromLegacy(ctx context.Context, rbac *repository.RBACRepository, legacy model.UserRole) ([]string, error) {
	code := RoleCodeOperator
	if legacy == model.UserRoleAdmin {
		code = RoleCodeWorkspaceAdmin
	}
	id, err := rbac.GetRoleIDByCode(ctx, code)
	if err != nil {
		return nil, err
	}
	return []string{id}, nil
}

type errString string

func (e errString) Error() string { return string(e) }

// LegacyPermissions fallback jika user_roles belum terisi.
func LegacyPermissions(legacy model.UserRole) []string {
	if legacy == model.UserRoleAdmin {
		return append([]string(nil), model.AllPermissionCodes...)
	}
	return append([]string(nil), model.OperatorPermissionCodes...)
}
