ifneq (,$(wildcard ./.env))
include .env
export
endif

APP_PORT ?= 8080
MYSQL_PORT ?= 3306
FRONTEND_DEV_PORT ?= 5173
DB_USER ?= pencatatan
DB_PASSWORD ?= pencatatan
DB_NAME ?= pencatatan
CORS_ORIGINS ?= http://localhost:$(FRONTEND_DEV_PORT)
JWT_SECRET ?= dev-secret-change-me-in-production
JWT_EXPIRY ?= 24h
ADMIN_EMAIL ?= admin@pencatatan.local
ADMIN_PASSWORD ?= changeme123

BACKEND_URL := http://localhost:$(APP_PORT)
FRONTEND_URL := http://localhost:$(FRONTEND_DEV_PORT)
VITE_API_BASE_LOCAL := http://localhost:$(APP_PORT)/api/v1

.PHONY: help dev db db-down db-wait backend frontend install stop sync-access-catalog \
	backend-run frontend-run docker-up docker-down docker-build

sync-access-catalog:
	cp shared/access-catalog.json backend/internal/access/catalog.json
	cp shared/access-catalog.json frontend/src/config/access-catalog.json

help:
	@echo "Pencatatan Usaha — perintah lokal"
	@echo ""
	@echo "  make dev        Jalankan MySQL + backend + frontend (dev)"
	@echo "  make backend    Jalankan backend saja (MySQL harus sudah jalan)"
	@echo "  make frontend   Jalankan frontend saja"
	@echo "  make db         Jalankan MySQL via Docker"
	@echo "  make db-down    Stop container MySQL"
	@echo "  make install    Install dependency backend + frontend"
	@echo "  make stop       Stop MySQL container"
	@echo ""
	@echo "  make docker-up  Jalankan full stack via Docker Compose"
	@echo "  make docker-down Stop full stack Docker Compose"
	@echo ""
	@echo "URL dev:"
	@echo "  Backend  $(BACKEND_URL)"
	@echo "  Frontend $(FRONTEND_URL)"
	@echo "  API      $(VITE_API_BASE_LOCAL)"

# Jalankan keduanya (+ MySQL)
dev: db-wait
	@echo "Backend  → $(BACKEND_URL)"
	@echo "Frontend → $(FRONTEND_URL)"
	@echo "API base → $(VITE_API_BASE_LOCAL)"
	@bash -c 'set -euo pipefail; trap "kill 0 2>/dev/null || true" EXIT INT TERM; \
		$(MAKE) backend-run & \
		$(MAKE) frontend-run & \
		wait'

backend: db-wait backend-run

frontend: frontend-run

backend-run: sync-access-catalog
	cd backend && \
	APP_PORT=$(APP_PORT) \
	DB_HOST=localhost \
	DB_PORT=$(MYSQL_PORT) \
	DB_USER=$(DB_USER) \
	DB_PASSWORD=$(DB_PASSWORD) \
	DB_NAME=$(DB_NAME) \
	CORS_ORIGINS=$(CORS_ORIGINS) \
	JWT_SECRET=$(JWT_SECRET) \
	JWT_EXPIRY=$(JWT_EXPIRY) \
	ADMIN_EMAIL=$(ADMIN_EMAIL) \
	ADMIN_PASSWORD=$(ADMIN_PASSWORD) \
	go run ./cmd/server

frontend-run:
	cd frontend && \
	VITE_API_BASE=$(VITE_API_BASE_LOCAL) \
	pnpm dev --host --port $(FRONTEND_DEV_PORT)

db:
	docker compose up mysql -d

db-down stop:
	docker compose stop mysql

db-wait: db
	@echo "Menunggu MySQL siap..."
	@bash -c 'for i in $$(seq 1 30); do \
		if docker compose exec -T mysql mysqladmin ping -h localhost -u"$(DB_USER)" -p"$(DB_PASSWORD)" --silent 2>/dev/null; then \
			echo "MySQL siap."; \
			exit 0; \
		fi; \
		sleep 2; \
	done; \
	echo "MySQL belum siap setelah 60 detik"; \
	exit 1'

install:
	cd backend && go mod download
	cd frontend && pnpm install

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose up --build -d
