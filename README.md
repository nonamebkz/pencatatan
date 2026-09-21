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

Akses:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8080/health
- Frontend proxy health: http://localhost:3000/api/health

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
pnpm dev
```

Frontend dev server mem-proxy `/api/*` ke `http://localhost:8080`.

## Endpoint

`GET /health`

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
