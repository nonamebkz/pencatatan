# Kontrak sewa kolam (MVP-04)

> Status: `done`  
> Tanggal: 2026-09-24

## Ringkasan

Catat komitmen sewa kolam per periode, generate jadwal cicilan otomatis (lump sum atau cicilan bulanan), dan bayar per jadwal → transaksi `RENT_PAYMENT`.

Out of scope (backlog): edit/hapus kontrak, unpay, `GET /reports/rent`, filter `?status=` di API list, kartu sewa di dashboard beranda.

## Business flow

1. User buka **Keuangan → Sewa kolam** (`/finance/rent`) → daftar kontrak.
2. **Tambah kontrak** (`/finance/rent/new`): pilih kolam, tanggal mulai, durasi (bulan), total sewa, skema `LUMP_SUM` atau `INSTALLMENT` → sistem buat jadwal bayar (`end_date` = start + durasi − 1 hari).
3. Di **detail kontrak** (`/finance/rent/:id`), user bayar jadwal yang belum lunas → tanggal bayar + akun kas → `RENT_PAYMENT` + jadwal `isPaid`.

### Aturan bisnis

| ID | Aturan | Jika gagal |
|----|--------|------------|
| BR-R1 | `totalAmount` > 0, `durationMonths` ≥ 1 | `VALIDATION_ERROR` |
| BR-R2 | Kolam harus ada di workspace aktif | `NOT_FOUND` |
| BR-R3 | Jadwal sudah dibayar tidak bisa dibayar lagi | `VALIDATION_ERROR` "Jadwal sudah dibayar" |
| BR-R4 | `INSTALLMENT`: N jadwal = `durationMonths`, jumlah dibulatkan; sisa di angsuran terakhir | — |
| BR-R5 | Status waktu & pembayaran dihitung on-read (`ACTIVE`/`EXPIRING`/`ENDED`, `UNPAID`/`PARTIAL`/`PAID`) | — |

## API contract

Base: `/api/v1`. Auth: JWT + `X-Workspace-ID`.

| Method | Path | Permission | Body | Response `data` |
|--------|------|------------|------|-----------------|
| GET | `/rent-contracts` | `finance.rent.read` | `?businessUnitId=` | `[PeriodicContract]` + `schedules[]` |
| GET | `/rent-contracts/:id` | `finance.rent.read` | — | kontrak + `schedules[]` |
| POST | `/rent-contracts` | `finance.rent.create` | lihat bawah | `{ contract, schedules }` |
| POST | `/rent-contracts/schedules/:scheduleId/pay` | `finance.rent.pay` | `{ paymentDate, cashAccountId, notes? }` | `{ payment, transaction }` |

**POST `/rent-contracts` body:**

```json
{
  "businessUnitId": "uuid",
  "startDate": "2026-01-01",
  "durationMonths": 12,
  "totalAmount": 12000000,
  "paymentScheme": "INSTALLMENT",
  "notes": "opsional"
}
```

Errors: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `INTERNAL_ERROR`.

### Perubahan skema DB

- Migrasi: `backend/internal/migrate/migrations/000006_rent_contracts.up.sql`
- Tabel: `periodic_contracts`, `payment_schedules`, `contract_payments`

## Frontend contract

| Route | Halaman | Catalog page / action |
|-------|---------|------------------------|
| `/finance/rent` | `RentListPage` | `page.finance.rent` → `read` |
| `/finance/rent/new` | `RentFormPage` | `page.finance.rent` → `create` |
| `/finance/rent/:id` | `RentDetailPage` | `page.finance.rent` → `read`; tombol bayar → `pay` |

API: `frontend/src/api/rent.ts`. Akses: `useCatalogAccess().canPageAction('page.finance.rent', …)`.

UI: `PageShell`, `PageHeader`, `MobileListFab`, `MobileFormFooter`, `PanelCard`, `useCashAccountAndPonds` — `design-system.mdc`.

## Access catalog

Entri `page.finance.rent` di [`shared/access-catalog.json`](../../shared/access-catalog.json):

| Permission | Operator default |
|------------|-------------------|
| `finance.rent.read` | ✅ |
| `finance.rent.create` | ✅ |
| `finance.rent.pay` | ✅ |

Setelah edit catalog: `make sync-access-catalog` + restart backend.

## Implementasi (referensi kode)

| Lapisan | Lokasi |
|---------|--------|
| Migrasi | `000006_rent_contracts.up.sql` |
| Model | `backend/internal/model/rent.go` |
| Service jadwal | `backend/internal/service/rent/schedules.go` |
| Repository | `backend/internal/repository/rent_repository.go` |
| Handler | `backend/internal/handler/rent_handler.go` |
| Routes | `backend/cmd/server/main.go` |
| FE API | `frontend/src/api/rent.ts` |
| FE halaman | `RentListPage`, `RentFormPage`, `RentDetailPage` |
| Routes FE | `frontend/src/App.tsx` |

## Verifikasi

- [x] `go build ./...` (backend)
- [x] `npm run build` (frontend)
- [ ] Manual: buat kontrak installment → bayar 1 jadwal → transaksi muncul di `/finance`
- [ ] Manual: bayar jadwal yang sudah lunas → error validasi
- [x] `TECHNICAL_SPEC.md` §5.7 + §20
- [x] `BRD.md` §7 / §21 / §23
