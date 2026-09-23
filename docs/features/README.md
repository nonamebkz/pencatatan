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
| [`water-quality-config-advice.md`](./water-quality-config-advice.md) | `done` | Ambang dan teks saran kualitas air, satu konfigurasi per workspace |
