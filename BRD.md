# BRD v1.1 — Pencatatan Operasional Usaha

| Field | Value |
|---|---|
| Versi | 1.1 |
| Status | Final — siap implementasi (post-review) |
| Produk | Aplikasi pencatatan operasional + pengeluaran usaha |
| Codename | `pencatatan-usaha` |
| Changelog v1.1 | Tambah glossary, business rules, state machine, validation, report spec, dashboard metrics, personal workspace, perkuat acceptance criteria |

---

## 1. Ringkasan Eksekutif

**Produk:** Aplikasi web pencatatan operasional + pengeluaran usaha, dimulai dari usaha lele, dirancang atomic untuk berkembang ke usaha lain dan keuangan pribadi.

**Masalah:** Pencatatan operasional lele (belanja barang, sewa kolam, pakan, bagi hasil) masih tersebar dan tidak terstruktur.

**Solusi MVP:** 4 modul operasional + dashboard + laporan, dalam arsitektur multi-workspace dengan atomic primitives.

**Fokus MVP:** pengeluaran operasional. Pemasukan/revenue otomatis belum masuk; income manual hanya di workspace personal.

**Bukan scope MVP:** akuntansi penuh, revenue otomatis, multi-user, export, reminder, offline.

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
| Q11 | Single user + login sederhana |
| Q12 | Laporan MVP incremental: 3 dulu → 6 lengkap |
| Q13 | Pembelian MVP: **multi-item** (1 transaksi, N line items) |
| Q14 | Bagi hasil MVP: **maksimal 2 pihak** per skema |
| Q15 | Histori harga: **`item_name_normalized`** (lowercase + trim) |
| Q16 | Status kontrak: **2 dimensi terpisah** (waktu + pembayaran) |

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
```

### Relasi Entitas Kritis (Anti Double-Count)

| Relasi | Aturan |
|---|---|
| Transaction ↔ PurchaseLineItem | 1 transaksi `PURCHASE` punya 1..N line items. `transaction.amount` = SUM(line items). |
| PurchaseLineItem ↔ ConsumableLot | Opsional 1:0..1. Lot **boleh** link ke line item pakan; harga lot diwarisi dari line item. |
| ConsumableLot ↔ Transaction | Lot **boleh** punya `transaction_id` (dari pembelian) atau dibuat manual tanpa transaksi. |
| PaymentSchedule ↔ Transaction | Bayar schedule → buat 1 Transaction `RENT_PAYMENT` + ContractPayment. Jangan double-count di laporan. |
| DistributionRecord ↔ Transaction | Tandai bayar → buat 1 Transaction `PROFIT_SHARE_PAYOUT` per record. Laporan bagi hasil pakai record, bukan re-sum transaction. |

### Extension Points (Future)

- `BusinessUnit.unit_type` → kios, gudang, dll.
- `ConsumableLot.lot_type` → obat, bahan baku, dll.
- Workspace type `personal` → subset modul transaksi
- Template usaha lain via plugin/template layer

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

| ID | Fitur |
|---|---|
| MVP-01 | Multi-workspace (usaha + personal) |
| MVP-02 | Master kolam (BusinessUnit) |
| MVP-03 | Pembelian barang multi-item + histori harga |
| MVP-04 | Kontrak sewa + jadwal cicilan auto-generate |
| MVP-05 | Pakan (ConsumableLot): lifecycle + buat manual/direct |
| MVP-06 | Bagi hasil: skema 2 pihak + realisasi manual |
| MVP-07 | Dashboard dengan metrik terdefinisi |
| MVP-08 | 6 laporan dengan spesifikasi kolom |
| MVP-09 | Batch opsional |
| MVP-10 | Login single user |
| MVP-11 | Kas default per workspace |

### Out of Scope — MVP

- Pemasukan penjualan / revenue otomatis (business workspace)
- Multi-user & role-based access
- Reminder/notifikasi push
- Stok barang non-pakan
- Export Excel/PDF
- Offline mode
- Akuntansi penuh
- Master supplier & master item (normalisasi via `item_name_normalized` saja)
- Bagi hasil >2 pihak

### Roadmap

| Tahap | Tambahan |
|---|---|
| **T2** | Reminder, master supplier, multi-kas, master item |
| **T3** | Revenue otomatis, laba otomatis, multi-user, export |
| **Visi** | Template usaha lain, extension API |

---

## 8. Perilaku Workspace Personal (MVP)

| Aspek | Business Workspace | Personal Workspace |
|---|---|---|
| Kas | Auto "Kas Utama" | Auto "Kas Utama" |
| Modul | Kolam, Pembelian, Pakan, Sewa, Bagi Hasil, Laporan | Transaksi saja |
| Transaction types | PURCHASE, RENT_PAYMENT, PROFIT_SHARE_PAYOUT, OTHER_EXPENSE | OTHER_EXPENSE, OTHER_INCOME |
| Kategori | Via line item category (pembelian) | Kategori pribadi: Makan, Transport, Belanja, Tagihan, Hiburan, Lainnya |
| Dashboard | 4 kartu operasional + widget pakan/sewa | 2 kartu: total keluar & total masuk bulan ini |
| Laporan | 6 laporan operasional | Ringkasan sederhana (filter periode, grouped by kategori) |
| Menu | Full menu lele template | Dashboard + Transaksi |
| Batch/Kolam/Pakan/Sewa/Bagi Hasil | ✅ | ❌ tidak tampil |

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

### FR-02 Auth
- Login email + password (single user)
- JWT session; logout blacklist token

### FR-03 Kas
- Auto-create "Kas Utama" per workspace
- Semua transaksi link ke kas (default pre-selected)

### FR-04 Master Kolam
- CRUD: nama, lokasi, ukuran, pemilik, status, catatan
- List + filter status

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

### FR-12 Laporan
- Lihat §14 Report Specification

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

---

## 16. Screen Flow & Menu

*(unchanged from v1.0 — see P-01 s/d P-19, menu structure)*

| # | Halaman | Catatan v1.1 |
|---|---|---|
| P-06 | Pembelian — Form | **Multi-item**: tabel baris + tombol tambah baris |
| P-03 | Dashboard | Business vs Personal layout berbeda (§8) |
| P-17 | Laporan — Detail | Kolom sesuai §14 |

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
| Revenue otomatis | 🔜 T3 | — |

---

## 20. Sprint Breakdown

*(unchanged timeline, 3–4 minggu — catatan: estimasi agresif; buffer 20% disarankan)*

### Sprint 0 — Foundation
**DoD:** Login → workspace switch → health check

### Sprint 1 — Master + Transaksi
**DoD:** Multi-item purchase + histori harga normalized + personal expense/income

### Sprint 2 — Pakan + Sewa + Lap 1–3
**DoD:** Consumable lifecycle + dual status kontrak + dashboard metrics + RPT 01,04,06

### Sprint 3 — Bagi Hasil + Lap 4–6 + Polish
**DoD:** Distribution 2-party + all reports + QA

---

## 21. MVP Release Checklist

- [ ] Login + logout
- [ ] Multi-workspace (business + personal) dengan menu berbeda
- [ ] CRUD kolam
- [ ] Multi-item purchase + histori harga normalized
- [ ] Consumable: from purchase + manual + lifecycle
- [ ] Kontrak sewa lunas & cicilan + dual status
- [ ] Bayar schedule → transaction, no double count
- [ ] Bagi hasil 2 pihak + formula validated
- [ ] Dashboard metrics sesuai §13
- [ ] 6 laporan + personal ringkasan sesuai §14
- [ ] Responsive mobile browser

---

## 22. Referensi

- [raw idea.md](./raw%20idea.md) — ide awal modul lele
- [jangka panjang.md](./jangka%20panjang.md) — visi multi-usaha + atomic
- [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md) — spesifikasi teknis implementasi

### Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Backend API | Go 1.23 + Gin |
| Database | MariaDB 11 |
| Cache | Redis 7 |
