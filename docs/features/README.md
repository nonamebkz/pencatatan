# Spesifikasi fitur

Setiap fitur baru yang butuh UI dan/atau API **wajib** punya dokumen di folder ini sebelum implementasi paralel BE/FE.

1. Salin [`_template.md`](./_template.md) → `docs/features/<slug-kebab>.md`
2. Isi **business flow** + **API contract** + **frontend contract**
3. Set status `contract-ready` setelah review
4. Implementasi mengacu dokumen ini; selesai → status `done` + update `TECHNICAL_SPEC.md`

Aturan lengkap: `.cursor/rules/feature-delivery.mdc`

**Skema database:** [database/ERD.md](../database/ERD.md) — diagram relasi tabel (selaras migrasi SQL).

**Riset domain** (sebelum spesifikasi): lihat [`../research/`](../research/) — contoh [`pond-spec-water-quality.md`](../research/pond-spec-water-quality.md) untuk kolam & kualitas air lele.

## Dokumen yang ada

| File | Status | Isi |
|------|--------|-----|
| [`operational-reports.md`](./operational-reports.md) | `done` | RPT-01/02/03/06 + laporan konsolidasi — API + `/finance/reports/*` |
| [`rent-contracts.md`](./rent-contracts.md) | `done` | Kontrak sewa kolam, jadwal cicilan, bayar → `RENT_PAYMENT` |
| [`finance-transactions.md`](./finance-transactions.md) | `done` | Pembelian & pengeluaran lain — CRUD, audit, daftar per hari |
| [`cash-accounts.md`](./cash-accounts.md) | `done` | CRUD akun kas workspace |
| [`access-catalog.md`](./access-catalog.md) | `done` | Menu FE ↔ permission DB |
| [`rbac.md`](./rbac.md) | `done` | RBAC fase 1–2 |
| [`water-quality-config-advice.md`](./water-quality-config-advice.md) | `done` | Template ambang & saran untuk kolam baru |
| [`pond-water-quality-config.md`](./pond-water-quality-config.md) | `done` | Salinan ambang & saran di tiap kolam |
| [`workspace-switch.md`](./workspace-switch.md) | `done` | Daftar workspace, switcher UI, seed personal, validasi header |
| [`workspace-user-access.md`](./workspace-user-access.md) | `done` | Assign user ↔ workspace, middleware membership, form pengguna |
| [`workspace-consolidated-reports.md`](./workspace-consolidated-reports.md) | `done` | Laporan ringkasan gabungan workspace BUSINESS |
| [`workspace-crud.md`](./workspace-crud.md) | `done` | Tambah/ubah/hapus workspace + template lele |
| [`workspace-template-generic.md`](./workspace-template-generic.md) | `done` | Template `generic`, registry menu, guard API |
| [`operational-units.md`](./operational-units.md) | `done` | CRUD `operational_units` (bukan kolam) |
