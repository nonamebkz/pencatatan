# RBAC — permission & Kelola Akses

> Status: `done`  
> Tanggal: 2026-09-23  
> Pemilik: —

## Ringkasan

Mengganti otorisasi hardcode `ADMIN`/`USER` dengan **permission** (`resource.action`), role sebagai paket permission, menu **Kelola Akses** di frontend. Kolom `users.role` tetap untuk JWT transisi; assignment di `user_roles`.

Out of scope MVP slice: audit log UI, CRUD master permission (definisi permission via **access catalog**), multi-tenant scope.

**Access catalog:** [`shared/access-catalog.json`](../../shared/access-catalog.json) — [access-catalog.md](./access-catalog.md).

## Business flow

1. Admin login → API mengembalikan `permissions[]` (union role di DB).
2. Sidebar & bottom nav: item operasional + **Kelola Akses** difilter via access catalog + `can()` — lihat `canSeeCatalogMenu`, `visibleMainNavFromCatalog`, `visibleAccessNavFromCatalog` ([access-catalog.md](./access-catalog.md)).
3. Request API dicek `RequirePermission` di backend untuk endpoint yang sudah di-guard (deny default); modul operasional sebagian masih JWT-only — lihat TECH §7.5.
4. Admin ubah permission pada role di `/roles/:id/edit` → user dengan role itu mendapat permission efektif baru setelah **`/auth/me` refresh** (fokus tab atau reload; tidak wajib logout).

### Visibilitas menu (FE)

| Sumber | Isi |
|--------|-----|
| DB | `user_roles` → `role_permissions` → kode permission |
| API | `GET /auth/me` → `permissions: string[]` |
| FE | `AuthContext.can(code)`; menu = minimal satu kode di subtree catalog (`collectMenuPermissionCodes`) |
| Bukan | Label JWT `users.role` (`ADMIN`/`USER`) sebagai gate menu utama |

Beranda (`nav.dashboard`) tidak punya permission di catalog → semua user login.

### Aturan bisnis

| ID | Aturan | Jika gagal |
|----|--------|------------|
| BR-R1 | Tanpa permission → 403 | `FORBIDDEN` |
| BR-R2 | Role sistem (`workspace_admin`, `operator`) tidak boleh dihapus | `VALIDATION_ERROR` |
| BR-R3 | User legacy `ADMIN`/`USER` disinkron ke role paket saat create/update user | — |
| BR-R4 | FE `can()` untuk menu/CTA; backend tetap enforcement di route yang di-guard | — |
| BR-R5 | Menu operasional/Kelola Akses mengikuti permission efektif role (catalog + `/auth/me`) | Item disembunyikan, bukan hanya disabled |

## API contract

Base: `/api/v1`. Auth: Bearer JWT.

### `GET /auth/me`

- **Response `data`**: user fields + `permissions: string[]` + `roles: { code, name }[]`

### `POST /auth/login`

- **Response**: + `permissions`, `roles` (sama seperti me)

### Users (permission)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/users`, `/users/:id` | `user.read` |
| POST | `/users` | `user.create` |
| PUT | `/users/:id`, reset-password | `user.update` |
| DELETE | `/users/:id` | `user.delete` |
| PUT | `/users/:id/roles` | `user.assign_role` |

### Roles

| Method | Path | Permission |
|--------|------|------------|
| GET | `/roles`, `/roles/:id` | `role.read` |
| POST | `/roles` | `role.create` |
| DELETE | `/roles/:id` | `role.delete` |
| PUT | `/roles/:id` | `role.update` |
| PUT | `/roles/:id/permissions` | `role.assign_permission` |

### Permissions catalog

Kanonik menu/halaman/aksi: **`shared/access-catalog.json`** (lihat `docs/features/access-catalog.md`). Seed DB mengikuti file ini.

| GET | `/permissions` | `permission.read` **atau** `role.read` / `role.create` / `role.assign_permission` |

### Destructive / admin ops

| DELETE | `/ponds/:id` | `pond.delete` |
| DELETE | `/water-quality-logs/:id` | `water_quality.delete` |
| PUT | `/water-quality/config` | `water_quality.config.update` |

### Cash accounts

| Method | Path | Permission |
|--------|------|------------|
| GET | `/cash-accounts`, `/cash-accounts/:id` | `cash_account.read` |
| POST | `/cash-accounts` | `cash_account.create` |
| PUT | `/cash-accounts/:id` | `cash_account.update` |
| DELETE | `/cash-accounts/:id` | `cash_account.delete` |

### Perubahan skema DB

- `000005_rbac.up.sql`: `permissions`, `roles`, `role_permissions`, `user_roles`

## Frontend contract

| Route | Halaman | Permission route |
|-------|---------|------------------|
| `/users/*` | existing | `user.read` |
| `/roles` | `RoleListPage` | `role.read` |
| `/roles/new` | `RoleFormPage` | `role.create` |
| `/roles/:id/edit` | `RoleFormPage` | `role.read` (edit metadata: `role.update`; checkbox: `role.assign_permission`) |
| `/forbidden` | `ForbiddenPage` | — |

Form peran: checkbox permission dikelompokkan per **menu/halaman** dari access catalog (bukan hanya `resource` DB).

Halaman operasional: tombol create/edit/delete & sub-nav (mis. Akun kas, FAB catat kualitas air) memakai `canPageAction` / `useCatalogAccess`.

`AuthContext`: refresh profil saat window `focus` dan `visibilitychange` agar perubahan role admin cepat terlihat.

### UI / design

Mobile-first sidebar group **Kelola Akses**; `PermissionRoute` redirect ke `/forbidden`.

## Checklist implementasi

- [x] Contract
- [x] BE migrasi + seed + middleware
- [x] FE can() + menu + roles UI
- [x] Build + graphify
