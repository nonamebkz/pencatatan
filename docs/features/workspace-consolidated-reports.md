# Laporan konsolidasi lintas usaha

> Status: `done`  
> Tanggal: 2026-09-28

## Ringkasan

Agregat pengeluaran operasional dari **beberapa workspace `BUSINESS`** yang user punya akses, dalam satu periode. Personal tidak ikut. Tanpa `X-Workspace-ID` wajib.

## API

### `GET /reports/consolidated/summary`

- **Auth**: JWT
- **Permission**: `finance.read`
- **Query**: `from`, `to` (YYYY-MM-DD, default bulan berjalan WIB); `workspaceIds` opsional (comma-separated UUID, subset membership BUSINESS)
- **Response**: `ConsolidatedOperationalSummaryReport` — total gabungan + `byWorkspace[]` + `byTransactionType` + `topPurchaseCategories`

## Frontend

| Route | Halaman |
|-------|---------|
| `/finance/reports/consolidated-summary` | `ConsolidatedSummaryReportPage` |

Hub laporan menampilkan kartu jika user punya ≥2 workspace usaha.
