# Catatan keuangan (transaksi)

**Status:** `done`

**BRD:** §9 **BR-G** · **ERD:** [docs/database/ERD.md](../database/ERD.md)

## Business flow

1. User membuka **Keuangan** (`/finance`) — ringkasan bulan ini + arsip transaksi **dikelompokkan per hari** (accordion: tanggal, jumlah transaksi, total keluar hari itu).
2. Ketuk baris hari → tampil daftar transaksi hari tersebut → ketuk transaksi → detail.
3. **Catat pembelian** (`PURCHASE`) atau **pengeluaran lain** (`OTHER_EXPENSE`) lewat form create.
4. **Ubah** pembelian/pengeluaran dari detail (permission update) — audit `UPDATE` di `audit_logs`.
5. **Hapus** pembelian/pengeluaran dari detail (permission delete, konfirmasi) — audit `DELETE`; line item pembelian ikut terhapus (CASCADE).
6. **Bayar sewa** membuat `RENT_PAYMENT` + `contract_payments` — tidak diubah/dihapus dari arsip umum ([rent-contracts.md](./rent-contracts.md)).

## Aturan bisnis (ringkas)

| Jenis | Create | Update | Delete dari arsip |
|-------|--------|--------|-------------------|
| `PURCHASE` | ✅ | ✅ | ✅ |
| `OTHER_EXPENSE` | ✅ | ✅ | ✅ |
| `RENT_PAYMENT` | via sewa | ❌ | ❌ |
| Lainnya (MVP) | — | ❌ | ❌ |

- List API: urut `transaction_date DESC`, `created_at DESC`.
- List response pembelian: `lineItemCount`, `firstItemName` (tanpa full `items[]`).
- Audit: `entity_type=transaction`, `changes_json` berisi snapshot `before` / `after` (update) atau `before` (delete).

## API contract

| Method | Path | Permission | Body / query | Response / errors |
|--------|------|------------|--------------|-------------------|
| GET | `/finance/summary` | auth | — | `FinanceSummary` bulan berjalan |
| GET | `/transactions` | auth | `transactionType`, `from`, `to`, `page`, `limit` | `[Transaction]` + meta; urutan tanggal |
| GET | `/transactions/:id` | auth | — | `Transaction` + `items[]` jika pembelian |
| GET | `/purchases` | auth | filter sama | `[Transaction]` type PURCHASE |
| GET | `/purchases/:id` | auth | — | `Transaction` + items |
| POST | `/purchases` | auth* | `PurchaseInput` | `201` `Transaction` |
| PUT | `/purchases/:id` | `finance.purchase.update` | sama POST | `Transaction`; audit |
| DELETE | `/purchases/:id` | `finance.purchase.delete` | — | `204`; audit |
| POST | `/transactions/other-expenses` | auth* | `OtherExpenseInput` | `201` |
| PUT | `/transactions/other-expenses/:id` | `finance.expense.update` | sama POST | `Transaction`; audit |
| DELETE | `/transactions/other-expenses/:id` | `finance.expense.delete` | — | `204`; audit |

\*Create belum `RequirePermission` di middleware (⚠️ backlog guard API); update/delete sudah.

**Kode error umum:** `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`.

## Frontend contract

| Route | Halaman | Keterangan |
|-------|---------|------------|
| `/finance` | `FinancePage` | Metrik bulan + `FinanceDayGroup` per tanggal |
| `/finance/purchases/new` | `PurchaseFormPage` | Create |
| `/finance/purchases/:id/edit` | `PurchaseFormPage` | Update |
| `/finance/purchases/:id` | `PurchaseDetailPage` | Detail + ubah/hapus |
| `/finance/expenses/new` | `OtherExpenseFormPage` | Create |
| `/finance/expenses/:id/edit` | `OtherExpenseFormPage` | Update |
| `/finance/transactions/:id` | `TransactionDetailPage` | Detail semua jenis |

**API client:** `frontend/src/api/finance.ts`  
**Komponen:** `FinanceDayGroup`, `TransactionRow`, `transactionRowSubtitle`  
**Access catalog:** `page.finance.purchases` / `page.finance.expenses` — actions `create`, `update`, `delete`

## UI / design

- Mobile-first: accordion per hari (`FinanceDayGroup`), touch target pada header hari.
- Subtitle baris transaksi: deskripsi → nama barang / jumlah → kategori/kolam → label jenis.
- Hapus: `DeleteOutlineButton` + `window.confirm`; setelah sukses redirect `/finance`.
