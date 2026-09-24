# Laporan operasional (RPT-01–03, 06)

| Field | Value |
|---|---|
| Status | `done` |
| MVP | MVP-08 (parsial — tanpa RPT-04/05/P) |

## Business flow

1. Pengguna dengan `finance.read` membuka **Keuangan → Laporan**.
2. Memilih jenis laporan; filter periode (default: bulan berjalan WIB) atau parameter khusus (nama barang, status sewa).
3. Sistem menampilkan tabel + footer agregat; mobile-first dengan filter panel.

## Aturan bisnis

- Periode default: tanggal 1 bulan berjalan s/d hari ini (Asia/Jakarta).
- RPT-01 hanya transaksi `PURCHASE` per baris line item.
- RPT-02 wajib `itemName` (match `item_name_normalized`).
- RPT-03 berbasis kontrak (bukan transaksi); filter status opsional.
- RPT-04/05 belum — tidak ada tabel `consumable_lots` / bagi hasil.

## API contract

Auth: Bearer + workspace. Permission: `finance.read`.

### GET `/reports/purchases`

Query: `from`, `to` (YYYY-MM-DD, opsional), `businessUnitId?`

Response `data`:
```json
{
  "items": [{ "transactionDate", "itemName", "category", "qty", "unit", "unitPrice", "totalPrice", "supplierName", "pondName", "transactionId" }],
  "footer": { "totalAmount", "transactionCount", "lineCount" }
}
```

### GET `/reports/price-history`

Query: `itemName` (wajib)

Response `data`:
```json
{
  "entries": [{ "transactionDate", "itemName", "unitPrice", "priceDelta", "supplierName" }],
  "footer": { "minPrice", "maxPrice", "lastPrice" }
}
```

### GET `/reports/price-history/items`

Query: `q?` — autocomplete nama barang (normalized).

### GET `/reports/rent`

Query: `timeStatus?`, `paymentStatus?` (enum kontrak)

Response `data`:
```json
{
  "contracts": [PeriodicContract],
  "footer": { "activeContractCount", "totalRemaining" },
  "totalPaid": number,
  "totalRemaining": number
}
```

### GET `/reports/summary`

Query: `from`, `to` (opsional)

Response `data`: kartu §13 yang tersedia + `topPurchaseCategories[]`, `byTransactionType[]`, `grandTotalOperational`.

## Frontend contract

| Route | Halaman | Permission |
|---|---|---|
| `/finance/reports` | `ReportsHubPage` | `finance.read` |
| `/finance/reports/purchases` | `PurchaseReportPage` | `finance.read` |
| `/finance/reports/price-history` | `PriceHistoryReportPage` | `finance.read` |
| `/finance/reports/rent` | `RentReportPage` | `finance.read` + `finance.rent.read` untuk data sewa |
| `/finance/reports/summary` | `OperationalSummaryReportPage` | `finance.read` |

API: `frontend/src/api/reports.ts`

Catalog: `page.finance.reports` → `finance.read`
