# RBAC — permission & Kelola Akses

> Status: `done`  
> Tanggal: 2026-09-23  
> Pemilik: —

## Ringkasan

Mengganti otorisasi hardcode `ADMIN`/`USER` dengan **permission** (`resource.action`), role sebagai paket permission, menu **Kelola Akses** di frontend. Kolom `users.role` tetap untuk JWT transisi; assignment di `user_roles`.

Out of scope MVP slice: audit log UI, CRUD master permission, multi-tenant scope.

## Business flow

1. Admin login → API mengembalikan `permissions[]`.
2. Sidebar menampilkan submenu Kelola Akses jika `user.read` / `role.read`.
3. Request API dicek `RequirePermission` di backend (deny default).
4. Admin ubah permission pada role di `/roles/:id/edit` → user dengan role itu mendapat permission efektif baru setelah login/me refresh.

### Aturan bisnis

| ID | Aturan | Jika gagal |
|----|--------|------------|
| BR-R1 | Tanpa permission → 403 | `FORBIDDEN` |
| BR-R2 | Role sistem (`workspace_admin`, `operator`) tidak boleh dihapus | `VALIDATION_ERROR` |
| BR-R3 | User legacy `ADMIN`/`USER` disinkron ke role paket saat create/update user | — |
| BR-R4 | FE `can()` hanya UX; backend tetap enforcement | — |

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

### Roles

| Method | Path | Permission |
|--------|------|------------|
| GET | `/roles`, `/roles/:id` | `role.read` |
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
| `/roles/:id/edit` | `RoleFormPage` | `role.read` |
| `/forbidden` | `ForbiddenPage` | — |

### UI / design

Mobile-first sidebar group **Kelola Akses**; `PermissionRoute` redirect ke `/forbidden`.

## Checklist implementasi

- [x] Contract
- [x] BE migrasi + seed + middleware
- [x] FE can() + menu + roles UI
- [x] Build + graphify
