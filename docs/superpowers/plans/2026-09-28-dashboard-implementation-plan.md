# Rencana eksekusi: Dashboard Beranda

| Field | Value |
|-------|--------|
| Tanggal | 2026-09-28 |
| Spesifikasi fitur | [docs/features/dashboard.md](../../features/dashboard.md) |
| Status rencana | **Siap dieksekusi per slice** |

Gunakan dokumen ini saat spawn subagent atau task terpisah. Setiap slice **wajib** membaca `dashboard.md` § API/FE untuk slice tersebut saja.

---

## Slice DASH-API-UNIFY

**Tujuan:** Satu endpoint `GET /dashboard` untuk semua template; ganti pola `leleOnly` di route.

### Backend checklist

- [ ] `internal/handler/dashboard_handler.go` (atau perluas handler existing) — orchestrasi repo
- [ ] Load `workspace` by header → `type`, `templateId`
- [ ] Response struct `DashboardResponse` di `internal/model/dashboard.go`
- [ ] Pindahkan logika WQ dari `WaterQualityHandler.DashboardSummary` ke service/repo yang dipanggil dashboard handler
- [ ] `main.go`: `GET /dashboard` tanpa `RequireWorkspaceTemplate(lele)`; permission filter per section
- [ ] Unit test minimal: template generic tidak memanggil query WQ

### Frontend checklist

- [ ] `frontend/src/api/dashboard.ts` — types mirror contract
- [ ] `DashboardPage`: satu `getDashboard()`; hapus dual fetch transisi setelah BE siap

### DoD

- Response berisi `period`, `workspace`, `waterQualitySummary` untuk lele (parity dengan sekarang)
- Generic/personal tidak error 403 pada `/dashboard`

---

## Slice DASH-FIN-KPI

**Tujuan:** BRD §13 empat kartu bisnis (lele).

### Backend

- [ ] Repo method: `DashboardFinanceKPI(workspaceID, from, to)`  
  - `totalPurchases`: SUM `PURCHASE`  
  - `totalFeed`: SUM `purchase_line_items.total_price` JOIN tx WHERE category=FEED  
  - `totalRent`: SUM `RENT_PAYMENT`  
  - `totalProfitShare`: SUM `PROFIT_SHARE_PAYOUT`  
- [ ] Gate: `finance.read`
- [ ] Tambah ke response `GET /dashboard` field `finance`

### Frontend

- [ ] `DashboardFinanceKpiGrid` — 4× `StatCard`, format IDR
- [ ] Link “Lihat keuangan” → `/finance`

### DoD

- Angka selaras dengan query manual SQL untuk workspace seed

---

## Slice DASH-PERSONAL

**Tujuan:** BRD §8 dua kartu (keluar/masuk bulan ini).

### Backend

- [ ] Agregat `OTHER_EXPENSE`, `OTHER_INCOME` di periode default
- [ ] Hanya expose jika `workspace.type=PERSONAL`

### Frontend

- [ ] Layout personal di `DashboardPage` (ganti empty state generik untuk PERSONAL)
- [ ] CTA ke `/finance` (transaksi)

### DoD

- Switch workspace personal menampilkan 2 kartu setelah ada transaksi

---

## Slice DASH-GENERIC

**Tujuan:** Beranda template `generic`.

### Backend

- [ ] `finance` subset: purchases + other expense (sama `MonthSummary` extended)
- [ ] `operational.activeUnitCount` — COUNT `operational_units` ACTIVE
- [ ] Gate `operational_unit.read` untuk count (atau tampilkan 0 tanpa permission)

### Frontend

- [ ] KPI keuangan + kartu “Unit aktif”
- [ ] CTA Unit + Keuangan

### DoD

- Workspace generic baru menampilkan KPI tanpa memanggil `/ponds`

---

## Slice DASH-RENT-ALERTS

**Tujuan:** Tagihan sewa jatuh tempo ≤30 hari (ide analisis §5).

### Backend

- [ ] Query `payment_schedules` JOIN kontrak/kolam WHERE `is_paid=0` AND `due_date` BETWEEN today AND today+30
- [ ] `rentAlerts.unpaidTotal`, `upcomingSchedules[]` (kontrak, kolam, dueDate, amount)
- [ ] Gate `finance.rent.read`, template `lele`

### Frontend

- [ ] Panel tabel mobile-first (mirip `RentListPage` ringkas)
- [ ] Link `/finance/rent`

---

## Slice DASH-ALERTS

**Tujuan:** Panel peringatan terpadu.

### Backend

- [ ] `alerts[]`: `{ code, severity, title, meta, href? }`
- [ ] Sumber: WQ `notMeasuredToday`, rent due ≤7 hari, transaksi OTHER_EXPENSE tanpa category (personal/generic)

### Frontend

- [ ] Reuse pola `alertInline` / kartu dari design system
- [ ] Tap navigasi ke modul

---

## Slice DASH-CHARTS (Plus)

**Tujuan:** Arus kas 30 hari + donut kategori (bulan berjalan).

### Backend

- [ ] Query group by `transaction_date` / kategori
- [ ] Pisahkan masuk (`OTHER_INCOME`) vs keluar

### Frontend

- [ ] Lazy chart component; tinggi tetap di mobile

**Catatan:** Bisa ship setelah DASH-FIN-KPI tanpa blocking MVP §13.

---

## Slice DASH-BATCH (Plus, blocked)

**Tujuan:** Biaya per batch/kolam di beranda.

**Blocker:** CRUD batch UI (MVP-09), agregat `transactions.batch_id` stabil.

---

## Slice DASH-FEED-WIDGET (blocked)

**Blocker:** MVP-05 `consumable_lots`.

---

## Koordinasi dokumen

Setelah tiap slice `done`:

1. Centang baris di [dashboard.md](../../features/dashboard.md) tabel Planning
2. `TECHNICAL_SPEC.md` §5.11 + §20
3. BRD FR-11 / PART-DASH / checklist §21
4. `graphify update` backend dan/atau frontend
