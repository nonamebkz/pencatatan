# Katalog akses (menu FE ↔ permission DB)

**Status:** `done`

**Dokumen terkait:** [TECHNICAL_SPEC §7.5](../../TECHNICAL_SPEC.md), [BRD §24.1b](../../BRD.md), [rbac.md](./rbac.md).

## Tujuan

Satu file JSON menjadi **sumber kebenaran** untuk:

- Struktur **menu** sidebar / bottom nav (operasional + Kelola Akses)
- **Halaman** dan **aksi UI** yang punya permission RBAC
- **Seed / sync** baris `permissions` di MariaDB saat backend start
- **Form peran** — checkbox dikelompokkan per menu/halaman, bukan hanya `resource` DB
- **Visibilitas menu & CTA** — dibandingkan dengan `permissions[]` dari `/auth/me` (assignment role di DB)

## File kanonik

| Path | Pemakaian |
|------|-----------|
| `shared/access-catalog.json` | Edit di sini |
| `backend/internal/access/catalog.json` | Salinan embed (`make sync-access-catalog`) |
| `frontend/src/config/access-catalog.json` | Salinan untuk build FE / Docker (`make sync-access-catalog`) |
| `frontend/src/lib/access-catalog.ts` | Helper TS (flatten, menu filter, form grouping) |

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
    "operatorPermissionCodes": [
      "finance.read",
      "finance.purchase.create",
      "finance.expense.create",
      "cash_account.read",
      "cash_account.create",
      "cash_account.update",
      "pond.read",
      "pond.create",
      "pond.update",
      "water_quality.read",
      "water_quality.create",
      "water_quality.update"
    ]
  }
}
```

### Field penting

| Field | Arti |
|-------|------|
| `permission` | Kode unik di DB & middleware (`RequirePermission`) |
| `resource` / `action` | Kolom `permissions` (legacy/query) |
| `routes` | Dokumentasi route FE; guard tetap di `App.tsx` / `PermissionRoute` |
| `menuPermission` | Kode opsional di level menu; ikut dikumpulkan oleh `collectMenuPermissionCodes` |
| `operatorDefault` | Dokumentasi; subset operator di `roleDefaults.operatorPermissionCodes` |

## Visibilitas menu ↔ role DB

1. **`GET /auth/me`** (dan login) mengembalikan `permissions[]` = union kode dari **`user_roles` → `role_permissions`** (bukan hardcode `ADMIN`/`USER` di FE).
2. **`collectMenuPermissionCodes(menu)`** — gabungan `menu.menuPermission` + semua `action.permission` di subtree `pages`.
3. **`canSeeCatalogMenu(can, menu)`** — menu tampil jika **≥1** kode dari (2) lolos `can(code)` (`AuthContext` memakai array dari me).
4. **`visibleMainNavFromCatalog` / `visibleAccessNavFromCatalog`** — filter sidebar & bottom nav.
5. **`canViewCatalogPage` / `canCatalogPageAction`** — halaman & tombol (Akun kas, FAB catat WQ, dll.).
6. Menu **tanpa** kode permission di subtree (mis. Beranda) → semua user login.
7. Setelah admin ubah role user: **`AuthContext`** refresh `/auth/me` saat fokus tab / `visibilitychange` (user tidak perlu logout).

Halaman tanpa `actions` dan tanpa parent menu ter-filter → semua user login (legacy).

## Alur perubahan

1. Edit `shared/access-catalog.json` (tambah menu, page, atau action + `permission`).
2. `make sync-access-catalog` (otomatis sebelum `make backend-run`).
3. Restart backend → `EnsureRBAC` upsert permission + sync role sistem (`operator` ← `operatorPermissionCodes`).
4. FE: form peran + menu otomatis mengikuti JSON; sesuaikan `App.tsx` / `PermissionRoute` jika ada route baru.
5. Tambah konstanta di `frontend/src/lib/permissions.ts` & `backend/internal/model/permission.go` jika middleware memakai kode baru (opsional untuk kode hanya FE/menu).

## Sinkron DB

Startup: `seed.EnsureRBAC` → `access.Load()` → `UpsertPermissionMeta` per entri flatten (pages + `metaPermissions`).

Role sistem:

- `workspace_admin` — semua kode dari catalog
- `operator` — `roleDefaults.operatorPermissionCodes`

## Frontend contract

- `useCatalogAccess()` — `canViewPageId`, `canPageAction`, `canSeeMenu` (wrapper `can()` + catalog)
- `visibleMainNavFromCatalog(can)` / `visibleAccessNavFromCatalog(can)` — sidebar & bottom nav
- Aturan halaman: action `read` → wajib permission read; `routes` cocok `path` → wajib permission aksi; hanya `delete` → halaman bisa dibuka jika menu parent terlihat; tanpa action → ikut aturan menu parent atau semua login
- `groupCatalogForRoleForm()` — UI form peran
- `mainNavFromCatalog()` / `accessNavFromCatalog()` — struktur menu penuh (sebelum filter)
- `flattenCatalogPermissionEntries()` — daftar kode untuk tooling

## Backend contract

- `access.Load()`, `FlattenPermissions()`, `AllPermissionCodes()`, `OperatorPermissionCodes()`

**Catatan:** Guard API untuk modul operasional (pembelian, kolam CRUD, dll.) belum seluruhnya memakai kode catalog — lihat tabel §7.5 di TECHNICAL_SPEC.
