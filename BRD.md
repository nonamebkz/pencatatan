# BRD v1.7 — Pencatatan Operasional Usaha

| Field | Value |
|---|---|
| Versi | 1.7 |
| Status | Living document — selaras dengan codebase `pencatatan-usaha` |
| Produk | Aplikasi pencatatan operasional + pengeluaran usaha |
| Codename | `pencatatan-usaha` |
| Changelog v1.7 | **Katalog akses** [`shared/access-catalog.json`](./shared/access-catalog.json) — menu/halaman/aksi FE ↔ seed permission DB; RBAC fase 1–2 live; kas CRUD + permission granular |
| Changelog v1.6 | Target **RBAC berbasis permission** + struktur menu **Kelola Akses** (Users/Roles/Permissions/Audit); map transisi dari peran `ADMIN`/`USER` repo — lihat §24 |
| Changelog v1.5 | Ambang & saran kualitas air disimpan **per kolam** (salin sekali dari template workspace); form kolam `/ponds/new` dan `/ponds/:id/edit` |
| Changelog v1.4 | Ambang & teks saran kualitas air dikonfigurasi per workspace (bukan hardcoded); selaraskan §2, §7, §9, §15–§16, §23 |
| Changelog v1.3 | Tambah §23 Status Implementasi; selaraskan scope auth/multi-user & modul Kualitas Air yang sudah live di repo |
| Changelog v1.2 | Tambah modul Kualitas Air (`WaterQualityLog`) — desain T2 |
| Changelog v1.1 | Tambah glossary, business rules, state machine, validation, report spec, dashboard metrics, personal workspace, perkuat acceptance criteria |

---

## 1. Ringkasan Eksekutif

**Produk:** Aplikasi web pencatatan operasional + pengeluaran usaha, dimulai dari usaha lele, dirancang atomic untuk berkembang ke usaha lain dan keuangan pribadi.

**Masalah:** Pencatatan operasional lele (belanja barang, sewa kolam, pakan, bagi hasil) masih tersebar dan tidak terstruktur.

**Solusi MVP:** 4 modul operasional + dashboard + laporan, dalam arsitektur multi-workspace dengan atomic primitives.

**Fokus MVP:** pengeluaran operasional. Pemasukan/revenue otomatis belum masuk; income manual hanya di workspace personal.

**Bukan scope MVP (tetap):** akuntansi penuh, revenue otomatis, **pendaftaran mandiri (register)**, export, reminder push, offline.

**Sudah diimplementasi di repo (slice awal, lihat §23):** login JWT, kelola pengguna (admin), master kolam, kualitas air (log, ambang & saran per kolam, dashboard), pembelian + pengeluaran lain (sebagian), UI web responsive. Sewa, pakan, bagi hasil, dan multi-workspace penuh **belum**.

---

## 2. Keputusan Desain (Locked)

| # | Keputusan |
|---|---|
| Q1 | Multi-workspace dari MVP (usaha + personal placeholder) |
| Q2 | Bagi hasil full flow, laba diinput manual |
| Q3 | Batch opsional (nullable di semua modul) |
| Q4 | 6 atom frozen; batch = metadata extension |
| Q5 | Web responsive (HP browser OK) |
| Q6 | Personal = workspace terpisah, engine transaksi sama |
| Q7 | Satu kas default ("Kas Utama") di MVP |
| Q8 | Kontrak cicilan → auto-generate jadwal bayar |
| Q9 | Supplier free text di MVP |
| Q10 | Prompt "Buat catatan consumable?" setelah beli barang |
| Q11 | Login email + password; **tanpa register** — akun dibuat admin. **Repo:** peran `ADMIN` / `USER`. **Target:** RBAC permission + role paket (§24); hindari satu role `admin` untuk semua kebutuhan |
| Q12 | Laporan MVP incremental: 3 dulu → 6 lengkap |
| Q13 | Pembelian MVP: **multi-item** (1 transaksi, N line items) |
| Q14 | Bagi hasil MVP: **maksimal 2 pihak** per skema |
| Q15 | Histori harga: **`item_name_normalized`** (lowercase + trim) |
| Q16 | Status kontrak: **2 dimensi terpisah** (waktu + pembayaran) |
| Q17 | Kualitas air: atom **`WaterQualityLog`** observasional, **tanpa Transaction** |
| Q18 | Metrik T2: **ammonia (ppm)** + **pH** + **notes**; minimal satu field wajib terisi |
| Q19 | Ambang & saran kualitas air disimpan **di tiap kolam**. Template workspace (admin) hanya menyalin ke kolam baru. Default template: ammonia ≥0.5 ppm waspada, ≥1.0 bahaya; pH di luar 6.5–8.5 waspada |
| Q20 | UI T2: menu **Kualitas Air** + tab riwayat di detail Kolam; **business workspace only** |

---

## 3. Persona

| Persona | Peran | Kebutuhan MVP |
|---|---|---|
| **Ahmad (Pengelola)** | Operasional harian | Catat belanja, pakan, bayar sewa, input bagi hasil |
| **Ahmad (Pribadi)** | Same user, workspace berbeda | Catat pengeluaran & pemasukan pribadi sederhana |

---

## 4. Glossary

| Istilah | Definisi |
|---|---|
| **Workspace** | Kontainer data terisolasi per usaha atau keuangan pribadi. Semua entitas bisnis scoped ke workspace. |
| **BusinessUnit** | Unit operasional (instance lele: Kolam). Bisa dilink ke transaksi, kontrak, lot pakan. |
| **Transaction** | Record uang masuk/keluar. Semua modul keuangan berujung ke sini. Amount selalu positif; arah ditentukan oleh `transaction_type`. |
| **PurchaseLineItem** | Detail barang dalam transaksi pembelian. Satu transaksi bisa punya banyak line item. |
| **PeriodicContract** | Komitmen biaya periodik (sewa kolam). Punya periode, nilai total, dan jadwal bayar. |
| **PaymentSchedule** | Satu baris jadwal pembayaran dalam kontrak (due date + nominal). |
| **ContractPayment** | Record pembayaran aktual terhadap schedule; selalu link ke 1 Transaction. |
| **ConsumableLot** | Lot bahan habis pakai (pakan) dengan lifecycle: dibeli → dipakai → habis. |
| **DistributionScheme** | Aturan pembagian hasil antar pihak (persen/nominal, dasar perhitungan). |
| **DistributionRecord** | Realisasi bagi hasil per periode; hasil kalkulasi + status bayar. |
| **CashAccount** | Sumber/tujuan dana. MVP: 1 "Kas Utama" per workspace. |
| **Batch** | Metadata opsional untuk mengelompokkan biaya per siklus tebar/panen. Nullable di semua modul. |
| **Hasil (bagi hasil)** | Nilai uang hasil panen/omzet yang diinput manual per periode. Bukan stok ikan. |
| **WaterQualityLog** | Catatan observasional kualitas air kolam: ammonia (ppm), pH, dan catatan teks. Tidak terkait Transaction. Status dan saran dihitung dari konfigurasi kolam, tidak disimpan di baris log. |

---

## 5. Atomic Architecture (Frozen v1)

```
Workspace
  └── BusinessUnit (type: pond)
  └── Transaction
        └── PurchaseLineItem (1:N)
        └── ContractPayment (0:1)
        └── ConsumableLot (0:1, via transaction_id)
        └── DistributionRecord payout (0:1)
  └── PeriodicContract
        └── PaymentSchedule (1:N)
  └── ConsumableLot (standalone allowed)
  └── DistributionScheme
        └── DistributionRecord (1:N)
  └── CashAccount
  └── Batch (nullable metadata)
  └── WaterQualityLog (T2 — observasional, no Transaction)
```

### Relasi Entitas Kritis (Anti Double-Count)

| Relasi | Aturan |
|---|---|
| Transaction ↔ PurchaseLineItem | 1 transaksi `PURCHASE` punya 1..N line items. `transaction.amount` = SUM(line items). |
| PurchaseLineItem ↔ ConsumableLot | Opsional 1:0..1. Lot **boleh** link ke line item pakan; harga lot diwarisi dari line item. |
| ConsumableLot ↔ Transaction | Lot **boleh** punya `transaction_id` (dari pembelian) atau dibuat manual tanpa transaksi. |
| PaymentSchedule ↔ Transaction | Bayar schedule → buat 1 Transaction `RENT_PAYMENT` + ContractPayment. Jangan double-count di laporan. |
| DistributionRecord ↔ Transaction | Tandai bayar → buat 1 Transaction `PROFIT_SHARE_PAYOUT` per record. Laporan bagi hasil pakai record, bukan re-sum transaction. |
| WaterQualityLog ↔ Transaction | **Tidak ada relasi.** Log kualitas air murni observasional; tidak masuk laporan pengeluaran. |

### Extension Points (Future)

- `BusinessUnit.unit_type` → kios, gudang, dll.
- `ConsumableLot.lot_type` → obat, bahan baku, dll.
- Workspace type `personal` → subset modul transaksi
- Template usaha lain via plugin/template layer
- `WaterQualityLog` → kolom metrik tambahan (DO, suhu, nitrit) di T3+

---

## 6. Transaction Types — MVP

### Aktif di MVP (bisa dibuat user)

| Type | Arah | Dibuat dari | Workspace |
|---|---|---|---|
| `PURCHASE` | Keluar | Form pembelian barang | Business |
| `RENT_PAYMENT` | Keluar | Centang bayar schedule sewa | Business |
| `PROFIT_SHARE_PAYOUT` | Keluar | Tandai bayar distribution record | Business |
| `OTHER_EXPENSE` | Keluar | Form transaksi manual | Business & Personal |
| `OTHER_INCOME` | Masuk | Form transaksi manual | **Personal only** |

### Disiapkan struktur, belum UI di MVP

| Type | Keterangan |
|---|---|
| `FEED_PURCHASE` | **Tidak dipakai terpisah.** Pembelian pakan = `PURCHASE` + line item kategori FEED. Hindari double-count. |

### Aturan

- Workspace **business**: hanya tipe keluar (`PURCHASE`, `RENT_PAYMENT`, `PROFIT_SHARE_PAYOUT`, `OTHER_EXPENSE`).
- Workspace **personal**: `OTHER_EXPENSE` + `OTHER_INCOME` manual.
- Revenue otomatis dari penjualan panen → **T3**, bukan MVP.
- Bagi hasil payout = `PROFIT_SHARE_PAYOUT`, bukan `OTHER_EXPENSE`.

---

## 7. Scope

### In Scope — MVP (Tahap 1)

| ID | Fitur | Status repo |
|---|---|---|
| MVP-01 | Multi-workspace (usaha + personal) | ❌ |
| MVP-02 | Master kolam (BusinessUnit) | ✅ |
| MVP-03 | Pembelian barang multi-item + histori harga | ⚠️ (create multi-item live; histori harga belum) |
| MVP-04 | Kontrak sewa + jadwal cicilan auto-generate | ❌ |
| MVP-05 | Pakan (ConsumableLot): lifecycle + buat manual/direct | ❌ |
| MVP-06 | Bagi hasil: skema 2 pihak + realisasi manual | ❌ |
| MVP-07 | Dashboard dengan metrik terdefinisi | ⚠️ (hanya metrik kualitas air) |
| MVP-08 | 6 laporan dengan spesifikasi kolom | ❌ |
| MVP-09 | Batch opsional | ⚠️ (DB; belum di form WQ) |
| MVP-10 | Login + kelola user (admin, tanpa register) | ✅ |
| MVP-11 | Kas default per workspace | ❌ |

### Out of Scope — MVP

- Pemasukan penjualan / revenue otomatis (business workspace)
- **Self-service register** (pendaftaran publik)
- Reminder/notifikasi push
- Stok barang non-pakan
- Export Excel/PDF
- Offline mode
- Akuntansi penuh
- Master supplier & master item (normalisasi via `item_name_normalized` saja)
- Bagi hasil >2 pihak

### Sudah diimplementasi (di luar urutan MVP asli — lihat §23)

| Area | Ringkasan |
|---|---|
| Auth & pengguna | Login, logout, JWT; CRUD user admin-only; seed admin |
| Kolam | CRUD BusinessUnit (pond) + detail |
| Kualitas air | CRUD log, ambang + teks saran per kolam, template workspace, dashboard widget, filter list, API tren & laporan |
| Infrastruktur | Docker Compose, MySQL, health check, API `/api/v1` |

### Roadmap

| Tahap | Tambahan |
|---|---|
| **T2** | **Kualitas Air** — *live* (§23), termasuk ambang & saran per kolam; sisa: CRUD batch di UI. Juga rencana: reminder sewa/pakan, master supplier, multi-kas, master item |
| **T3** | Revenue otomatis, laba otomatis, self-service multi-tenant; metrik kualitas air tambahan (DO, suhu) |
| **Visi** | Template usaha lain, extension API |

### In Scope — Tahap 2 (Kualitas Air)

| ID | Fitur |
|---|---|
| T2-01 | CRUD `WaterQualityLog` (ammonia_ppm, ph, notes) | ✅ |
| T2-02 | Kolam wajib, batch opsional, `measured_at` bebas (backdate OK) | ✅ (batch opsional di form; CRUD batch belum) |
| T2-03 | Validasi: minimal satu dari ammonia_ppm / ph / notes terisi | ✅ |
| T2-04 | Soft warning dari konfigurasi workspace (default ammonia 0,5 / 1,0 ppm, pH 6,5–8,5) | ✅ |
| T2-09 | Ambang + teks saran per kolam; template admin untuk kolam baru; panel saran di list, dashboard, form, laporan | ✅ |
| T2-05 | Menu Kualitas Air + tab riwayat di detail Kolam | ✅ |
| T2-06 | Dashboard widget nilai terakhir per kolam aktif + badge waspada | ✅ |
| T2-07 | Reminder in-app "belum diukur hari ini" (bukan push) | ✅ (banner/kartu dashboard) |
| T2-08 | Laporan RPT-07: list + filter + grafik tren 7/30 hari | ✅ (halaman `/water-quality/report`) |

---

## 8. Perilaku Workspace Personal (MVP)

| Aspek | Business Workspace | Personal Workspace |
|---|---|---|
| Kas | Auto "Kas Utama" | Auto "Kas Utama" |
| Modul | Kolam, Pembelian, Pakan, Sewa, Bagi Hasil, Laporan *(+ Kualitas Air di T2)* | Transaksi saja |
| Transaction types | PURCHASE, RENT_PAYMENT, PROFIT_SHARE_PAYOUT, OTHER_EXPENSE | OTHER_EXPENSE, OTHER_INCOME |
| Kategori | Via line item category (pembelian) | Kategori pribadi: Makan, Transport, Belanja, Tagihan, Hiburan, Lainnya |
| Dashboard | 4 kartu operasional + widget pakan/sewa *(+ widget kualitas air T2)* | 2 kartu: total keluar & total masuk bulan ini |
| Laporan | 6 laporan operasional | Ringkasan sederhana (filter periode, grouped by kategori) |
| Menu | Menu operasional lele (§16, §24) + **Kelola Akses** jika punya permission `user.read` | Dashboard + Transaksi |
| Batch/Kolam/Pakan/Sewa/Bagi Hasil/Kualitas Air | ✅ *(Kualitas Air T2)* | ❌ tidak tampil |

---

## 9. Business Rules

### BR-A: Pembelian Barang

- BR-A1: Satu form pembelian = **1 Transaction** + **1..N PurchaseLineItem**.
- BR-A2: `transaction.amount` = SUM(`qty × unit_price`) semua line items.
- BR-A3: Minimal 1 line item per transaksi.
- BR-A4: Setiap line item punya `item_name` + `item_name_normalized` (= lowercase + trim whitespace).
- BR-A5: Histori harga di-group by `item_name_normalized`, tampilkan `item_name` terakhir sebagai label.
- BR-A6: Supplier free text per line item (boleh berbeda dalam 1 nota).

### BR-B: ConsumableLot (Pakan)

- BR-B1: Lot **boleh** dibuat dari pembelian (via prompt) **atau** manual langsung di menu Pakan.
- BR-B2: Jika dari pembelian: pre-fill `name`, `total_cost`, `purchase_date` dari line item; user isi sisanya.
- BR-B3: Jika manual: user input semua field; `transaction_id` = null.
- BR-B4: Obat/vitamin **boleh** pakai alur consumable yang sama jika user pilih "Ya" di prompt (lot_type tetap FEED di MVP; MEDICINE di T2).
- BR-B5: Lot depleted **wajib** punya `actual_end_date`.
- BR-B6: `actual_end_date` ≥ `start_use_date` (jika start_use_date ada).
- BR-B7: ConsumableLot **tidak** membuat Transaction terpisah; biaya sudah tercatat di PURCHASE (jika ada link) atau di `total_cost` lot manual.

### BR-C: Kontrak Sewa

- BR-C1: Durasi default 12 bulan; `end_date` = `start_date` + durasi.
- BR-C2: Cicilan: generate N schedule, `amount` = `total_amount / N` (bulatkan ke rupiah, sisa di schedule terakhir).
- BR-C3: Lunas: 1 schedule dengan amount = total_amount.
- BR-C4: **Status waktu** (derived, bukan input user):
  - `ACTIVE`: end_date > today + 30 hari
  - `EXPIRING`: end_date dalam 30 hari ke depan
  - `ENDED`: end_date ≤ today
- BR-C5: **Status pembayaran** (derived):
  - `UNPAID`: 0 schedule paid
  - `PARTIAL`: sebagian schedule paid
  - `PAID`: semua schedule paid
- BR-C6: Kontrak ENDED + PARTIAL = valid (waktu habis tapi masih ada tunggakan). Tampilkan peringatan di UI.
- BR-C7: "Akan habis" di dashboard = status waktu EXPIRING, **bukan** berdasarkan sisa pembayaran.

### BR-D: Bagi Hasil

- BR-D1: MVP maksimal **2 pihak** per skema.
- BR-D2: Jika tipe persen: total persen **harus = 100%**.
- BR-D3: Formula per `base_type`:

| Base Type | Input wajib | Formula porsi |
|---|---|---|
| `NET_PROFIT` | hasil + biaya | net = hasil − biaya; porsi = net × persen |
| `REVENUE` | hasil saja | biaya diabaikan; porsi = hasil × persen |
| `FIXED` | nominal per pihak | hasil & biaya opsional (informasi saja); porsi = nominal tetap |

- BR-D4: "Hasil" = nilai uang hasil panen/omzet periode, diinput manual.
- BR-D5: Satu DistributionRecord = satu periode + satu skema. Payout = 1 Transaction total semua pihak (atau 1 per pihak — lihat BR-D6).

**Keputusan BR-D6 (locked):** 1 Transaction `PROFIT_SHARE_PAYOUT` per pihak yang dibayar. Jika bayar 2 pihak sekaligus → 2 Transaction. Laporan bagi hasil count by record, bukan by transaction.

### BR-E: Umum

- BR-E1: Setiap workspace wajib punya ≥1 CashAccount (auto-create "Kas Utama").
- BR-E2: Semua query data scoped ke `workspace_id` aktif.
- BR-E3: Batch nullable di semua modul; tidak wajib diisi.
- BR-E4: Soft delete **tidak** dipakai di MVP; delete = hard delete dengan konfirmasi.

### BR-F: Kualitas Air (T2)

- BR-F1: `WaterQualityLog` **tidak** membuat Transaction; tidak masuk laporan pengeluaran.
- BR-F2: `business_unit_id` (kolam) **wajib**; `batch_id` opsional.
- BR-F3: `measured_at` wajib — waktu pengukuran (boleh backdate); terpisah dari `created_at`.
- BR-F4: Minimal **satu** dari `ammonia_ppm`, `ph`, atau `notes` harus terisi saat simpan.
- BR-F5: Kolam `INACTIVE` → log lama read-only; **input baru ditolak**.
- BR-F6: Hapus kolam → **semua data terkait kolam** ikut terhapus: catatan kualitas air, batch, transaksi keuangan (termasuk baris pembelian) yang terhubung ke kolam/batch tersebut.
- BR-F7: Status dihitung dari **konfigurasi kolam** (`business_units.water_quality_config`). Template workspace (`workspace_settings.water_quality_config`) hanya disalin saat kolam dibuat; mengubah template tidak mengubah kolam yang sudah ada. Jika kolam belum punya config, pakai default:
  - Ammonia ≥ ambang waspada (default 0,5 ppm) → `WARNING`; ≥ ambang bahaya (default 1,0 ppm) → `DANGER`
  - pH di luar min–maks normal (default 6,5–8,5) → `WARNING` (pH sendiri tidak menaikkan ke `DANGER`)
  - Jika amonia sudah `DANGER`, status tetap `DANGER` meski pH juga di luar rentang
  - Ambang bahaya amonia harus ≥ waspada; pH maksimum harus ≥ minimum; nilai ≤ 0 ditolak saat simpan
- BR-F8: Soft warning saja — nilai di luar range tetap bisa disimpan.
- BR-F9: CRUD penuh (create, read, update, delete).
- BR-F10: Hanya tampil di **business workspace**, bukan personal.
- BR-F11: "Belum diukur hari ini" = tidak ada log dengan `measured_at` date = today (timezone Asia/Jakarta) untuk kolam aktif tersebut.
- BR-F12: Saat status bukan `NORMAL`, respons log, ringkasan dashboard, laporan, dan `POST /water-quality/evaluate` menyertakan `advice[]` (judul + langkah) dari teks **kolam** yang dicatat. Evaluate wajib `businessUnitId`. Template diubah admin di `/settings/water-quality`. Ambang kolam diubah di form `/ponds/new` dan `/ponds/:id/edit`.

---

## 10. State Machines

### ConsumableLot

```
[CREATED] ──(set start_use_date)──► [ACTIVE] ──(set actual_end_date)──► [DEPLETED]
```

- CREATED: lot ada, belum mulai dipakai (`start_use_date` null)
- ACTIVE: sedang dipakai
- DEPLETED: sudah habis, terminal state

### PaymentSchedule

```
[UNPAID] ──(pay action)──► [PAID]
```

- Tidak bisa unpay di MVP
- Paid schedule tidak bisa dibayar ulang

### DistributionRecord

```
[UNPAID] ──(pay action)──► [PAID]
```

### PeriodicContract (derived, read-only)

Status waktu dan pembayaran dihitung on-read, bukan disimpan sebagai single enum (hindari inkonsistensi).

---

## 11. Validation Rules

| Field / Aksi | Rule | Error message |
|---|---|---|
| `total_amount` kontrak | > 0 | "Total sewa harus lebih dari 0" |
| `duration_months` | ≥ 1 | "Durasi minimal 1 bulan" |
| Bayar schedule | amount ≤ sisa kontrak | "Nominal melebihi sisa kontrak" |
| Bayar schedule | schedule belum paid | "Jadwal sudah dibayar" |
| `actual_end_date` | ≥ `start_use_date` | "Tanggal habis tidak boleh sebelum mulai pakai" |
| Bagi hasil persen | total = 100% | "Total persentase harus 100%" |
| Bagi hasil persen | each 0..100 | "Persentase tidak valid" |
| Purchase line item | qty > 0 | "Jumlah harus lebih dari 0" |
| Purchase line item | unit_price ≥ 0 | "Harga tidak valid" |
| Personal income | hanya di workspace personal | "Tipe transaksi tidak tersedia" |
| `item_name` | not empty | "Nama barang wajib diisi" |

---

## 12. Functional Requirements

### FR-01 Workspace
- CRUD workspace (business / personal)
- Switcher di header; semua data scoped ke workspace aktif
- Personal: lihat §8  
- **Status repo:** ⚠️ workspace default hardcoded (`Usaha Lele`); switcher & personal **belum**

### FR-02 Auth & otorisasi
- Login email + password
- JWT session; logout (client + endpoint; blacklist Redis **belum**)
- Kelola pengguna: tanpa register publik
- **Enforcement di backend** (deny by default); frontend hanya menyembunyikan menu/tombol untuk UX
- **Repo:** ✅ JWT + `RequirePermission`; role sistem `workspace_admin` / `operator`; assignment `user_roles`
- **Target (§24):** permission `resource.action`; role = kumpulan permission; audit log perubahan akses
- **Katalog:** definisi menu & aksi permission → [`shared/access-catalog.json`](./shared/access-catalog.json) ([docs/features/access-catalog.md](./docs/features/access-catalog.md))
- **Status repo:** ✅ login/logout/me + `permissions[]`; ✅ user & role management; ❌ Redis blacklist; ❌ halaman master Permission/Audit

### FR-03 Kas
- Auto-create "Kas Utama" per workspace
- Semua transaksi link ke kas (default pre-selected)

### FR-04 Master Kolam
- CRUD: nama, lokasi, ukuran, pemilik, status, catatan
- List + filter status  
- **Status repo:** ✅ CRUD + list; ⚠️ field ukuran/pemilik ada di model/API sebagian belum di form UI

### FR-05 Pembelian Barang
- Form multi-item: tanggal, kas, kolam/batch opsional, daftar barang (add/remove row)
- Per item: nama, kategori, qty, satuan, harga satuan, supplier
- Simpan → 1 Transaction + N PurchaseLineItem
- Prompt per line item kategori FEED/MEDICINE: "Buat catatan consumable?"

### FR-06 Histori Harga
- Group by `item_name_normalized`
- Tampilkan: tanggal, nama (display), harga satuan, selisih vs pembelian sebelumnya

### FR-07 Kontrak Sewa
- Form: kolam, start, durasi, total, lunas/cicilan
- Auto-generate PaymentSchedule
- Tampilkan status waktu + status pembayaran terpisah

### FR-08 Pembayaran Sewa
- Centang schedule → Transaction RENT_PAYMENT + ContractPayment
- Update status pembayaran derived

### FR-09 Pakan
- Buat dari pembelian (pre-fill) atau manual
- Lifecycle: start_use → estimated_end → actual_end → depleted

### FR-10 Bagi Hasil
- Skema max 2 pihak, base_type, validasi persen
- Realisasi: input hasil (+ biaya jika NET_PROFIT) → auto calc
- Bayar per pihak → Transaction PROFIT_SHARE_PAYOUT

### FR-11 Dashboard
- Lihat §13 Dashboard Metrics  
- **Status repo:** ⚠️ dashboard **kualitas air** saja (stat kolam, status per kolam, belum diukur hari ini); kartu keuangan §13 **belum**

### FR-12 Laporan
- Lihat §14 Report Specification  
- **Status repo:** ⚠️ API laporan kualitas air; UI laporan dedicated & RPT-01–06 **belum**

---

## 13. Dashboard Metrics

**Periode default:** bulan kalender berjalan (tanggal 1 s/d hari ini).  
**Timezone:** WIB (Asia/Jakarta).  
**Currency:** IDR, tanpa desimal di tampilan.

### Business Workspace — Kartu

| Kartu | Definisi | Sumber | Formula |
|---|---|---|---|
| Total Belanja | Pengeluaran pembelian barang | Transaction `PURCHASE` | SUM(amount) WHERE transaction_date in period |
| Total Pakan | Biaya pembelian pakan | PurchaseLineItem category=FEED | SUM(total_price) via linked transaction in period |
| Beban Sewa | Pembayaran sewa aktual | Transaction `RENT_PAYMENT` | SUM(amount) in period |
| Bagi Hasil Dibayar | Payout bagi hasil | Transaction `PROFIT_SHARE_PAYOUT` | SUM(amount) in period |

### Business Workspace — Widget

| Widget | Definisi |
|---|---|
| Pakan Aktif | ConsumableLot status ACTIVE/CREATED; tampilkan nama + estimasi sisa hari (`estimated_end_date - today`) |
| Kontrak Akan Habis | PeriodicContract status waktu = EXPIRING; tampilkan kolam + end_date + sisa hari |

### Business Workspace — Widget T2 (Kualitas Air)

| Widget | Definisi |
|---|---|
| Kualitas Air Terakhir | Per kolam ACTIVE: ammonia + pH + measured_at terakhir + badge waspada/bahaya + saran penanganan jika di luar ambang kolam itu |
| Belum Diukur Hari Ini | Badge in-app jika kolam ACTIVE belum punya log dengan measured_at date = today |

### Personal Workspace — Kartu

| Kartu | Formula |
|---|---|
| Total Keluar | SUM OTHER_EXPENSE in period |
| Total Masuk | SUM OTHER_INCOME in period |

---

## 14. Report Specification

### RPT-01: Pembelian Barang

| | |
|---|---|
| **Filter** | from, to, businessUnitId (opsional) |
| **Sort** | transaction_date DESC |
| **Kolom** | Tanggal, Barang, Kategori, Qty, Satuan, Harga Satuan, Total, Supplier, Kolam |
| **Footer** | Total pengeluaran, jumlah transaksi, jumlah item |
| **Sumber** | PurchaseLineItem JOIN Transaction |

### RPT-02: Histori Harga

| | |
|---|---|
| **Filter** | item_name (autocomplete by normalized) |
| **Sort** | transaction_date ASC |
| **Kolom** | Tanggal, Nama Barang, Harga Satuan, Selisih (vs sebelumnya), Supplier |
| **Footer** | Harga terendah, tertinggi, terakhir |
| **Sumber** | PurchaseLineItem grouped by item_name_normalized |

### RPT-03: Sewa Kolam

| | |
|---|---|
| **Filter** | status waktu (opsional), status pembayaran (opsional) |
| **Sort** | end_date ASC |
| **Kolom** | Kolam, Periode (start–end), Total Sewa, Sudah Dibayar, Sisa, Status Waktu, Status Bayar |
| **Footer** | Total kontrak aktif, total sisa tunggakan |
| **Sumber** | PeriodicContract + aggregate PaymentSchedule |
| **Catatan** | Berbasis **kontrak**, bukan per transaksi |

### RPT-04: Pakan

| | |
|---|---|
| **Filter** | from, to, status (ACTIVE/DEPLETED), businessUnitId |
| **Sort** | purchase_date DESC |
| **Kolom** | Jenis, Merek, Tanggal Beli, Kg, Biaya, Kolam, Mulai Pakai, Estimasi Habis, Aktual Habis, Status, Durasi Pakai (hari) |
| **Footer** | Total biaya, rata-rata durasi pakai |
| **Sumber** | ConsumableLot |
| **Catatan** | Fokus **lifecycle**, bukan duplikasi pembelian |

### RPT-05: Bagi Hasil

| | |
|---|---|
| **Filter** | from, to, paymentStatus, schemeId |
| **Sort** | period_end DESC |
| **Kolom** | Skema, Periode, Hasil, Biaya, Laba, Pihak A, Pihak B, Status Bayar, Tanggal Bayar |
| **Footer** | Total dibayar, total outstanding |
| **Sumber** | DistributionRecord JOIN DistributionScheme |
| **Catatan** | Count by **record**, bukan re-sum transaction |

### RPT-06: Ringkasan Operasional

| | |
|---|---|
| **Filter** | from, to |
| **Sort** | — (summary cards) |
| **Isi** | 4 angka dashboard (§13) + breakdown per kategori pembelian (top 5) + total transaksi per type |
| **Footer** | Grand total pengeluaran operasional |
| **Sumber** | Aggregated transactions + line items |

### RPT-07: Kualitas Air (T2)

| | |
|---|---|
| **Filter** | from, to, businessUnitId (opsional), days (7\|30 untuk tren) |
| **Sort** | measured_at DESC |
| **Kolom (list)** | Tanggal Ukur, Kolam, Batch, Ammonia (ppm), pH, Catatan, Status (normal/waspada/bahaya) |
| **Grafik** | Line chart ammonia + pH per kolam; periode 7 atau 30 hari |
| **Footer** | Jumlah entri, kolam belum diukur hari ini |
| **Sumber** | WaterQualityLog |
| **Catatan** | Observasional; **bukan** transaksi keuangan. Status dan saran dihitung saat dibaca dari konfigurasi kolam (tidak disimpan di baris log) |

### RPT-P: Personal Ringkasan

| | |
|---|---|
| **Filter** | from, to |
| **Kolom** | Tanggal, Tipe (Masuk/Keluar), Kategori, Nominal, Catatan |
| **Footer** | Total masuk, total keluar, selisih |
| **Sumber** | Transaction personal workspace |

---

## 15. User Stories (Updated Acceptance Criteria)

### Epic E3 — Pembelian (perkuat)

| Story | Acceptance Criteria |
|---|---|
| US-3.1 Multi-item purchase | **Given** form dengan 3 line items, **When** submit, **Then** 1 Transaction amount = sum items, 3 PurchaseLineItem tersimpan |
| US-3.2 Histori harga | **Given** "PF1000" dan "pf1000" dibeli terpisah, **When** lihat histori "PF1000", **Then** keduanya muncul dalam 1 group |
| US-3.3 Prompt consumable | **Given** line item kategori FEED, **When** submit, **Then** modal muncul; jika Ya, redirect ke form lot dengan name & cost pre-filled |

### Epic E4 — Sewa (perkuat)

| Story | Acceptance Criteria |
|---|---|
| US-4.3 Bayar schedule | **Given** schedule unpaid Rp 1jt, **When** centang bayar, **Then** 1 Transaction RENT_PAYMENT 1jt, schedule paid=true, sisa kontrak berkurang 1jt |
| US-4.4 Dual status | **Given** kontrak end_date 15 hari lagi & partial paid, **When** lihat list, **Then** status waktu=EXPIRING, status bayar=PARTIAL |

### Epic E5 — Pakan (perkuat)

| Story | Acceptance Criteria |
|---|---|
| US-5.5 Manual lot | **Given** user buat lot manual tanpa pembelian, **When** save, **Then** ConsumableLot tersimpan dengan transaction_id=null |
| US-5.3 Close lot | **Given** lot ACTIVE start 1 Jan, **When** set actual_end 15 Feb, **Then** status=DEPLETED, durasi=45 hari di laporan |

### Epic E6 — Bagi Hasil (perkuat)

| Story | Acceptance Criteria |
|---|---|
| US-6.1 Validasi persen | **Given** skema 30% + 60%, **When** save, **Then** error "Total persentase harus 100%" |
| US-6.2 Kalkulasi NET_PROFIT | **Given** hasil 20jt biaya 12jt skema 30/70, **When** save record, **Then** net=8jt, pihak A=2.4jt, pihak B=5.6jt |
| US-6.3 Bayar | **Given** record UNPAID, **When** bayar pihak A, **Then** 1 Transaction PROFIT_SHARE_PAYOUT, record tetap UNPAID until all parties paid (or mark PAID when last party paid — **locked: PAID when all parties paid**) |

### Epic E7 — Kualitas Air (T2)

| Story | Acceptance Criteria |
|---|---|
| US-7.1 Simpan log | **Given** kolam aktif + ammonia 0.3 + pH 7.2, **When** save, **Then** WaterQualityLog tersimpan tanpa Transaction |
| US-7.2 Validasi kosong | **Given** semua field ammonia/ph/notes kosong, **When** save, **Then** error validasi |
| US-7.3 Soft warning | **Given** ammonia 1.2 ppm dan ambang default, **When** save, **Then** tersimpan + badge bahaya + saran amonia bahaya di list & dashboard |
| US-7.7 Atur ambang | **Given** kolam dengan ambang waspada 0,3, **When** simpan log ammonia 0,4, **Then** status waspada memakai ambang kolam itu. Mengubah template workspace tidak mengubah kolam yang sudah ada |
| US-7.4 Kolam nonaktif | **Given** kolam INACTIVE, **When** coba buat log baru, **Then** error; riwayat lama tetap tampil |
| US-7.5 Belum diukur | **Given** kolam aktif tanpa log hari ini, **When** lihat dashboard, **Then** badge "belum diukur hari ini" muncul |
| US-7.6 Tren | **Given** log 30 hari untuk Kolam A, **When** buka RPT-07 days=30, **Then** grafik ammonia + pH tampil |

---

## 16. Screen Flow & Menu

### 16.1 Menu operasional (workspace business — template lele)

| Menu | Route | Siapa melihat (target permission) | Repo saat ini |
|---|---|---|---|
| Beranda | `/` | Semua user login | ✅ |
| Keuangan | `/finance` | `finance.read` *(alias: semua USER+)* | ✅ |
| Kolam | `/ponds` | `pond.read` | ✅ |
| Kualitas Air | `/water-quality` | `water_quality.read` | ✅ |
| Konfigurasi kualitas air | `/settings/water-quality` | `water_quality.config.update` | ✅ `PermissionRoute` |
| Akun kas | `/finance/cash-accounts` | `cash_account.read` (+ create/update/delete) | ✅ |
| Laporan kualitas air | `/water-quality/report` | `water_quality.read` | ✅ |

**Personal workspace (belum penuh):** hanya Beranda + Transaksi — lihat §8.

### 16.2 Menu Kelola Akses (grup sidebar / profil)

Mengikuti pola **Access Management**; visibilitas **permission**, bukan hardcode role di banyak file.

| Submenu | Route target | Permission menu | Repo |
|---|---|---|---|
| Pengguna | `/users` | `user.read` | ✅ |
| Peran | `/roles` | `role.read` | ✅ |
| Permission | `/permissions` | `permission.read` | ❌ (hanya API list; definisi via access catalog) |
| Audit Log | `/audit-logs` | `audit.read` | ❌ |

**Repo:** Pengguna & Peran di sidebar jika punya permission; definisi checkbox permission di form peran mengikuti **access catalog**, bukan halaman `/permissions`.

### 16.3 Halaman

| # | Halaman | Catatan | Status repo |
|---|---|---|---|
| P-01 | Login | Email + password; tanpa register | ✅ `/login` |
| P-02 | Pengguna | CRUD akun tim; assign role RBAC | ✅ `/users` |
| P-02b | Peran | CRUD role custom + assign permission (UI = access catalog) | ✅ `/roles` |
| P-02c | Permission | Master permission (platform) | ❌ (seed dari JSON) |
| P-02d | Audit Log | Jejak perubahan user/role/assignment | ❌ |
| P-02e | Forbidden | Akses ditolak | ✅ `/forbidden` |
| P-03 | Dashboard | Business vs Personal layout berbeda (§8); widget kualitas air | ⚠️ hanya widget kualitas air |
| P-06 | Pembelian — Form | Multi-item | ⚠️ `/finance/purchases/new` (histori harga belum) |
| P-17 | Laporan — Detail | Kolom §14; RPT-07 tren | ⚠️ `/water-quality/report` (WQ saja) |
| P-19 | Master Kolam — List | | ✅ `/ponds` |
| P-19b | Master Kolam — Form | Identitas + ambang dan saran kolam | ✅ `/ponds/new`, `/ponds/:id/edit` |
| P-20 | Kualitas Air — List | Filter kolam/periode; badge status | ✅ `/water-quality` |
| P-21 | Kualitas Air — Form | ammonia + pH + catatan + measured_at | ✅ |
| P-22 | Kolam — Detail | Riwayat kualitas air | ✅ `/ponds/:id` |
| P-23 | Pengaturan kualitas air (admin) | Template ambang untuk kolam baru | ✅ `/settings/water-quality` |

---

## 17. Process Flows

### Flow 1: Beli Barang (multi-item)

1. User isi header (tanggal, kas, kolam opsional)
2. User tambah 1..N line items
3. Submit → 1 Transaction + N PurchaseLineItem
4. Untuk setiap line item FEED/MEDICINE → prompt consumable per item

### Flow 2–4

*(unchanged logic, refer to §9 Business Rules for detail)*

---

## 18. Non-Functional Requirements

| NFR | Spesifikasi |
|---|---|
| Platform | Web responsive; target mobile browser (375px+) |
| Performance | Dashboard load < 2s (with Redis cache) |
| Performance | List pages < 1s for 500 records |
| Security | HTTPS, bcrypt password, JWT expiry 24h |
| Security | Workspace isolation enforced server-side |
| Data | Currency IDR; timezone Asia/Jakarta |
| Data | Backup MariaDB daily (ops, post-MVP deploy) |
| Availability | Single-user MVP; no SLA |
| i18n | Bahasa Indonesia only |
| Accessibility | Form labels, keyboard navigable (baseline) |

---

## 19. Gap Map

| Gap | Status | Kapan |
|---|---|---|
| Transaction type clarity | ✅ Closed v1.1 | — |
| Multi-item purchase | ✅ Closed v1.1 | Sprint 1 |
| ConsumableLot rules | ✅ Closed v1.1 | — |
| Dual contract status | ✅ Closed v1.1 | Sprint 2 |
| Distribution formula | ✅ Closed v1.1 | Sprint 3 |
| Personal workspace detail | ✅ Closed v1.1 | — |
| Price history normalization | ✅ Closed v1.1 | Sprint 1 |
| Dashboard metrics | ✅ Closed v1.1 | Sprint 2 |
| Report column spec | ✅ Closed v1.1 | Sprint 2–3 |
| Master item / supplier | 🔜 T2 | — |
| Reminder | 🔜 T2 | — |
| Kualitas air (WaterQualityLog) | ✅ Live, termasuk ambang & saran per kolam | Sisa: CRUD batch di UI |
| Auth multi-user (admin) | ✅ Live | Tanpa register |
| Revenue otomatis | 🔜 T3 | — |

---

## 20. Sprint Breakdown

*(rencana asli 3–4 minggu — di bawah: **status aktual codebase**, bukan timeline)*

| Sprint | DoD rencana | Status aktual |
|---|---|---|
| **0 — Foundation** | Login → workspace switch → health check | ⚠️ Login ✅; health ✅; workspace switch ❌ |
| **1 — Master + Transaksi** | Multi-item purchase + histori harga + personal | ⚠️ pembelian + pengeluaran lain; histori harga & personal ❌ |
| **2 — Pakan + Sewa + Lap 1–3** | Lifecycle + kontrak + dashboard keuangan + RPT 01,04,06 | ❌ |
| **3 — Bagi Hasil + Lap 4–6 + Polish** | Distribution + all reports + QA | ❌ |
| **4 — Kualitas Air (T2)** | WQ CRUD + widget + RPT-07 + tab kolam + konfigurasi ambang/saran | ✅ (sisa: CRUD batch UI) |
| **+ Auth & users** | *(di luar sprint asli)* | ✅ Admin user management |

---

## 21. MVP Release Checklist

**Legenda:** ✅ selesai di repo · ⚠️ sebagian · ❌ belum

- [x] Login + logout
- [x] Kelola pengguna (admin, tanpa register)
- [ ] Multi-workspace (business + personal) dengan menu berbeda
- [x] CRUD kolam
- [ ] Histori harga normalized (pembelian multi-item create sudah ada di `/finance`)
- [ ] Consumable: from purchase + manual + lifecycle
- [ ] Kontrak sewa lunas & cicilan + dual status
- [ ] Bayar schedule → transaction, no double count
- [ ] Bagi hasil 2 pihak + formula validated
- [ ] Dashboard metrics sesuai §13 (keuangan)
- [x] Dashboard widget kualitas air + belum diukur hari ini (§13 T2)
- [ ] 6 laporan + personal ringkasan sesuai §14
- [x] CRUD kualitas air + filter list (RPT-07 list)
- [x] Grafik tren kualitas air 7/30 hari di UI (RPT-07)
- [x] Responsive mobile browser

---

## 22. Referensi

- [raw idea.md](./raw%20idea.md) — ide awal modul lele
- [jangka panjang.md](./jangka%20panjang.md) — visi multi-usaha + atomic
- [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) — spesifikasi teknis implementasi (v1.6, §7.5 RBAC + access catalog)

### Tech Stack (implementasi aktual)

| Layer | BRD / Spec awal | Repo saat ini |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript | ✅ + Tailwind + shadcn-style |
| Backend API | Go + Gin (spec) | Go 1.26 + **Fiber** |
| Database | MariaDB 11 | **MySQL 8.4** |
| Cache | Redis 7 | ❌ belum |
| Auth | JWT + bcrypt | ✅ JWT HS256 + bcrypt (logout blacklist Redis belum) |

---

## 23. Status Implementasi (Codebase)

*Terakhir diselaraskan dengan repo `pencatatan-usaha`. Gunakan section ini sebagai sumber kebenaran progress vs §7 / §21.*

### ✅ Sudah ada (backend + frontend)

| ID | Fitur | Catatan |
|---|---|---|
| IMP-AUTH | Login `/login`, JWT, `/auth/me`, `/auth/logout` | Token di localStorage; protected routes |
| IMP-USER | User management | CRUD users, reset password, `PUT /users/:id/roles`, permission `user.*` |
| IMP-RBAC | Role & permission | Migrasi RBAC, `GET /permissions`, form peran, [`shared/access-catalog.json`](./shared/access-catalog.json) |
| IMP-POND | Master kolam | CRUD ponds; hapus kolam **admin only** — cascade: WQ, batch, transaksi & pembelian terkait |
| IMP-WQ | Kualitas air | CRUD logs; hapus catatan **admin only**; validasi minimal 1 field; status + `advice` dari konfigurasi kolam |
| IMP-WQ-CFG | Ambang & saran | JSON di `business_units`; template `GET/PUT /water-quality/config` (PUT admin); form `/ponds/new` dan `/ponds/:id/edit` |
| IMP-DASH-WQ | Dashboard operasional air | Ringkasan per kolam, stat, alert belum diukur hari ini |
| IMP-UI | Layout responsive | Bottom nav mobile, halaman kolam & kualitas air |
| IMP-FIN | Pembelian, pengeluaran, **CRUD akun kas** | UI `/finance`, `/finance/cash-accounts/*` |
| IMP-OPS | Health + Docker | `GET /health`, compose MySQL + API + FE |

### ⚠️ Sebagian (gap ke BRD)

| ID | Fitur | Yang sudah | Yang belum |
|---|---|---|---|
| PART-WQ | T2 / BR-F | CRUD, dashboard, filter, grafik tren UI, batch opsional di form log, ambang & saran per kolam | CRUD batch (hanya `GET /batches`) |
| PART-POND | FR-04 | name, location, notes, status | Form UI untuk size, ownerName |
| PART-WS | MVP-01 / FR-01 | Satu workspace seed `Usaha Lele` | CRUD workspace, switcher, personal workspace |
| PART-FIN | MVP-03 / MVP-11 | Create pembelian multi-item, pengeluaran lain, list kas & transaksi | Histori harga, ubah/hapus pembelian, sewa, pakan, bagi hasil |
| PART-DASH | MVP-07 / §13 | Kartu kualitas air; ringkasan keuangan di `/finance` | Kartu Total Belanja, Pakan, Sewa, Bagi Hasil di dashboard utama |
| PART-AUTH | FR-02 spec | JWT 24h; RBAC fase 1–2 + access catalog | Redis blacklist; audit log UI; CRUD master `/permissions` |

### ❌ Belum ada (masih sesuai rencana MVP asli)

| ID | Fitur BRD |
|---|---|
| MVP-04 | Kontrak sewa + jadwal cicilan |
| MVP-05 | ConsumableLot / pakan |
| MVP-06 | Bagi hasil 2 pihak |
| MVP-08 | Laporan RPT-01 s/d RPT-06 + RPT-P |
| MVP-09 | CRUD batch di UI (`GET /batches` + pilihan di form log sudah ada) |
| MVP-11 | ~~Kas list only~~ | **Sudah:** CRUD kas + RBAC — lihat [docs/features/cash-accounts.md](./docs/features/cash-accounts.md) |
| MVP-01 | Multi-workspace penuh + menu personal |

### Prioritas suggested (backlog BRD)

1. **Sprint 0 sisa:** workspace switcher + seed personal (placeholder).
2. **Sprint 1 sisa:** histori harga pembelian + CRUD batch. Create pembelian multi-item sudah live.
3. **Redis + logout blacklist** (sesuai TECHNICAL_SPEC) saat deploy production.
4. **Sisa T2:** CRUD batch di UI; field size/ownerName di form kolam.
5. **RBAC fase 3 (§24):** audit log + master permission UI (definisi permission tetap dari access catalog).

---

## 24. RBAC — Peran, Permission & Menu

Referensi desain: permission sebagai unit otorisasi, role sebagai paket permission, **backend sumber kebenaran**, frontend untuk UX saja.

### 24.1 Repo saat ini

| Mekanisme | Detail |
|---|---|
| JWT + legacy | Kolom `users.role` `ADMIN`/`USER` masih ada; disinkron ke `user_roles` |
| Role sistem | `workspace_admin` (semua permission catalog), `operator` (subset — lihat JSON `roleDefaults`) |
| Enforcement | `RequirePermission` / `RequireAnyPermission` per endpoint |
| UX | `can()`, `PermissionRoute`, menu dari access catalog |
| Admin legacy | Setara user dengan role `workspace_admin` |

### 24.1b Katalog akses (sumber kebenaran permission produk)

File: [`shared/access-catalog.json`](./shared/access-catalog.json)

- Menyusun **menu**, **halaman**, dan **aksi UI** yang punya kode permission
- Backend **upsert** baris `permissions` saat startup (`make sync-access-catalog` → embed Go)
- Form **Peran** menampilkan checkbox per halaman/aksi (bukan hanya grouping DB `resource`)

Dokumen teknis: [docs/features/access-catalog.md](./docs/features/access-catalog.md), [TECHNICAL_SPEC §7.5](./TECHNICAL_SPEC.md).

### 24.2 Peran target (single-workspace / multi-workspace nanti)

| Kode role | Tujuan | Catatan produk |
|---|---|---|
| `super_admin` | Platform / seed sistem | Kelola master permission; lock role sistem; **T3+** jika multi-tenant |
| `workspace_admin` | Admin usaha (setara `org_admin`) | User + assignment role dalam workspace; konfigurasi template WQ |
| `operator` | Pengelola harian (persona Ahmad) | Catat pembelian, kualitas air, kolam — tanpa kelola permission sistem |
| `user_manager` | HR ringan | CRUD user + assign role **tanpa** edit master permission |
| `auditor` | Read-only + audit | `audit.read`, `user.read`, read modul operasional |
| `viewer` | Read-only operasional | Lihat dashboard, kolam, kualitas air, laporan — tanpa create/update/delete |

**Migrasi:** seed role di atas; map `ADMIN` → `workspace_admin` (+ permission penuh workspace); map `USER` → `operator`.

### 24.3 Format permission (contoh MVP → penuh)

| Resource | Permission |
|---|---|
| User | `user.read`, `user.create`, `user.update`, `user.delete`, `user.assign_role` |
| Role | `role.read`, `role.create`, `role.update`, `role.delete`, `role.assign_permission` |
| Permission master | `permission.read`, `permission.create`, `permission.update`, `permission.delete` |
| Audit | `audit.read` |
| Kolam | `pond.read`, `pond.create`, `pond.update`, `pond.delete` |
| Kualitas air | `water_quality.read`, `water_quality.create`, `water_quality.update`, `water_quality.delete`, `water_quality.config.read`, `water_quality.config.update` |
| Keuangan / kas | `cash_account.read`, `cash_account.create`, `cash_account.update`, `cash_account.delete` | ✅ kas live; pembelian/pengeluaran belum di-guard per permission |
| Keuangan (rencana) | `finance.read`, `finance.purchase.create`, `finance.expense.create` | ❌ belum di catalog |

**Default policy:** deny. Endpoint protected wajib cek permission di middleware (bukan hanya cek string `ADMIN` di JWT).

### 24.4 Map singkat ADMIN/USER → permission (hingga RBAC penuh live)

| Aksi / menu | USER (repo) | ADMIN (repo) | Permission target |
|---|---|---|---|
| Menu Pengguna | ❌ | ✅ | `user.read` |
| CRUD user | ❌ | ✅ | `user.create` / `update` / `delete` |
| Hapus kolam / log WQ | ❌ | ✅ | `pond.delete`, `water_quality.delete` |
| Kelola kas | create/read/update ✅ | delete ✅ | `cash_account.read` … `cash_account.delete` |
| Template WQ (`/settings/water-quality`) | ❌ | ✅ | `water_quality.config.update` |
| Operasional harian | ✅ | ✅ | `pond.*`, `water_quality.*`, `finance.*` (read/create/update) |

### 24.5 Fase implementasi

| Fase | Backend | Frontend | Status |
|---|---|---|---|
| **0** | JWT claim `role`; `RequireAdmin` | Menu Pengguna jika `isAdmin` | ✅ digantikan |
| **1** | RBAC + access catalog seed; `/auth/me` permissions | `can()`; Kelola Akses | ✅ |
| **2** | CRUD role; assignment | `/roles`, form peran + catalog | ✅ |
| **3** | Permission CRUD platform; audit | `/permissions`, `/audit-logs` | ❌ |

Detail API & skema: [TECHNICAL_SPEC.md §7.5](./TECHNICAL_SPEC.md).
