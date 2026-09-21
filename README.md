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

Contoh custom port:

```env
MYSQL_PORT=3307
APP_PORT=9090
FRONTEND_PORT=4000
CORS_ORIGINS=http://localhost:4000,http://localhost:5173
```

Akses (sesuaikan dengan `.env`):

- Frontend: http://localhost:${FRONTEND_PORT:-3000}
- Backend health: http://localhost:${APP_PORT:-8080}/health
- Frontend proxy health: http://localhost:${FRONTEND_PORT:-3000}/api/health

## Development lokal

### Backend

```bash
cd backend
cp ../.env.example ../.env
# Set DB_HOST=localhost jika MySQL sudah jalan
go run ./cmd/server
```

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local   # opsional, sesuaikan APP_PORT / FRONTEND_DEV_PORT
pnpm dev
```

Frontend dev server mem-proxy `/api/*` ke backend (`VITE_PROXY_TARGET` atau `http://localhost:${APP_PORT}`).

## Endpoint

`GET /health`

`GET /api/v1/water-quality-logs` — CRUD kualitas air (ammonia, pH, catatan)

`GET /api/v1/ponds` — master kolam (prasyarat kualitas air)

`GET /api/v1/dashboard` — ringkasan kualitas air per kolam aktif

Frontend default API base: `/api/v1` (via nginx proxy `/api/` → backend)

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
