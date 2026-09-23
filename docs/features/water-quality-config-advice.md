# Konfigurasi & saran kualitas air

> Status: `done`  
> Tanggal: 2026-09-23  
> Pemilik: —

## Ringkasan

Saat pH atau amonia di luar ambang, API mengembalikan `advice[]` (judul + langkah). Halaman ini menyimpan **template workspace** di `workspace_settings` (`water_quality_config`). Penilaian harian memakai salinan di tiap kolam — lihat [`pond-water-quality-config.md`](./pond-water-quality-config.md).

## Business flow

1. Admin membuka **Pengaturan → Kualitas Air**.
2. Form terisi dari konfigurasi tersimpan, atau dari `DefaultConfig()` jika belum ada.
3. Admin menyimpan ambang dan langkah saran.
4. Saat catatan dibuat, diubah, ditampilkan, atau dipratinjau, status dan saran dihitung dari konfigurasi aktif. Nilai tidak disimpan di baris log.

### Aturan bisnis

| ID | Aturan | Jika gagal |
|----|--------|------------|
| BR-1 | Satu template per workspace; penilaian memakai config kolam | — |
| BR-2 | Amonia ≥ waspada → `WARNING`; ≥ bahaya → `DANGER` | — |
| BR-3 | pH di luar min–maks → `WARNING` saja | — |
| BR-4 | Bahaya amonia ≥ waspada; pH maks ≥ min; semua ambang > 0 | `VALIDATION_ERROR` |
| BR-5 | `GET` config & evaluate untuk semua user login; `PUT` template untuk semua user login (MVP) | — |
| BR-6 | Status `NORMAL` tidak mengirim saran | `advice` kosong |
| BR-7 | Nilai di luar ambang tetap boleh disimpan di log | — |

Default jika belum disimpan: amonia 0,5 / 1,0 ppm, pH 6,5–8,5, plus teks di `backend/internal/service/waterquality/config.go`.

## API contract

Base: `/api/v1`. Auth: Bearer JWT. Workspace: `X-Workspace-ID`.

| Method | Path | Auth | Body / response |
|--------|------|------|-----------------|
| GET | `/water-quality/config` | User | `WaterQualityConfig` (merge default jika belum disimpan) |
| PUT | `/water-quality/config` | Admin | body `WaterQualityConfig` → `WaterQualityConfig` |
| POST | `/water-quality/evaluate` | User | `{ ammoniaPpm?, ph? }` → `{ status, advice }` |

Log, ringkasan dashboard, dan laporan memuat `status` + `advice` yang dihitung ulang dari konfigurasi aktif.

`WaterQualityConfig`: `ammoniaWarnPpm`, `ammoniaDangerPpm`, `phMinNormal`, `phMaxNormal`, `ammoniaAnalyteNote`, `advicePhLow`, `advicePhHigh`, `adviceAmmoniaWarn`, `adviceAmmoniaDanger`.

## Frontend contract

| | |
|---|---|
| Route | `/settings/water-quality` (admin) |
| Halaman | `frontend/src/pages/WaterQualityConfigPage.tsx` |
| API | `getWaterQualityConfig`, `updateWaterQualityConfig` di `frontend/src/api/water-quality.ts` |
| Panel saran | `WaterQualityAdvicePanel` di daftar catatan, dashboard kolam, form catat (pratinjau), laporan |

## UI / design

- Form panjang: ambang angka di atas, empat teks saran (satu langkah per baris) di bawah.
- Simpan menempel di footer mobile (`MobileFormFooter`).
- Menu konfigurasi tersedia untuk semua user login (sidebar / menu pengguna).
