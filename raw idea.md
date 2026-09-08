Baik, berarti kebutuhan nyatanya sekarang lebih spesifik. Sistemnya belum perlu terlalu “akuntansi penuh”, tapi harus kuat untuk mencatat hal-hal operasional utama usaha lele:

1. **pembelian barang + harga barang**
2. **sewa kolam untuk 12 bulan**
3. **pembelian pakan + prediksi/realita habis sampai kapan**
4. **bagi hasil**

Dengan kebutuhan ini, saya sarankan desain sistemnya jangan mulai dari “aplikasi keuangan lengkap”, tapi dari:

## **Sistem pencatatan operasional + pengeluaran usaha**
yang nanti bisa berkembang jadi:
- usaha lele
- usaha lain
- bahkan personal

---

# Gambaran inti sistem

Saya sarankan sistem dibagi menjadi 4 modul utama:

## 1. Modul Pembelian / Pengeluaran Barang
Untuk mencatat:
- beli barang apa
- jumlah berapa
- harga satuan
- total harga
- tanggal beli
- dipakai untuk apa

Contoh:
- ember 2 buah x 75000
- jaring 1 x 120000
- pakan PF1000 3 karung x 350000
- obat 2 botol x 45000

Jadi bukan cuma “uang keluar”, tapi juga ada detail barang.

---

## 2. Modul Sewa Kolam
Karena sewa kolam itu bukan pengeluaran harian biasa. Itu lebih cocok dianggap sebagai:

- **kontrak / komitmen biaya**
- punya periode mulai
- lama sewa
- jatuh tempo
- bisa dibayar lunas atau bertahap

Contoh:
- Kolam A
- masa sewa: Jan–Des
- nilai sewa: 12 juta
- pembayaran: lunas / cicilan
- biaya per bulan: 1 juta

Ini penting karena nanti laporan bisa tahu:
- sewa kolam aktif yang masih berjalan
- kapan habis sewanya
- berapa beban sewa per bulan

---

## 3. Modul Pakan
Ini juga sebaiknya jangan dianggap sekadar pembelian barang biasa.

Karena pakan punya 2 sisi:
- **dibeli kapan dan berapa**
- **dipakai/habis sampai kapan**

Artinya sistem perlu mencatat:
- stok masuk
- estimasi pemakaian
- tanggal habis
- pemakaian aktual

Contoh:
- beli 10 karung pakan 20 Jan
- total 300 kg
- dipakai untuk Kolam A dan B
- estimasi habis 18 Feb
- realita habis 15 Feb

Dari sini bisa muncul manfaat:
- tahu kebutuhan pakan per periode
- tahu boros atau hemat
- bisa prediksi kapan harus beli lagi

---

## 4. Modul Bagi Hasil
Ini beda lagi dari pengeluaran barang.

Bagi hasil lebih tepat dicatat sebagai:
- kesepakatan dengan partner/investor/pemilik kolam
- dasar pembagian
- persen atau nominal
- periode bagi hasil
- status sudah dibayar atau belum

Contoh:
- hasil panen batch Januari
- laba bersih: 8 juta
- bagi hasil 40% untuk pemilik modal
- dibayar tanggal 10 Feb

Atau:
- bagi hasil pemilik kolam 20%
- pengelola 80%

---

# Desain sistem yang lebih pas dengan kebutuhan Anda

Saya susun ulang menjadi model yang praktis.

---

# A. Entitas utama

## 1. Workspace
Supaya nanti tetap bisa dipakai untuk banyak usaha / personal.

Contoh:
- Usaha Lele A
- Usaha Lele B
- Keuangan Pribadi

---

## 2. Transaksi
Semua catatan uang masuk/keluar tetap masuk ke tabel transaksi utama.

### Jenis transaksi:
- pembelian barang
- sewa
- pakan
- bagi hasil
- biaya operasional lain
- pemasukan nanti bisa ditambah

Field dasar:
- tanggal
- jenis transaksi
- nominal
- deskripsi
- akun kas/sumber dana
- catatan

---

## 3. Item Barang
Karena Anda mencatat pembelian barang dan harga barang, perlu detail item.

Field:
- nama barang
- kategori barang
- satuan
- jumlah
- harga satuan
- total
- supplier
- terkait transaksi mana

Contoh kategori barang:
- pakan
- alat
- obat
- bahan perawatan
- perlengkapan

---

## 4. Kolam
Karena ada sewa kolam, kolam perlu jadi data master.

Field:
- nama kolam
- lokasi
- ukuran
- status aktif/nonaktif
- pemilik kolam
- catatan

Nanti transaksi bisa dikaitkan ke kolam tertentu.

---

## 5. Kontrak Sewa
Pisahkan dari transaksi biasa.

Field:
- kolam_id
- tanggal mulai
- tanggal selesai
- durasi bulan
- nilai total sewa
- metode pembayaran
- jatuh tempo
- status kontrak

Kalau dibayar bertahap:
- kontrak sewa tetap 1
- pembayaran sewanya bisa banyak transaksi

Jadi rapi.

---

## 6. Batch / Siklus
Opsional tapi sangat berguna.

Kalau nanti mau tahu biaya per siklus:
- batch Januari
- batch Februari
- batch pembibitan A

Field:
- nama batch
- tanggal mulai
- tanggal selesai
- kolam terkait
- jumlah tebar
- status

Ini membantu mengaitkan:
- pakan
- obat
- sewa
- bagi hasil
ke siklus tertentu.

---

## 7. Catatan Pakan
Karena pakan punya logika khusus, saya sarankan ada tabel khusus, bukan cuma transaksi biasa.

Field:
- transaksi_pembelian_id
- jenis pakan
- jumlah sak/karung
- berat total kg
- harga total
- tanggal beli
- estimasi mulai dipakai
- estimasi habis
- tanggal habis aktual
- kolam/batch terkait
- catatan konsumsi

Dengan ini bisa jawab pertanyaan:
- pakan yang dibeli tanggal sekian habis kapan?
- berapa lama 1 pembelian pakan bertahan?
- rata-rata kebutuhan pakan per minggu/bulan?

---

## 8. Skema Bagi Hasil
Jangan campur langsung dengan transaksi biasa.

Field:
- nama skema
- pihak 1
- pihak 2
- dasar pembagian
- jenis pembagian (`persentase` / `nominal tetap`)
- nilai pembagian
- periode
- batch/kolam terkait
- status aktif

Contoh:
- Pemilik modal 30%
- Pengelola 70%

---

## 9. Realisasi Bagi Hasil
Karena skema dan pembayaran aktual itu beda.

Field:
- skema_bagi_hasil_id
- periode
- dasar perhitungan
- total hasil
- total biaya
- laba bersih
- porsi pihak A
- porsi pihak B
- tanggal dibayar
- status bayar

Ini penting agar riwayatnya jelas.

---

# B. Struktur modul yang saya sarankan

## Modul 1 — Pembelian Barang
Form input:
- tanggal
- nama barang
- kategori barang
- jumlah
- satuan
- harga satuan
- total
- supplier
- kolam/batch
- catatan

### Output laporan:
- daftar pembelian barang
- total pengeluaran barang per bulan
- harga barang terakhir
- riwayat harga barang

Ini penting karena Anda bilang saat ini ada catatan pembelian barang dan harga barang saja.  
Berarti sistem perlu menyimpan **histori harga**, bukan hanya transaksi.

---

## Modul 2 — Sewa Kolam
Form input:
- nama kolam
- pemilik kolam
- tanggal mulai sewa
- durasi 12 bulan
- nilai total
- pola bayar
- jatuh tempo
- catatan

### Fitur yang penting:
- pengingat sewa akan habis
- pengingat jatuh tempo cicilan
- hitung biaya sewa per bulan
- status aktif / akan habis / selesai

### Laporan:
- daftar kolam aktif
- masa sewa berakhir kapan
- total beban sewa bulan ini
- riwayat pembayaran sewa

---

## Modul 3 — Pakan
Form input pembelian pakan:
- tanggal beli
- jenis pakan
- merek
- jumlah sak
- berat per sak
- total kg
- harga per sak
- total harga
- untuk kolam/batch mana

Form update pemakaian:
- mulai dipakai tanggal
- estimasi habis tanggal
- realisasi habis tanggal
- catatan konsumsi

### Laporan:
- stok pakan masuk
- pakan aktif yang sedang dipakai
- estimasi sisa hari
- rata-rata lama habis
- pengeluaran pakan per batch/kolam

Ini salah satu bagian paling penting di usaha lele.

---

## Modul 4 — Bagi Hasil
Form input:
- nama partner/pihak
- jenis hubungan: investor / pemilik kolam / pengelola / mitra
- skema pembagian
- objek terkait: kolam/batch/periode
- dasar perhitungan: omzet / laba bersih / hasil panen
- persentase / nominal
- tanggal realisasi pembayaran

### Laporan:
- daftar pembagian hasil per periode
- yang belum dibayar
- total bagi hasil ke masing-masing pihak
- per batch atau per kolam

---

# C. Alur kerja sistem yang paling cocok

## 1. Saat beli barang
Catat:
- barang
- jumlah
- harga satuan
- total
- untuk kebutuhan apa

Kalau barang itu pakan, sistem bisa otomatis masuk juga ke modul pakan.

---

## 2. Saat sewa kolam
Buat kontrak sewa:
- periode 12 bulan
- nilai total
- jadwal pembayaran

Setelah itu setiap pembayaran dicatat sebagai transaksi pembayaran sewa.

---

## 3. Saat pakan mulai dipakai
Update:
- pakan digunakan untuk kolam/batch mana
- estimasi habis kapan

Saat habis:
- update tanggal habis aktual

---

## 4. Saat hitung bagi hasil
Pilih:
- periode / batch
- hasil usaha
- total biaya
- laba
- sistem hitung porsi bagi hasil

Lalu simpan status:
- belum dibayar
- sudah dibayar

---

# D. Desain database sederhana

Berikut model tabel yang praktis.

## 1. workspaces
- id
- name
- type

## 2. ponds
- id
- workspace_id
- name
- location
- owner_name
- status
- notes

## 3. transactions
- id
- workspace_id
- transaction_date
- transaction_type (`purchase`, `rent_payment`, `feed_purchase`, `profit_share`, `other_expense`)
- amount
- description
- pond_id nullable
- batch_id nullable
- created_at

## 4. purchase_items
- id
- transaction_id
- item_name
- item_category
- qty
- unit
- unit_price
- total_price
- supplier_name
- notes

## 5. rent_contracts
- id
- workspace_id
- pond_id
- start_date
- end_date
- duration_months
- total_rent_amount
- payment_scheme
- monthly_equivalent
- status
- notes

## 6. rent_payments
- id
- rent_contract_id
- transaction_id
- payment_date
- amount
- notes

## 7. feed_records
- id
- workspace_id
- transaction_id
- pond_id nullable
- batch_id nullable
- feed_name
- brand
- qty_bags
- weight_per_bag
- total_weight
- total_cost
- purchase_date
- start_use_date
- estimated_end_date
- actual_end_date
- status
- notes

## 8. batches
- id
- workspace_id
- pond_id
- name
- start_date
- end_date
- status
- notes

## 9. profit_share_schemes
- id
- workspace_id
- name
- related_type (`pond`, `batch`, `general`)
- related_id
- base_type (`revenue`, `net_profit`, `fixed`)
- party_one_name
- party_one_value
- party_one_type (`percent`, `fixed`)
- party_two_name
- party_two_value
- party_two_type
- status

## 10. profit_share_records
- id
- scheme_id
- period_start
- period_end
- gross_result
- total_cost
- net_result
- party_one_amount
- party_two_amount
- payment_status
- payment_date
- notes

---

# E. Supaya tetap general untuk usaha lain / personal

Agar nanti tidak cuma untuk lele, logikanya begini:

## Yang bersifat umum:
- transaksi
- pembelian barang
- kontrak periodik
- persediaan habis pakai
- bagi hasil/komisi
- laporan

## Yang khusus lele:
- kolam
- batch
- pakan

Kalau nanti dipakai untuk usaha lain:
- “kolam” bisa diganti jadi unit usaha/aset
- “pakan” bisa diganti jadi bahan habis pakai
- “bagi hasil” tetap bisa dipakai untuk investor/partner/komisi
- “sewa kolam” bisa berubah jadi sewa kios/gudang/tempat usaha

Jadi desain generalnya sebaiknya seperti ini:

### Modul umum:
- transaksi
- item pembelian
- kontrak biaya periodik
- konsumsi bahan habis pakai
- bagi hasil

### Modul template lele:
- kolam
- batch
- pakan

---

# F. Laporan yang paling berguna untuk Anda

Dengan kebutuhan yang Anda sebutkan, laporan minimum yang perlu ada:

## 1. Laporan pembelian barang
- tanggal
- barang
- jumlah
- harga satuan
- total
- supplier

## 2. Laporan histori harga barang
- barang apa
- kapan beli
- harga satuan berapa
- naik/turun dibanding sebelumnya

Ini penting untuk memantau harga pakan atau alat.

## 3. Laporan sewa kolam
- nama kolam
- periode sewa
- total sewa
- sudah dibayar berapa
- sisa berapa
- habis kontrak kapan

## 4. Laporan pakan
- jenis pakan
- tanggal beli
- jumlah
- total kg
- dipakai mulai kapan
- estimasi habis kapan
- aktual habis kapan

## 5. Laporan bagi hasil
- periode
- dasar perhitungan
- laba/hasil
- porsi masing-masing pihak
- status pembayaran

## 6. Ringkasan operasional
- total belanja barang bulan ini
- total pakan bulan ini
- total beban sewa bulan ini
- total bagi hasil bulan ini

---

# G. Versi MVP yang paling realistis

Kalau mau dibuat bertahap, saya sarankan:

## Tahap 1
Fokus pada yang Anda butuhkan sekarang:
- master kolam
- catat pembelian barang
- histori harga barang
- catat sewa kolam
- catat pembelian pakan
- estimasi pakan habis kapan
- catat bagi hasil
- dashboard sederhana

## Tahap 2
- batch/siklus
- reminder jatuh tempo sewa
- reminder pakan hampir habis
- filter per kolam
- filter per periode

## Tahap 3
- pemasukan penjualan
- hitung laba otomatis
- stok barang
- multi-user
- ekspor Excel/PDF

---

# H. Rekomendasi desain final

Kalau saya sederhanakan, sistem Anda sebaiknya punya **5 objek inti**:

1. **Kolam**
2. **Pembelian Barang**
3. **Kontrak Sewa**
4. **Pakan**
5. **Bagi Hasil**

Semua itu dibungkus dalam **transaksi umum** supaya nanti bisa berkembang ke jenis usaha lain.

---

# I. Contoh struktur menu aplikasi

- Dashboard
- Kolam
- Pembelian Barang
- Pakan
- Sewa Kolam
- Bagi Hasil
- Laporan
- Pengaturan

---

# J. Saran penting

Untuk kasus Anda, saya sangat sarankan **jangan langsung pakai kategori keuangan yang terlalu rumit**.  
Lebih baik mulai dari bentuk operasional yang memang dipakai sehari-hari:

- barang dibeli apa
- untuk kolam mana
- sewa sampai kapan
- pakan habis kapan
- bagi hasil ke siapa

Itu jauh lebih natural untuk dipakai.

