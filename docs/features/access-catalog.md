# Katalog akses (menu FE ↔ permission DB)

**Status:** `done`

## Tujuan

Satu file JSON menjadi **sumber kebenaran** untuk:

- Struktur **menu** sidebar (Kelola Akses + referensi halaman)
- **Halaman** dan **aksi UI** yang punya permission RBAC
- **Seed / sync** baris `permissions` di MariaDB saat backend start
- **Form peran** — checkbox dikelompokkan per menu/halaman, bukan hanya `resource` DB

## File kanonik

| Path | Pemakaian |
|------|-----------|
| `shared/access-catalog.json` | Edit di sini |
| `backend/internal/access/catalog.json` | Salinan embed (`make sync-access-catalog`) |
| `frontend/src/lib/access-catalog.ts` | Helper TS; import JSON via alias `@shared/` |

Override path backend (opsional): env `ACCESS_CATALOG_PATH`.

## Skema JSON (ringkas)

```json
{
  "version": 1,
  "sections": [
    {
      "id": "main",
      "label": "Menu utama",
      "menu": [
        {
          "id": "nav.finance",
          "label": "Keuangan",
          "path": "/finance",
          "icon": "Wallet",
          "pages": [
            {
              "id": "page.finance.cash_accounts",
              "label": "Akun kas",
              "path": "/finance/cash-accounts",
              "actions": [
                {
                  "id": "read",
                  "label": "Lihat daftar & pilih di form",
                  "permission": "cash_account.read",
                  "resource": "cash_account",
                  "action": "read",
                  "operatorDefault": true,
                  "routes": ["/finance/cash-accounts"]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "metaPermissions": [],
  "roleDefaults": {
    "workspaceAdmin": "all",
    "operatorPermissionCodes": ["cash_account.read"]
  }
}
```

### Field penting

| Field | Arti |
|-------|------|
| `permission` | Kode unik di DB & middleware (`RequirePermission`) |
| `resource` / `action` | Kolom `permissions` (legacy/query) |
| `routes` | Dokumentasi route FE; guard tetap di `App.tsx` / `PermissionRoute` |
| `menuPermission` | Tampilkan item menu jika user punya kode ini |
| `operatorDefault` | Dokumentasi; subset operator di `roleDefaults.operatorPermissionCodes` |

Halaman tanpa `actions` = semua user login (belum dibatasi RBAC).

## Alur perubahan

1. Edit `shared/access-catalog.json` (tambah menu, page, atau action + `permission`).
2. `make sync-access-catalog` (otomatis sebelum `make backend-run`).
3. Restart backend → `EnsureRBAC` upsert permission + sync role sistem.
4. FE: form peran otomatis menampilkan struktur baru; sesuaikan `App.tsx` / `PermissionRoute` jika ada route baru.
5. Tambah konstanta di `frontend/src/lib/permissions.ts` & `backend/internal/model/permission.go` jika middleware memakai kode baru.

## Sinkron DB

Startup: `seed.EnsureRBAC` → `access.Load()` → `UpsertPermissionMeta` per entri flatten (pages + `metaPermissions`).

Role sistem:

- `workspace_admin` — semua kode dari catalog
- `operator` — `roleDefaults.operatorPermissionCodes`

## Frontend contract

- `groupCatalogForRoleForm()` — UI form peran
- `mainNavFromCatalog()` / `accessNavFromCatalog()` — sidebar
- `flattenCatalogPermissionEntries()` — daftar kode untuk tooling

## Backend contract

- `access.Load()`, `FlattenPermissions()`, `AllPermissionCodes()`, `OperatorPermissionCodes()`
