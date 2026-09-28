# Desain: template usaha `generic` & unit operasional terpisah

| Field | Value |
|-------|--------|
| Tanggal | 2026-09-28 |
| Status | **Disetujui untuk dokumentasi** — menunggu implementasi |
| Konteks | [Lintas bisnis](./2026-09-28-multi-business-and-workspace-access-design.md) fase 4, [BRD](../../BRD.md) FR-01 |

## 1. Tujuan

Memungkinkan workspace `BUSINESS` dengan `template_id = generic` untuk usaha yang **bukan** budidaya lele: pencatatan keuangan shared (pembelian, pengeluaran, kas, laporan) plus **master unit operasional ringan**, tanpa kolam, kualitas air, sewa, atau batch.

Prinsip arsitektur (permintaan produk):

- **Tidak reuse** tabel `business_units` (kolam lele) — single responsibility per jenis modul.
- **`workspaces.template_id`** menjadi switch modul operasional; menambah jenis usaha nanti = template baru + modulnya, bukan menumpuk kolom di satu tabel master.

## 2. Batas scope slice pertama

| In scope | Out of scope (fase berikutnya) |
|----------|--------------------------------|
| Registry template `lele` \| `generic` (BE validasi + FE menu/route) | Template `warung`, plugin dinamis dari DB |
| Tabel + CRUD `operational_units` | Batch, WQ, sewa, consumable |
| Create workspace `generic` (tanpa seed WQ) | Ubah `template_id` workspace yang sudah ada |
| Menu **Unit** + halaman list/form | Dashboard widget khusus generic |
| Guard API: endpoint lele → 403 jika template bukan `lele` | Link `operational_unit_id` wajib di semua transaksi |
| Pembelian: opsional link `operationalUnitId` di workspace generic | Entitas master baru selain `operational_units` |

## 3. Model data

### 3.1 Tabel `operational_units`

| Kolom | Tipe | Catatan |
|-------|------|---------|
| `id` | CHAR(36) PK | UUID |
| `workspace_id` | CHAR(36) FK → workspaces | CASCADE |
| `name` | VARCHAR(255) | Wajib |
| `location` | VARCHAR(255) NULL | Opsional |
| `notes` | TEXT NULL | Opsional |
| `status` | ENUM ACTIVE/INACTIVE | Default ACTIVE |
| `created_at`, `updated_at` | DATETIME | |

Index: `(workspace_id)`, `(workspace_id, status)`.

**Tidak** ada `water_quality_config`, `unit_type` lele, atau FK ke batch.

### 3.2 Transaksi (opsional slice 1)

Kolom baru di `transactions`:

- `operational_unit_id` CHAR(36) NULL, FK → `operational_units(id)` ON DELETE SET NULL

Aturan:

- Workspace `template_id = generic`: boleh set `operational_unit_id`; **tidak** set `business_unit_id` (kolam).
- Workspace `template_id = lele`: perilaku sekarang (`business_unit_id`); `operational_unit_id` harus null.
- Validasi di layer handler pembelian/pengeluaran (bukan trigger DB).

## 4. Template registry

### 4.1 Backend

Paket kecil `internal/workspace/template` (atau `internal/template`):

```go
const (
    TemplateLele    = "lele"
    TemplateGeneric = "generic"
    TemplatePersonal = "personal"
)

func IsLele(templateID string) bool
func SupportsPondModule(templateID string) bool   // lele only
func SupportsOperationalUnits(templateID string) bool // generic only
```

Middleware/helper `RequireWorkspaceTemplate(c, allowed...)`:

- Load `template_id` workspace dari header `X-Workspace-ID` (cache per request).
- Jika tidak cocok → `403` `TEMPLATE_NOT_SUPPORTED`.

Dipasang pada grup route: `/ponds`, `/water-quality*`, `/rent*`, `/operational-units`.

### 4.2 Frontend

`frontend/src/templates/registry.ts`:

| Template | Label usaha | Nav operasional (subset catalog) | Blocked routes |
|----------|-------------|-----------------------------------|----------------|
| `lele` | Budidaya lele | Beranda, Keuangan, Kolam, Kualitas air | `/operational-units` |
| `generic` | Usaha umum | Beranda, Keuangan, **Unit** | `/ponds`, `/water-quality`, `/finance/rent`, `/settings/water-quality` |
| `personal` | (existing) | Beranda, Keuangan | (existing PERSONAL_BLOCKED) |

Perluas `workspace-nav.ts` → `filterMainNavForWorkspace(items, workspace)` memakai `templateId` + `type`.

Route guard di `AppLayout` (mirror personal): redirect ke `/` jika path diblokir template aktif.

## 5. API baru (ringkas)

| Method | Path | Template | Permission |
|--------|------|----------|------------|
| GET | `/operational-units` | generic | `operational_unit.read` |
| GET | `/operational-units/:id` | generic | `operational_unit.read` |
| POST | `/operational-units` | generic | `operational_unit.create` |
| PUT | `/operational-units/:id` | generic | `operational_unit.update` |
| DELETE | `/operational-units/:id` | generic | `operational_unit.delete` |

`POST /workspaces`: izinkan `templateId: "generic"`; **jangan** seed `workspace_settings.water_quality_config`.

## 6. RBAC & access catalog

Permission baru (seed via `shared/access-catalog.json`):

- `operational_unit.read`, `.create`, `.update`, `.delete`

Menu catalog:

- `nav.operational_units` → path `/operational-units`, label **Unit**, icon `Building2` atau `Boxes`
- Hanya muncul jika template workspace aktif = `generic` **dan** user punya `operational_unit.read` (atau subtree create, dll.)

Role `workspace_admin` / `operator`: assign semua `operational_unit.*` di sync catalog (selaras pola `pond.*`).

## 7. Pendekatan alternatif (ditolak)

| Opsi | Alasan tidak dipilih |
|------|----------------------|
| Reuse `business_units` dengan `unit_type` | Tumpang tindih kolom WQ/sewa; sulit jaga SRP saat jenis usaha bertambah |
| Polymorphic `unit_kind` + `unit_id` di transaksi | Fleksibel tapi kompleks validasi & query laporan di MVP |
| Satu tabel `units` untuk semua template | Melanggar keputusan pemisahan tabel per modul |

**Dipilih:** tabel `operational_units` khusus template `generic`; kolom transaksi terpisah (`operational_unit_id`).

## 8. Urutan implementasi

1. Migrasi `operational_units` + kolom `transactions.operational_unit_id`
2. Model, repository, handler operational units + template guard
3. Perluas `POST /workspaces` + permission seed + sync catalog
4. FE registry, nav filter, halaman Unit (clone pola PondListPage tipis)
5. Guard route + optional select unit di form pembelian (generic)
6. Dokumen: ERD, TECHNICAL_SPEC §5, BRD PART-WS, status fase 4 design lintas bisnis

## 9. Keputusan terkunci

| # | Keputusan |
|---|-----------|
| G1 | `business_units` tetap eksklusif modul lele |
| G2 | `operational_units` eksklusif modul generic |
| G3 | `template_id` tidak dapat diubah setelah create workspace (slice ini) |
| G4 | Engine keuangan & laporan shared tetap sama; konsolidasi lintas usaha tidak berubah |

## 10. Dokumen turunan

- Kontrak implementasi: [workspace-template-generic.md](../../features/workspace-template-generic.md)
- Master unit: bagian yang sama + [operational-units.md](../../features/operational-units.md) (API detail)
