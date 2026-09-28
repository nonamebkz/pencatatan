Berikut saran dashboard berdasarkan ERD kamu — saya bagi per area data, lalu saran lintas-fitur.

## 1. Dashboard Utama (landing per workspace)

- **Kartu ringkas di atas:** total saldo semua `cash_accounts` (menyesuaikan workspace aktif), jumlah kolam aktif, batch berjalan, dan tagihan sewa jatuh tempo ≤30 hari (dari `payment_schedules.is_paid + due_date`).
- **Arus kas 30 hari terakhir** (line/bar dari `transactions.transaction_date`, dipisah masuk–keluar). Karena skema sekarang tampaknya dominan pengeluaran, tampilkan "burn rate" per bulan — ini metrik paling berguna untuk usaha kecil.
- **Widget peringatan** (paling bernilai): jadwal sewa jatuh tempo, batch tanpa pencatatan kualitas air >X hari, transaksi tanpa `category`/`batch_id` (data "yatim" yang biasanya tanda pencatatan lalai).

## 2. Kolam (business_units) & Batch

- **Kartu kolam** dengan status + batch aktif + umur batch (hari sejak dibuat), bukan tabel mentah.
- **Detail batch sebagai timeline:** tebar → sampling → panen, plus akumulasi biaya yang sudah tercatat ke batch itu (`transactions.batch_id`). Ini langsung menjawab "batch ini untung atau tidak?" — satu angka: total biaya terikat batch vs estimasi nilai panen.
- **Ringkasan biaya per kolam** (bar chart dari `transactions` group by `business_unit_id` × `category`) — berguna membandingkan efisiensi antar kolam.

## 3. Kualitas Air (water_quality_logs)

- **Tren harian per parameter** (pH, ammonia) sebagai line chart per kolam, dengan zona aman diarsir — `water_quality_config` (runtime JSON) per business_unit dipakai sebagai batas zona. Ini konversi alami dari kolom config kamu.
- **Flag otomatis** saat pengukuran terakhir di luar zona aman; tampilkan di dashboard utama juga, jangan sembunyikan di halaman detail.
- Form input cepat (inline, bukan modal panjang) — pencatatan harian hanya bertahan kalau inputnya <10 detik.

## 4. Keuangan

- **Breakdown pengeluaran per kategori** (donut/bar dari `transactions.category` atau `purchase_line_items.category`).
- **Ringkasan pembelian per item** — agregasi `purchase_line_items` by `item_name_normalized`: qty total, harga satuan rata-rata. Sangat berguna untuk deteksi kenaikan harga pakan.
- **Buku kas per akun:** saldo berjalan per `cash_accounts` + toggle filter kategori/tanggal. Jangan izinkan hapus transaksi RENT_PAYMENT yang ter-link (sudah dijaga skema; di UI, tombol hapus untuk transaksi terkait kontrak sebaiknya disembunyikan, bukan disabled dengan pesan error).

## 5. Kontrak Sewa

- **Kalender/timeline tagihan:** semua `payment_schedules` semua kontrak aktif, dipilah jatuh tempo terdekat, dengan status lunas/belum. Tampilan "kapan saya harus bayar apa" lebih penting daripada CRUD kontrak.
- **Indikator progres kontrak:** sudah dibayar vs `total_amount`, sisa periode.

## 6. Admin / RBAC / Audit

- Untuk non-admin, halaman audit_logs tidak perlu tampil; untuk owner, cukup **feed aktivitas terakhir** (siapa mengubah apa, kapan) di halaman pengaturan — bukan tabel penuh. Tambah filter entity_type + date range kalau datanya tumbuh.
- Halaman manajemen akses: daftar anggota workspace (dari `user_workspaces` join `users`) + role, dengan audit-trail kecil per anggota.

## Saran lintas-fitur (keseluruhan)

1. **Satu prinsip hierarchy:** Dashboard utama = jawaban ("sehat atau tidak?"), halaman fitur = detail ("kenapa dan apa yang harus dilakukan"). Jangan taruh CRUD di dashboard.
2. **Semua selalu ter-scope workspace aktif** — data PK kamu UUID, jadi pastikan setiap query dashboard menyaring `workspace_id` dari sesi, dan workspace PERSONAL tampil dengan tema/label berbeda (sudah di-seed di `000008`).
3. **Angka saldo & arus kas dihitung dari `transactions`**, bukan kolom saldo tersimpan — konsisten dengan aturan audit BR-G kamu.
4. **Empty state yang mengarahkan:** pengguna baru di kolam kosong sebaiknya melihat CTA ("Tambah kolam pertama", "Catat pengeluaran pertama") alih-alih chart kosong.
5. **Prioritas build untuk MVP:** (a) ringkasan kas + arus kas, (b) jadwal sewa jatuh tempo, (c) biaya per batch/kolam. Kualitas air dan audit feed bisa menyusul — datanya baru berharga setelah terkumpul beberapa minggu.

sample html

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard — Workspace Utama</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<style>
  :root{
    --bg:#f4f6f9; --card:#ffffff; --border:#e3e8ef; --text:#1c2430; --muted:#64748b;
    --primary:#0e7490; --primary-soft:#e0f2fe; --green:#15803d; --green-soft:#dcfce7;
    --red:#b91c1c; --red-soft:#fee2e2; --amber:#b45309; --amber-soft:#fef3c7;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);font-size:14px}
  .layout{display:flex;min-height:100vh}
  /* Sidebar */
  .sidebar{width:220px;background:#0f172a;color:#cbd5e1;padding:20px 0;flex-shrink:0}
  .logo{padding:0 20px 20px;font-size:18px;font-weight:700;color:#fff}
  .logo span{color:#22d3ee}
  .ws-switch{margin:0 14px 20px;background:#1e293b;border-radius:8px;padding:10px 12px;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
  .ws-switch small{color:#64748b;display:block}
  .nav a{display:block;padding:11px 20px;color:#cbd5e1;text-decoration:none;font-size:13.5px;border-left:3px solid transparent}
  .nav a.active{background:#1e293b;color:#fff;border-left-color:#22d3ee}
  .nav a:hover{background:#1e293b}
  /* Main */
  .main{flex:1;padding:24px 28px;max-width:1200px}
  .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}
  .topbar h1{font-size:20px}
  .topbar .date{color:var(--muted);font-size:13px}
  .btn{background:var(--primary);color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:13px;cursor:pointer;font-weight:600}
  .btn.ghost{background:#fff;color:var(--primary);border:1px solid var(--border)}
  /* Cards */
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
  .kpi{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px 18px}
  .kpi .label{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.4px}
  .kpi .value{font-size:22px;font-weight:700;margin-top:6px}
  .kpi .sub{font-size:12px;margin-top:4px;color:var(--muted)}
  .kpi .sub.up{color:var(--green)} .kpi .sub.down{color:var(--red)}
  /* Grid sections */
  .grid{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px}
  .grid.two{grid-template-columns:1fr 1fr}
  .panel{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px}
  .panel h2{font-size:15px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
  .panel h2 a{font-size:12px;color:var(--primary);text-decoration:none;font-weight:500}
  .chart-wrap{height:260px;position:relative}
  .donut-wrap{height:220px;position:relative}
  /* Alerts */
  .alert{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:10px;margin-bottom:10px;font-size:13px}
  .alert .ico{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700}
  .alert.red{background:var(--red-soft)} .alert.red .ico{background:#fecaca;color:var(--red)}
  .alert.amber{background:var(--amber-soft)} .alert.amber .ico{background:#fde68a;color:var(--amber)}
  .alert b{display:block;margin-bottom:2px}
  .alert .meta{color:var(--muted);font-size:12px}
  /* Tables */
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;color:var(--muted);font-weight:600;font-size:12px;padding:8px 6px;border-bottom:1px solid var(--border)}
  td{padding:10px 6px;border-bottom:1px solid #f1f5f9}
  tr:last-child td{border-bottom:none}
  .tag{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11.5px;font-weight:600}
  .tag.paid{background:var(--green-soft);color:var(--green)}
  .tag.due{background:var(--amber-soft);color:var(--amber)}
  .tag.over{background:var(--red-soft);color:var(--red)}
  .amount.out{color:var(--red)} .amount.in{color:var(--green)}
  .pond-row{display:flex;gap:12px}
  .pond-card{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 16px}
  .pond-card .status{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px}
  .pond-card h3{font-size:14px;margin-bottom:6px}
  .pond-card .meta{color:var(--muted);font-size:12px;line-height:1.7}
  .bar{height:6px;background:#e2e8f0;border-radius:99px;margin-top:8px;overflow:hidden}
  .bar i{display:block;height:100%;background:var(--primary);border-radius:99px}
  @media(max-width:900px){.cards{grid-template-columns:repeat(2,1fr)}.grid,.grid.two{grid-template-columns:1fr}.sidebar{display:none}.pond-row{flex-direction:column}}
</style>
</head>
<body>
<div class="layout">
  <!-- SECTION: sidebar -->
  <aside class="sidebar">
    <div class="logo">Aqua<span>Buku</span></div>
    <div class="ws-switch">
      <div><b>Workspace Utama</b><small>Tipe: BUSINESS</small></div>
      <span>⌄</span>
    </div>
    <nav class="nav">
      <a class="active" href="#">📊 Dashboard</a>
      <a href="#"> ponds Kolam &amp; Batch</a>
      <a href="#">💧 Kualitas Air</a>
      <a href="#">💰 Keuangan</a>
      <a href="#">📄 Kontrak Sewa</a>
      <a href="#">⚙️ Pengaturan</a>
    </nav>
  </aside>

  <!-- SECTION: main -->
  <main class="main">
    <div class="topbar">
      <div>
        <h1>Dashboard</h1>
        <div class="date">Senin, 28 September 2026</div>
      </div>
      <div>
        <button class="btn ghost">＋ Catat Kualitas Air</button>
        <button class="btn">＋ Catat Transaksi</button>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="cards">
      <div class="kpi">
        <div class="label">Total Saldo Kas</div>
        <div class="value">USD 4.250,00</div>
        <div class="sub">3 akun kas</div>
      </div>
      <div class="kpi">
        <div class="label">Pengeluaran Bulan Ini</div>
        <div class="value">USD 1.180,00</div>
        <div class="sub down">▲ 12% vs bulan lalu</div>
      </div>
      <div class="kpi">
        <div class="label">Batch Aktif</div>
        <div class="value">4</div>
        <div class="sub">dari 5 kolam aktif</div>
      </div>
      <div class="kpi">
        <div class="label">Sewa Jatuh Tempo ≤30 hari</div>
        <div class="value">USD 600,00</div>
        <div class="sub down">2 tagihan belum lunas</div>
      </div>
    </div>

    <!-- Cashflow + alerts -->
    <div class="grid">
      <div class="panel">
        <h2>Arus Kas 30 Hari Terakhir <a href="#">Lihat keuangan →</a></h2>
        <div class="chart-wrap"><canvas id="cashflowChart"></canvas></div>
      </div>
      <div class="panel">
        <h2>Peringatan</h2>
        <div class="alert red">
          <div class="ico">!</div>
          <div><b>Sewa Kolam B2 jatuh tempo dalam 3 hari</b>
          <div class="meta">USD 400,00 · jadwal 1 Okt 2026 · Kontrak #K-12</div></div>
        </div>
        <div class="alert amber">
          <div class="ico">!</div>
          <div><b>Kolam A1 belum ada pencatatan kualitas air 5 hari</b>
          <div class="meta">Pengukuran terakhir: 23 Sep 2026</div></div>
        </div>
        <div class="alert amber">
          <div class="ico">!</div>
          <div><b>pH Kolam B2 di luar zona aman</b>
          <div class="meta">Tercatat 7,9 (batas config: 6,5–7,5)</div></div>
        </div>
        <div class="alert" style="background:#f1f5f9">
          <div class="ico" style="background:#e2e8f0;color:#475569">i</div>
          <div><b>2 transaksi tanpa kategori</b>
          <div class="meta">Lengkapi agar laporan per kategori akurat</div></div>
        </div>
      </div>
    </div>

    <!-- Ponds -->
    <div class="panel" style="margin-bottom:20px">
      <h2>Status Kolam &amp; Batch <a href="#">Kelola kolam →</a></h2>
      <div class="pond-row">
        <div class="pond-card">
          <h3><span class="status" style="background:#22c55e"></span>Kolam A1 — Batch #14</h3>
          <div class="meta">Umur batch: 42 hari · Benih: 8.000 ekor<br>Biaya tercatat: <b>USD 520,00</b></div>
          <div class="bar"><i style="width:60%"></i></div>
        </div>
        <div class="pond-card">
          <h3><span class="status" style="background:#22c55e"></span>Kolam A2 — Batch #09</h3>
          <div class="meta">Umur batch: 75 hari · Estimasi panen 15 hari lagi<br>Biaya tercatat: <b>USD 890,00</b></div>
          <div class="bar"><i style="width:83%"></i></div>
        </div>
        <div class="pond-card">
          <h3><span class="status" style="background:#eab308"></span>Kolam B2 — Batch #11</h3>
          <div class="meta">Umur batch: 20 hari · pH tinggi ⚠<br>Biaya tercatat: <b>USD 310,00</b></div>
          <div class="bar"><i style="width:25%"></i></div>
        </div>
        <div class="pond-card">
          <h3><span class="status" style="background:#94a3b8"></span>Kolam B1 — Kosong</h3>
          <div class="meta">Batch sebelumnya selesai (untung: USD 1.240)<br>Siap ditebar</div>
          <div class="bar"><i style="width:0%"></i></div>
        </div>
      </div>
    </div>

    <!-- Rent schedule + expense breakdown -->
    <div class="grid two" style="margin-bottom:20px">
      <div class="panel">
        <h2>Jadwal Sewa Terdekat <a href="#">Semua tagihan →</a></h2>
        <table>
          <tr><th>Kontrak</th><th>Jatuh Tempo</th><th>Nominal</th><th>Status</th></tr>
          <tr><td>K-12 · Kolam B2</td><td>1 Okt 2026</td><td class="amount out">USD 400,00</td><td><span class="tag over">≤7 hari</span></td></tr>
          <tr><td>K-07 · Kolam A1</td><td>12 Okt 2026</td><td class="amount out">USD 200,00</td><td><span class="tag due">≤30 hari</span></td></tr>
          <tr><td>K-12 · Kolam B2</td><td>1 Nov 2026</td><td class="amount out">USD 400,00</td><td><span class="tag due">Terjadwal</span></td></tr>
          <tr><td>K-07 · Kolam A1</td><td>12 Sep 2026</td><td class="amount out">USD 200,00</td><td><span class="tag paid">Lunas</span></td></tr>
        </table>
      </div>
      <div class="panel">
        <h2>Pengeluaran per Kategori (bulan ini)</h2>
        <div class="donut-wrap"><canvas id="categoryChart"></canvas></div>
      </div>
    </div>

    <!-- Batch cost comparison -->
    <div class="panel">
      <h2>Biaya per Kolam — 6 Bulan Terakhir <a href="#">Detail biaya →</a></h2>
      <div class="chart-wrap"><canvas id="costChart"></canvas></div>
    </div>
  </main>
</div>

<script>
// Arus kas harian (mock)
const labels = Array.from({length:30},(_,i)=>`${i+1} Sep`);
const inflow = [0,0,150,0,0,0,80,0,0,0,0,120,0,0,0,60,0,0,0,0,200,0,0,0,0,0,90,0,0,0];
const outflow = [45,0,0,120,0,60,0,0,85,0,0,0,40,0,110,0,0,0,70,0,0,95,0,0,55,0,0,0,130,0];
new Chart(document.getElementById('cashflowChart'),{
  type:'bar',
  data:{labels,datasets:[
    {label:'Masuk',data:inflow,backgroundColor:'#22c55e',borderRadius:3},
    {label:'Keluar',data:outflow.map(v=>-v),backgroundColor:'#ef4444',borderRadius:3}
  ]},
  options:{responsive:true,maintainAspectRatio:false,
    scales:{y:{ticks:{callback:v=>'USD '+Math.abs(v)}},x:{ticks:{maxTicksLimit:10}}},
    plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>c.dataset.label+': USD '+Math.abs(c.parsed.y)}}}}
});

// Kategori pengeluaran
new Chart(document.getElementById('categoryChart'),{
  type:'doughnut',
  data:{labels:['Pakan','Benih','Sewa','Obat & Vitamin','Listrik & Operasional','Lainnya'],
    datasets:[{data:[520,180,200,90,110,80],
    backgroundColor:['#0e7490','#22d3ee','#f59e0b','#8b5cf6','#64748b','#e2e8f0'],borderWidth:2,borderColor:'#fff'}]},
  options:{responsive:true,maintainAspectRatio:false,cutout:'62%',
    plugins:{legend:{position:'right',labels:{boxWidth:12,font:{size:11}}},
    tooltip:{callbacks:{label:c=>' '+c.label+': USD '+c.parsed}}}}
});

// Biaya per kolam per bulan
new Chart(document.getElementById('costChart'),{
  type:'line',
  data:{labels:['Apr','Mei','Jun','Jul','Agu','Sep'],
    datasets:[
      {label:'Kolam A1',data:[310,280,420,390,460,520],borderColor:'#0e7490',tension:.35},
      {label:'Kolam A2',data:[520,480,560,610,720,890],borderColor:'#22d3ee',tension:.35},
      {label:'Kolam B2',data:[180,200,240,260,280,310],borderColor:'#f59e0b',tension:.35},
      {label:'Kolam B1',data:[400,350,300,150,80,40],borderColor:'#94a3b8',tension:.35,borderDash:[5,4]}
    ]},
  options:{responsive:true,maintainAspectRatio:false,
    scales:{y:{ticks:{callback:v=>'USD '+v}}},
    plugins:{legend:{position:'bottom'}}}
});
</script>
</body>
</html>
