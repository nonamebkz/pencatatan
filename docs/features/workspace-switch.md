# Switch workspace (MVP-01 slice)

> Status: `done`  
> Tanggal: 2026-03-28

## Ringkasan

User login dapat memilih workspace aktif (usaha / personal). Semua API data memakai header `X-Workspace-ID`. UI menampilkan switcher di layout; menu personal disederhanakan (Beranda + Keuangan).

Out of scope slice ini: CRUD workspace lewat UI, income personal (`OTHER_INCOME`), validasi tipe transaksi per workspace, **assignment user ↔ workspace** (dokumen terpisah: [workspace-user-access.md](./workspace-user-access.md)).

## Business flow

1. User login → FE memuat `GET /workspaces`.
2. FE memilih workspace aktif (localStorage, default workspace usaha seed).
3. Setiap request API membawa `X-Workspace-ID`.
4. User ganti workspace → data halaman di-refresh (remount outlet), navigasi ke `/` jika route tidak tersedia di personal.

### Aturan bisnis

| ID | Aturan | Jika gagal |
|----|--------|------------|
| BR-WS1 | Workspace aktif harus ada di DB | `404 WORKSPACE_NOT_FOUND` |
| BR-WS2 | Daftar workspace mengikuti **membership** user (`user_workspaces`) — lihat [workspace-user-access.md](./workspace-user-access.md) | User tanpa assign → daftar kosong |
| BR-WS3 | Personal: menu utama hanya Beranda + Keuangan | Redirect dari route operasional |

## API contract

### `GET /workspaces`

- **Auth**: JWT
- **Header**: `X-Workspace-ID` tidak wajib
- **Response 200**: `{ success, data: Workspace[] }`

```json
{
  "id": "uuid",
  "name": "Usaha Lele",
  "type": "BUSINESS",
  "templateId": "lele",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Validasi header (semua route protected lain)

- Workspace ID tidak dikenal → `404`, kode `WORKSPACE_NOT_FOUND`

## Frontend contract

| Komponen | File |
|----------|------|
| API | `frontend/src/api/workspace.ts` |
| Storage | `frontend/src/lib/workspace-storage.ts` |
| Context | `frontend/src/contexts/WorkspaceContext.tsx` |
| Switcher | `frontend/src/components/workspace/WorkspaceSwitcher.tsx` |

## UI / design

- Switcher di sidebar desktop (bawah brand) dan header mobile (di atas judul halaman).
- Native `Select` (touch-friendly `h-11`).
