# Konfigurasi & saran kualitas air

## Ringkasan

Saat pH atau amonia di luar ambang (waspada/bahaya), API mengembalikan `advice[]` (blok judul + langkah). Ambang dan teks saran disimpan per workspace di `workspace_settings` (`water_quality_config`).

## API

| Method | Path | Auth | Body / response |
|--------|------|------|-----------------|
| GET | `/water-quality/config` | User | `WaterQualityConfig` (merge dengan default jika belum disimpan) |
| PUT | `/water-quality/config` | Admin | `WaterQualityConfig` |
| POST | `/water-quality/evaluate` | User | `{ ammoniaPpm?, ph? }` → `{ status, advice }` |

Log, dashboard summary, dan laporan memuat `advice` yang dihitung dari config aktif.

## UI

- Daftar catatan, dashboard kolam, form catat (pratinjau live): panel **Saran penanganan**
- Admin: **Pengaturan → Kualitas Air** (`/settings/water-quality`)

## Default

Lihat `backend/internal/service/waterquality/config.go` (`DefaultConfig`).
