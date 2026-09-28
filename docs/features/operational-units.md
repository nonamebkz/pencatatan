# Master unit operasional (template generic)

| Field | Value |
|-------|--------|
| Status | `done` |
| Tanggal | 2026-09-28 |
| Terkait | [workspace-template-generic.md](./workspace-template-generic.md) |

## Ringkasan

CRUD **unit** per workspace `template_id = generic` — entitas terpisah dari `business_units` (kolam lele). Dipakai untuk mengelompokkan pembelian/pengeluaran opsional per lokasi/cabang/aktivitas.

## Business flow

1. User dengan `operational_unit.read` membuka **Unit** dari sidebar.
2. List unit aktif/inaktif; tap untuk detail atau edit.
3. Admin/tambah: form nama (wajib), lokasi, catatan, status.
4. Hapus unit: konfirmasi; transaksi terkait kehilangan link unit (null).

### Aturan bisnis

| ID | Aturan | Jika gagal |
|----|--------|------------|
| BR-OU1 | Nama unit wajib, max 255 karakter | `VALIDATION_ERROR` |
| BR-OU2 | `status` ACTIVE \| INACTIVE | `VALIDATION_ERROR` |
| BR-OU3 | Semua query scoped `workspace_id` dari header | `403 WORKSPACE_FORBIDDEN` |
| BR-OU4 | Hanya template `generic` | `403 TEMPLATE_NOT_SUPPORTED` |

### Edge cases

- List kosong: empty state + CTA tambah jika `operational_unit.create`.
- Unit INACTIVE: tetap tampil di list dengan filter; tidak dipakai di select default form (hanya ACTIVE di dropdown pembelian).

## API contract

Headers: `Authorization`, `X-Workspace-ID`. Template guard: generic only.

### GET `/operational-units`

Query: `status?` (`ACTIVE` \| `INACTIVE`)

Response `data`:

```json
[
  {
    "id": "uuid",
    "workspaceId": "uuid",
    "name": "Gudang A",
    "location": "Jl. ...",
    "notes": null,
    "status": "ACTIVE",
    "createdAt": "2026-09-28T00:00:00Z",
    "updatedAt": "2026-09-28T00:00:00Z"
  }
]
```

Permission: `operational_unit.read`

### GET `/operational-units/:id`

Permission: `operational_unit.read`  
Errors: `NOT_FOUND`

### POST `/operational-units`

Body:

```json
{
  "name": "Gudang A",
  "location": "opsional",
  "notes": "opsional",
  "status": "ACTIVE"
}
```

Response `201` + object unit.  
Permission: `operational_unit.create`

### PUT `/operational-units/:id`

Body: partial sama seperti create (semua field opsional kecuali validasi nama tidak kosong jika dikirim).

Permission: `operational_unit.update`

### DELETE `/operational-units/:id`

Response: `204`  
Permission: `operational_unit.delete`  
Errors: `NOT_FOUND`

### Perubahan pembelian (workspace generic)

`POST /finance/purchases` (dan update jika ada): field opsional `operationalUnitId` — harus merujuk unit di workspace yang sama; `businessUnitId` tidak boleh dikirim / diabaikan.

## Frontend contract

| Route | Halaman | Permission |
|-------|---------|------------|
| `/operational-units` | `OperationalUnitListPage` | `operational_unit.read` |
| `/operational-units/new` | `OperationalUnitFormPage` | `operational_unit.create` |
| `/operational-units/:id` | `OperationalUnitDetailPage` | `operational_unit.read` |
| `/operational-units/:id/edit` | `OperationalUnitFormPage` | `operational_unit.update` |

API: `frontend/src/api/operational-units.ts`  
Catalog menu: `nav.operational_units` (visibility + template generic).

## UI / design

- Pola sama `PondListPage` / `PondFormPage` (DRY: pertimbangkan shared `MasterUnitLayout` hanya jika diff kecil).
- Mobile: list kartu, swipe actions optional (delete di detail saja untuk MVP).
- Detail: ringkasan field + tombol edit/hapus sesuai permission.
