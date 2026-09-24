# Spesifikasi fitur

Setiap fitur baru yang butuh UI dan/atau API **wajib** punya dokumen di folder ini sebelum implementasi paralel BE/FE.

1. Salin [`_template.md`](./_template.md) → `docs/features/<slug-kebab>.md`
2. Isi **business flow** + **API contract** + **frontend contract**
3. Set status `contract-ready` setelah review
4. Implementasi mengacu dokumen ini; selesai → status `done` + update `TECHNICAL_SPEC.md`

Aturan lengkap: `.cursor/rules/feature-delivery.mdc`

**Riset domain** (sebelum spesifikasi): lihat [`../research/`](../research/) — contoh [`pond-spec-water-quality.md`](../research/pond-spec-water-quality.md) untuk kolam & kualitas air lele.

## Dokumen yang ada

| File | Status | Isi |
|------|--------|-----|
| [`operational-reports.md`](./operational-reports.md) | `done` | RPT-01/02/03/06 — API + halaman `/finance/reports/*` |
| [`rent-contracts.md`](./rent-contracts.md) | `done` | Kontrak sewa kolam, jadwal cicilan, bayar → `RENT_PAYMENT` |
| [`cash-accounts.md`](./cash-accounts.md) | `done` | CRUD akun kas workspace |
| [`access-catalog.md`](./access-catalog.md) | `done` | Menu FE ↔ permission DB |
| [`rbac.md`](./rbac.md) | `done` | RBAC fase 1–2 |
| [`water-quality-config-advice.md`](./water-quality-config-advice.md) | `done` | Template ambang & saran untuk kolam baru |
| [`pond-water-quality-config.md`](./pond-water-quality-config.md) | `done` | Salinan ambang & saran di tiap kolam |
