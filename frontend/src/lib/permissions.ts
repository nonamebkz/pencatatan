/** Kode permission — definisi kanonik & label UI ada di `shared/access-catalog.json`. */
export const PermUserRead = 'user.read'
export const PermUserCreate = 'user.create'
export const PermUserUpdate = 'user.update'
export const PermUserDelete = 'user.delete'
export const PermRoleRead = 'role.read'
export const PermRoleCreate = 'role.create'
export const PermRoleUpdate = 'role.update'
export const PermRoleDelete = 'role.delete'
export const PermRoleAssignPerm = 'role.assign_permission'
export const PermPermissionRead = 'permission.read'
export const PermPondDelete = 'pond.delete'
export const PermWaterQualityDelete = 'water_quality.delete'
export const PermWaterQualityCfgUp = 'water_quality.config.update'
export const PermCashAccountRead = 'cash_account.read'
export const PermCashAccountCreate = 'cash_account.create'
export const PermCashAccountUpdate = 'cash_account.update'
export const PermCashAccountDelete = 'cash_account.delete'

export function can(permissions: readonly string[] | undefined, code: string): boolean {
  if (!permissions?.length) return false
  return permissions.includes(code)
}

export function canAny(permissions: readonly string[] | undefined, codes: string[]): boolean {
  return codes.some((code) => can(permissions, code))
}
