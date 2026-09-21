# Pencatatan Usaha

Monorepo awal dengan health check API (Go Fiber + MySQL) dan frontend React (shadcn/ui).

## Stack

- **Backend:** Go 1.23, Fiber v2, MySQL 8
- **Frontend:** React 19, Vite, Tailwind CSS 4, shadcn/ui, pnpm
- **Infra:** Docker Compose

## Menjalankan dengan Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Semua port host bisa di-overwrite lewat `.env`:

| Variable | Default | Keterangan |
|---|---|---|
| `MYSQL_PORT` | 3306 | Port MySQL di host |
| `APP_PORT` | 8080 | Port backend di host & container |
| `FRONTEND_PORT` | 3000 | Port frontend di host |
| `FRONTEND_CONTAINER_PORT` | 80 | Port nginx di dalam container |
| `FRONTEND_DEV_PORT` | 5173 | Port Vite dev server (lokal) |
| `VITE_API_BASE` | `http://localhost:8080/api/v1` | URL API penuh untuk frontend |

Contoh custom port:

```env
MYSQL_PORT=3307
APP_PORT=9090
FRONTEND_PORT=4000
VITE_API_BASE=http://localhost:9090/api/v1
CORS_ORIGINS=http://localhost:4000,http://localhost:5173
```

Contoh production:

```env
APP_PORT=8801
FRONTEND_PORT=8802
VITE_API_BASE=https://pencatatan.rubyjane.my.id:8801/api/v1
CORS_ORIGINS=https://pencatatan.rubyjane.my.id
```

Akses:

- Frontend: http://localhost:${FRONTEND_PORT:-3000}
- Backend health: http://localhost:${APP_PORT:-8080}/health
- API dashboard: `${VITE_API_BASE}/dashboard`

## Development lokal

### Makefile (recommended)

```bash
cp .env.example .env   # sesuaikan port jika perlu
make install           # pertama kali
make dev               # MySQL + backend + frontend
```

Perintah lain:

```bash
make backend           # backend saja
make frontend          # frontend saja
make db                # MySQL saja
make stop              # stop MySQL container
```

Pastikan di `.env` lokal:

```env
APP_PORT=8080
MYSQL_PORT=3306
FRONTEND_DEV_PORT=5173
CORS_ORIGINS=http://localhost:5173
```

Backend connect ke MySQL via `localhost:$(MYSQL_PORT)`.

### Manual

```bash
cd backend
cp ../.env.example ../.env
go run ./cmd/server
```

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Frontend memanggil backend langsung lewat `VITE_API_BASE` (tanpa proxy nginx/vite).

## Endpoint

`GET /health`

`GET /api/v1/water-quality-logs` — CRUD kualitas air (ammonia, pH, catatan)

`GET /api/v1/ponds` — master kolam (prasyarat kualitas air)

`GET /api/v1/dashboard` — ringkasan kualitas air per kolam aktif

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "db": "ok",
    "checks": {
      "api": "ok",
      "db": "ok"
    }
  }
}
```
