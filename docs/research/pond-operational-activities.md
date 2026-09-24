# Riset: pencatatan aktivitas operasional kolam (lele)

**Tujuan:** landasan domain sebelum `docs/features/pond-activities.md` (atau nama setara).  
**Bukan kontrak fitur.** Verifikasi dengan praktisi lapangan wajib.

## Ringkasan eksekutif

Di budidaya lele, “catatan harian” di lapangan biasanya **bukan satu jenis form**, melainkan beberapa lembar yang saling melengkapi:

| Jejak di buku lapangan | Isi tipikal | Sudah ada di `pencatatan-usaha`? |
|------------------------|-------------|----------------------------------|
| Pemberian pakan (kg/hari, respons) | Konsumsi vs rencana, sisa pakan | ⚠️ **Belum** — `ConsumableLot` (MVP-05) belum diimplementasi; pembelian pakan lewat `PURCHASE` + line FEED |
| Kualitas air (pH, amonia, …) | Observasi + tindakan | ✅ `WaterQualityLog` (T2) |
| Mortalitas / kejadian | Jumlah mati, cuaca, pencurian, banjir | ❌ |
| Sampling bobot / hitung ulang | Estimasi biomassa → ration pakan | ❌ (batch metadata ada, UI batch belum lengkap) |
| Tebar / panen | Siklus produksi | ❌ (batch opsional, belum workflow) |
| Input biaya (pakan, obat, transport) | Uang keluar | ✅ `Transaction` / pembelian |
| Perawatan (obat, pupuk, liming) | Event + dosis | ❌ (obat bisa lewat pembelian; **event aplikasi** belum) |

**Kesimpulan desain awal:** fitur “aktivitas” paling masuk akal sebagai **catatan operasional non-keuangan** (seperti `WaterQualityLog`), dengan **tipe aktivitas** yang jelas, supaya tidak menggandakan transaksi atau mengaburkan modul kualitas air.

---

## Sumber primer (ringkas)

### 1. Buku catatan per kolam & siklus

Farm Africa — *Farmer record keeping booklet* (KMAP): **satu lembar per kolam per siklus**; mencakup stocking, sampling, **daily feeding sheet** (rencana kg, yang diberi, sisa dikembalikan), **observations/other inputs**, panen, indikator FCR & survival.  
Sumber: [farmafrica.org PDF](https://www.farmafrica.org/wp-content/uploads/2024/07/farmer-record-keeping-booklet.pdf)

### 2. Manual budidaya lele Afrika

BEAM — *Training manual grow-out pond culture of African catfish*: menekankan **record keeping** untuk rencana (liming, pupuk, tebar, manajemen pasca-tebar); catatan pakan harus memuat **jenis pakan, jumlah per hari, respons makan**.  
Sumber: [beamexchange.org PDF](https://beamexchange.org/documents/2334/Aquaculture-Training-Manual-Final-2.pdf)

### 3. Handbook industri

Aller Aqua — *Catfish handbook*: **pH, suhu, oksigen, amonia** dipantau; **mortalitas** diambil dan dicatat; **kuantitas pakan** dicatat harian untuk performa & pendapatan.  
Sumber: [aller-aqua catfish handbook PDF](https://www.datocms-assets.com/106601/1741515453-aller-aqua-catfish-handbook_en_download.pdf)

### 4. Peternak skala kolam (AS, pola relevan)

Texas A&M — *Catfish Farmer's Handbook*: **daily feeding record per kolam**; **weekly pond record** (stok, bobot, pakan mingguan, gain, panen, perawatan di remarks); akurasi estimasi bobot kolam menentukan ration & kualitas air.  
Sumber: [extension.rwfm.tamu.edu PDF](https://extension.rwfm.tamu.edu/wp-content/uploads/sites/8/2013/09/Catfish-Farmers-Handbook.pdf)

### 5. FAO — manajemen rutin

FAO — *Management for freshwater fish culture*: monitoring rutin + **catatan terstruktur** untuk keputusan pupuk/pakan; pemeriksaan air **mingguan** lebih lengkap; kolom catatan untuk cuaca, tindakan manajemen, dll.  
Sumber: [FAO x6709e §16](https://www.fao.org/fishery/static/FAO_Training/FAO_Training/General/x6709e/x6709e16.htm)

---

## Pola aktivitas yang sering muncul (taxonomy draft)

Untuk lele grow-out di kolam, aktivitas operasional yang **sering** dan **berbeda dari uang** atau **berbeda dari satu pengukuran WQ**:

| Kode draft | Label ID | Frekuensi | Field khas | Hubungan biaya |
|------------|----------|-----------|------------|----------------|
| `FEEDING` | Pemberian pakan | Harian, bisa 1–2× | kg diberi, jenis/merek lot, respons makan, sisa | Tidak buat transaksi; kurangi stok lot / konsumsi lot |
| `MORTALITY` | Mortalitas | Saat ada | jumlah ekor, estimasi kg opsional, penyebab teks | Tidak |
| `TREATMENT` | Obat / perawatan | Ad hoc | nama obat, dosis, cara aplikasi | Biaya sudah di pembelian; ini **event pakai** |
| `SAMPLING` | Sampling bobot | Mingguan | avg weight, jumlah sampel, estimasi biomassa | Tidak |
| `STOCKING` | Tebar benih | Per siklus | jumlah, ukuran, supplier teks | Bisa link batch; biaya bisa terpisah |
| `HARVEST` | Panen (partial/full) | Per siklus | kg/ekor, jenis panen | Hasil uang masuk **belum** MVP bisnis |
| `INFRA_CHECK` | Cek infrastruktur | Rutin | aerator, pompa, tangki resapan | Tidak |
| `GENERAL_NOTE` | Catatan umum | Ad hoc | teks bebas, cuaca | Tidak |

**Kualitas air** sengaja **tidak** dimasukkan sebagai tipe generik di sini — sudah atom `WaterQualityLog` di BRD §4 (Q17).

---

## Keselarasan dengan arsitektur repo saat ini

Dari `BRD.md` §4–§5:

- **Observasional tanpa Transaction:** `WaterQualityLog` ✅
- **Lifecycle pakan:** `ConsumableLot` (beli → pakai → habis) — **belum** di DB/kode
- **Q10:** prompt “Buat catatan consumable?” setelah pembelian FEED/MEDICINE — **belum** UI
- **Batch:** metadata opsional; CRUD batch UI masih backlog T2
- **Dashboard:** widget “Pakan aktif” butuh lot + estimasi habis — belum

**Celah produk:** pengguna bisa **beli** pakan dan **ukur air**, tetapi tidak punya tempat terstruktur untuk **“hari ini kolam A diberi 12 kg pakan X, respons bagus”** atau **“5 ekor mati setelah hujan”** tanpa memaksakan ke catatan WQ atau transaksi.

---

## Opsi arsitektur (untuk keputusan produk)

### Opsi A — Satu entitas `PondActivity` (polymorphic)

Satu tabel/log dengan `activity_type` + JSON/`payload` atau kolom nullable per tipe.

- **Pro:** satu timeline di detail kolam; satu API list/filter.
- **Kontra:** validasi per tipe lebih rumit; risiko “god object”.

### Opsi B — Per tipe atom (seperti WQ terpisah)

`FeedingLog`, `MortalityLog`, …

- **Pro:** validasi ketat, laporan per domain jelas.
- **Kontra:** banyak endpoint/UI; timeline kolam perlu agregasi.

### Opsi C — Perluas yang ada

- Pakan harian → hanya lewat **ConsumableLot** (kurangi stok per event).
- Mortalitas/notes → field di `WaterQualityLog` atau `Batch`.

- **Pro:** sedikit entitas baru.
- **Kontra:** WQ jadi campur aduk; lot tanpa event harian tidak cukup untuk “respons makan”.

### Opsi D — Timeline operasional + referensi

`PondActivity` minimal (waktu, kolam, tipe, ringkasan) + **link** ke entitas lain (`water_quality_log_id`, `consumable_lot_id`, `transaction_id` read-only).

- **Pro:** tidak duplikasi data WQ; feed event bisa mengurangi lot.
- **Kontra:** model relasi perlu aturan anti double-count.

**Rekomendasi riset (bukan keputusan final):** MVP aktivitas mulai dari **Opsi A atau D** dengan **2–3 tipe pertama** (`FEEDING`, `MORTALITY`, `GENERAL_NOTE`), setelah atau paralel dengan **ConsumableLot** minimal agar `FEEDING` punya referensi lot.

---

## Implikasi laporan & dashboard (draft)

| Kebutuhan | Sumber data |
|-----------|-------------|
| FCR / efisiensi pakan | Σ pakan (aktivitas atau lot) ÷ gain biomass (sampling/panen) |
| Timeline kolam | Gabung WQ + aktivitas + transaksi (read-only) di UI |
| Alert “belum catat pakan hari ini” | Mirip “belum ukur WQ hari ini” |
| RPT operasional | BRD RPT-04 pakan = **lifecycle lot**; aktivitas harian bisa feed **detail** RPT-04 atau widget, bukan duplikasi pembelian |

---

## Risiko & anti-patterns

1. **Double-count biaya:** aktivitas pemberian pakan tidak boleh membuat `Transaction` baru jika pakan sudah dibeli via `PURCHASE`.
2. **Overlap WQ:** jangan wajibkan pH/amonia di form pakan; arahkan ke modul WQ atau link.
3. **Scope meledak:** tebar/panen/penuh FAO dalam satu rilis — pecah fase (feeding + notes dulu).
4. **Tanpa lot:** `FEEDING` hanya kg + catatan tanpa lot masih berguna, tetapi widget “pakan aktif” tetap butuh `ConsumableLot`.

---

## Pertanyaan terbuka (untuk grilling / workshop)

Lihat sesi grilling dengan pemilik produk; keputusan di sini mengisi `docs/features/pond-activities.md`.

---

## Referensi internal

- `BRD.md` §4 glossary, §5 atom, FR-09 pakan, FR T2 WQ, Q10/Q17/Q20
- `docs/research/pond-spec-water-quality.md` — parameter air (jangan dicampur sembarang ke aktivitas)
- `TECHNICAL_SPEC.md` §20 — MVP-05 pakan belum

*Disusun: 2026-09-24. Sumber web di atas; SNI/KKP spesifik Indonesia disarankan ditambahkan pada review lapangan.*
