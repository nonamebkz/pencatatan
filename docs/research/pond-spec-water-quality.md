# Riset: Spesifikasi Kolam & Kualitas Air Budidaya Lele (Clarias sp.)

**Tujuan dokumen:** landasan primer untuk perancangan fitur pemodelan kualitas air dan metadata unit budidaya di aplikasi Pencatatan.  
**Spesies acuan:** lele dumbo / African catfish (*Clarias gariepinus* Burchell, 1822; hibrida *C. gariepinus* × *C. fuscus* pada SNI Indonesia).  
**Tanggal:** 23 September 2026  
**Status:** riset awal — bukan kontrak produk.

---

## Ringkasan eksekutif

1. **Standar nasional Indonesia** (SNI 01-6484.5:2002 kelas pembesaran kolam) menetapkan kisaran kualitas air: suhu 25–30 °C, pH 6,5–8,5, DO >4 mg/L, kecerahan (Secchi) 25–30 cm, amonia terlarut (NH₃) <0,01 mg/L; kolam minimal 100 m², tinggi air 0,75–1,5 m ([Komunitas Penyuluh Perikanan, 2017](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html); [Suwarsito et al., 2020](https://ejournal-balitbang.kkp.go.id/index.php/aureliajournal/article/download/9887/7241)). SNI induk/pembenihan (6484.3:2014) memakai ambang NH₃ lebih longgar (maks. 0,1 mg/L) dan DO minimal 3 mg/L ([SNI 6484.3 ringkasan](https://pdfcoffee.com/download/tpsni-ikan-lele-pdf-free.html); [KKP/SMART-Fish SOP pembenihan](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf)).

2. **Praktik lapangan** jauh lebih beragam daripada SNI: padat tebar kolam tanah 35–400 ekor/m², tinggi air operasional 30–120 cm, bioflok/KKP 250 ekor/m³ ([Fauziyah, JKSE KKP](https://ejournal-balitbang.kkp.go.id/index.php/jkse/article/download/7764/6428); [Panduan KKP bioflok nila/lele](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf)). Lele toleran DO rendah (air breathing) tetapi pertumbuhan dan pakan optimal masih mengutamakan DO ≥4–6 mg/L ([Păpuc et al., 2019](https://elba.bioflux.com.ro/docs/2019.9-17.pdf); [NCRAC Fact Sheet 170](https://southcenters.osu.edu/sites/southc/files/site-library/site-images/WaterChemistryInAquacultureNCRAC.pdf)).

3. **Degradasi air** didorong terutama oleh beban pakan, biomassa, akumulasi feses/sisa pakan, dan kapasitas asimilasi (plankton, nitrifikasi, pertukaran air). Aturan praktis dari literatur akuakultur global: ekresi N ≈300 mg N/m²/hari pada pemberian pakan 100 kg/ha/hari; batas asimilasi kolam statis ~30 kg pakan/ha/hari tanpa aerasi dan ~120 kg/ha/hari dengan aerasi 3–4 hp/ha ([Boyd via Global Seafood Advocate](https://www.globalseafood.org/advocate/nitrogen-and-phosphorus-loads-vary-by-system/); [Cole & Boyd, 1986](https://doi.org/10.1577/1548-8640(1986)48)). **Tidak ada model deterministik sederhana yang divalidasi khusus lele Indonesia** untuk prediksi drift harian pH/amonia dari volume saja — perlu log pakan, aerasi, dan pengukuran.

4. **Koreksi:** pengapuran dasar kolam (pra-tebar) umum 50–168 g CaCO₃/m² atau 2.000–3.000 kg/ha; kapur tohor di air kolam berisi ikan berisiko lonjakan pH ([SNI 6484.5 via penyuluh](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html); [UF/IFAS FA028](https://ask.ifas.ufl.edu/publication/FA028/pdf); [Hasibuan & Syafriadiman, kolam Kampar](https://studylibid.com/doc/1088755/saberina-hasibuan---syafriadiman-%5E-laboratory-of-soil-and...)). Penggantian air 10–30% (hingga 20%/hari di bioflok) dan kurangi pakan 20–30% saat bau amonia adalah langkah operasional yang tercatat ([KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf); [SOP pembenihan KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf)).

5. **Untuk software:** volume kolam, luas, kedalaman, padat tebar, dan log pakan memungkinkan **perhitungan stok, beban pakan, dan fraksi NH₃ dari TAN** (jika TAN diukur); ambang peringatan dapat diselaraskan SNI + FAO; dosis kapur dan kecepatan pemulihan **tidak** dapat dihitung andal tanpa alkalinitas tanah/air dan jenis kapur.

---

## Tabel referensi parameter

Kolom **Optimum (SNI pembesaran)** = acuan formal Indonesia. **Peringatan / bahaya** disusun dari SNI, PP 82/2001 (nitrit air kelas III), review *C. gariepinus*, dan FAO — bedakan satuan NH₃ vs TAN.

| Parameter | Satuan | Optimum / target (SNI & ekstensi) | Peringatan (review operasional) | Bahaya / kritis | Catatan toksisitas & pengukuran |
|-----------|--------|-----------------------------------|----------------------------------|-----------------|--------------------------------|
| **Suhu** | °C | 25–30 ([SNI 6484.5](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html); [Suwarsito et al., 2020](https://doi.org/10.15578/aj.v2i2.9887)) | <22 atau >32 ([Păpuc et al., 2019](https://elba.bioflux.com.ro/docs/2019.9-17.pdf)) | Embrio <17,5 °C / >35 °C; stres fisiologis ~23–41 °C jangka panjang ([Păpuc et al., 2019](https://elba.bioflux.com.ro/docs/2019.9-17.pdf)) | Suhu tinggi ↓ DO terlarut dan ↑ fraksi NH₃ ([FAO water quality](https://openknowledge.fao.org/server/api/core/bitstreams/185abd2a-fe7d-49dc-86ff-a6a1174566c7/content)) |
| **pH** | — | 6,5–8,5 pembesaran; 6,5–8,0 induk ([SNI](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html); [SOP KKP Tabel 1](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf)) | <6,5 atau >8,5 di luar SNI | Larva: mortalitas tinggi pH 9; tidak survive pH ≤4 ([Ndubuisi et al., 2015 via Păpuc et al., 2019](https://elba.bioflux.com.ro/docs/2019.9-17.pdf)) | pH ↑ → ↑ NH₃ dari TAN yang sama ([FAO site selection](https://www.fao.org/4/ac175e/AC175E07.htm); [UF/IFAS FA031](https://ask.ifas.ufl.edu/publication/FA031/pdf)) |
| **DO** | mg/L | >4 SNI pembesaran; >3 SNI induk ([SNI](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html); [SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf)) | <4 pagi hari (praktik: kurangi pakan) ([Aller Aqua Catfish Handbook](https://www.datocms-assets.com/106601/1741515453-aller-aqua-catfish-handbook_en_download.pdf)) | <3 kronis: nafsu makan turun ([NCRAC 170](https://southcenters.osu.edu/sites/southc/files/site-library/site-images/WaterChemistryInAquacultureNCRAC.pdf)) | Lele bisa naik permukaan; aerasi 6–24 h dianjurkan sistem intensif ([KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf); [aerasi C. gariepinus](https://doi.org/10.54615/2231-7805.24.15.836)) |
| **NH₃ (un-ionized)** | mg/L | <0,01 SNI pembesaran ([Suwarsito et al., 2020](https://doi.org/10.15578/aj.v2i2.9887)) | 0,01–0,05 | >0,05 hatchery ([Boyd 1990 via Păpuc et al., 2019](https://elba.bioflux.com.ro/docs/2019.9-17.pdf)); >0,34 kerusakan insang ([Schram et al. via Păpuc et al., 2019](https://elba.bioflux.com.ro/docs/2019.9-17.pdf)) | Ukur TAN + pH + suhu → hitung NH₃ ([UF/IFAS FA031](https://ask.ifas.ufl.edu/publication/FA031/pdf); [FAO Table NH₃%](https://openknowledge.fao.org/server/api/core/bitstreams/185abd2a-fe7d-49dc-86ff-a6a1174566c7/content)) |
| **TAN / “amonia” kit** | mg/L N atau NH₃-N | SNI menyebut “amoniak terlarut” — interpretasi lapangan sering TAN | Bandingkan ke NH₃ terhitung | LC50 NH₃ ikan ~0,5–1,5 cyprinid ([FAO](https://openknowledge.fao.org/server/api/core/bitstreams/185abd2a-fe7d-49dc-86ff-a6a1174566c7/content)) | Kit murah sering tidak membedakan NH₃ vs NH₄⁺ |
| **Nitrit (NO₂⁻)** | mg/L | <0,05 Moore/lele ([JoAS Unair](https://e-journal.unair.ac.id/JoAS/article/download/35578/pdf)); <0,06 PP 82/2001 kelas III ([MARJ](https://doi.org/10.14710/marj.v7i4.22564)) | 0,05–0,6 | >0,6 mg/L NO₂⁻-N 28 hari: stres fisiologis *C. gariepinus* ([Păpuc et al., 2019](https://elba.bioflux.com.ro/docs/2019.9-17.pdf)); sumber lain <1 mg/L ([JP Unram](https://doi.org/10.29303/jp.v12i3.330)) — **ketidakseragaman sumber** |
| **Kecerahan (Secchi)** | cm | 25–30 ([SNI](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html); [JGT v13](https://doi.org/10.31850/jgt.v13i2.1219)) | <25 (keruh) atau >30 sangat jernih | Ekstrem keruh: risiko rendah DO malam | Kecerahan turun dengan padat tebar ↑ ([JGT v13](https://doi.org/10.31850/jgt.v13i2.1219)) |
| **Alkalinitas** | mg/L CaCO₃ | >50 pembenihan (catatan SOP, bukan SNI) ([SOP KKP Tabel 2](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf)) | <20: pertimbangkan kapur ([UF/IFAS FA028](https://ask.ifas.ufl.edu/publication/FA028/pdf)) | <20: fluktuasi pH besar ([Boyd](https://seafwa.org/sites/default/files/journal-articles/BOYD-605-611.pdf)) | Buffer pH; target umum akuakultur 50–200 ([Aquapublisher T7](https://www.aquapublisher.com/files/upfiles/files/T7-b(14).pdf)) |
| **Kekeruhan** | NTU / visual | SNI pakai Secchi, bukan NTU | — | — | Turbidity 30 cm Secchi ≈ rekomendasi handbook Afrika ([Aquapublisher T7](https://www.aquapublisher.com/files/upfiles/files/T7-b(14).pdf)) |

**Konversi NH₃ dari TAN (wajib di aplikasi jika user mengukur TAN):**  
`NH₃ (mg/L) ≈ TAN (mg/L) × f(pH, suhu)` dengan tabel Emerson ([UF/IFAS FA031](https://ask.ifas.ufl.edu/publication/FA031/pdf); [FAO](https://openknowledge.fao.org/server/api/core/bitstreams/185abd2a-fe7d-49dc-86ff-a6a1174566c7/content)).

---

## Checklist spesifikasi kolam (untuk pencatatan & pemodelan)

### Dimensi & konstruksi (SNI / KKP)

| Item | Nilai / aturan | Sumber |
|------|----------------|--------|
| Jenis wadah | Kolam tanah atau tembok; dapat dikeringkan | [SNI 6484.5 ringkasan](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html) |
| Luas minimal | 100 m² (tanah); beton 20 m² (induk SNI 6484.3) | [SNI ringkasan](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html) |
| Kedalaman air (operasional) | 0,75–1,5 m SNI; praktik 80–120 cm pembesaran; tebar benih 30–50 cm | [SNI](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html); [JIAA Lampung](https://doi.org/10.23960/jiia.v9i1.4818) |
| Tekstur tanah dasar | Lempung 50–60%, pasir <20% | [SNI](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html) |
| pH tanah | 3,5–8,5 (lokasi) | [SNI](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html) |

### Volume & padat tebar

| Sistem | Padat tebar / kepadatan | Kedalaman / catatan |
|--------|-------------------------|---------------------|
| SNI / ekstensi formal | SNI 6484.5 **tidak** menetapkan angka padat tebar tunggal; hitung: `jumlah = kepadatan × luas` ([penyuluh](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html)) | — |
| Kolam tanah monokultur (survei) | 35–400 ekor/m²; air 30–90 cm | [JKSE KKP Tangerang](https://ejournal-balitbang.kkp.go.id/index.php/jkse/article/download/7764/6428) |
| Semi-intensif / ekstensi | 75–150 ekor/m² tanpa sirkulasi kuat; 200–300 dengan aerasi | [Mitra Tani](http://mitratanibudidayaindonesia.blogspot.com/2018/03/menghitung-padat-tebar-lele-dalam-kolam.html) |
| Intensif kolam dangkal | 200–400 ekor/m² (kedalaman ~1–1,5 m) | [Minapoli / praktik](https://www.minapoli.com/info/panduan-lengkap-budidaya-ikan-lele) |
| Bioflok bak (KKP) | 250 ekor/m³ lele; kondisi pH 7–8 | [KKP bioflok PDF](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf) |
| Berbasis volume | 50–100 ekor/m³ (model/rekomendasi matematis) | [Bilangan v3](https://doi.org/10.62383/bilangan.v3i6.883) |
| Kolam tanah (*C. gariepinus*) | 3–9 ekor/m² (penelitian 180 hari) | [Shoko et al., 2016](https://doi.org/10.1080/10454438.2016.1188338) |
| Induk pembenihan | 5–7 ekor/m²; kedalaman 70–100 cm | [SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf) |
| Larva pendederan I | 2.000–2.500 ekor/m²; air 20–40 cm | [SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf) |

**Rumus volume (prismatik):** `V (m³) = luas permukaan air (m²) × tinggi air (m)` — untuk kolam tidak seragam kedalaman, catat **tinggi air rata-rata** atau poligon ([Bilangan v3](https://doi.org/10.62383/bilangan.v3i6.883)).

### Aerasi & pertukaran air

| Praktik | Indikasi | Sumber |
|---------|----------|--------|
| Aerasi pra-pakai air | Minimal 6 jam sebelum isi kolam | [KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf) |
| Ganti air rutin | Maks. ~20%/hari bertahap (bioflok); 20–30% saat kualitas turun (pembenihan) | [KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf); [SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf) |
| Tangki intensif | 25–35% air/hari; kurangi pakan jika DO <5 | [Aller Aqua Handbook](https://www.datocms-assets.com/106601/1741515453-aller-aqua-catfish-handbook_en_download.pdf) |
| Kapasitas pakan kolam | ~30 kg/ha/hari tanpa aerasi; ~120 kg/ha/hari dengan aerasi 3–4 hp/ha | [Boyd](https://www.globalseafood.org/advocate/nitrogen-and-phosphorus-loads-vary-by-system/) |

### Parameter yang **biasanya dicatat** penyuluh / SNI / UPR

- **Frekuensi:** suhu & DO pagi–sore (SNI); pembenihan mingguan–10 hari ([SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf)).
- **Alat:** termometer, pH meter/tester, DO meter, piring Secchi, test kit amonia ([SNI](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html)).
- **Operasional:** tinggi air, jumlah tebar, bobot sampel ikan (untuk pakan), volume/ persentase ganti air, aplikasi probiotik (interval label / 7–10 hari induk) ([SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf); [KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf)).
- **Opsional tapi penting untuk model:** alkalinitas, TAN (bukan hanya “amonia”), nitrit, catatan pakan kg/hari, status aerasi (jam/hari, hp atau jumlah diffuser).

---

## Dinamika degradasi & catatan pemodelan

### Pemicu penurunan kualitas air

1. **Beban pakan & biomassa** — metabolisme protein → amonia/urea; padat tebar tinggi ↑ bahan organik ([Sihite et al., 2020 via JGT](https://doi.org/10.31850/jgt.v13i2.1219); [JoAS bioflok](https://e-journal.unair.ac.id/JoAS/article/download/35578/pdf)).
2. **Kedalaman dangkal + padat tebar** — ruang vertikal terbatas; kecerahan turun ([JGT v13](https://doi.org/10.31850/jgt.v13i2.1219)).
3. **DO rendah** — menahan nitrifikasi, meningkatkan TAN; malam hari puncak ([NCRAC 170](https://southcenters.osu.edu/sites/southc/files/site-library/site-images/WaterChemistryInAquacultureNCRAC.pdf)).
4. **pH/alkalinitas rendah** — fluktuasi pH harian besar; toksisitas NH₃ naik saat pH naik ([FAO](https://www.fao.org/4/AC175E/AC175E07.htm)).
5. **Turnover air rendah** — pada sistem statis, asimilasi plankton/nitrifikasi punya batas ([Boyd](https://www.globalseafood.org/advocate/nitrogen-and-phosphorus-loads-vary-by-system/)).

### Aturan praktis “seberapa cepat” (batas bukti)

| Pernyataan | Bukti | Keterbatasan untuk app |
|------------|-------|-------------------------|
| TAN berkorelasi dengan **kg pakan/ha/hari** (0–224 kg/ha/hari pada kolam catfish) | [Cole & Boyd, 1986](https://doi.org/10.1577/1548-8640(1986)48) | Spesies/klima Indonesia berbeda; tidak linear di semua musim |
| ~300 mg N/m²/hari diekskresikan pada 100 kg pakan/ha/hari | [Boyd thesis via DOI](https://doi.org/10.31390/gradschool_disstheses.5955) | Perlu luas kolam (m²/ha) untuk skala unit kecil |
| Penarikan pakan 9 hari **tidak** menurunkan TAN di kolam catfish | [Tidwell et al., 1994 via Boyd thesis](https://doi.org/10.31390/gradschool_disstheses.5955) | Jangan janjikan pemulihan instan setelah stop feeding |
| Model simulasi TAN musiman akurat untuk kolam catfish AS | [Boyd thesis](https://doi.org/10.31390/gradschool_disstheses.5955) | Parameter (feeding rate, fraksi ekskresi) tidak tersedia di lapangan rakyat |
| Padat tebar lele bioflok 30 vs 15 ekor/15 L ↑ NH₃ signifikan | [JoAS](https://e-journal.unair.ac.id/JoAS/article/download/35578/pdf) | Skala laboratorium; bukan kolam 100 m² |

**Kesimpulan jujur:** aplikasi dapat menawarkan **estimasi beban** (pakan → N input) dan **indeks risiko** (padat tebar × kedalaman, DO di bawah ambang, NH₃ terhitung), tetapi **tidak** menggantikan pengukuran tanpa kalibrasi lokal. Drift pH harian membutuhkan data alkalinitas dan fotosintesis plankton — tidak dapat diprediksi hanya dari volume.

---

## Playbook tindakan korektif

> **Peringatan:** dosis di bawah ini dari SNI/penyuluhan/akuakultur umum. **Kapur tohor/CaO di kolam berisi ikan** dapat membunuh ikan jika overdosis ([SRAC 4100](https://www.srac.msstate.edu/pdfs/Fact%20Sheets/4100%20Lining%20Ponds%20for%20Aquaculture.pdf)). Selalu catat perlakuan di log aplikasi.

### pH rendah (<6,5)

| Konteks | Perlakuan | Dosis (sumber) |
|---------|-----------|----------------|
| **Pra-tebar / kolam kosong** | Kapur pertanian (CaCO₃), dolomit; kapur tohor desinfeksi | 50–100 g/m² kapur tohor ([SNI 6484.5 ringkasan](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html)); 250–750 g/m² dolomit/kapur karbonat ([Minapoli](https://www.minapoli.com/info/panduan-lengkap-budidaya-ikan-lele)); 2.000–3.000 kg/ha ([Ilmu Dasar / praktik](https://ilmudasar.id/tujuan-dan-manfaat-pengapuran-pada-kolam-ikan/)); 168 g/m² CaCO₃ → pH tanah ~6,7–7,1 ([Hasibuan & Syafriadiman](https://studylibid.com/doc/1088755/saberina-hasibuan---syafriadiman-%5E-laboratory-of-soil-and...)) |
| **Kolam berisi ikan** | Utamakan **ganti air** + kapur **agricultural limestone** hati-hati; hindari CaO massal | Alkalinitas <20 mg/L: pertimbangkan kapur; ~4,5 lb/acre-ft ≈ 5,4 kg/ha per 1 mg/L alkalinitas (acre-ft) ([UF/IFAS FA028](https://ask.ifas.ufl.edu/publication/FA028/pdf)); 1–2 ton/acre ≈ 2,2–4,5 t/ha umum ([FA028](https://ask.ifas.ufl.edu/publication/FA028/pdf)) |
| **Tanah sangat masam** | CaO berdasarkan pH tanah | pH<4: 500–1.000 kg/ha; pH 5–6: 250–500 kg/ha CaO ([JBA Mempawah](https://doi.org/10.29406/jba.v2i2.2403)) — konteks tambak, **transfer hati-hati ke kolam ikan** |

### pH tinggi (>8,5)

| Perlakuan | Catatan |
|-----------|---------|
| Ganti air bertahap (≤20%/hari) | [KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf) |
| Kurangi pakan & cek NH₃ terlarut (pH tinggi ↑ toksisitas NH₃) | [Suwarsito et al., 2020](https://ejournal-balitbang.kkp.go.id/index.php/aureliajournal/article/download/9887/7241) |
| Tambah air sumber humus/asam hanya dengan uji kecil — **tidak ada dosis standar lele** | — |

### Amonia / TAN tinggi

| Langkah | Detail |
|---------|--------|
| Stop/kurangi pakan 20–30% | [KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf) |
| Aerasi ↑; sifon endapan | [SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf) |
| Ganti air 10–30% (induk 20%; pembenihan hingga 30%+) | [SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf) |
| Probiotik + molase (bioflok) | Ikut label; KKP: setelah hari ke-5–7 tebar ([KKP bioflok](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf)) |
| Turunkan padat tebar / panen sebagian | Praktik intensif ([Aller Aqua](https://www.datocms-assets.com/106601/1741515453-aller-aqua-catfish-handbook_en_download.pdf)) |

### Nitrit tinggi

| Langkah | Ambang acuan |
|---------|--------------|
| Ganti air, aerasi, kurangi pakan | Target <0,05–0,06 mg/L ([JoAS](https://e-journal.unair.ac.id/JoAS/article/download/35578/pdf); [PP 82/2001 via MARJ](https://doi.org/10.14710/marj.v7i4.22564)) |
| Pastikan klorida jika rasio NO₂/Cl⁻ relevan (catfish AS) | [Li & Lovell, 1992](https://doi.org/10.1111/j.1749-7345.1992.tb00759.x) — jarang diukur di Indonesia |

### DO rendah

| Langkah | Sumber |
|---------|--------|
| Aerasi 12–24 h (fingerling) | [DOI aerasi Ghana](https://doi.org/10.54615/2231-7805.24.15.836) |
| Kurangi pakan di bawah 5 mg/L | [Aller Aqua](https://www.datocms-assets.com/106601/1741515453-aller-aqua-catfish-handbook_en_download.pdf) |
| Ganti air permukaan pagi hari | Praktik umum ([NCRAC 170](https://southcenters.osu.edu/sites/southc/files/site-library/site-images/WaterChemistryInAquacultureNCRAC.pdf)) |

### Pupuk & desinfektan (SNI pembesaran — bukan koreksi harian)

| Bahan | Dosis SNI 6484.5 (ringkasan penyuluh) |
|-------|--------------------------------------|
| Pupuk organik | 250–500 g/m² |
| Urea | 10–20 g/m²; TSP 5–10 g/m² |
| Kalium permanganat | 1–3 mg/L |
| Formalin | 15–25 ml/m³ |
| Garam (rendam) | 500–1.000 mg/L, 12–24 jam, diaerasi |

([Komunitas Penyuluh Perikanan, 2017](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html))

### Tabel ketidakpastian dosis kapur (jangan satu angka di app)

| Sumber | Dosis CaCO₃ setara | Kondisi |
|--------|-------------------|---------|
| SNI pembesaran | 50–100 g/m² **kapur tohor** (desinfeksi) | Kolam persiapan |
| Praktik dolomit | 70 g/m² ([JAFP Pandaan](https://doi.org/10.20473/jafh.v7i3.11260)) | Nila, kolam tanah |
| Penelitian kolam lele/Kampar | 168 g/m² optimal ([Hasibuan](https://studylibid.com/doc/1088755/saberina-hasibuan---syafriadiman-%5E-laboratory-of-soil-and...)) | pH tanah awal 5,0–5,8 |
| Boyd / FA028 | 2 t/ha agricultural limestone jika LR tidak diuji | Kolam baru |

---

## Status implementasi di repo (snapshot)

| Area | Kode / data | Selisih vs riset |
|------|-------------|------------------|
| Badge kualitas air | Konfigurasi per workspace (`workspace_settings.water_quality_config`). Default di `config.go`: amonia ≥0,5 ppm waspada, ≥1,0 bahaya; pH di luar 6,5–8,5 waspada. Satu set untuk semua kolam | SNI pembesaran NH₃ **<0,01 mg/L**; ambang app kemungkinan **TAN** atau lebih longgar — lihat §2 tabel. Admin bisa mengubah angka, tetapi belum per kolam/spesies |
| Master kolam | `business_units`: name, location, size (string), notes, status | Belum: luas, tinggi air, volume, fase, padat tebar (usulan § Gap analysis) |
| Log kualitas air | ammonia, pH, notes, batch; saran dihitung saat dibaca dari konfigurasi workspace | Belum: suhu, DO, jenis analit TAN/NH₃ tersimpan di log, tindakan koreksi yang dicatat petugas |

Langkah produk berikutnya: spesifikasi fitur `docs/features/pond-master-water-playbook.md` (belum dibuat).

---

## Gap analysis untuk perangkat lunak

### Dapat dihitung deterministik (dengan asumsi)

| Fitur | Input | Logika |
|-------|-------|--------|
| Volume air | `length × width × depth` atau `area × depth` | Geometri ([Bilangan v3](https://doi.org/10.62383/bilangan.v3i6.883)) |
| Jumlah ikan dari padat tebar | `density × area` atau `density × volume` | SNI cara hitung ([penyuluh](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html)) |
| Biomassa estimasi | `count × avg_weight` dari sampling | SNI jumlah pakan ([penyuluh](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html)) |
| Pakan harian | `%BW × biomass` | SOP pembenihan 1–2% induk; penelitian lele 4–5% ([SOP KKP](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf); [JGT](https://doi.org/10.31850/jgt.v13i2.1219)) |
| NH₃ dari TAN | tabel f(pH,T) | [FA031](https://ask.ifas.ufl.edu/publication/FA031/pdf) |
| Status vs SNI | bandingkan log dengan tabel parameter | [Suwarsito et al., 2020](https://doi.org/10.15578/aj.v2i2.9887) |
| Volume ganti air | `% × volume` | User input % |

### Perlu judgment petani / data tambahan

- Jenis sistem (statis, bioflok, RAS), jam aerasi, kualitas sumber air.
- Alkalinitas / hardness (untuk rekomendasi kapur).
- Apakah pengukur “amonia” = TAN atau NH₃.
- Keputusan panen sebagian, probiotik merek X, pupuk awal.
- Musim hujan/kemarau, kebocoran, gangguan listrik aerasi.

### Usulan field `business_units` / kolam (metadata)

| Field | Tipe | Keterangan |
|-------|------|------------|
| `pond_type` | enum | `earthen`, `concrete`, `liner`, `circular_tank`, `biofloc` |
| `area_m2` | number | Luas permukaan air |
| `depth_design_m` | number | Kedalaman desain |
| `water_depth_m` | number | Tinggi air aktual (bisa time-series) |
| `volume_m3` | computed | `area × water_depth` atau override manual |
| `stocking_density_per_m2` / `_per_m3` | number | Beserta tanggal tebar |
| `stock_count` | integer | |
| `aeration` | object | `{enabled, hours_per_day, hp_per_ha?, diffuser_count?}` |
| `water_exchange` | object | `{mode: static|flow|batch, percent_per_day}` |
| `lime_last_application` | object | `{date, product, g_per_m2, pond_empty: bool}` |
| `target_sni_profile` | enum | `growout_6484_5`, `broodstock_6484_3`, `nursery_6484_4` |
| `alkalinity_mg_l` | number? | Opsional, sangat membantu alert pH |

### Usulan log kualitas air (minimum viable)

- `measured_at`, `temperature_c`, `ph`, `do_mg_l`, `secchi_cm`
- `tan_mg_l` **atau** `nh3_mg_l` + flag `analyte_type`
- `nitrite_mg_l` (opsional), `alkalinity_mg_l` (opsional)
- `depth_at_measurement_m`, `time_of_day` (pagi/sore)
- `actions_taken` (enum multi): `water_exchange`, `reduce_feed`, `aeration`, `probiotic`, `lime`, `siphon`

---

## Referensi

1. Badan Standardisasi Nasional. *SNI 01-6484.5-2002: Ikan lele dumbo — Kelas pembesaran di kolam* (diringkas [Komunitas Penyuluh Perikanan, 2017](http://komunitaspenyuluhperikanan.blogspot.com/2017/09/ikan-lele-dumbo-clarias-gariepinus-x.html)).
2. [SNI 6484.3:2014 — Produksi induk lele dumbo](https://pdfcoffee.com/download/tpsni-ikan-lele-pdf-free.html) (ringkasan parameter air).
3. [KKP / SMART-Fish II — Prosedur Operasional Pembenihan Lele (PDF)](https://diskan.kamparkab.go.id/public/dokumen/cpib-sop.pdf).
4. [KKP — Panduan budidaya nila/lele bioflok di bak bulat (PDF)](https://www.kkp.go.id/storage/Materi/panduan-budi-daya-ikan-nilalele-di-bak-bulat-bioflok6982e9ada5a67/materi-6982e9adaa327.pdf).
5. [Suwarsito, D. et al. (2020). Kesesuaian kualitas air lele dumbo vs SNI 6484.5. *Aurelia* KKP](https://doi.org/10.15578/aj.v2i2.9887).
6. [Fauziyah (JKSE KKP). Evaluasi budidaya lele Tangerang](https://doi.org/10.29406/jba.v2i2.2403) / [PDF](https://ejournal-balitbang.kkp.go.id/index.php/jkse/article/download/7764/6428).
7. [Păpuc, T. et al. (2019). Review parameter lingkungan *C. gariepinus* (PDF)](https://elba.bioflux.com.ro/docs/2019.9-17.pdf).
8. [FAO — Water quality for aquaculture (PDF bitstream)](https://openknowledge.fao.org/server/api/core/bitstreams/185abd2a-fe7d-49dc-86ff-a6a1174566c7/content).
9. [FAO — Site selection, chemical features (ammonia % tables)](https://www.fao.org/4/ac175e/AC175E18.htm).
10. [University of Florida — Ammonia in aquatic systems FA031 (PDF)](https://ask.ifas.ufl.edu/publication/FA031/pdf).
11. [University of Florida — Lime in fish ponds FA028 (PDF)](https://ask.ifas.ufl.edu/publication/FA028/pdf).
12. [NCRAC Fact Sheet 170 — Water chemistry in freshwater aquaculture (PDF)](https://southcenters.osu.edu/sites/southc/files/site-library/site-images/WaterChemistryInAquacultureNCRAC.pdf).
13. [SRAC 4100 — Liming ponds for aquaculture (PDF)](https://www.srac.msstate.edu/pdfs/Fact%20Sheets/4100%20Lining%20Ponds%20for%20Aquaculture.pdf).
14. [Boyd, C. E. — Hardness, alkalinity, pH, pond fertilization (PDF)](https://seafwa.org/sites/default/files/journal-articles/BOYD-605-611.pdf).
15. [Boyd — Nitrogen loads and feeding limits (Global Seafood Advocate)](https://www.globalseafood.org/advocate/nitrogen-and-phosphorus-loads-vary-by-system/).
16. [Cole, B. & Boyd, C. E. (1986). Feeding rate & water quality](https://doi.org/10.1577/1548-8640(1986)48).
17. [Li, M. & Lovell, R. T. (1992). Dietary protein & nitrite in catfish ponds](https://doi.org/10.1111/j.1749-7345.1992.tb00759.x).
18. [Shoko, A. P. et al. (2016). Stocking density *C. gariepinus* earthen ponds](https://doi.org/10.1080/10454438.2016.1188338).
19. [Aller Aqua — Catfish handbook (PDF)](https://www.datocms-assets.com/106601/1741515453-aller-aqua-catfish-handbook_en_download.pdf).
20. [JoAS Unair — Padat tebar lele bioflok & NH₃/NO₂](https://e-journal.unair.ac.id/JoAS/article/download/35578/pdf).
21. [JGT — Kualitas air & padat tebar lele Sangkuriang](https://doi.org/10.31850/jgt.v13i2.1219).
22. [JIAA — Risiko budidaya lele Lampung (kedalaman, kapur)](https://doi.org/10.23960/jiia.v9i1.4818).
23. [Hasibuan, S. & Syafriadiman — Pengapuran dasar kolam (CaCO₃ g/m²)](https://studylibid.com/doc/1088755/saberina-hasibuan---syafriadiman-%5E-laboratory-of-soil-and...).
24. [Bilangan — Volume kolam & padat tebar 50–100 ekor/m³](https://doi.org/10.62383/bilangan.v3i6.883).
25. [Aquapublisher — Recommended water quality *C. gariepinus* table](https://www.aquapublisher.com/files/upfiles/files/T7-b(14).pdf).

---

*Dokumen ini disusun dari sumber terbuka; untuk keputusan regulasi atau dosis kimia di lapangan, verifikasi SNI asli, label produk, dan penyuluh setempat.*
