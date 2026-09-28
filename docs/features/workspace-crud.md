# CRUD workspace

> Status: `done`  
> Tanggal: 2026-09-28

## Ringkasan

Admin dapat menambah workspace usaha (template `lele`), mengubah nama, dan menghapus workspace (cascade data). Pembuat otomatis mendapat membership. Kas default + template kualitas air disalin.

## API

| Method | Path | Permission |
|--------|------|------------|
| POST | `/workspaces` | `workspace.create` |
| PUT | `/workspaces/:id` | `workspace.update` |
| DELETE | `/workspaces/:id` | `workspace.delete` |

Body create: `{ name, type: "BUSINESS"|"PERSONAL", templateId? }` — default template `lele` / `personal`.

## Aturan

- Tidak boleh menghapus workspace **BUSINESS** terakhir di sistem.
- Workspace `PERSONAL` seed tidak wajib dilindungi (hati-hati di produksi).
- Route CRUD tidak memerlukan `X-Workspace-ID`.

## Frontend

| Route | Halaman |
|-------|---------|
| `/settings/workspaces` | `WorkspaceListPage` |
| `/settings/workspaces/new` | `WorkspaceFormPage` |
| `/settings/workspaces/:id/edit` | `WorkspaceFormPage` |
