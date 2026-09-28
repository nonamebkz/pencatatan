# Panduan agent — Pencatatan Usaha

Dokumen ringkas untuk manusia dan AI. Aturan detail ada di `.cursor/rules/`.

## Fitur baru

1. Buat `docs/features/<slug>.md` dari [`docs/features/_template.md`](docs/features/_template.md).
2. Isi **business flow** + **API contract** + **frontend contract**.
3. Set `contract-ready` → update `TECHNICAL_SPEC.md` §5.
4. Spawn subagent **Backend** + **Frontend** paralel (lihat `.cursor/rules/feature-delivery.mdc`).
5. Integrasi: `go build ./...`, `cd frontend && npm run build`, update §20 status.
6. **Wajib:** `cd frontend && graphify update .` dan/atau `cd backend && graphify update .` untuk folder yang berubah — baru anggap selesai.

## Rules

| File | Isi |
|------|-----|
| `project-principles.mdc` | DRY, SOLID, arah repo |
| `feature-delivery.mdc` | Gate contract, urutan implement, spawn BE/FE |
| `agent-orchestration.mdc` | Kapan pakai subagent |
| `frontend-dry-solid.mdc` | DRY/SOLID, hierarki komponen |
| `mobile-first.mdc` | **Prioritas** — desain dari 360px, footer, touch |
| `design-system.mdc` | Token, tipografi, pola UI konsisten |
| `backend-dry-solid.mdc` | Handler, repo, httpx, migrasi |
| `graphify-monorepo.mdc` | Graphify dari `frontend/` atau `backend/` (masing-masing `graphify-out/`) |

## Monorepo

- Backend: `backend/` — Go, Fiber, MySQL
- Frontend: `frontend/` — React, Vite, shadcn
- **ERD database:** [`docs/database/ERD.md`](docs/database/ERD.md) — selaras `backend/internal/migrate/migrations/`; update saat migrasi baru
- **Dashboard beranda (per workspace):** [dashboard.md](docs/features/dashboard.md) · [rencana slice](docs/superpowers/plans/2026-09-28-dashboard-implementation-plan.md)
- **Multi-workspace / lintas usaha:** [design](docs/superpowers/specs/2026-09-28-multi-business-and-workspace-access-design.md) · [switch](docs/features/workspace-switch.md) · [akses user](docs/features/workspace-user-access.md) · [CRUD](docs/features/workspace-crud.md) · [laporan konsolidasi](docs/features/workspace-consolidated-reports.md) · [template generic](docs/features/workspace-template-generic.md) + [unit operasional](docs/features/operational-units.md)
- **Access catalog (RBAC):** [`shared/access-catalog.json`](shared/access-catalog.json) — menu/aksi FE ↔ seed DB; visibilitas menu dari `permissions[]` `/auth/me` + `canSeeCatalogMenu`. Lihat [docs/features/access-catalog.md](docs/features/access-catalog.md). Setelah edit JSON: `make sync-access-catalog` (otomatis sebelum `backend-run`); restart backend; user yang role-nya berubah: fokus tab atau refresh.
